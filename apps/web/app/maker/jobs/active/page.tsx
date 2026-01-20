'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DEMO_MODE, getManufacturerJobs, type DemoJob } from '@/lib/demoData';

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
  material?: string;
  machine?: string;
}

export default function ActiveJobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<ActiveJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (DEMO_MODE) {
      const demoJobs = getManufacturerJobs('reva_demo_id').filter(j => 
        j.status === 'accepted' || j.status === 'in_production' || j.status === 'qc_pending' || j.status === 'shipped'
      );
      
      const activeJobs: ActiveJob[] = demoJobs.map(job => {
        // Calculate completed based on status
        let completed = 0;
        if (job.status === 'in_production') {
          completed = Math.floor(job.quantity * 0.6); // 60% done
        } else if (job.status === 'qc_pending' || job.status === 'shipped') {
          completed = job.quantity;
        }

        // Get pay amount
        let payAmount = job.suggested_pay;
        if (job.assigned_manufacturers) {
          const revaAssignment = job.assigned_manufacturers.find(m => m.manufacturer_id === 'reva_demo_id');
          if (revaAssignment) {
            payAmount = revaAssignment.pay_amount;
          }
        }

        return {
          id: job.id,
          job_id: job.id,
          client_name: job.client_name || 'Client',
          product_name: job.title,
          status: job.status === 'accepted' ? 'in_production' : 
                  job.status === 'qc_pending' ? 'qc_pending' :
                  job.status === 'shipped' ? 'qc_approved' : 'in_production',
          quantity: job.quantity,
          completed,
          deadline: job.deadline,
          pay_amount: payAmount,
          started_at: job.created_at,
          material: job.material,
          machine: job.manufacturing_type?.[0] || 'CNC / 3D Printing',
        };
      });
      
      setJobs(activeJobs);
      setLoading(false);

      // Poll for updates
      const interval = setInterval(() => {
        const updated = getManufacturerJobs('reva_demo_id').filter(j => 
          j.status === 'accepted' || j.status === 'in_production' || j.status === 'qc_pending' || j.status === 'shipped'
        );
        const updatedJobs: ActiveJob[] = updated.map(job => {
          let completed = 0;
          if (job.status === 'in_production') {
            completed = Math.floor(job.quantity * 0.6);
          } else if (job.status === 'qc_pending' || job.status === 'shipped') {
            completed = job.quantity;
          }
          let payAmount = job.suggested_pay;
          if (job.assigned_manufacturers) {
            const revaAssignment = job.assigned_manufacturers.find(m => m.manufacturer_id === 'reva_demo_id');
            if (revaAssignment) {
              payAmount = revaAssignment.pay_amount;
            }
          }
          return {
            id: job.id,
            job_id: job.id,
            client_name: job.client_name || 'Client',
            product_name: job.title,
            status: job.status === 'accepted' ? 'in_production' : 
                    job.status === 'qc_pending' ? 'qc_pending' :
                    job.status === 'shipped' ? 'qc_approved' : 'in_production',
            quantity: job.quantity,
            completed,
            deadline: job.deadline,
            pay_amount: payAmount,
            started_at: job.created_at,
            material: job.material,
            machine: job.manufacturing_type?.[0] || 'CNC / 3D Printing',
          };
        });
        setJobs(updatedJobs);
      }, 2000);

      return () => clearInterval(interval);
    } else {
      // TODO: Fetch from API
      setLoading(false);
    }
  }, []);

  const handleUpdateProgress = (jobId: string, completed: number) => {
    setJobs(jobs.map(j => j.id === jobId ? { ...j, completed } : j));
    // TODO: Update in demoData or API
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-200 to-white flex items-center justify-center">
        <div className="text-[#0a1929]">Loading active jobs...</div>
      </div>
    );
  }

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
                  <span className="text-white ml-2">{job.material || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[#9ca3af]">Machine:</span>
                  <span className="text-white ml-2">{job.machine || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[#9ca3af]">Deadline:</span>
                  <span className="text-white ml-2">{new Date(job.deadline).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-[#253242]">
                <Link
                  href={`/maker/jobs/active/${job.id}`}
                  className="bg-[#253242] hover:bg-[#3a4552] text-white px-4 py-2 border border-[#3a4552] transition-colors text-sm"
                >
                  View Details
                </Link>
                {job.status === 'in_production' && (
                  <Link
                    href={`/maker/jobs/qc/${job.id}`}
                    className="bg-[#253242] hover:bg-[#3a4552] text-white px-4 py-2 border border-[#3a4552] transition-colors text-sm"
                  >
                    Submit for QC
                  </Link>
                )}
                {job.status === 'qc_pending' && (
                  <button
                    disabled
                    className="bg-[#253242] text-[#9ca3af] px-4 py-2 border border-[#3a4552] cursor-not-allowed text-sm"
                  >
                    Awaiting QC Review
                  </button>
                )}
                {job.status === 'qc_approved' && (
                  <Link
                    href={`/maker/jobs/ship/${job.id}`}
                    className="bg-[#253242] hover:bg-[#3a4552] text-white px-4 py-2 border border-[#3a4552] transition-colors text-sm"
                  >
                    Mark as Shipped
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

