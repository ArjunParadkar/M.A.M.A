import { requireAuth } from '@/lib/auth';
import { getJobsByManufacturer } from '@/lib/db';
import Link from 'next/link';
import { signOut } from '@/lib/auth';

export default async function ManufacturerDashboard() {
  const profile = await requireAuth('manufacturer');
  const { data: jobs, error } = await getJobsByManufacturer(profile.id);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">ForgeNet - Manufacturer Dashboard</h1>
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
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Jobs</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              Error loading jobs: {error.message}
            </div>
          )}

          {jobs && jobs.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-6 text-center">
              <p className="text-gray-500">No assigned jobs yet.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {jobs?.map((job) => (
                <Link
                  key={job.id}
                  href={`/manufacturer/jobs/${job.id}`}
                  className="bg-white shadow rounded-lg p-6 hover:shadow-md transition"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">{job.description}</p>
                      <div className="mt-2 flex space-x-4 text-sm text-gray-600">
                        <span>Status: <span className="font-medium">{job.status}</span></span>
                        <span>Material: {job.material}</span>
                        <span>Quantity: {job.quantity}</span>
                      </div>
                    </div>
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800">
                      {job.status}
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

