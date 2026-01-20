'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import JobMessages from '@/components/JobMessages';
import { DEMO_MODE, getDemoJobs, getManufacturerJobs, type DemoJob } from '@/lib/demoData';

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;
  const [job, setJob] = useState<DemoJob | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadJob() {
      setLoading(true);
      try {
        if (DEMO_MODE) {
          // Load from demo data
          const jobs = getDemoJobs();
          const foundJob = jobs.find(j => j.id === jobId);
          if (foundJob) {
            setJob(foundJob);
          }
        } else {
          // Load from API
          const res = await fetch(`/api/jobs/${jobId}`);
          const data = await res.json();
          if (!data.error) {
            setJob(data as any);
          }
        }
      } catch (error) {
        console.error('Error loading job:', error);
      } finally {
        setLoading(false);
      }
    }
    loadJob();
  }, [jobId]);

  const handleAcceptJob = async () => {
    if (DEMO_MODE && job) {
      const { acceptJobForReva } = await import('@/lib/demoData');
      if (job.order_type === 'open-request') {
        const quantity = prompt(`How many units can you accept? (Max: ${job.quantity - (job.assigned_quantity || 0)})`);
        if (quantity && parseInt(quantity) > 0) {
          acceptJobForReva(jobId, parseInt(quantity));
        }
      } else {
        acceptJobForReva(jobId);
      }
      router.push(`/maker/jobs/active/${jobId}`);
    } else {
      // TODO: Create active_job entry via API
      router.push('/maker/jobs/active');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-200 to-white flex items-center justify-center">
        <div className="text-[#0a1929]">Loading job...</div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-200 to-white flex items-center justify-center">
        <div className="text-[#0a1929]">Job not found.</div>
      </div>
    );
  }

  const isAccepted = job.status === 'accepted' || job.status === 'in_production' || 
                     job.selected_manufacturer_id === 'reva_demo_id' ||
                     job.assigned_manufacturers?.some(m => m.manufacturer_id === 'reva_demo_id' && m.status === 'accepted');

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-200 to-white">
      {/* Top Navigation Bar */}
      <div className="bg-[#0a1929] text-white py-4 px-8 border-b border-[#1a2332]">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/maker/jobs" className="text-white hover:text-[#9ca3af] transition-colors">
            ← Back to Jobs
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-8">
        <h1 className="text-3xl font-semibold text-[#0a1929] mb-2 heading-font">
          {job.product_name}
        </h1>
        <p className="text-[#6b7280] mb-6">Client: {job.client_name}</p>

        <div className="bg-[#0a1929] border border-[#1a2332] p-8 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <span className="text-[#9ca3af] text-sm">Material</span>
              <p className="text-white font-medium">{job.material}</p>
            </div>
            <div>
              <span className="text-[#9ca3af] text-sm">Quantity</span>
              <p className="text-white font-medium">{job.quantity} units</p>
            </div>
            <div>
              <span className="text-[#9ca3af] text-sm">Tolerance</span>
              <p className="text-white font-medium">{job.tolerance || 'Standard'}</p>
            </div>
            <div>
              <span className="text-[#9ca3af] text-sm">Deadline</span>
              <p className="text-white font-medium">{new Date(job.deadline).toLocaleDateString()}</p>
            </div>
            <div>
              <span className="text-[#9ca3af] text-sm">Status</span>
              <p className="text-white font-medium capitalize">{job.status?.replace('_', ' ') || 'Pending'}</p>
            </div>
            <div>
              <span className="text-[#9ca3af] text-sm">Order Type</span>
              <p className="text-white font-medium capitalize">{job.order_type?.replace('-', ' ') || 'Standard'}</p>
            </div>
            <div>
              <span className="text-[#9ca3af] text-sm">Pay</span>
              <p className="text-white font-medium text-xl">${job.suggested_pay.toFixed(2)}</p>
            </div>
          </div>

          {job.selected_manufacturer_id && (
            <div className="bg-[#1a2332] border border-[#253242] p-4">
              <span className="text-[#9ca3af] text-sm">Assigned to: </span>
              <span className="text-white font-medium">
                {job.selected_manufacturer_id === 'reva_demo_id' ? 'You (Reva)' : 'Another Manufacturer'}
              </span>
            </div>
          )}

          {job.assigned_manufacturers && job.assigned_manufacturers.length > 0 && (
            <div className="bg-[#1a2332] border border-[#253242] p-4">
              <span className="text-[#9ca3af] text-sm mb-2 block">Assigned Manufacturers:</span>
              {job.assigned_manufacturers.map((mfg, idx) => (
                <div key={idx} className="text-white text-sm mb-1">
                  {mfg.manufacturer_name}: {mfg.assigned_quantity} units ({mfg.status})
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-4 pt-4 border-t border-[#253242]">
            {!isAccepted ? (
              <>
                <Link
                  href="/maker/jobs"
                  className="flex-1 bg-[#1a2332] hover:bg-[#253242] text-white px-6 py-3 border border-[#253242] hover:border-[#3a4552] transition-colors text-center"
                >
                  Cancel
                </Link>
                <button
                  onClick={handleAcceptJob}
                  className="flex-1 bg-[#253242] hover:bg-[#3a4552] text-white px-6 py-3 border border-[#3a4552] transition-colors font-medium"
                >
                  Accept Job
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/maker/jobs/active"
                  className="flex-1 bg-[#1a2332] hover:bg-[#253242] text-white px-6 py-3 border border-[#253242] hover:border-[#3a4552] transition-colors text-center"
                >
                  Back to Active Jobs
                </Link>
                <Link
                  href={`/maker/jobs/active/${jobId}`}
                  className="flex-1 bg-[#253242] hover:bg-[#3a4552] text-white px-6 py-3 border border-[#3a4552] transition-colors text-center font-medium"
                >
                  View Active Job
                </Link>
              </>
            )}
          </div>
        </div>

        {/* QC Submission and Messages for Accepted Jobs */}
        {isAccepted && (
          <div className="space-y-6 mt-6">
            {/* QC Submission Button */}
            <div className="bg-[#0a1929] border border-[#1a2332] p-6">
              <h2 className="text-xl font-semibold text-white mb-4 heading-font">Quality Control & Submission</h2>
              <p className="text-[#9ca3af] text-sm mb-4">
                Upload photos of your completed parts for AI-powered quality control check.
              </p>
              <Link
                href={`/maker/jobs/qc/${jobId}`}
                className="inline-block bg-[#253242] hover:bg-[#3a4552] text-white px-6 py-3 border border-[#3a4552] transition-colors font-medium"
              >
                Submit for Quality Check →
              </Link>
            </div>

            {/* Messages */}
            <JobMessages jobId={jobId} />
          </div>
        )}
      </div>
    </div>
  );
}

