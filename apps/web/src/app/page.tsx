import { redirect } from 'next/navigation';
import { getCurrentProfile } from '@/lib/auth';

export default async function Home() {
  const profile = await getCurrentProfile();
  
  if (!profile) {
    redirect('/login');
  }
  
  // Redirect based on role
  switch (profile.role) {
    case 'client':
      redirect('/client/dashboard');
    case 'manufacturer':
      redirect('/manufacturer/dashboard');
    case 'admin':
      redirect('/admin/dashboard');
    default:
      redirect('/login');
  }
}

