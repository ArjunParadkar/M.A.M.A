'use client';

import Link from 'next/link';

interface NewRequest {
  id: string;
  clientName: string;
  deadline: string;
  attempts: number;
  material: string;
  quantity: number;
  toleranceTier: string;
}

const newRequests: NewRequest[] = [
  {
    id: '5',
    clientName: 'TechFlow Inc',
    deadline: '2026-02-03',
    attempts: 0,
    material: 'PLA',
    quantity: 25,
    toleranceTier: 'medium',
  },
  {
    id: '6',
    clientName: 'Manufacturing Pro',
    deadline: '2026-02-06',
    attempts: 0,
    material: 'ABS',
    quantity: 10,
    toleranceTier: 'high',
  },
];

export default function NewRequestsPage() {
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
              {newRequests.length} new request{newRequests.length !== 1 ? 's' : ''} available
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {newRequests.map((request) => (
              <div key={request.id} className="bg-[#0a1929] border border-[#1a2332] overflow-hidden">
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
                      {request.clientName}
                    </h3>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[#9ca3af] text-sm">Material:</span>
                      <span className="text-white text-sm font-medium">{request.material}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#9ca3af] text-sm">Quantity:</span>
                      <span className="text-white text-sm font-medium">{request.quantity}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#9ca3af] text-sm">Tolerance:</span>
                      <span className="text-white text-sm font-medium capitalize">{request.toleranceTier}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-[#1a2332]">
                      <span className="text-[#9ca3af] text-sm">Deadline:</span>
                      <span className="text-white text-sm font-medium">
                        {formatDate(request.deadline)}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button className="flex-1 bg-[#1a2332] hover:bg-[#253242] text-white px-4 py-3 border border-[#253242] hover:border-[#3a4552] transition-colors font-medium">
                      Accept Request
                    </button>
                    <button className="flex-1 bg-[#1a2332] hover:bg-[#253242] text-white px-4 py-3 border border-[#253242] hover:border-[#3a4552] transition-colors font-medium">
                      View Details
                    </button>
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
