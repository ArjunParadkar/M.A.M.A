'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface JobRecommendation {
  id: string;
  job_id: string;
  client_name: string;
  product_name: string;
  material: string;
  quantity: number;
  tolerance: string;
  deadline: string;
  suggested_pay: number;
  rank_score: number;
  estimated_hours: number;
  type: 'open-request' | 'quick-service' | 'closed-request';
  max_quantity_claimable?: number; // For open requests
}

export default function MakerJobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<JobRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'open-request' | 'quick-service' | 'closed-request'>('all');

  useEffect(() => {
    // TODO: Fetch actual recommendations from database
    // For now, mock data
    const mockJobs: JobRecommendation[] = [
      {
        id: 'rec1',
        job_id: 'job1',
        client_name: 'Acme Corp',
        product_name: 'Bracket Assembly',
        material: '6061-T6 Aluminum',
        quantity: 50,
        tolerance: '±0.005"',
        deadline: '2026-02-15',
        suggested_pay: 2450.00,
        rank_score: 0.92,
        estimated_hours: 12,
        type: 'open-request',
        max_quantity_claimable: 25, // Can claim up to 25 units
      },
      {
        id: 'rec2',
        job_id: 'job2',
        client_name: 'TechStart Inc',
        product_name: 'Custom Housing',
        material: 'ABS',
        quantity: 100,
        tolerance: '±0.010"',
        deadline: '2026-02-20',
        suggested_pay: 3200.00,
        rank_score: 0.87,
        estimated_hours: 18,
        type: 'quick-service',
      },
    ];
    
    setJobs(mockJobs);
    setLoading(false);
  }, []);

  const handleAcceptJob = async (job: JobRecommendation, quantity?: number) => {
    try {
      // TODO: Create active_job entry in database
      // For open requests, specify claimed quantity
      console.log('Accepting job:', job.id, quantity ? `Quantity: ${quantity}` : '');
      
      // Redirect to active jobs or show success
      router.push('/maker/jobs/active');
    } catch (error) {
      console.error('Error accepting job:', error);
    }
  };

  const filteredJobs = filter === 'all' ? jobs : jobs.filter(j => j.type === filter);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-200 to-white">
      {/* Top Navigation Bar */}
      <div className="bg-[#0a1929] text-white py-4 px-8 border-b border-[#1a2332]">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <Link href="/maker/dashboard" className="text-white hover:text-[#9ca3af] transition-colors">
              ← Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        <h1 className="text-4xl font-semibold text-[#0a1929] mb-2 heading-font">
          Job Recommendations
        </h1>
        <p className="text-[#6b7280] mb-6">Accept new work and view available opportunities</p>

        {/* Filter Tabs */}
        <div className="flex gap-4 mb-6">
          {(['all', 'open-request', 'quick-service', 'closed-request'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 border transition-colors ${
                filter === f
                  ? 'bg-[#0a1929] border-[#0a1929] text-white'
                  : 'bg-white border-[#253242] text-[#6b7280] hover:border-[#0a1929]'
              }`}
            >
              {f === 'all' ? 'All' : f.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-[#9ca3af]">Loading recommendations...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="bg-white border border-[#1a2332] p-12 text-center">
            <p className="text-[#6b7280]">No jobs available in this category</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredJobs.map((job) => (
              <div key={job.id} className="bg-[#0a1929] border border-[#1a2332] p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-1">{job.product_name}</h3>
                    <p className="text-[#9ca3af]">Client: {job.client_name}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">${job.suggested_pay.toFixed(2)}</div>
                    <p className="text-sm text-[#9ca3af]">Match: {(job.rank_score * 100).toFixed(0)}%</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                  <div>
                    <span className="text-[#9ca3af]">Material:</span>
                    <span className="text-white ml-2">{job.material}</span>
                  </div>
                  <div>
                    <span className="text-[#9ca3af]">Quantity:</span>
                    <span className="text-white ml-2">{job.quantity}</span>
                  </div>
                  <div>
                    <span className="text-[#9ca3af]">Tolerance:</span>
                    <span className="text-white ml-2">{job.tolerance}</span>
                  </div>
                  <div>
                    <span className="text-[#9ca3af]">Est. Hours:</span>
                    <span className="text-white ml-2">{job.estimated_hours}h</span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-[#253242]">
                  <div className="text-sm text-[#9ca3af]">
                    Deadline: {new Date(job.deadline).toLocaleDateString()}
                  </div>
                  <div className="flex gap-3">
                    {job.type === 'open-request' && job.max_quantity_claimable && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-[#9ca3af]">Claim up to:</span>
                        <input
                          type="number"
                          min="1"
                          max={job.max_quantity_claimable}
                          defaultValue={job.max_quantity_claimable}
                          className="w-20 bg-[#1a2332] border border-[#253242] text-white px-2 py-1 text-sm"
                        />
                        <span className="text-sm text-[#9ca3af]">units</span>
                      </div>
                    )}
                    <button
                      onClick={() => handleAcceptJob(job)}
                      className="bg-[#253242] hover:bg-[#3a4552] text-white px-6 py-2 border border-[#3a4552] transition-colors"
                    >
                      Accept Job
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

