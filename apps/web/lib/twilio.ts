/**
 * Thin Twilio Verify REST client (no SDK — keeps cold-start + bundle size small).
 *
 * Docs: https://www.twilio.com/docs/verify/api
 */

const BASE = 'https://verify.twilio.com/v2';

function authHeader(): string {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const tok = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !tok) throw new Error('Twilio credentials missing');
  return 'Basic ' + Buffer.from(`${sid}:${tok}`).toString('base64');
}

function svc(): string {
  const s = process.env.TWILIO_VERIFY_SERVICE_SID;
  if (!s) throw new Error('TWILIO_VERIFY_SERVICE_SID missing');
  return s;
}

export type VerifyStatus = 'pending' | 'approved' | 'canceled' | 'max_attempts_reached' | 'deleted' | 'failed' | 'expired';

/** Sends an OTP to the given E.164 phone number via SMS. */
export async function startVerification(
  to: string,
  channel: 'sms' | 'call' = 'sms',
): Promise<{ status: VerifyStatus; sid: string }> {
  const body = new URLSearchParams({ To: to, Channel: channel });
  const res = await fetch(`${BASE}/Services/${svc()}/Verifications`, {
    method: 'POST',
    headers: {
      Authorization: authHeader(),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });
  const json = (await res.json()) as { status?: VerifyStatus; sid?: string; message?: string };
  if (!res.ok) throw new Error(json.message ?? `Twilio start failed (${res.status})`);
  return { status: json.status!, sid: json.sid! };
}

/** Checks a user-submitted code against Twilio. */
export async function checkVerification(
  to: string,
  code: string,
): Promise<{ status: VerifyStatus; valid: boolean }> {
  const body = new URLSearchParams({ To: to, Code: code });
  const res = await fetch(`${BASE}/Services/${svc()}/VerificationCheck`, {
    method: 'POST',
    headers: {
      Authorization: authHeader(),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });
  const json = (await res.json()) as { status?: VerifyStatus; valid?: boolean; message?: string };
  if (!res.ok) throw new Error(json.message ?? `Twilio check failed (${res.status})`);
  return { status: json.status!, valid: Boolean(json.valid) };
}

/** Normalises a user-entered phone number to E.164 (simple heuristic). */
export function toE164(input: string, defaultCountry = '1'): string | null {
  const digits = input.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) return digits;
  if (digits.length === 10) return `+${defaultCountry}${digits}`;
  if (digits.length === 11 && digits.startsWith(defaultCountry)) return `+${digits}`;
  return null;
}
