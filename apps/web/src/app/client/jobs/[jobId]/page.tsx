import { requireAuth } from '@/lib/auth';
import { getJobById, getJobRecommendations, getPayEstimate, getQCRecord } from '@/lib/db';
import { ManufacturerCard } from '@/components/ManufacturerCard';
import { PayBreakdown } from '@/components/PayBreakdown';
import { QCPanel } from '@/components/QCPanel';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function JobDetailPage({ params }: { params: { jobId: string } }) {
  const profile = await requireAuth('client');
  const { data: job, error } = await getJobById(params.jobId);

  if (error || !job || job.client_id !== profile.id) {
    notFound();
  }

  const { data: recommendations } = await getJobRecommendations(params.jobId);
  const { data: payEstimate } = await getPayEstimate(params.jobId);
  const { data: qcRecord } = await getQCRecord(params.jobId);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/client/dashboard" className="text-indigo-600 hover:text-indigo-500">
                ← Back to Dashboard
              </Link>
              <h1 className="text-xl font-bold text-gray-900">{job.title}</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">
          {/* Job Details */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Job Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-500">Status</span>
                <p className="font-medium">{job.status}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Material</span>
                <p className="font-medium">{job.material}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Quantity</span>
                <p className="font-medium">{job.quantity}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Tolerance</span>
                <p className="font-medium">{job.tolerance_tier}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Deadline</span>
                <p className="font-medium">{new Date(job.deadline).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-gray-500">Description</span>
              <p className="mt-1">{job.description}</p>
            </div>
          </div>

          {/* Recommendations */}
          {recommendations && recommendations.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recommended Manufacturers</h2>
              <div className="space-y-4">
                {recommendations.map((rec: any) => (
                  <ManufacturerCard
                    key={rec.id}
                    recommendation={rec}
                    jobId={job.id}
                    currentStatus={job.status}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Pay Estimate */}
          {payEstimate && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Fair Pay Estimate</h2>
              <PayBreakdown estimate={payEstimate} />
            </div>
          )}

          {/* QC Results */}
          {qcRecord && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quality Check Results</h2>
              <QCPanel qcRecord={qcRecord} jobId={job.id} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

