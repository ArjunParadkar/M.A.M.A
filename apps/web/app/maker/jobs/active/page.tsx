'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ActiveJob {
  id: string;
  job_id: string;
  client_name: string;
  product_name: string;
  status: 'assigned' | 'in_production' | 'qc_pending' | 'qc_approved' | 'shipped';
  quantity: number;
  completed: number;
  deadline: string;
  pay_amount: number;
  started_at: string;
}

export default function ActiveJobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<ActiveJob[]>([
    {
      id: 'active1',
      job_id: 'job1',
      client_name: 'Acme Corp',
      product_name: 'Bracket Assembly',
      status: 'in_production',
      quantity: 50,
      completed: 30,
      deadline: '2026-02-15',
      pay_amount: 2450.00,
      started_at: '2026-01-20',
    },
    {
      id: 'active2',
      job_id: 'job2',
      client_name: 'TechStart Inc',
      product_name: 'Custom Housing',
      status: 'qc_pending',
      quantity: 100,
      completed: 100,
      deadline: '2026-02-20',
      pay_amount: 3200.00,
      started_at: '2026-01-18',
    },
  ]);

  const handleUpdateProgress = (jobId: string, completed: number) => {
    setJobs(jobs.map(j => j.id === jobId ? { ...j, completed } : j));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return 'bg-blue-900 text-blue-200';
      case 'in_production': return 'bg-yellow-900 text-yellow-200';
      case 'qc_pending': return 'bg-purple-900 text-purple-200';
      case 'qc_approved': return 'bg-green-900 text-green-200';
      case 'shipped': return 'bg-gray-900 text-gray-200';
      default: return 'bg-gray-900 text-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-200 to-white">
      {/* Top Navigation Bar */}
      <div className="bg-[#0a1929] text-white py-4 px-8 border-b border-[#1a2332]">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <Link href="/maker/dashboard" className="text-white hover:text-[#9ca3af] transition-colors">
              ← Dashboard
            </Link>
            <Link href="/maker/jobs" className="text-white hover:text-[#9ca3af] transition-colors">
              Recommendations
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        <h1 className="text-4xl font-semibold text-[#0a1929] mb-2 heading-font">
          Active Jobs
        </h1>
        <p className="text-[#6b7280] mb-6">Track progress on all your active work</p>

        <div className="space-y-6">
          {jobs.map((job) => (
            <div key={job.id} className="bg-[#0a1929] border border-[#1a2332] p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-1">{job.product_name}</h3>
                  <p className="text-[#9ca3af]">Client: {job.client_name}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 text-xs font-medium ${getStatusColor(job.status)}`}>
                    {job.status.replace('_', ' ').toUpperCase()}
                  </span>
                  <div className="text-right">
                    <div className="text-lg font-bold text-white">${job.pay_amount.toFixed(2)}</div>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm text-[#9ca3af] mb-2">
                  <span>Progress</span>
                  <span>{job.completed} / {job.quantity} units</span>
                </div>
                <div className="w-full bg-[#1a2332] h-3">
                  <div
                    className="bg-[#253242] h-3 transition-all duration-300"
                    style={{ width: `${(job.completed / job.quantity) * 100}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                <div>
                  <span className="text-[#9ca3af]">Expected Time:</span>
                  <span className="text-white ml-2">12 hours</span>
                </div>
                <div>
                  <span className="text-[#9ca3af]">Material:</span>
                  <span className="text-white ml-2">6061-T6 Aluminum</span>
                </div>
                <div>
                  <span className="text-[#9ca3af]">Machine:</span>
                  <span className="text-white ml-2">CNC Milling</span>
                </div>
                <div>
                  <span className="text-[#9ca3af]">Deadline:</span>
                  <span className="text-white ml-2">{new Date(job.deadline).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-[#253242]">
                {job.status === 'in_production' && job.completed < job.quantity && (
                  <button
                    onClick={() => handleUpdateProgress(job.id, Math.min(job.completed + 10, job.quantity))}
                    className="bg-[#253242] hover:bg-[#3a4552] text-white px-4 py-2 border border-[#3a4552] transition-colors text-sm"
                  >
                    Update Progress
                  </button>
                )}
                {job.completed >= job.quantity && job.status === 'in_production' && (
                  <button
                    onClick={() => router.push(`/maker/jobs/qc/${job.id}`)}
                    className="bg-[#253242] hover:bg-[#3a4552] text-white px-4 py-2 border border-[#3a4552] transition-colors"
                  >
                    Submit for QC
                  </button>
                )}
                {job.status === 'qc_pending' && (
                  <button
                    disabled
                    className="bg-[#253242] text-[#9ca3af] px-4 py-2 border border-[#3a4552] cursor-not-allowed"
                  >
                    Awaiting QC Review
                  </button>
                )}
                {job.status === 'qc_approved' && (
                  <button
                    onClick={() => router.push(`/maker/jobs/ship/${job.id}`)}
                    className="bg-[#253242] hover:bg-[#3a4552] text-white px-4 py-2 border border-[#3a4552] transition-colors"
                  >
                    Mark as Shipped
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

