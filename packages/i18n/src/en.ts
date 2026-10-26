// Source catalogue. Brand voice: warm and reverent, no gamification, no emoji (AGENTS.md).
// Igbo words keep their tone marks and dotted vowels; every string is NFC.
export const en = {
  'brand.name': 'Nnọọ',
  'brand.tagline': 'welcome home',
  'brand.principle': 'Igbo enwe eze.',
  'brand.principleGloss': 'The Igbo have no king. The people decide together.',

  'nav.today': 'Today',
  'nav.lessons': 'Lessons',
  'nav.oba': 'Ọbá',
  'nav.obaSub': 'Living archive',
  'nav.ikpe': 'Ikpe',
  'nav.ikpeSub': 'The council',
  'nav.oha': 'Ọha',
  'nav.ohaSub': 'Community',
  'nav.you': 'You',
  'nav.main': 'Main',

  'signIn.title': 'Nnọọ. Welcome home.',
  'signIn.lede':
    'Sign in with your phone number or email. We send a six-digit code; there is no password.',
  'signIn.byPhone': 'Phone',
  'signIn.byEmail': 'Email',
  'signIn.phoneLabel': 'Phone number, with country code',
  'signIn.phoneHint': 'For example +234 803 000 0000',
  'signIn.emailLabel': 'Email address',
  'signIn.sendCode': 'Send code',
  'signIn.sending': 'Sending…',
  'signIn.codeLabel': 'Six-digit code',
  'signIn.codeSentTo': 'We sent a code to {destination}. It lasts five minutes.',
  'signIn.verify': 'Sign in',
  'signIn.verifying': 'Signing in…',
  'signIn.changeDestination': 'Use a different number or email',
  'signIn.withPasskey': 'Sign in with a passkey',
  'signIn.passkeyFailed': 'That passkey could not be used. Try a code instead.',
  'signIn.invalidPhone': 'Enter the number with its country code, starting with +.',
  'signIn.invalidEmail': 'Enter a full email address.',
  'signIn.invalidCode': 'That code did not match, or it has expired.',

  'today.eyebrow': 'Today',
  'today.greeting': 'Nnọọ, {name}.',
  'today.greetingAnon': 'Nnọọ.',
  'today.lede': 'The elders’ voices arrive here once kin have decided, in Ikpe, what is kept.',
  'today.lessonsEmptyTitle': 'No lessons yet',
  'today.lessonsEmptyBody':
    'Lessons are made only from recordings kin have approved. None have been approved yet.',
  'today.ikpeEmptyTitle': 'Ikpe is not open yet',
  'today.ikpeEmptyBody':
    'When a recording from your hometown is ready, its kin decide together whether it is kept.',

  'pending.eyebrow': 'Being built',
  'pending.lessons': 'Lessons in the elders’ own voices, with gentle feedback on your tones.',
  'pending.oba': 'The living archive: recordings kin have agreed to keep.',
  'pending.ikpe': 'Where verified kin listen, then decide together what is kept.',
  'pending.oha': 'Circles and conversation with people from your hometown.',
  'pending.body':
    'This part of Nnọọ is not open yet. Nothing here is a placeholder pretending to be real.',

  'you.eyebrow': 'You',
  'you.unnamed': 'Your name',
  'you.profile': 'Profile',
  'you.displayName': 'Name shown to others',
  'you.save': 'Save',
  'you.saving': 'Saving…',
  'you.saved': 'Saved.',
  'you.identity': 'Identity',
  'you.identity.none': 'Not yet verified',
  'you.identity.basic': 'Verified by code',
  'you.identity.in_person': 'Verified in person',
  'you.passkeys': 'Passkeys',
  'you.passkeysBody':
    'A passkey lets you sign in with your face, fingerprint or device PIN. Voting in Ikpe and other weighty acts need one.',
  'you.passkeysNone': 'No passkeys yet.',
  'you.addPasskey': 'Add a passkey',
  'you.addingPasskey': 'Waiting for your device…',
  'you.passkeyAdded': 'Passkey added.',
  'you.passkeyFailed': 'The passkey was not added.',
  'you.passkeyNeedsFreshSignIn': 'For your safety, sign in again before adding a passkey.',
  'you.removePasskey': 'Remove',
  'you.signOut': 'Sign out',

  'rail.principleEyebrow': 'Our first rule',
  'rail.weekEyebrow': 'This week',
  'rail.weekEmpty': 'Days you practise will show here. The words wait; there are no streaks.',

  'error.generic': 'Something went wrong. Please try again.',
  'error.network': 'We could not reach Nnọọ. Check your connection and try again.',
  'error.rateLimited': 'Too many tries. Please wait a little and try again.',
  'error.unavailable': 'This sign-in method is not available yet.',
  loading: 'Loading…',
} as const;

export type MessageKey = keyof typeof en;
