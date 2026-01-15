import { ScoreBadge } from './ScoreBadge';

interface PayBreakdownProps {
  estimate: any;
}

export function PayBreakdown({ estimate }: PayBreakdownProps) {
  const breakdown = estimate.breakdown || {};

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-lg font-semibold text-gray-900">Suggested Pay</span>
        <span className="text-2xl font-bold text-indigo-600">
          ${estimate.suggested_pay.toFixed(2)}
        </span>
      </div>

      <div className="text-sm text-gray-600">
        <p>Range: ${estimate.range_low.toFixed(2)} - ${estimate.range_high.toFixed(2)}</p>
      </div>

      <div className="border-t pt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Breakdown</h4>
        <div className="grid grid-cols-2 gap-4">
          {breakdown.time && (
            <div>
              <span className="text-sm text-gray-500">Time</span>
              <p className="font-medium">${breakdown.time.toFixed(2)}</p>
            </div>
          )}
          {breakdown.material && (
            <div>
              <span className="text-sm text-gray-500">Material</span>
              <p className="font-medium">${breakdown.material.toFixed(2)}</p>
            </div>
          )}
          {breakdown.complexity && (
            <div>
              <span className="text-sm text-gray-500">Complexity</span>
              <p className="font-medium">${breakdown.complexity.toFixed(2)}</p>
            </div>
          )}
          {breakdown.urgency && (
            <div>
              <span className="text-sm text-gray-500">Urgency</span>
              <p className="font-medium">${breakdown.urgency.toFixed(2)}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

