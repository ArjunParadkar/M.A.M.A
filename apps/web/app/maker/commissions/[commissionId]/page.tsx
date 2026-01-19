'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function CommissionDetailPage() {
  const params = useParams();
  const commissionId = params.commissionId as string;

  // TODO: Fetch actual commission data
  const [commission] = useState({
    id: commissionId,
    product_name: 'Standard Bracket',
    client_name: 'Long-term Client Corp',
    assignedThisWeek: 8,
    completedThisWeek: 4,
    quotaPerWeek: 8,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    payPerUnit: 25.00,
  });

  const percentage = (commission.completedThisWeek / commission.assignedThisWeek) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-200 to-white">
      <div className="bg-[#0a1929] text-white py-4 px-8 border-b border-[#1a2332]">
        <div className="max-w-7xl mx-auto">
          <Link href="/maker/dashboard" className="text-white hover:text-[#9ca3af] transition-colors">
            ← Back to Dashboard
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-8">
        <h1 className="text-3xl font-semibold text-[#0a1929] mb-2 heading-font">
          {commission.product_name}
        </h1>
        <p className="text-[#6b7280] mb-6">Long-term Commission • Client: {commission.client_name}</p>

        <div className="bg-[#0a1929] border border-[#1a2332] p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4 heading-font">Weekly Quota</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[#9ca3af] text-sm">This Week's Progress</span>
              <span className="text-white text-sm font-medium">
                {commission.completedThisWeek} / {commission.assignedThisWeek}
              </span>
            </div>
            <div className="w-full bg-[#1a2332] h-3">
              <div className="bg-[#253242] h-3" style={{ width: `${percentage}%` }} />
            </div>
            <div className="text-right">
              <span className="text-[#9ca3af] text-xs">{Math.round(percentage)}% Complete</span>
            </div>
          </div>
        </div>

        <div className="bg-[#0a1929] border border-[#1a2332] p-6">
          <h2 className="text-xl font-semibold text-white mb-4 heading-font">Commission Details</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-[#9ca3af]">Quota Per Week:</span> <span className="text-white ml-2">{commission.quotaPerWeek} units</span></div>
            <div><span className="text-[#9ca3af]">Pay Per Unit:</span> <span className="text-white ml-2">${commission.payPerUnit.toFixed(2)}</span></div>
            <div><span className="text-[#9ca3af]">Start Date:</span> <span className="text-white ml-2">{new Date(commission.startDate).toLocaleDateString()}</span></div>
            <div><span className="text-[#9ca3af]">End Date:</span> <span className="text-white ml-2">{new Date(commission.endDate).toLocaleDateString()}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

