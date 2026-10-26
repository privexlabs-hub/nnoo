/**
 * Provider ports (02 §8). Real adapters (Termii/Twilio SMS, Resend/SMTP email) are
 * added when accounts exist; until then those choices fail at boot instead of
 * pretending to send.
 */
export type OtpPurpose = 'sign-in' | 'email-verification';

export interface SmsPort {
  sendOtp(phoneE164: string, code: string): Promise<void>;
}

export interface EmailPort {
  sendOtp(email: string, code: string, purpose: OtpPurpose): Promise<void>;
}

export type InboxMessage = {
  channel: 'sms' | 'email';
  to: string;
  code: string;
  purpose: OtpPurpose;
  at: Date;
};

/**
 * Fake delivery for local development and tests ONLY (env validation rejects `fake`
 * elsewhere). Codes go to an in-memory inbox and, locally, a gitignored file — never to logs.
 */
export class FakeInbox implements SmsPort, EmailPort {
  readonly messages: InboxMessage[] = [];
  constructor(private readonly persist?: (m: InboxMessage) => void) {}

  async sendOtp(to: string, code: string, purpose: OtpPurpose = 'sign-in'): Promise<void> {
    const m: InboxMessage = {
      channel: to.includes('@') ? 'email' : 'sms',
      to,
      code,
      purpose,
      at: new Date(),
    };
    this.messages.push(m);
    this.persist?.(m);
  }

  latestCode(to: string): string | undefined {
    return [...this.messages].reverse().find((m) => m.to === to)?.code;
  }
}

export class ProviderNotConfiguredError extends Error {
  override name = 'ProviderNotConfiguredError';
}
