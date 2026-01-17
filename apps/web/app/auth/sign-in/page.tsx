'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authMethod, setAuthMethod] = useState<'google' | 'email'>('google');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const redirectTo = searchParams.get('redirect') || '/maker/dashboard';

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();

      const { data, error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (signInError) throw signInError;
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google. Make sure Supabase credentials are configured.');
      setLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please try again.');
        } else if (signInError.message.includes('Email not confirmed')) {
          setError('Please verify your email before signing in. Check your inbox.');
        } else {
          throw signInError;
        }
        setLoading(false);
        return;
      }

      // Redirect to dashboard or requested page
      router.push(redirectTo);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-200 to-white flex items-center justify-center p-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-[#0a1929] p-8 border border-[#1a2332]">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-semibold text-white mb-2 heading-font">
              Sign In
            </h1>
            <p className="text-[#9ca3af]">Sign in to your M.A.M.A account</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-700 text-red-200 text-sm">
              {error}
            </div>
          )}

          {/* Auth Method Tabs */}
          <div className="mb-6 flex gap-2 border-b border-[#1a2332]">
            <button
              onClick={() => setAuthMethod('google')}
              className={`flex-1 px-4 py-2 font-medium transition-colors ${
                authMethod === 'google'
                  ? 'text-white border-b-2 border-white'
                  : 'text-[#9ca3af] hover:text-white'
              }`}
            >
              Google
            </button>
            <button
              onClick={() => setAuthMethod('email')}
              className={`flex-1 px-4 py-2 font-medium transition-colors ${
                authMethod === 'email'
                  ? 'text-white border-b-2 border-white'
                  : 'text-[#9ca3af] hover:text-white'
              }`}
            >
              Email
            </button>
          </div>

          {authMethod === 'google' ? (
            <div className="space-y-4">
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full bg-[#1a2332] hover:bg-[#253242] text-white px-6 py-4 border border-[#253242] hover:border-[#3a4552] transition-colors font-medium flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  'Signing in...'
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Continue with Google
                  </>
                )}
              </button>
            </div>
          ) : (
            <form onSubmit={handleEmailSignIn} className="space-y-4">
              <div>
                <label className="block text-white mb-2 font-medium text-sm">Email *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-[#1a2332] border border-[#253242] text-white px-4 py-3 focus:outline-none focus:border-[#3a4552]"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className="block text-white mb-2 font-medium text-sm">Password *</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-[#1a2332] border border-[#253242] text-white px-4 py-3 focus:outline-none focus:border-[#3a4552]"
                  placeholder="Enter your password"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1a2332] hover:bg-[#253242] text-white px-6 py-4 border border-[#253242] hover:border-[#3a4552] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-[#1a2332] text-center">
            <p className="text-[#9ca3af] text-sm">
              Don't have an account?{' '}
              <Link
                href="/auth/sign-up"
                className="text-white hover:text-[#9ca3af] underline font-medium"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

