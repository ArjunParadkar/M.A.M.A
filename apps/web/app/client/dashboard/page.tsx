'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { DEMO_MODE, DEMO_CLIENT_NAME, getClientJobs, type DemoJob } from '@/lib/demoData';

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
  
  // Demo mode - use Arham
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' || sessionStorage.getItem('demo_mode') === 'true') {
      setClientName('Arham');
    }
  }, []);
  const [loading, setLoading] = useState(true);
  const [showNewMenu, setShowNewMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const sectionsRef = useRef<(HTMLDivElement | null)[]>([]);

  // Fetch client name
  useEffect(() => {
    async function fetchClientData() {
      try {
        if (!isSupabaseConfigured()) {
          setLoading(false);
          return;
        }
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
        // Error fetching client data - handled silently
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.error('Error fetching client data:', error);
        }
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

  const [ongoingServices, setOngoingServices] = useState<OngoingService[]>([]);

  // Fetch jobs for client
  useEffect(() => {
    async function fetchClientJobs() {
      try {
        if (DEMO_MODE) {
          // Load from demo data for Arham
          const jobs = getClientJobs('arham_demo_id');
          const mapped = jobs.map((j: DemoJob) => {
            let manufacturerName = 'Pending assignment';
            if (j.selected_manufacturer_id) {
              manufacturerName = j.selected_manufacturer_id === 'reva_demo_id' ? 'Reva' : `Maker ${String(j.selected_manufacturer_id).slice(-4)}`;
            } else if (j.assigned_manufacturers && j.assigned_manufacturers.length > 0) {
              const mfgNames = j.assigned_manufacturers.map(m => m.manufacturer_name).join(', ');
              manufacturerName = `${j.assigned_manufacturers.length} manufacturer(s): ${mfgNames}`;
            }
            
            return {
              id: j.id,
              manufacturerName,
              productName: j.title,
              deadline: j.deadline,
              status: j.status === 'qc_pending' ? 'qc_pending' :
                      j.status === 'accepted' ? 'accepted' :
                      j.status === 'assigned' ? 'in_progress' :
                      'in_progress',
              quantity: j.quantity,
              completed: j.status === 'accepted' ? 0 : Math.floor(j.quantity * 0.3),
            };
          });
          setOngoingServices(mapped);
          
          // Listen for new jobs
          const interval = setInterval(() => {
            const updatedJobs = getClientJobs('arham_demo_id');
            const updated = updatedJobs.map((j: DemoJob) => {
              let manufacturerName = 'Pending assignment';
              if (j.selected_manufacturer_id) {
                manufacturerName = j.selected_manufacturer_id === 'reva_demo_id' ? 'Reva' : `Maker ${String(j.selected_manufacturer_id).slice(-4)}`;
              } else if (j.assigned_manufacturers && j.assigned_manufacturers.length > 0) {
                const mfgNames = j.assigned_manufacturers.map(m => m.manufacturer_name).join(', ');
                manufacturerName = `${j.assigned_manufacturers.length} manufacturer(s): ${mfgNames}`;
              }
              
              return {
                id: j.id,
                manufacturerName,
                productName: j.title,
                deadline: j.deadline,
                status: j.status === 'qc_pending' ? 'qc_pending' :
                        j.status === 'accepted' ? 'accepted' :
                        j.status === 'assigned' ? 'in_progress' :
                        'in_progress',
                quantity: j.quantity,
                completed: j.status === 'accepted' ? 0 : Math.floor(j.quantity * 0.3),
              };
            });
            setOngoingServices(updated);
          }, 1000);
          
          return () => clearInterval(interval);
        } else if (!isSupabaseConfigured()) {
          return;
        } else {
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          const { data: jobs, error } = await supabase
            .from('jobs')
            .select('id,title,deadline,status,quantity,selected_manufacturer_id')
            .eq('client_id', user.id)
            .order('created_at', { ascending: false });

          if (error) throw error;

          // For demo: manufacturer name is placeholder unless we join profiles
          const mapped = (jobs || []).map((j: any) => ({
            id: j.id,
            manufacturerName: j.selected_manufacturer_id ? `Maker ${String(j.selected_manufacturer_id).slice(-4)}` : 'Pending assignment',
            productName: j.title,
            deadline: j.deadline,
            status:
              j.status === 'qc_pending' ? 'qc_pending' :
              j.status === 'accepted' ? 'accepted' :
              'in_progress',
            quantity: j.quantity || 1,
            completed: j.status === 'accepted' ? (j.quantity || 1) : Math.floor((j.quantity || 1) * 0.6),
          }));
          setOngoingServices(mapped);
        }
      } catch (e) {
        // Error fetching client jobs - handled silently
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.error('Error fetching client jobs:', e);
        }
      }
    }

    fetchClientJobs();
  }, []);

  const handleNewOrderClick = (orderType: 'open-request' | 'quick-service' | 'closed-request' | 'closed-commission') => {
    setShowNewMenu(false);
    router.push(`/client/new-order?type=${orderType}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-200 to-white">
      {/* TEMPORARY: Development Testing Buttons */}
      <div className="bg-yellow-100 border-b-2 border-yellow-400 p-4">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-bold text-yellow-800 mb-2">🔧 DEV MODE - Testing Buttons</p>
          <div className="flex flex-wrap gap-2">
            <Link href="/client/dashboard" className="bg-yellow-200 hover:bg-yellow-300 text-yellow-900 px-3 py-1 text-xs border border-yellow-400 rounded">Dashboard</Link>
            <Link href="/client/new-order" className="bg-yellow-200 hover:bg-yellow-300 text-yellow-900 px-3 py-1 text-xs border border-yellow-400 rounded">New Order</Link>
            <Link href="/client/new-order/processing" className="bg-yellow-200 hover:bg-yellow-300 text-yellow-900 px-3 py-1 text-xs border border-yellow-400 rounded">Processing (AI Analysis)</Link>
            <Link href="/client/financials" className="bg-yellow-200 hover:bg-yellow-300 text-yellow-900 px-3 py-1 text-xs border border-yellow-400 rounded">Financials</Link>
            <Link href="/client/jobs/test123/workflow" className="bg-yellow-200 hover:bg-yellow-300 text-yellow-900 px-3 py-1 text-xs border border-yellow-400 rounded">Workflow (Example Job)</Link>
            <Link href="/maker/dashboard" className="bg-orange-200 hover:bg-orange-300 text-orange-900 px-3 py-1 text-xs border border-orange-400 rounded">Maker Dashboard</Link>
            <Link href="/maker/workflow" className="bg-orange-200 hover:bg-orange-300 text-orange-900 px-3 py-1 text-xs border border-orange-400 rounded">Maker Workflow</Link>
            <Link href="/maker/jobs" className="bg-orange-200 hover:bg-orange-300 text-orange-900 px-3 py-1 text-xs border border-orange-400 rounded">Maker Jobs</Link>
            <Link href="/maker/jobs/active" className="bg-orange-200 hover:bg-orange-300 text-orange-900 px-3 py-1 text-xs border border-orange-400 rounded">Active Jobs</Link>
            <Link href="/" className="bg-blue-200 hover:bg-blue-300 text-blue-900 px-3 py-1 text-xs border border-blue-400 rounded">Homepage</Link>
          </div>
        </div>
      </div>

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
            <Link href="/client/financials" className="text-white hover:text-[#9ca3af] transition-colors text-sm">
              Financials
            </Link>
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

          {ongoingServices.length === 0 ? (
            <div className="bg-white border border-[#1a2332] p-8 text-center">
              <p className="text-[#6b7280] mb-4">No ongoing services</p>
              <p className="text-sm text-[#9ca3af]">Start by creating a new order</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {ongoingServices.map((service) => (
                <div
                  key={service.id}
                  className="bg-[#0a1929] border border-[#1a2332] p-6 hover:border-[#253242] transition-colors cursor-pointer"
                >
                  <Link
                    href={`/client/jobs/${service.id}/workflow`}
                    className="block"
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
                  </Link>

                  <div className="mt-4">
                    <Link
                      href={`/client/jobs/${service.id}`}
                      className="text-white hover:text-[#9ca3af] text-sm underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View & Message →
                    </Link>
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

