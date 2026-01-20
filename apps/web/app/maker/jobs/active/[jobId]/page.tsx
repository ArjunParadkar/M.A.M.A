'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import STLViewer from '@/components/STLViewer';
import JobMessages from '@/components/JobMessages';
import { DEMO_MODE, getManufacturerJobs, getDemoJobs, saveDemoJob, updateRevaWorkflow, type DemoJob } from '@/lib/demoData';

export default function ActiveJobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;

  const [showDescription, setShowDescription] = useState(false);
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (DEMO_MODE) {
      const jobs = getManufacturerJobs('reva_demo_id');
      const foundJob = jobs.find(j => j.id === jobId);
      if (foundJob) {
        // Calculate completed based on status
        let completed = 0;
        if (foundJob.status === 'in_production') {
          completed = Math.floor(foundJob.quantity * 0.6); // 60% done
        } else if (foundJob.status === 'qc_pending' || foundJob.status === 'shipped') {
          completed = foundJob.quantity;
        }

        // Get pay amount
        let payAmount = foundJob.suggested_pay;
        if (foundJob.assigned_manufacturers) {
          const revaAssignment = foundJob.assigned_manufacturers.find((m: any) => m.manufacturer_id === 'reva_demo_id');
          if (revaAssignment) {
            payAmount = revaAssignment.pay_amount;
          }
        }

        setJob({
          id: foundJob.id,
          product_name: foundJob.title,
          client_name: foundJob.client_name || 'Client',
          status: foundJob.status,
          quantity: foundJob.quantity,
          completed,
          deadline: foundJob.deadline,
          pay_amount: payAmount,
          started_at: foundJob.created_at,
          material: foundJob.material,
          tolerance: foundJob.tolerance,
          expected_time: '12 hours', // TODO: Calculate from workflow
          machine: foundJob.manufacturing_type?.[0] || 'CNC / 3D Printing',
          extended_description: foundJob.title + ' • Material: ' + foundJob.material + ' • Quantity: ' + foundJob.quantity + '. This is an actively running service.',
          stl_file_url: foundJob.stl_file_url,
        });
      } else {
        // Job not found - redirect or show error
        router.push('/maker/dashboard');
      }
      setLoading(false);
    } else {
      // TODO: Fetch from API
      setLoading(false);
    }
  }, [jobId, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-200 to-white flex items-center justify-center">
        <div className="text-[#0a1929]">Loading job details...</div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-200 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-[#0a1929] text-xl mb-4">Job not found</div>
          <Link href="/maker/dashboard" className="text-blue-600 hover:underline">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-200 to-white">
      <div className="bg-[#0a1929] text-white py-4 px-8 border-b border-[#1a2332]">
        <div className="max-w-7xl mx-auto">
          <Link href="/maker/jobs/active" className="text-white hover:text-[#9ca3af] transition-colors">
            ← Back to Active Jobs
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8">
        <h1 className="text-3xl font-semibold text-[#0a1929] mb-2 heading-font">{job.product_name}</h1>
        <p className="text-[#6b7280] mb-6">Client: {job.client_name}</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* STL CAD File Viewer */}
          <div className="bg-[#0a1929] border border-[#1a2332] p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white heading-font">CAD File (STL Model)</h2>
              {job.stl_file_url && (
                <a
                  href={job.stl_file_url}
                  download
                  className="bg-[#253242] hover:bg-[#3a4552] text-white px-4 py-2 border border-[#3a4552] transition-colors text-sm"
                >
                  ⬇ Download STL
                </a>
              )}
            </div>
            <div className="bg-black border border-[#253242] min-h-[400px] flex items-center justify-center relative">
              {job.stl_file_url ? (
                <div className="relative w-full h-full">
                  {/* Spinning STL Preview - Mesh of Dots */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative w-64 h-64 stl-mesh-container">
                      <div className="stl-mesh-3d">
                        {Array.from({ length: 64 }).map((_, i) => {
                          const row = Math.floor(i / 8);
                          const col = i % 8;
                          const x = (col - 3.5) * 16;
                          const y = (row - 3.5) * 16;
                          const z = Math.sin((i / 64) * Math.PI * 2) * 20;
                          
                          return (
                            <div
                              key={i}
                              className="stl-dot"
                              style={{
                                '--x': `${x}px`,
                                '--y': `${y}px`,
                                '--z': `${z}px`,
                                '--delay': `${(i * 0.05)}s`,
                              } as React.CSSProperties}
                            />
                          );
                        })}
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                        <span className="text-[#9ca3af] text-sm font-semibold bg-[#0a1929] px-3 py-1 border border-[#1a2332]">STL</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center p-8">
                  <div className="text-[#9ca3af] mb-4">STL Model Preview</div>
                  <div className="text-[#6b7280] text-sm">3D model will appear here</div>
                </div>
              )}
            </div>
          </div>

          {/* Job Options & Details */}
          <div className="space-y-6">
            {/* Progress */}
            <div className="bg-[#0a1929] border border-[#1a2332] p-6">
              <div className="flex justify-between text-sm text-[#9ca3af] mb-2">
                <span>Progress</span>
                <span>{job.completed} / {job.quantity} units</span>
              </div>
              <div className="w-full bg-[#1a2332] h-3 mb-4">
                <div className="bg-[#253242] h-3" style={{ width: `${(job.completed / job.quantity) * 100}%` }} />
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-[#9ca3af]">Status:</span> <span className="text-white ml-2 capitalize">{job.status.replace('_', ' ')}</span></div>
                <div><span className="text-[#9ca3af]">Deadline:</span> <span className="text-white ml-2">{new Date(job.deadline).toLocaleDateString()}</span></div>
              </div>
            </div>

            {/* Quick Info Cards */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setShowDescription(!showDescription)}
                className="bg-[#0a1929] border border-[#1a2332] hover:border-[#3a4552] p-4 text-left transition-colors"
              >
                <div className="text-[#9ca3af] text-xs mb-1">View</div>
                <div className="text-white font-medium">Description</div>
              </button>
              <div className="bg-[#0a1929] border border-[#1a2332] p-4">
                <div className="text-[#9ca3af] text-xs mb-1">Time</div>
                <div className="text-white font-medium">{job.expected_time}</div>
              </div>
              <div className="bg-[#0a1929] border border-[#1a2332] p-4">
                <div className="text-[#9ca3af] text-xs mb-1">Material Used</div>
                <div className="text-white font-medium">{job.material}</div>
              </div>
              <div className="bg-[#0a1929] border border-[#1a2332] p-4">
                <div className="text-[#9ca3af] text-xs mb-1">Pay Amount</div>
                <div className="text-white font-semibold text-lg">${job.pay_amount.toFixed(2)}</div>
                <div className="text-[#6b7280] text-xs mt-1">${(job.pay_amount / job.quantity).toFixed(2)} per unit</div>
              </div>
            </div>
          </div>
        </div>

        {/* Extended Description Modal */}
        {showDescription && job.extended_description && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setShowDescription(false)}>
            <div className="bg-[#0a1929] border border-[#1a2332] max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-white heading-font">Extended Description</h3>
                <button onClick={() => setShowDescription(false)} className="text-[#9ca3af] hover:text-white">✕</button>
              </div>
              <p className="text-white leading-relaxed">{job.extended_description}</p>
            </div>
          </div>
        )}

        {/* Start Button - For newly accepted jobs */}
        {job.status === 'accepted' && (
          <div className="bg-[#0a1929] border border-[#1a2332] p-6 mb-6">
            <h2 className="text-xl font-semibold text-white mb-4 heading-font">Start Production</h2>
            <p className="text-[#9ca3af] text-sm mb-4">
              Click the button below to start production on this job. Once started, the job will appear as "Running on Device" in your dashboard.
            </p>
            <button
              onClick={() => {
                if (DEMO_MODE && typeof window !== 'undefined') {
                  const jobs = getDemoJobs();
                  const foundJob = jobs.find(j => j.id === jobId);
                  if (foundJob) {
                    foundJob.status = 'in_production';
                    saveDemoJob(foundJob);
                    // Update workflow
                    updateRevaWorkflow();
                    // Reload the page to show updated status
                    window.location.reload();
                  }
                }
              }}
              className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 border border-green-700 transition-colors text-center font-medium"
            >
              Start Production →
            </button>
          </div>
        )}

        {/* Action Buttons - Quality Control & Submission */}
        {job.status !== 'accepted' && (
          <div className="bg-[#0a1929] border border-[#1a2332] p-6">
            <h2 className="text-xl font-semibold text-white mb-4 heading-font">Quality Control & Submission</h2>
            <p className="text-[#9ca3af] text-sm mb-4">
              Upload photos of your completed parts (4-6 photos recommended) for AI-powered quality control check.
            </p>
            <div className="flex gap-4">
              {(job.status === 'in_production' || job.completed >= job.quantity) && (
                <Link
                  href={`/maker/jobs/qc/${job.id}`}
                  className="flex-1 bg-[#253242] hover:bg-[#3a4552] text-white px-6 py-3 border border-[#3a4552] transition-colors text-center font-medium"
                >
                  Submit for Quality Check →
                </Link>
              )}
              {job.status === 'qc_approved' || job.status === 'qc_pending' ? (
                <Link
                  href={`/maker/jobs/ship/${job.id}`}
                  className="flex-1 bg-[#253242] hover:bg-[#3a4552] text-white px-6 py-3 border border-[#3a4552] transition-colors text-center font-medium"
                >
                  Ship Order →
                </Link>
              ) : null}
            </div>
          </div>
        )}

        <div className="mt-6">
          <JobMessages jobId={jobId} />
        </div>
      </div>
    </div>
  );
}

