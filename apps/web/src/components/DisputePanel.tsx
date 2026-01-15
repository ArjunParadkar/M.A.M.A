'use client';

import { useState, useEffect } from 'react';
import { ScoreBadge } from './ScoreBadge';
import type { Dispute, Job, JobRecommendation, PayEstimate, QCRecord } from '@shared/types';

interface DisputePanelProps {
  dispute: Dispute & {
    jobs?: Job;
    profiles?: any;
  };
  isAdmin?: boolean;
  onResolve?: (disputeId: string, resolution: string, approved: boolean) => void;
}

export function DisputePanel({ dispute, isAdmin = false, onResolve }: DisputePanelProps) {
  const [evidence, setEvidence] = useState<{
    recommendation?: JobRecommendation;
    payEstimate?: PayEstimate;
    qcRecord?: QCRecord;
  }>({});
  const [resolution, setResolution] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEvidence = async () => {
      if (!dispute.jobs?.id) return;

      const jobId = dispute.jobs.id;

      try {
        // Fetch all evidence in parallel
        const [recRes, payRes, qcRes] = await Promise.all([
          fetch(`/api/jobs/${jobId}/recommendations`).then((r) => r.json()).catch(() => null),
          fetch(`/api/jobs/${jobId}/pay-estimate`).then((r) => r.json()).catch(() => null),
          fetch(`/api/jobs/${jobId}/qc`).then((r) => r.json()).catch(() => null),
        ]);

        setEvidence({
          recommendation: recRes?.data?.[0] || null,
          payEstimate: payRes?.data || null,
          qcRecord: qcRes?.data || null,
        });
      } catch (err) {
        console.error('Error loading evidence:', err);
      } finally {
        setLoading(false);
      }
    };

    loadEvidence();
  }, [dispute.jobs?.id]);

  const handleResolve = (approved: boolean) => {
    if (!onResolve || !resolution.trim()) {
      alert('Please provide a resolution reason');
      return;
    }
    onResolve(dispute.id, resolution, approved);
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-gray-600">Loading evidence packet...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dispute Info */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900">Dispute Details</h3>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              dispute.status === 'open'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-green-100 text-green-800'
            }`}
          >
            {dispute.status.toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Job ID</label>
            <p className="mt-1 text-sm text-gray-900">{dispute.jobs?.title || dispute.job_id}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Created</label>
            <p className="mt-1 text-sm text-gray-900">
              {new Date(dispute.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="mb-4">
          <label className="text-sm font-medium text-gray-500">Reason</label>
          <p className="mt-1 text-sm text-gray-900">{dispute.reason}</p>
        </div>

        {dispute.status === 'resolved' && dispute.resolution && (
          <div className="border-t pt-4">
            <label className="text-sm font-medium text-gray-500">Resolution</label>
            <p className="mt-1 text-sm text-gray-900">{dispute.resolution}</p>
          </div>
        )}
      </div>

      {/* Evidence Packet */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Evidence Packet</h3>

        {/* F1: Ranking Result */}
        {evidence.recommendation && (
          <div className="mb-6 pb-6 border-b">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">F1: Manufacturer Ranking</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Rank Score</span>
                <ScoreBadge score={evidence.recommendation.rank_score} />
              </div>
              <div>
                <span className="text-sm text-gray-600">Top Factors:</span>
                <ul className="mt-1 list-disc list-inside text-sm text-gray-800">
                  {evidence.recommendation.explanations?.factors?.map((factor: string, idx: number) => (
                    <li key={idx}>{factor}</li>
                  ))}
                </ul>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Model: {evidence.recommendation.model_version}
              </div>
            </div>
          </div>
        )}

        {/* F2: Pay Estimate */}
        {evidence.payEstimate && (
          <div className="mb-6 pb-6 border-b">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">F2: Fair Pay Estimate</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Suggested Pay</span>
                <span className="text-sm font-semibold text-gray-900">
                  ${evidence.payEstimate.suggested_pay.toFixed(2)}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                Range: ${evidence.payEstimate.range_low.toFixed(2)} - $
                {evidence.payEstimate.range_high.toFixed(2)}
              </div>
              {evidence.payEstimate.breakdown && (
                <div className="mt-2 text-sm">
                  <span className="text-gray-600">Breakdown:</span>
                  <ul className="mt-1 space-y-1 text-gray-800">
                    <li>Time: ${evidence.payEstimate.breakdown.time?.toFixed(2)}</li>
                    <li>Material: ${evidence.payEstimate.breakdown.material?.toFixed(2)}</li>
                    <li>Complexity: ${evidence.payEstimate.breakdown.complexity?.toFixed(2)}</li>
                    <li>Urgency: ${evidence.payEstimate.breakdown.urgency?.toFixed(2)}</li>
                  </ul>
                </div>
              )}
              <div className="text-xs text-gray-500 mt-2">
                Model: {evidence.payEstimate.model_version}
              </div>
            </div>
          </div>
        )}

        {/* F3: QC Score */}
        {evidence.qcRecord && (
          <div className="mb-6 pb-6 border-b">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">F3: Quality Control</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">QC Score</span>
                <ScoreBadge score={evidence.qcRecord.qc_score} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Similarity</span>
                <ScoreBadge score={evidence.qcRecord.similarity} />
              </div>
              <div>
                <span className="text-sm text-gray-600">Status:</span>
                <span
                  className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                    evidence.qcRecord.status === 'pass'
                      ? 'bg-green-100 text-green-800'
                      : evidence.qcRecord.status === 'review'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {evidence.qcRecord.status.toUpperCase()}
                </span>
              </div>
              {evidence.qcRecord.evidence_paths && evidence.qcRecord.evidence_paths.length > 0 && (
                <div className="mt-2">
                  <span className="text-sm text-gray-600">Evidence Files:</span>
                  <div className="mt-1 space-y-1">
                    {evidence.qcRecord.evidence_paths.map((path: string, idx: number) => (
                      <a
                        key={idx}
                        href={path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sm text-indigo-600 hover:text-indigo-800"
                      >
                        {path.split('/').pop()}
                      </a>
                    ))}
                  </div>
                </div>
              )}
              <div className="text-xs text-gray-500 mt-2">
                Model: {evidence.qcRecord.model_version}
              </div>
            </div>
          </div>
        )}

        {/* Job Files */}
        {dispute.jobs?.stl_path && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Job Files</h4>
            <a
              href={dispute.jobs.stl_path}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-indigo-600 hover:text-indigo-800"
            >
              STL: {dispute.jobs.stl_path.split('/').pop()}
            </a>
          </div>
        )}
      </div>

      {/* Admin Resolution Panel */}
      {isAdmin && dispute.status === 'open' && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Resolve Dispute</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Resolution Reason
              </label>
              <textarea
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                rows={4}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Explain your decision..."
              />
            </div>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => handleResolve(false)}
                className="px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50"
              >
                Reject
              </button>
              <button
                onClick={() => handleResolve(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
