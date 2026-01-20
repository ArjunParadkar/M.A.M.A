'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DEMO_MODE, getRevaNotifications, acceptJobForReva, type DemoJob } from '@/lib/demoData';

interface NewRequest {
  id: string;
  clientName: string;
  deadline: string;
  attempts: number;
  material: string;
  quantity: number;
  toleranceTier: string;
}

export default function NewRequestsPage() {
  const router = useRouter();
  const [demoJobs, setDemoJobs] = useState<DemoJob[]>([]);

  useEffect(() => {
    if (DEMO_MODE) {
      const notifications = getRevaNotifications();
      setDemoJobs(notifications);
    }
  }, []);

  // Listen for storage changes
  useEffect(() => {
    if (!DEMO_MODE) return;
    
    const handleStorageChange = () => {
      const notifications = getRevaNotifications();
      setDemoJobs(notifications);
    };

    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(handleStorageChange, 1000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const handleAccept = (jobId: string) => {
    if (DEMO_MODE) {
      const job = demoJobs.find(j => j.id === jobId);
      if (!job) return;
      
      if (job?.order_type === 'open-request') {
        // Calculate available quantity
        const totalAssigned = job.assigned_manufacturers?.reduce((sum, m) => sum + (m.assigned_quantity || 0), 0) || 0;
        const available = job.quantity - totalAssigned;
        
        // Calculate feasibility - estimate time per part
        const deadlineDate = new Date(job.deadline);
        const now = new Date();
        const daysUntilDeadline = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const hoursUntilDeadline = daysUntilDeadline * 24;
        
        // Estimate hours per part (conservative: 2-4 hours per part depending on complexity)
        const hoursPerPart = 3; // Average estimate
        const maxFeasibleParts = Math.floor((hoursUntilDeadline / hoursPerPart) * 0.8); // 80% capacity to be safe
        
        // For open requests, prompt for quantity with feasibility check
        const quantityInput = prompt(
          `How many units can you accept?\n` +
          `Available: ${available}\n` +
          `Deadline: ${daysUntilDeadline} days (${hoursUntilDeadline} hours)\n` +
          `Estimated time per part: ~${hoursPerPart} hours\n` +
          `Recommended max: ${Math.min(available, maxFeasibleParts)} parts (to meet deadline)\n` +
          `Enter quantity (Max: ${available}):`
        );
        
        if (quantityInput) {
          const quantity = parseInt(quantityInput);
          if (quantity > 0 && quantity <= available) {
            // Warn if quantity seems infeasible
            if (quantity > maxFeasibleParts) {
              const confirm = window.confirm(
                `Warning: ${quantity} parts in ${daysUntilDeadline} days might be challenging.\n` +
                `Estimated time needed: ${quantity * hoursPerPart} hours\n` +
                `Available time: ~${hoursUntilDeadline} hours\n` +
                `Do you still want to accept?`
              );
              if (!confirm) return;
            }
            acceptJobForReva(jobId, quantity);
            router.push('/maker/dashboard');
          } else {
            alert(`Invalid quantity. Please enter a number between 1 and ${available}.`);
          }
        }
      } else {
        // For closed requests/commissions, accept full quantity
        acceptJobForReva(jobId);
        router.push('/maker/dashboard');
      }
    }
  };
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-200 to-white p-0">
      {/* Top Section - Navy */}
      <div className="bg-[#0a1929] p-8 pb-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-6">
              <Link
                href="/maker/dashboard"
                className="bg-[#1a2332] hover:bg-[#253242] text-white px-6 py-3 border border-[#1a2332] hover:border-[#253242] transition-colors font-medium heading-font"
              >
                Back to Dashboard
              </Link>
              <h1 className="text-4xl font-semibold text-white heading-font">
                New Requests
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - White Background */}
      <div className="bg-white p-8 pt-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <p className="text-gray-600 text-lg">
              {DEMO_MODE ? demoJobs.length : 0} new request{(DEMO_MODE ? demoJobs.length : 0) !== 1 ? 's' : ''} available
            </p>
          </div>

          {DEMO_MODE && demoJobs.length === 0 && (
            <div className="bg-[#0a1929] border border-[#1a2332] p-8 text-center text-white">
              <p>No new requests at this time.</p>
              <p className="text-sm text-[#9ca3af] mt-2">Create orders as Arham (client) to see them appear here.</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(DEMO_MODE ? demoJobs : []).map((job) => (
              <div key={job.id} className="bg-[#0a1929] border border-[#1a2332] overflow-hidden">
                {/* STL Preview - Mesh of Dots */}
                <div className="relative h-48 bg-black overflow-hidden flex items-center justify-center">
                  <div className="relative w-40 h-40 stl-mesh-container">
                    <div className="stl-mesh-3d">
                      {Array.from({ length: 64 }).map((_, i) => {
                        const row = Math.floor(i / 8);
                        const col = i % 8;
                        const x = (col - 3.5) * 12;
                        const y = (row - 3.5) * 12;
                        const z = 0;
                        
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

                {/* Request Info */}
                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-1 heading-font">
                      {job.title || 'Manufacturing Job'}
                    </h3>
                    <p className="text-[#9ca3af] text-sm">Client: {job.client_name}</p>
                    <p className="text-[#9ca3af] text-xs mt-1">Type: {job.order_type.replace('-', ' ')}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[#9ca3af] text-sm">Material:</span>
                      <span className="text-white text-sm font-medium">{job.material}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#9ca3af] text-sm">Quantity:</span>
                      <span className="text-white text-sm font-medium">{job.quantity} {job.order_type === 'open-request' && job.assigned_quantity ? `(${job.assigned_quantity} assigned)` : ''}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#9ca3af] text-sm">Tolerance:</span>
                      <span className="text-white text-sm font-medium">{job.tolerance || 'Standard'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#9ca3af] text-sm">Pay:</span>
                      <span className="text-white text-sm font-medium">${job.suggested_pay.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-[#1a2332]">
                      <span className="text-[#9ca3af] text-sm">Deadline:</span>
                      <span className="text-white text-sm font-medium">
                        {formatDate(job.deadline)}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button 
                      onClick={() => handleAccept(job.id)}
                      className="flex-1 bg-[#1a2332] hover:bg-[#253242] text-white px-4 py-3 border border-[#253242] hover:border-[#3a4552] transition-colors font-medium"
                    >
                      Accept Request
                    </button>
                    <Link 
                      href={`/maker/jobs/${job.id}`}
                      className="flex-1 bg-[#1a2332] hover:bg-[#253242] text-white px-4 py-3 border border-[#253242] hover:border-[#3a4552] transition-colors font-medium text-center"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

