'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function ClientFinancialsPage() {
  const [loading, setLoading] = useState(true);
  const [tx, setTx] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch('/api/financials');
        const data = await res.json();
        setTx(data.transactions || []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-200 to-white">
      <div className="bg-[#0a1929] text-white py-4 px-8 border-b border-[#1a2332]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/client/dashboard" className="text-white hover:text-[#9ca3af] transition-colors">
            ← Back to Dashboard
          </Link>
          <h1 className="text-xl font-semibold heading-font">Financials</h1>
          <div className="w-24" />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8">
        <div className="bg-[#0a1929] border border-[#1a2332] p-6">
          {loading ? (
            <div className="text-white">Loading…</div>
          ) : tx.length === 0 ? (
            <div className="text-[#9ca3af]">No financial transactions yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[#9ca3af]">
                    <th className="text-left py-2 pr-4">Date</th>
                    <th className="text-left py-2 pr-4">Job</th>
                    <th className="text-left py-2 pr-4">Status</th>
                    <th className="text-left py-2 pr-4">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {tx.map((t) => (
                    <tr key={t.id} className="border-t border-[#253242]">
                      <td className="py-2 pr-4 text-white">{new Date(t.created_at).toLocaleString()}</td>
                      <td className="py-2 pr-4 text-white">{t.job_id ? String(t.job_id).slice(-6) : '-'}</td>
                      <td className="py-2 pr-4 text-white">{t.status}</td>
                      <td className="py-2 pr-4 text-white">${(t.amount_cents / 100).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



