'use client';

import { useState } from 'react';
import { ScoreBadge } from './ScoreBadge';
import { createClientSupabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

interface ManufacturerCardProps {
  recommendation: any;
  jobId: string;
  currentStatus: string;
}

export function ManufacturerCard({ recommendation, jobId, currentStatus }: ManufacturerCardProps) {
  const router = useRouter();
  const supabase = createClientSupabase();
  const [loading, setLoading] = useState(false);

  const handleSelect = async () => {
    setLoading(true);
    const { error } = await supabase
      .from('jobs')
      .update({ 
        selected_manufacturer_id: recommendation.manufacturer_id,
        status: 'assigned'
      })
      .eq('id', jobId);

    if (!error) {
      router.refresh();
    }
    setLoading(false);
  };

  const manufacturer = recommendation.manufacturers;
  const factors = recommendation.explanations?.factors || [];

  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-semibold text-gray-900">Manufacturer {manufacturer?.id.slice(0, 8)}</h3>
          <p className="text-sm text-gray-500">
            {manufacturer?.location_state}, {manufacturer?.location_zip}
          </p>
        </div>
        <ScoreBadge score={recommendation.rank_score} />
      </div>

      <div className="mb-4">
        <p className="text-sm font-medium text-gray-700 mb-2">Top Factors:</p>
        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
          {factors.slice(0, 3).map((factor: string, idx: number) => (
            <li key={idx}>{factor}</li>
          ))}
        </ul>
      </div>

      <div className="text-sm text-gray-600 mb-4">
        <p>Equipment: {Object.keys(manufacturer?.equipment || {}).filter(k => manufacturer?.equipment[k]).join(', ')}</p>
        <p>Materials: {manufacturer?.materials?.join(', ') || 'N/A'}</p>
        <p>Tolerance Tier: {manufacturer?.tolerance_tier}</p>
        <p>Capacity Score: {(manufacturer?.capacity_score * 100).toFixed(0)}%</p>
      </div>

      {currentStatus === 'posted' && (
        <button
          onClick={handleSelect}
          disabled={loading}
          className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Selecting...' : 'Select Manufacturer'}
        </button>
      )}
    </div>
  );
}

