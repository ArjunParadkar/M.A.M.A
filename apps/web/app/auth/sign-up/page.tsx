'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function SignUpPage() {
  const router = useRouter();
  const [userType, setUserType] = useState<'manufacturer' | 'client' | null>(null);

  if (!userType) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-200 to-white flex items-center justify-center p-8">
        <div className="max-w-2xl w-full space-y-8">
          <div className="bg-[#0a1929] p-8 border border-[#1a2332]">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-semibold text-white mb-2 heading-font">
                Create Account
              </h1>
              <p className="text-[#9ca3af]">Choose your account type</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button
                onClick={() => setUserType('manufacturer')}
                className="bg-[#1a2332] hover:bg-[#253242] text-white px-6 py-12 border border-[#253242] hover:border-[#3a4552] transition-colors font-medium text-left group"
              >
                <h3 className="text-xl font-semibold text-white mb-3 heading-font group-hover:text-white">
                  Manufacturer
                </h3>
                <p className="text-[#9ca3af] text-sm mb-4">
                  Create 3D printed parts, manufacture products, and build your business
                </p>
                <ul className="text-[#9ca3af] text-sm space-y-1">
                  <li>• Access manufacturing jobs</li>
                  <li>• Showcase your equipment</li>
                  <li>• Build your reputation</li>
                  <li>• Earn fair compensation</li>
                </ul>
              </button>

              <button
                onClick={() => setUserType('client')}
                className="bg-[#1a2332] hover:bg-[#253242] text-white px-6 py-12 border border-[#253242] hover:border-[#3a4552] transition-colors font-medium text-left group"
              >
                <h3 className="text-xl font-semibold text-white mb-3 heading-font group-hover:text-white">
                  Client
                </h3>
                <p className="text-[#9ca3af] text-sm mb-4">
                  Post manufacturing jobs and get quality parts delivered
                </p>
                <ul className="text-[#9ca3af] text-sm space-y-1">
                  <li>• Post manufacturing jobs</li>
                  <li>• Get AI-matched makers</li>
                  <li>• Fair pricing estimates</li>
                  <li>• Quality assurance</li>
                </ul>
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-[#1a2332] text-center">
              <p className="text-[#9ca3af] text-sm">
                Already have an account?{' '}
                <Link
                  href="/auth/sign-in"
                  className="text-white hover:text-[#9ca3af] underline font-medium"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (userType === 'manufacturer') {
    return <ManufacturerSignUp onBack={() => setUserType(null)} />;
  }

  return <ClientSignUp onBack={() => setUserType(null)} />;
}

function ManufacturerSignUp({ onBack }: { onBack: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authMethod, setAuthMethod] = useState<'google' | 'email'>('google');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleGoogleSignUp = async () => {
    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();

      const { data, error: signUpError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent('/auth/complete-profile?role=manufacturer')}`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (signUpError) throw signUpError;
    } catch (err: any) {
      setError(err.message || 'Failed to sign up with Google. Make sure Supabase credentials are configured.');
      setLoading(false);
    }
  };

  const checkEmailExists = async (emailToCheck: string) => {
    const supabase = createClient();
    // Check if email exists in auth.users (via admin API or by attempting sign in)
    // For now, we'll let Supabase handle duplicate email errors
    return false;
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();

      // Check if email already exists
      const { data: existingUsers, error: checkError } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', email)
        .single();

      if (existingUsers && !checkError) {
        setError('This email is already registered. Please sign in instead.');
        setLoading(false);
        return;
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: 'manufacturer',
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent('/auth/complete-profile?role=manufacturer')}`,
        },
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          setError('This email is already registered. Please sign in instead.');
        } else {
          throw signUpError;
        }
        setLoading(false);
        return;
      }

      // Redirect to complete profile
      router.push('/auth/complete-profile?role=manufacturer');
    } catch (err: any) {
      setError(err.message || 'Failed to create account. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-200 to-white flex items-center justify-center p-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-[#0a1929] p-8 border border-[#1a2332]">
          <div className="text-center mb-8">
            <button
              onClick={onBack}
              className="mb-4 text-[#9ca3af] hover:text-white text-sm underline"
            >
              ← Back to account type selection
            </button>
            <h1 className="text-3xl font-semibold text-white mb-2 heading-font">
              Sign Up as Manufacturer
            </h1>
            <p className="text-[#9ca3af]">Choose your sign-up method</p>
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
                onClick={handleGoogleSignUp}
                disabled={loading}
                className="w-full bg-[#1a2332] hover:bg-[#253242] text-white px-6 py-4 border border-[#253242] hover:border-[#3a4552] transition-colors font-medium flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  'Signing up...'
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
            <form onSubmit={handleEmailSignUp} className="space-y-4">
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
                  minLength={6}
                  className="w-full bg-[#1a2332] border border-[#253242] text-white px-4 py-3 focus:outline-none focus:border-[#3a4552]"
                  placeholder="At least 6 characters"
                />
              </div>
              <div>
                <label className="block text-white mb-2 font-medium text-sm">Confirm Password *</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full bg-[#1a2332] border border-[#253242] text-white px-4 py-3 focus:outline-none focus:border-[#3a4552]"
                  placeholder="Confirm your password"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1a2332] hover:bg-[#253242] text-white px-6 py-4 border border-[#253242] hover:border-[#3a4552] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-[#1a2332]">
            <p className="text-[#9ca3af] text-sm text-center">
              After signing up, you'll be asked about your devices and manufacturing capabilities.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ClientSignUp({ onBack }: { onBack: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authMethod, setAuthMethod] = useState<'google' | 'email'>('google');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleGoogleSignUp = async () => {
    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();

      const { data, error: signUpError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent('/auth/complete-profile?role=client')}`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (signUpError) throw signUpError;
    } catch (err: any) {
      setError(err.message || 'Failed to sign up with Google. Make sure Supabase credentials are configured.');
      setLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();

      // Check if email already exists
      const { data: existingUsers, error: checkError } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', email)
        .single();

      if (existingUsers && !checkError) {
        setError('This email is already registered. Please sign in instead.');
        setLoading(false);
        return;
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: 'client',
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent('/auth/complete-profile?role=client')}`,
        },
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          setError('This email is already registered. Please sign in instead.');
        } else {
          throw signUpError;
        }
        setLoading(false);
        return;
      }

      // Redirect to complete profile
      router.push('/auth/complete-profile?role=client');
    } catch (err: any) {
      setError(err.message || 'Failed to create account. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-200 to-white flex items-center justify-center p-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-[#0a1929] p-8 border border-[#1a2332]">
          <div className="text-center mb-8">
            <button
              onClick={onBack}
              className="mb-4 text-[#9ca3af] hover:text-white text-sm underline"
            >
              ← Back to account type selection
            </button>
            <h1 className="text-3xl font-semibold text-white mb-2 heading-font">
              Sign Up as Client
            </h1>
            <p className="text-[#9ca3af]">Choose your sign-up method</p>
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
                onClick={handleGoogleSignUp}
                disabled={loading}
                className="w-full bg-[#1a2332] hover:bg-[#253242] text-white px-6 py-4 border border-[#253242] hover:border-[#3a4552] transition-colors font-medium flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  'Signing up...'
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
            <form onSubmit={handleEmailSignUp} className="space-y-4">
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
                  minLength={6}
                  className="w-full bg-[#1a2332] border border-[#253242] text-white px-4 py-3 focus:outline-none focus:border-[#3a4552]"
                  placeholder="At least 6 characters"
                />
              </div>
              <div>
                <label className="block text-white mb-2 font-medium text-sm">Confirm Password *</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full bg-[#1a2332] border border-[#253242] text-white px-4 py-3 focus:outline-none focus:border-[#3a4552]"
                  placeholder="Confirm your password"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1a2332] hover:bg-[#253242] text-white px-6 py-4 border border-[#253242] hover:border-[#3a4552] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-[#1a2332]">
            <p className="text-[#9ca3af] text-sm text-center">
              After signing up, you'll be asked whether you're a company or individual.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

