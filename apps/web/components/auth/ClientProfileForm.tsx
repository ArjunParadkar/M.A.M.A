'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

export default function ClientProfileForm({ user }: { user: any }) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [clientType, setClientType] = useState<'individual' | 'small_business' | 'corporation'>('individual');
  const [name, setName] = useState(user?.user_metadata?.full_name || user?.email?.split('@')[0] || '');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name) {
      setError('Name is required');
      return;
    }

    if ((clientType === 'small_business' || clientType === 'corporation') && !companyName?.trim()) {
      setError('Company name is required');
      return;
    }

    if (!address || !city || !state || !zipCode) {
      setError('Address information is required');
      return;
    }

    if (!isSupabaseConfigured()) {
      setError('Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const supabase = createClient();

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          role: 'client',
          name,
          client_type: clientType,
          company_name: (clientType === 'small_business' || clientType === 'corporation') ? companyName : null,
          phone: phone || null,
          address,
          city,
          state,
          zip_code: zipCode,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Failed to complete profile');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-200 to-white p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-[#0a1929] p-8 border border-[#1a2332]">
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-white mb-2 heading-font">
              Complete Your Profile
            </h1>
            <p className="text-[#9ca3af]">Tell us about yourself</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-700 text-red-200 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-white mb-4 font-medium">Account Type *</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => { setClientType('individual'); setCompanyName(''); }}
                  className={`p-6 border transition-colors text-left ${
                    clientType === 'individual' ? 'bg-[#253242] border-white text-white' : 'bg-[#1a2332] border-[#253242] text-[#9ca3af] hover:border-[#3a4552]'
                  }`}
                >
                  <h3 className="font-semibold mb-2">Individual</h3>
                  <p className="text-sm">Personal projects and orders</p>
                </button>
                <button
                  type="button"
                  onClick={() => setClientType('small_business')}
                  className={`p-6 border transition-colors text-left ${
                    clientType === 'small_business' ? 'bg-[#253242] border-white text-white' : 'bg-[#1a2332] border-[#253242] text-[#9ca3af] hover:border-[#3a4552]'
                  }`}
                >
                  <h3 className="font-semibold mb-2">Small Business</h3>
                  <p className="text-sm">Startups, shops, studios</p>
                </button>
                <button
                  type="button"
                  onClick={() => setClientType('corporation')}
                  className={`p-6 border transition-colors text-left ${
                    clientType === 'corporation' ? 'bg-[#253242] border-white text-white' : 'bg-[#1a2332] border-[#253242] text-[#9ca3af] hover:border-[#3a4552]'
                  }`}
                >
                  <h3 className="font-semibold mb-2">Corporation</h3>
                  <p className="text-sm">Enterprises and large orders</p>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-white mb-2 font-medium">
                {(clientType === 'small_business' || clientType === 'corporation') ? 'Contact Name' : 'Name'} *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#1a2332] border border-[#253242] text-white px-4 py-3 focus:outline-none focus:border-[#3a4552]"
                placeholder={(clientType === 'small_business' || clientType === 'corporation') ? 'John Doe' : 'Your name'}
                required
              />
            </div>

            {(clientType === 'small_business' || clientType === 'corporation') && (
              <div>
                <label className="block text-white mb-2 font-medium">Company Name *</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-[#1a2332] border border-[#253242] text-white px-4 py-3 focus:outline-none focus:border-[#3a4552]"
                  placeholder={clientType === 'corporation' ? 'Acme Corp.' : 'My Studio LLC'}
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-[#9ca3af] mb-2 font-medium">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-[#1a2332] border border-[#253242] text-white px-4 py-3 focus:outline-none focus:border-[#3a4552]"
                placeholder="(555) 123-4567"
              />
            </div>

            <div>
              <label className="block text-white mb-2 font-medium">Address *</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-[#1a2332] border border-[#253242] text-white px-4 py-3 focus:outline-none focus:border-[#3a4552]"
                placeholder="123 Main St"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-white mb-2 font-medium">City *</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-[#1a2332] border border-[#253242] text-white px-4 py-3 focus:outline-none focus:border-[#3a4552]"
                  placeholder="City"
                  required
                />
              </div>
              <div>
                <label className="block text-white mb-2 font-medium">State *</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full bg-[#1a2332] border border-[#253242] text-white px-4 py-3 focus:outline-none focus:border-[#3a4552]"
                  placeholder="CA"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-white mb-2 font-medium">ZIP Code *</label>
              <input
                type="text"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                className="w-full bg-[#1a2332] border border-[#253242] text-white px-4 py-3 focus:outline-none focus:border-[#3a4552]"
                placeholder="12345"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1a2332] hover:bg-[#253242] text-white px-6 py-3 border border-[#253242] hover:border-[#3a4552] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Complete Profile'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

