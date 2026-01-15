'use client';

import { useState, useEffect } from 'react';
import { ScoreBadge } from './ScoreBadge';
import type { QCRecord } from '@shared/types';

interface QCPanelProps {
  jobId: string;
  qcRecord?: QCRecord;
  onAccept?: () => void;
  onDispute?: () => void;
}

export function QCPanel({ jobId, qcRecord, onAccept, onDispute }: QCPanelProps) {
  const [loading, setLoading] = useState(false);
  const [qc, setQc] = useState<QCRecord | null>(qcRecord || null);

  useEffect(() => {
    if (!qcRecord && jobId) {
      // Fetch QC record
      fetch(`/api/qc/${jobId}`)
        .then((res) => res.json())
        .then((data) => setQc(data))
        .catch(console.error);
    }
  }, [jobId, qcRecord]);

  if (!qc) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">QC check not yet completed.</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'review':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'fail':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-900">Quality Control Results</h3>
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(qc.status)}`}
        >
          {qc.status.toUpperCase()}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <label className="text-sm font-medium text-gray-500">QC Score</label>
          <div className="mt-1">
            <ScoreBadge score={qc.qc_score} />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-500">Similarity</label>
          <div className="mt-1">
            <ScoreBadge score={qc.similarity} />
          </div>
        </div>
      </div>

      <div className="mb-6">
        <label className="text-sm font-medium text-gray-500">Evidence Files</label>
        <div className="mt-2 space-y-2">
          {qc.evidence_paths && qc.evidence_paths.length > 0 ? (
            qc.evidence_paths.map((path, idx) => (
              <div key={idx} className="flex items-center text-sm text-gray-600">
                <span className="mr-2">📎</span>
                <a
                  href={path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-indigo-800"
                >
                  {path.split('/').pop()}
                </a>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">No evidence files</p>
          )}
        </div>
      </div>

      <div className="mb-6">
        <label className="text-sm font-medium text-gray-500">Model Version</label>
        <p className="mt-1 text-sm text-gray-600">{qc.model_version}</p>
      </div>

      {qc.status !== 'fail' && (
        <div className="flex justify-end space-x-4 pt-4 border-t">
          {onDispute && (
            <button
              onClick={onDispute}
              className="px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50"
            >
              Dispute
            </button>
          )}
          {onAccept && (
            <button
              onClick={onAccept}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Accept
            </button>
          )}
        </div>
      )}

      {qc.status === 'fail' && (
        <div className="pt-4 border-t">
          <p className="text-sm text-red-600">
            This job failed quality control. Please contact support or create a dispute.
          </p>
        </div>
      )}
    </div>
  );
}
