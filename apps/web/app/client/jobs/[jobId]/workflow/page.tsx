'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { DEMO_MODE, getClientJobs, getDemoJobs, type DemoJob } from '@/lib/demoData';

interface JobAssignment {
  id: string;
  assigned_quantity: number;
  completed_quantity: number;
  estimated_delivery_date: string;
  status: 'accepted' | 'in_production' | 'qc_pending' | 'shipped' | 'delivered' | 'cancelled';
  pay_amount_cents: number;
  manufacturer: {
    id: string;
    name: string;
    company_name?: string;
  };
}

interface Job {
  id: string;
  title: string;
  quantity: number;
  order_type: string;
  status: string;
  deadline: string;
}

export default function ClientWorkflowPage() {
  const params = useParams();
  const jobId = params.jobId as string;
  const [job, setJob] = useState<Job | null>(null);
  const [assignments, setAssignments] = useState<JobAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        if (DEMO_MODE) {
          // Load from demo data
          const jobs = getDemoJobs();
          const foundJob = jobs.find(j => j.id === jobId);
          
          if (foundJob) {
            setJob({
              id: foundJob.id,
              title: foundJob.title,
              quantity: foundJob.quantity,
              order_type: foundJob.order_type,
              status: foundJob.status,
              deadline: foundJob.deadline,
            });

            // Convert demo job to assignments format
            const demoAssignments: JobAssignment[] = [];
            
            if (foundJob.selected_manufacturer_id) {
              // Single manufacturer (closed request/commission/quick service)
              // Calculate completed quantity based on status
              let completedQty = 0;
              if (foundJob.status === 'shipped') {
                completedQty = foundJob.quantity; // Fully shipped
              } else if (foundJob.status === 'qc_pending') {
                completedQty = foundJob.quantity; // All parts submitted for QC
              } else if (foundJob.status === 'in_production') {
                completedQty = Math.floor(foundJob.quantity * 0.6); // 60% in progress
              }
              
              demoAssignments.push({
                id: `demo_assignment_${foundJob.id}`,
                assigned_quantity: foundJob.quantity,
                completed_quantity: completedQty,
                estimated_delivery_date: foundJob.deadline,
                status: foundJob.status === 'accepted' ? 'accepted' : 
                        foundJob.status === 'in_production' ? 'in_production' :
                        foundJob.status === 'qc_pending' ? 'qc_pending' :
                        foundJob.status === 'shipped' ? 'shipped' : 'accepted',
                pay_amount_cents: Math.round(foundJob.suggested_pay * 100),
                manufacturer: {
                  id: foundJob.selected_manufacturer_id,
                  name: foundJob.selected_manufacturer_id === 'reva_demo_id' ? 'Reva' : 'Manufacturer',
                },
              });
            } else if (foundJob.assigned_manufacturers && foundJob.assigned_manufacturers.length > 0) {
              // Multiple manufacturers (open request)
              foundJob.assigned_manufacturers.forEach((mfg, idx) => {
                // Calculate completed quantity based on status
                let completedQty = 0;
                if (mfg.status === 'shipped') {
                  completedQty = mfg.assigned_quantity; // Fully shipped
                } else if (mfg.status === 'qc_pending') {
                  completedQty = mfg.assigned_quantity; // All parts submitted for QC
                } else if (mfg.status === 'in_production') {
                  completedQty = Math.floor(mfg.assigned_quantity * 0.6); // 60% in progress
                }
                
                demoAssignments.push({
                  id: `demo_assignment_${foundJob.id}_${idx}`,
                  assigned_quantity: mfg.assigned_quantity,
                  completed_quantity: completedQty,
                  estimated_delivery_date: mfg.estimated_delivery,
                  status: mfg.status === 'accepted' ? 'accepted' :
                          mfg.status === 'in_production' ? 'in_production' :
                          mfg.status === 'qc_pending' ? 'qc_pending' :
                          mfg.status === 'shipped' ? 'shipped' : 'accepted',
                  pay_amount_cents: Math.round(mfg.pay_amount * 100),
                  manufacturer: {
                    id: mfg.manufacturer_id,
                    name: mfg.manufacturer_name,
                  },
                });
              });
            }
            
            setAssignments(demoAssignments);
          }
        } else if (!isSupabaseConfigured()) {
          setLoading(false);
          return;
        } else {
          // Fetch job details
          const jobRes = await fetch(`/api/jobs/${jobId}`);
          const jobData = await jobRes.json();
          if (jobData.error) {
            if (process.env.NODE_ENV === 'development') {
              // eslint-disable-next-line no-console
              console.error('Job fetch error:', jobData.error);
            }
            setLoading(false);
            return;
          }
          setJob(jobData);

          // Fetch assignments
          const assignRes = await fetch(`/api/jobs/${jobId}/assignments`);
          const assignData = await assignRes.json();
          if (assignData.error) {
            console.error('Assignments fetch error:', assignData.error);
            setAssignments([]);
          } else {
            setAssignments(assignData || []);
          }
        }
      } catch (e) {
        console.error('Error loading workflow:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
    
    // Poll for updates every 2 seconds
    const interval = setInterval(load, 2000);
    return () => clearInterval(interval);
  }, [jobId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-900 text-green-200';
      case 'shipped': return 'bg-blue-900 text-blue-200';
      case 'qc_pending': return 'bg-yellow-900 text-yellow-200';
      case 'in_production': return 'bg-purple-900 text-purple-200';
      case 'accepted': return 'bg-gray-900 text-gray-200';
      case 'cancelled': return 'bg-red-900 text-red-200';
      default: return 'bg-gray-900 text-gray-200';
    }
  };

  const totalAssigned = assignments.reduce((sum, a) => sum + a.assigned_quantity, 0);
  const totalCompleted = assignments.reduce((sum, a) => sum + a.completed_quantity, 0);
  const remaining = (job?.quantity || 0) - totalAssigned;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-200 to-white">
      <div className="bg-[#0a1929] text-white py-4 px-8 border-b border-[#1a2332]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href={`/client/jobs/${jobId}`} className="text-white hover:text-[#9ca3af] transition-colors">
            ← Back to Job Details
          </Link>
          <div className="text-white heading-font">Workflow Management</div>
          <div className="w-24" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8 space-y-6">
        {loading ? (
          <div className="bg-[#0a1929] border border-[#1a2332] p-8 text-white">Loading workflow...</div>
        ) : !job ? (
          <div className="bg-[#0a1929] border border-[#1a2332] p-8 text-white">Job not found.</div>
        ) : (
          <>
            {/* Job Summary */}
            <div className="bg-[#0a1929] border border-[#1a2332] p-6">
              <h1 className="text-2xl font-semibold text-white mb-4 heading-font">{job.title}</h1>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-[#9ca3af]">Total Quantity:</span>
                  <span className="text-white ml-2">{job.quantity}</span>
                </div>
                <div>
                  <span className="text-[#9ca3af]">Assigned:</span>
                  <span className="text-white ml-2">{totalAssigned}</span>
                </div>
                <div>
                  <span className="text-[#9ca3af]">Completed:</span>
                  <span className="text-white ml-2">{totalCompleted}</span>
                </div>
                <div>
                  <span className="text-[#9ca3af]">Remaining:</span>
                  <span className="text-white ml-2">{remaining}</span>
                </div>
              </div>
              {remaining > 0 && job.order_type === 'open-request' && (
                <div className="mt-4 text-yellow-200 text-sm">
                  ⚠ {remaining} units still available for manufacturers to claim
                </div>
              )}
            </div>

            {/* Assignments List */}
            {job.order_type === 'open-request' ? (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-[#0a1929] heading-font">
                  Manufacturer Assignments ({assignments.length})
                </h2>
                {assignments.length === 0 ? (
                  <div className="bg-[#0a1929] border border-[#1a2332] p-8 text-center text-white">
                    <p>No manufacturers have accepted portions of this job yet.</p>
                    <p className="text-sm text-[#9ca3af] mt-2">Manufacturers will appear here as they claim quantities.</p>
                  </div>
                ) : (
                  assignments.map((assignment) => (
                    <div key={assignment.id} className="bg-[#0a1929] border border-[#1a2332] p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-white heading-font">
                            {assignment.manufacturer.company_name || assignment.manufacturer.name || 'Manufacturer'}
                          </h3>
                          <p className="text-sm text-[#9ca3af] mt-1">
                            Assigned: {assignment.assigned_quantity} units
                          </p>
                        </div>
                        <span className={`px-3 py-1 text-xs font-medium ${getStatusColor(assignment.status)}`}>
                          {assignment.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                        <div>
                          <span className="text-[#9ca3af]">Progress:</span>
                          <span className="text-white ml-2">
                            {assignment.completed_quantity} / {assignment.assigned_quantity}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#9ca3af]">Est. Delivery:</span>
                          <span className="text-white ml-2">
                            {new Date(assignment.estimated_delivery_date).toLocaleDateString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#9ca3af]">Pay Amount:</span>
                          <span className="text-white ml-2">
                            ${(assignment.pay_amount_cents / 100).toFixed(2)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#9ca3af]">Per Unit:</span>
                          <span className="text-white ml-2">
                            ${((assignment.pay_amount_cents / 100) / assignment.assigned_quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-[#1a2332] h-3 mb-2">
                        <div
                          className="bg-[#253242] h-3 transition-all"
                          style={{
                            width: `${Math.min(100, (assignment.completed_quantity / assignment.assigned_quantity) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              /* Single Manufacturer View (for non-open-request jobs) */
              <div className="bg-[#0a1929] border border-[#1a2332] p-6">
                <h2 className="text-xl font-semibold text-white mb-4 heading-font">Manufacturer Progress</h2>
                {assignments.length === 0 ? (
                  <div className="text-[#9ca3af]">
                    <p>This job has a single manufacturer assigned.</p>
                    <p className="text-sm mt-2">Workflow details will appear here once production begins.</p>
                  </div>
                ) : (
                  assignments.map((assignment) => (
                    <div key={assignment.id}>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-white heading-font">
                            {assignment.manufacturer.company_name || assignment.manufacturer.name || 'Manufacturer'}
                          </h3>
                        </div>
                        <span className={`px-3 py-1 text-xs font-medium ${getStatusColor(assignment.status)}`}>
                          {assignment.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-4">
                        <div>
                          <span className="text-[#9ca3af]">Progress:</span>
                          <span className="text-white ml-2">
                            {assignment.completed_quantity} / {assignment.assigned_quantity}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#9ca3af]">Est. Delivery:</span>
                          <span className="text-white ml-2">
                            {new Date(assignment.estimated_delivery_date).toLocaleDateString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#9ca3af]">Pay Amount:</span>
                          <span className="text-white ml-2">
                            ${(assignment.pay_amount_cents / 100).toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-[#1a2332] h-3">
                        <div
                          className="bg-[#253242] h-3 transition-all"
                          style={{
                            width: `${Math.min(100, (assignment.completed_quantity / assignment.assigned_quantity) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

