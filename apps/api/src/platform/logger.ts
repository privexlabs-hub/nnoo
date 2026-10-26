/**
 * Structured JSON logs (09 §6). Never log bodies, tokens, phone numbers, emails,
 * Igbo free text or connection strings. Callers pass identifiers and hashes only.
 */
type Level = 'debug' | 'info' | 'warn' | 'error';
const ORDER: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };

const SECRET_KEYS =
  /pass(word)?|secret|token|authorization|cookie|otp|code|phone|email|database_url|dsn/i;

function scrub(fields: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields)) out[k] = SECRET_KEYS.test(k) ? '[redacted]' : v;
  return out;
}

export type Logger = {
  [L in Level]: (msg: string, fields?: Record<string, unknown>) => void;
} & { child: (fields: Record<string, unknown>) => Logger };

export function createLogger(
  base: Record<string, unknown>,
  minLevel: Level = 'info',
  sink: (line: string) => void = (l) => process.stdout.write(`${l}\n`),
): Logger {
  const emit =
    (level: Level) =>
    (msg: string, fields: Record<string, unknown> = {}) => {
      if (ORDER[level] < ORDER[minLevel]) return;
      sink(
        JSON.stringify({
          level,
          msg,
          time: new Date().toISOString(),
          ...scrub(base),
          ...scrub(fields),
        }),
      );
    };
  return {
    debug: emit('debug'),
    info: emit('info'),
    warn: emit('warn'),
    error: emit('error'),
    child: (fields) => createLogger({ ...base, ...fields }, minLevel, sink),
  };
}
