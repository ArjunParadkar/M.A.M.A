import { requireAuth } from '@/lib/auth';
import { getDisputes } from '@/lib/db';
import Link from 'next/link';
import { signOut } from '@/lib/auth';

export default async function AdminDashboard() {
  const profile = await requireAuth('admin');
  const { data: disputes, error } = await getDisputes();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">ForgeNet - Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">Welcome, {profile.name}</span>
              <form action={signOut}>
                <button type="submit" className="text-sm text-indigo-600 hover:text-indigo-500">
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Open Disputes</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              Error loading disputes: {error.message}
            </div>
          )}

          {disputes && disputes.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-6 text-center">
              <p className="text-gray-500">No open disputes.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {disputes?.map((dispute: any) => (
                <Link
                  key={dispute.id}
                  href={`/admin/disputes/${dispute.id}`}
                  className="bg-white shadow rounded-lg p-6 hover:shadow-md transition"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Dispute #{dispute.id.slice(0, 8)}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">{dispute.reason}</p>
                      <div className="mt-2 flex space-x-4 text-sm text-gray-600">
                        <span>Job: {dispute.jobs?.title}</span>
                        <span>Client: {dispute.profiles?.name}</span>
                        <span>Manufacturer: {dispute.profiles?.name}</span>
                      </div>
                    </div>
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                      {dispute.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

