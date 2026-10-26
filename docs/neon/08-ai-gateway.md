# 08 · AI Gateway usage

The Neon AI Gateway (enabled by `aiGateway: true`, paid plan) gives the `jobs` function model access through `@neon/ai-sdk-provider` with injected credentials. Nnọọ uses it **narrowly**. Elders' words and community decisions are not raw material for automation.

## 1. Principles

1. **AI drafts. People decide.** No AI output is published, voted on, used to resolve a flag, or shown to learners as an elder's words without human editing and Ikpe review. (INV-1, INV-5.)
2. **Consent first.** AI processing of a recording requires `consent_record.allow_machine_assist = true`, explained to the elder at capture: "A computer may help write down your words. A person will always check them." The default is false.
3. **Never:** Nsọ material, Umunna recordings (unless consent explicitly allows machine assist _and_ the provider's data terms are acceptable to the council), minors' data, learner voice, consent evidence, private Ọha posts.
4. **Transparent provenance.** Any revision with a machine-assisted field records `draft_source = 'machine_assisted'` and `draft_model`. Ikpe voters and learners see "Drafted with machine help, checked by <editor>".
5. **Igbo first, honestly.** General LLMs are weak on Igbo dialects and often drop tone marks. Treat every output as a rough draft. Reject drafts that fail diacritic and dialect validation.

## 2. Permitted uses (v1)

| Use                        | Input                                                         | Output                                               | Human step                                                | Where                                          |
| -------------------------- | ------------------------------------------------------------- | ---------------------------------------------------- | --------------------------------------------------------- | ---------------------------------------------- |
| Gloss/translation draft    | human-written Igbo transcript (NFC) + dialect + target locale | draft gloss in the target locale (e.g. `en`, `fr`)   | facilitator or linguist edits and approves → new revision | `jobs` queue `default`, type `ai.glossDraft`   |
| Tagging suggestions        | approved transcript + gloss                                   | suggested topic tags and candidate words for lessons | editor accepts or rejects each suggestion                 | `ai.tagSuggest`                                |
| Facilitator help assistant | the facilitator's question + **public** training docs only    | answer streamed in facilitator mode                  | none (no content changes)                                 | `jobs` SSE route, tools limited to public docs |
| Ops summarisation          | aggregated, non-personal metrics                              | weekly ops digest draft                              | ops reviews                                               | `ai.opsDigest`                                 |

**Not in v1:** speech-to-text of elder audio. ⚠ Verify whether the Gateway offers ASR models. Any ASR use needs its own ADR, an Igbo accuracy evaluation per dialect, and the same consent gating.

**Forbidden:** generating "elder" content, proverbs or lessons from scratch; scoring learners; moderation decisions; kin verification; anything inside Ikpe evaluation; personalised nudges to minors.

## 3. Implementation

```typescript
// apps/api/src/modules/archive/application/ai-gloss-draft.ts   (runs in `jobs` only)
import { generateText } from 'ai';
import { neon } from '@neon/ai-sdk-provider';
import { igbo } from '@nnoo/igbo-text';

const MODEL = 'meta-llama-3-3-70b-instruct'; // pinned; changing it = PR + eval run (§4)

export async function glossDraft(job: { revisionId: string; locale: string }) {
  const rev = await archive.loadRevisionForAi(job.revisionId); // asserts consent.allow_machine_assist,
  // tier !== 'nso', no minors' data
  const { text } = await generateText({
    model: neon(MODEL),
    system: [
      'You translate Igbo transcripts into plain, faithful prose.',
      'Never add content. Never summarise. Keep names and Igbo proper nouns exactly as written, with all diacritics.',
      'If a phrase is uncertain, wrap it in [[double brackets]].',
    ].join(' '),
    prompt: `Dialect: ${rev.dialectName}\nTarget language: ${job.locale}\nTranscript:\n${rev.transcriptIg}`,
    maxOutputTokens: 2000,
    temperature: 0.2,
  });

  const draft = igbo.nfc(text.trim());
  if (!igbo.preservesProperNouns(rev.transcriptIg, draft))
    return archive.rejectAiDraft(rev, 'proper_noun_mismatch');

  await archive.saveDraftSuggestion(rev, {
    field: `glosses.${job.locale}.translation`,
    value: draft,
    draftSource: 'machine_assisted',
    draftModel: MODEL,
  }); // a suggestion, NOT a revision; editor promotes it
}
```

- **Only `jobs` calls the Gateway.** `api` enqueues `ai.*` jobs, so a slow model never blocks a user request, and a quickstart-style inline `/generate` doesn't exist.
- **Never inside a DB transaction** (03 §5). Read → call model → write suggestion in its own transaction.
- The first Gateway call on a new branch can return `403` while the credential propagates (quickstart note). Jobs retry with backoff, so this resolves itself.
- **Telemetry:** the quickstart disables AI SDK telemetry inside functions because of a tracing conflict. Keep `experimental_telemetry: { isEnabled: false }` for `streamText`. Log only model id, tokens and latency, never prompts or outputs that contain transcripts.

## 4. Evaluation and change control

- `tools/ai-eval`: a fixed, consented evaluation set per dialect (transcript → reference gloss written by fluent speakers). It scores adequacy, proper-noun preservation and hallucination (added content).
- Changing the model, prompt or temperature needs a PR, an eval run, and results attached. Merge only if the eval doesn't regress.
- Monthly sample review by a linguist and a custodian: 20 accepted drafts and 20 rejected. Findings are published in the governance notes.

## 5. Cost and limits

- Budget per month. The `ai.*` queue pauses when spend reaches 90% of budget (checked from Gateway usage). ⚠ Verify how usage is exposed.
- Rate-limit `ai.*` jobs per facilitator (e.g. 50 drafts/day) to prevent runaway spend.
- Open-weight models are enabled by default. Frontier models need access requested in the Console. Choose by eval results, not by habit.
