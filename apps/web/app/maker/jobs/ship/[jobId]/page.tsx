'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ShippingPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;

  const [trackingNumber, setTrackingNumber] = useState('');
  const [shippingCarrier, setShippingCarrier] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // TODO: Fetch actual job data
  const [job] = useState({
    id: jobId,
    pay_amount: 3247.50, // Accurate pay amount
    contract_terms: {
      payment_upon_delivery: true,
      client_confirmation_required: true,
      payment_processing_days: '3-5 business days',
    },
  });

  const handleMarkShipped = async () => {
    if (!trackingNumber || !shippingCarrier) {
      alert('Please enter tracking number and carrier');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`/api/jobs/${jobId}/ship`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carrier: shippingCarrier,
          tracking_number: trackingNumber,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error('Ship failed:', err);
        setSubmitting(false);
        return;
      }
      router.push('/maker/jobs/active');
    } catch (error) {
      console.error('Error marking as shipped:', error);
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-200 to-white">
      {/* Top Navigation Bar */}
      <div className="bg-[#0a1929] text-white py-4 px-8 border-b border-[#1a2332]">
        <div className="max-w-7xl mx-auto">
          <Link href="/maker/jobs/active" className="text-white hover:text-[#9ca3af] transition-colors">
            ← Back to Active Jobs
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-8 py-8">
        <h1 className="text-3xl font-semibold text-[#0a1929] mb-2 heading-font">
          Mark as Shipped
        </h1>
        <p className="text-[#6b7280] mb-6">Enter shipping information to complete the order</p>

        <div className="bg-[#0a1929] border border-[#1a2332] p-8 space-y-6">
          <div>
            <label className="block text-white mb-2 font-medium">Shipping Carrier *</label>
            <select
              value={shippingCarrier}
              onChange={(e) => setShippingCarrier(e.target.value)}
              className="w-full bg-[#1a2332] border border-[#253242] text-white px-4 py-3 focus:outline-none focus:border-[#3a4552]"
              required
            >
              <option value="">Select carrier</option>
              <option value="usps">USPS</option>
              <option value="ups">UPS</option>
              <option value="fedex">FedEx</option>
              <option value="dhl">DHL</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-white mb-2 font-medium">Tracking Number *</label>
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              className="w-full bg-[#1a2332] border border-[#253242] text-white px-4 py-3 focus:outline-none focus:border-[#3a4552]"
              placeholder="Enter tracking number"
              required
            />
          </div>

          {/* Contract Terms & Payment Structure */}
          <div className="bg-[#1a2332] border border-[#253242] p-6 space-y-4">
            <h3 className="text-lg font-semibold text-white heading-font">Contract & Payment Terms</h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex items-start">
                <span className="text-green-400 mr-2">✓</span>
                <div>
                  <span className="text-white font-medium">Payment Amount:</span>
                  <span className="text-white ml-2">${job.pay_amount.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="flex items-start">
                <span className="text-green-400 mr-2">✓</span>
                <div>
                  <span className="text-white font-medium">Payment Terms:</span>
                  <span className="text-[#9ca3af] ml-2">Payment upon delivery confirmation</span>
                </div>
              </div>
              
              <div className="flex items-start">
                <span className="text-blue-400 mr-2">→</span>
                <div>
                  <span className="text-white font-medium">Shipping Process:</span>
                  <span className="text-[#9ca3af] ml-2">You mark as shipped → Client confirms receipt → Payment processed</span>
                </div>
              </div>
              
              <div className="flex items-start">
                <span className="text-blue-400 mr-2">→</span>
                <div>
                  <span className="text-white font-medium">Payment Processing:</span>
                  <span className="text-[#9ca3af] ml-2">{job.contract_terms.payment_processing_days} after client confirmation</span>
                </div>
              </div>
            </div>
            
            <div className="pt-4 border-t border-[#253242] mt-4">
              <p className="text-[#9ca3af] text-xs">
                By marking as shipped, you confirm the order has been completed per specifications and is ready for delivery. 
                Payment will be automatically processed once the client confirms receipt.
              </p>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Link
              href="/maker/jobs/active"
              className="flex-1 bg-[#1a2332] hover:bg-[#253242] text-white px-6 py-3 border border-[#253242] hover:border-[#3a4552] transition-colors text-center"
            >
              Cancel
            </Link>
            <button
              onClick={handleMarkShipped}
              disabled={submitting || !trackingNumber || !shippingCarrier}
              className="flex-1 bg-[#253242] hover:bg-[#3a4552] text-white px-6 py-3 border border-[#3a4552] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Marking as Shipped...' : 'Mark as Shipped'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

