/**
 * User-friendly messages for common auth errors.
 */

const GOOGLE_NOT_ENABLED =
  'Google sign-in is not enabled in your Supabase project. ' +
  'Enable it: Supabase Dashboard → Authentication → Providers → Google. ' +
  'Use the Email tab to sign in or sign up instead.';

export function getAuthErrorMessage(err: unknown, fallback: string): string {
  const msg = String((err as any)?.message || (err as any)?.msg || '');
  const code = (err as any)?.error_code;
  if (
    code === 'validation_failed' ||
    msg.includes('provider is not enabled') ||
    msg.includes('Unsupported provider')
  ) {
    return GOOGLE_NOT_ENABLED;
  }
  return msg || fallback;
}

