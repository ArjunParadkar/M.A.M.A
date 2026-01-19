'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface OngoingService {
  id: string;
  manufacturerName: string;
  productName: string;
  deadline: string;
  status: 'in_progress' | 'qc_pending' | 'accepted';
  quantity: number;
  completed: number;
}

export default function ClientDashboard() {
  const router = useRouter();
  const [clientName, setClientName] = useState('Client');
  const [loading, setLoading] = useState(true);
  const [showNewMenu, setShowNewMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const sectionsRef = useRef<(HTMLDivElement | null)[]>([]);

  // Fetch client name
  useEffect(() => {
    async function fetchClientData() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, company_name, client_type')
            .eq('id', user.id)
            .single();
          
          if (profile) {
            const displayName = profile.company_name || profile.name || 'Client';
            setClientName(displayName);
          }
        }
      } catch (error) {
        console.error('Error fetching client data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchClientData();
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowNewMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    // Intersection Observer for scroll-based animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px',
      }
    );

    sectionsRef.current.forEach((section) => {
      if (section) {
        section.classList.add('observe-on-scroll');
        observer.observe(section);
      }
    });

    return () => observer.disconnect();
  }, []);

  // Mock data - replace with real data from Supabase
  const mockOngoingServices: OngoingService[] = [
    {
      id: '1',
      manufacturerName: 'Precision Makers LLC',
      productName: 'Bracket Assembly',
      deadline: '2026-01-25',
      status: 'in_progress',
      quantity: 50,
      completed: 30,
    },
    {
      id: '2',
      manufacturerName: 'TechFab Manufacturing',
      productName: 'Custom Housing',
      deadline: '2026-01-28',
      status: 'qc_pending',
      quantity: 25,
      completed: 25,
    },
  ];

  const handleNewOrderClick = (orderType: 'open-request' | 'quick-service' | 'closed-request' | 'closed-commission') => {
    setShowNewMenu(false);
    router.push(`/client/new-order?type=${orderType}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-200 to-white">
      {/* Top Navigation Bar */}
      <div className="bg-[#0a1929] text-white py-4 px-8 border-b border-[#1a2332]">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-white hover:text-[#9ca3af] transition-colors">
              Home
            </Link>
            <Link href="/maker/dashboard" className="text-white hover:text-[#9ca3af] transition-colors">
              Maker Dashboard
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/client/profile" className="text-white hover:text-[#9ca3af] transition-colors text-sm">
              Profile
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-semibold text-[#0a1929] mb-2 heading-font">
            Hello, {loading ? '...' : clientName}
          </h1>
          <p className="text-[#4b5563]">Welcome to your dashboard</p>
        </div>

        {/* Your Ongoing Services Section */}
        <div
          ref={(el) => {
            sectionsRef.current[0] = el;
          }}
          className="mb-12 observe-on-scroll"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-[#0a1929] heading-font">
              Your Ongoing Services
            </h2>
          </div>

          {mockOngoingServices.length === 0 ? (
            <div className="bg-white border border-[#1a2332] p-8 text-center">
              <p className="text-[#6b7280] mb-4">No ongoing services</p>
              <p className="text-sm text-[#9ca3af]">Start by creating a new order</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {mockOngoingServices.map((service) => (
                <div
                  key={service.id}
                  className="bg-[#0a1929] border border-[#1a2332] p-6 hover:border-[#253242] transition-colors"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-white font-semibold mb-1">{service.productName}</h3>
                      <p className="text-[#9ca3af] text-sm">{service.manufacturerName}</p>
                    </div>
                    <span
                      className={`px-3 py-1 text-xs font-medium ${
                        service.status === 'in_progress'
                          ? 'bg-blue-900 text-blue-200'
                          : service.status === 'qc_pending'
                          ? 'bg-yellow-900 text-yellow-200'
                          : 'bg-green-900 text-green-200'
                      }`}
                    >
                      {service.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-[#9ca3af] mb-2">
                      <span>Progress</span>
                      <span>
                        {service.completed} / {service.quantity}
                      </span>
                    </div>
                    <div className="w-full bg-[#1a2332] h-2">
                      <div
                        className="bg-[#253242] h-2 transition-all duration-300"
                        style={{
                          width: `${(service.completed / service.quantity) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[#9ca3af]">Deadline:</span>
                    <span className="text-white">
                      {new Date(service.deadline).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* New Order Button */}
        <div className="flex justify-center">
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowNewMenu(!showNewMenu)}
              className="bg-[#0a1929] text-white px-8 py-4 border border-[#1a2332] hover:border-[#3a4552] hover:bg-[#253242] transition-colors font-medium text-lg"
            >
              New Order
            </button>

            {showNewMenu && (
              <div className="absolute top-full left-0 mt-2 bg-[#0a1929] border border-[#1a2332] min-w-[280px] z-50">
                <button
                  onClick={() => handleNewOrderClick('open-request')}
                  onMouseEnter={(e) => {
                    e.currentTarget.querySelector('.tooltip')?.classList.remove('hidden');
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.querySelector('.tooltip')?.classList.add('hidden');
                  }}
                  className="w-full text-left px-6 py-4 hover:bg-[#253242] transition-colors border-b border-[#1a2332] relative group"
                >
                  <div className="text-white font-medium mb-1">Open Request</div>
                  <div className="tooltip hidden absolute left-full ml-2 top-0 bg-[#1a2332] border border-[#253242] p-3 text-sm text-[#9ca3af] w-64 z-10">
                    Large tasks posted publicly. Manufacturers claim a specific quantity they can complete before the deadline. Quantity is capped based on their capacity and quality scores.
                  </div>
                  <div className="text-sm text-[#9ca3af]">
                    Large tasks - manufacturers claim quantity
                  </div>
                </button>

                <button
                  onClick={() => handleNewOrderClick('quick-service')}
                  onMouseEnter={(e) => {
                    e.currentTarget.querySelector('.tooltip')?.classList.remove('hidden');
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.querySelector('.tooltip')?.classList.add('hidden');
                  }}
                  className="w-full text-left px-6 py-4 hover:bg-[#253242] transition-colors border-b border-[#1a2332] relative group"
                >
                  <div className="text-white font-medium mb-1">Open Quick Service</div>
                  <div className="tooltip hidden absolute left-full ml-2 top-0 bg-[#1a2332] border border-[#253242] p-3 text-sm text-[#9ca3af] w-64 z-10">
                    Trusted standard parts that any qualified manufacturer can fulfill immediately. Fast turnaround for common components.
                  </div>
                  <div className="text-sm text-[#9ca3af]">
                    Fast standard parts
                  </div>
                </button>

                <button
                  onClick={() => handleNewOrderClick('closed-request')}
                  onMouseEnter={(e) => {
                    e.currentTarget.querySelector('.tooltip')?.classList.remove('hidden');
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.querySelector('.tooltip')?.classList.add('hidden');
                  }}
                  className="w-full text-left px-6 py-4 hover:bg-[#253242] transition-colors border-b border-[#1a2332] relative group"
                >
                  <div className="text-white font-medium mb-1">Closed Request</div>
                  <div className="tooltip hidden absolute left-full ml-2 top-0 bg-[#1a2332] border border-[#253242] p-3 text-sm text-[#9ca3af] w-64 z-10">
                    Private requests sent to specific manufacturers you've worked with before. Not visible to the public marketplace.
                  </div>
                  <div className="text-sm text-[#9ca3af]">
                    Private to selected makers
                  </div>
                </button>

                <button
                  onClick={() => handleNewOrderClick('closed-commission')}
                  onMouseEnter={(e) => {
                    e.currentTarget.querySelector('.tooltip')?.classList.remove('hidden');
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.querySelector('.tooltip')?.classList.add('hidden');
                  }}
                  className="w-full text-left px-6 py-4 hover:bg-[#253242] transition-colors relative group"
                >
                  <div className="text-white font-medium mb-1">Closed Commission</div>
                  <div className="tooltip hidden absolute left-full ml-2 top-0 bg-[#1a2332] border border-[#253242] p-3 text-sm text-[#9ca3af] w-64 z-10">
                    Long-term ongoing partnerships with a specific manufacturer for recurring production runs. Set quotas and schedules.
                  </div>
                  <div className="text-sm text-[#9ca3af]">
                    Long-term partnerships
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

