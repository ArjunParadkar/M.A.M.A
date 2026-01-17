'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import ManufacturerProfileForm from '@/components/auth/ManufacturerProfileForm';
import ClientProfileForm from '@/components/auth/ClientProfileForm';

export default function CompleteProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get('role') as 'manufacturer' | 'client' | null;
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient();
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!currentUser) {
        router.push('/auth/sign-in');
        return;
      }

      setUser(currentUser);

      // Check if profile already exists and is complete
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (profile && profile.role && profile.role !== 'client') {
        // Profile exists, redirect to dashboard
        router.push('/maker/dashboard');
        return;
      }

      setLoading(false);
    }

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-200 to-white flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  if (!role || (role !== 'manufacturer' && role !== 'client')) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-200 to-white flex items-center justify-center p-8">
        <div className="bg-[#0a1929] p-8 border border-[#1a2332]">
          <p className="text-white">Invalid role. Please sign up again.</p>
          <button
            onClick={() => router.push('/auth/sign-up')}
            className="mt-4 bg-[#1a2332] hover:bg-[#253242] text-white px-6 py-3 border border-[#253242] hover:border-[#3a4552] transition-colors font-medium"
          >
            Go to Sign Up
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-200 to-white">
      {role === 'manufacturer' ? (
        <ManufacturerProfileForm user={user} />
      ) : (
        <ClientProfileForm user={user} />
      )}
    </div>
  );
}

