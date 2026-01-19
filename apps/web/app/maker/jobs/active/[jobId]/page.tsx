'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import STLViewer from '@/components/STLViewer';

export default function ActiveJobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;

  const [showDescription, setShowDescription] = useState(false);

  // TODO: Fetch actual job data - using more accurate pay amounts
  const [job] = useState({
    id: jobId,
    product_name: 'Bracket Assembly',
    client_name: 'Acme Corp',
    status: 'in_production',
    quantity: 50,
    completed: 30,
    deadline: '2026-02-15',
    pay_amount: 3247.50, // More accurate: $64.95 per unit for precision CNC aluminum work
    started_at: '2026-01-20',
    material: '6061-T6 Aluminum',
    material_cost: 245.00, // ~$4.90 per unit for material
    tolerance: '±0.005"',
    expected_time: '12 hours',
    machine: 'CNC Milling',
    extended_description: 'Precision bracket assembly for mounting system. Must maintain ±0.005" tolerance throughout. Requires smooth finish with no burrs. Parts will be used in aerospace application, so quality is critical. All edges must be deburred and cleaned.',
    stl_file: null as File | null, // TODO: Load actual STL file from storage
  });

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
            <h2 className="text-xl font-semibold text-white mb-4 heading-font">CAD File (STL Model)</h2>
            <div className="bg-black border border-[#253242] min-h-[400px] flex items-center justify-center">
              {job.stl_file ? (
                <STLViewer file={job.stl_file} width={500} height={400} />
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

        {/* Action Buttons */}
        <div className="bg-[#0a1929] border border-[#1a2332] p-6">
          <div className="flex gap-4">
            {job.completed >= job.quantity && job.status === 'in_production' && (
              <Link
                href={`/maker/jobs/qc/${job.id}`}
                className="flex-1 bg-[#253242] hover:bg-[#3a4552] text-white px-6 py-3 border border-[#3a4552] transition-colors text-center font-medium"
              >
                Check Quality
              </Link>
            )}
            {job.status === 'qc_approved' && (
              <Link
                href={`/maker/jobs/ship/${job.id}`}
                className="flex-1 bg-[#253242] hover:bg-[#3a4552] text-white px-6 py-3 border border-[#3a4552] transition-colors text-center font-medium"
              >
                Ship Order
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

