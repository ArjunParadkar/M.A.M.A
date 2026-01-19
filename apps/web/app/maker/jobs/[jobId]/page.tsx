'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;

  // TODO: Fetch actual job data from database
  const [job] = useState({
    id: jobId,
    product_name: 'Bracket Assembly',
    client_name: 'Acme Corp',
    material: '6061-T6 Aluminum',
    quantity: 50,
    tolerance: '±0.005"',
    deadline: '2026-02-15',
    suggested_pay: 3247.50, // $64.95 per unit for precision CNC aluminum work
    expected_time: '12 hours',
    manufacturing_types: ['CNC Milling'],
    machine: 'CNC Milling',
    extended_description: 'Precision bracket assembly for mounting system. Must maintain ±0.005" tolerance throughout. Requires smooth finish with no burrs. Parts will be used in aerospace application, so quality is critical. All edges must be deburred and cleaned.',
    finish: 'Smooth',
    coatings: [],
  });

  const handleAcceptJob = async () => {
    // TODO: Create active_job entry
    router.push('/maker/jobs/active');
  };

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
              <p className="text-white font-medium">{job.tolerance}</p>
            </div>
            <div>
              <span className="text-[#9ca3af] text-sm">Deadline</span>
              <p className="text-white font-medium">{new Date(job.deadline).toLocaleDateString()}</p>
            </div>
            <div>
              <span className="text-[#9ca3af] text-sm">Expected Time</span>
              <p className="text-white font-medium">{job.expected_time}</p>
            </div>
            <div>
              <span className="text-[#9ca3af] text-sm">Machine</span>
              <p className="text-white font-medium">{job.machine}</p>
            </div>
            <div>
              <span className="text-[#9ca3af] text-sm">Pay</span>
              <p className="text-white font-medium text-xl">${job.suggested_pay.toFixed(2)}</p>
            </div>
          </div>

          {job.extended_description && (
            <div>
              <span className="text-[#9ca3af] text-sm">Extended Description</span>
              <p className="text-white mt-1 leading-relaxed">{job.extended_description}</p>
            </div>
          )}

          <div className="flex gap-4 pt-4 border-t border-[#253242]">
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
          </div>
        </div>
      </div>
    </div>
  );
}

