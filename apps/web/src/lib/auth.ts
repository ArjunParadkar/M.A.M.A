import { createServerSupabase } from './supabaseClient';
import { redirect } from 'next/navigation';
import type { UserRole } from '@shared/types';

export async function getCurrentUser() {
  const supabase = createServerSupabase();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }
  
  return user;
}

export async function getCurrentProfile() {
  const supabase = createServerSupabase();
  const user = await getCurrentUser();
  
  if (!user) {
    return null;
  }
  
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  
  if (error || !profile) {
    return null;
  }
  
  return profile;
}

export async function requireAuth(requiredRole?: UserRole) {
  const profile = await getCurrentProfile();
  
  if (!profile) {
    redirect('/login');
  }
  
  if (requiredRole && profile.role !== requiredRole) {
    redirect('/');
  }
  
  return profile;
}

export async function signOut() {
  const supabase = createServerSupabase();
  await supabase.auth.signOut();
  redirect('/login');
}

