import { requireAuth } from '@/lib/auth';
import { getDisputeById, getJobById, getJobRecommendations, getPayEstimate, getQCRecord } from '@/lib/db';
import { DisputePanel } from '@/components/DisputePanel';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function DisputeDetailPage({ params }: { params: { disputeId: string } }) {
  await requireAuth('admin');
  const { data: dispute, error } = await getDisputeById(params.disputeId);

  if (error || !dispute) {
    notFound();
  }

  const { data: job } = await getJobById(dispute.job_id);
  const { data: recommendations } = await getJobRecommendations(dispute.job_id);
  const { data: payEstimate } = await getPayEstimate(dispute.job_id);
  const { data: qcRecord } = await getQCRecord(dispute.job_id);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/admin/dashboard" className="text-indigo-600 hover:text-indigo-500">
                ← Back to Dashboard
              </Link>
              <h1 className="text-xl font-bold text-gray-900">Dispute #{params.disputeId.slice(0, 8)}</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <DisputePanel
            dispute={dispute}
            job={job}
            recommendations={recommendations}
            payEstimate={payEstimate}
            qcRecord={qcRecord}
          />
        </div>
      </main>
    </div>
  );
}

