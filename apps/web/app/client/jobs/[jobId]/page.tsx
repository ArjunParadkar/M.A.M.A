'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import JobMessages from '@/components/JobMessages';

export default function ClientJobDetailPage() {
  const params = useParams();
  const jobId = params.jobId as string;
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/jobs/${jobId}`);
        const data = await res.json();
        setJob(data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [jobId]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-200 to-white">
      <div className="bg-[#0a1929] text-white py-4 px-8 border-b border-[#1a2332]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/client/dashboard" className="text-white hover:text-[#9ca3af] transition-colors">
            ← Back to Dashboard
          </Link>
          <div className="text-white heading-font">Job Details</div>
          <div className="w-24" />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8 space-y-6">
        {loading ? (
          <div className="bg-[#0a1929] border border-[#1a2332] p-8 text-white">Loading job…</div>
        ) : job?.error ? (
          <div className="bg-[#0a1929] border border-[#1a2332] p-8 text-white">Job not found.</div>
        ) : (
          <>
            <div className="bg-[#0a1929] border border-[#1a2332] p-6">
              <div className="text-white text-2xl heading-font mb-2">{job.title}</div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-[#9ca3af]">Status:</span>
                  <span className="text-white ml-2">{job.status}</span>
                </div>
                <div>
                  <span className="text-[#9ca3af]">Quantity:</span>
                  <span className="text-white ml-2">{job.quantity}</span>
                </div>
                <div>
                  <span className="text-[#9ca3af]">Material:</span>
                  <span className="text-white ml-2">{job.material}</span>
                </div>
                <div>
                  <span className="text-[#9ca3af]">Deadline:</span>
                  <span className="text-white ml-2">{new Date(job.deadline).toLocaleDateString()}</span>
                </div>
              </div>
              {job.description ? (
                <div className="mt-4 text-[#9ca3af] text-sm whitespace-pre-wrap">{job.description}</div>
              ) : null}
            </div>

            <div className="flex gap-4">
              <Link
                href={`/client/jobs/${jobId}/workflow`}
                className="flex-1 bg-[#253242] hover:bg-[#3a4552] text-white px-6 py-3 border border-[#3a4552] transition-colors text-center font-medium"
              >
                View Workflow Management
              </Link>
            </div>

            <JobMessages jobId={jobId} />
          </>
        )}
      </div>
    </div>
  );
}


