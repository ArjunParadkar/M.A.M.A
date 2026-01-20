'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DEMO_MODE, DEMO_MAKER_NAME, getRevaNotifications, getRevaWorkflow, getManufacturerJobs, type DemoJob, type DemoWorkflowTask } from '@/lib/demoData';

interface Service {
  id: string;
  clientName: string;
  deadline: string;
  attempts: number;
  type?: 'ongoing' | 'open-request' | 'quick-service' | 'long-term-commission';
  expectedTime?: string; // e.g., "12 hours", "3 days"
  materials?: string; // e.g., "6061-T6 Aluminum"
  machine?: string; // e.g., "CNC Milling", "3D Printer"
  extendedDescription?: string; // Full description from client
  status?: 'running' | 'needs_work' | 'paused'; // Status indicator
  partProgress?: string; // e.g., "5/8" for long-term commissions
}

interface QuickService {
  id: string;
  job: string;
  estimatedTime: string;
  qualityRating: number;
  payPerProduct: number;
  type: 'quick-service';
}

interface LongTermCommission {
  id: string;
  productName: string;
  assignedThisWeek: number;
  completedThisWeek: number;
}

// Ongoing Services = Active Jobs (from active_jobs table)
const mockActiveJobs: Service[] = [
  { 
    id: 'active1', 
    clientName: 'Acme Corp', 
    deadline: '2026-01-25', 
    attempts: 2, 
    type: 'ongoing',
    expectedTime: '12 hours',
    materials: '6061-T6 Aluminum',
    machine: 'CNC Milling',
    extendedDescription: 'Precision bracket assembly for mounting system. Must maintain ±0.005" tolerance throughout. Requires smooth finish with no burrs. Parts will be used in aerospace application, so quality is critical. All edges must be deburred and cleaned.',
  },
  { 
    id: 'active2', 
    clientName: 'TechStart Inc', 
    deadline: '2026-01-28', 
    attempts: 1, 
    type: 'ongoing',
    expectedTime: '8 hours',
    materials: '316 Stainless Steel',
    machine: 'CNC Turning',
    extendedDescription: 'Housing component for electronic device enclosure. Requires precise threading for M6 screws. Surface finish must be smooth with no visible tool marks. Material must be corrosion resistant for outdoor use.',
  },
  { 
    id: 'active3', 
    clientName: 'Industrial Solutions', 
    deadline: '2026-02-01', 
    attempts: 3, 
    type: 'ongoing',
    expectedTime: '20 hours',
    materials: 'ABS Plastic',
    machine: '3D Printer (FDM)',
    extendedDescription: 'Prototype casing for industrial sensor housing. Requires 100% infill for structural integrity. Layer height should be 0.2mm maximum. Must fit together with existing components - dimensions critical. No support material should remain inside.',
  },
  { 
    id: 'active4', 
    clientName: 'Global Manufacturing', 
    deadline: '2026-02-05', 
    attempts: 1, 
    type: 'ongoing',
    expectedTime: '15 hours',
    materials: 'Polycarbonate',
    machine: 'Injection Molding',
    extendedDescription: 'Clear cover plate for display module. Must be optically clear with no bubbles or imperfections. Edge chamfers required for safety. All dimensions must be within ±0.003" of specification. Clean room handling preferred.',
  },
];

const mockOpenRequests: Service[] = [
  { 
    id: '7', 
    clientName: 'Open Project Alpha', 
    deadline: '2026-02-10', 
    attempts: 0, 
    type: 'open-request',
    expectedTime: '18 hours',
    materials: '7075 Aluminum',
    machine: 'CNC Milling',
    extendedDescription: 'Custom mounting bracket for heavy-duty application. Requires multiple tapped holes and precise alignment. Must support load of 500 lbs. Material heat treatment may be required. Delivery includes full inspection report.',
  },
  { 
    id: '8', 
    clientName: 'Open Project Beta', 
    deadline: '2026-02-12', 
    attempts: 0, 
    type: 'open-request',
    expectedTime: '10 hours',
    materials: 'Delrin (Acetal)',
    machine: 'CNC Machining',
    extendedDescription: 'Low-friction wear component for mechanical assembly. Requires tight tolerances on sliding surfaces. Material must have low moisture absorption. All surfaces must be smooth with Ra < 0.8 μm.',
  },
  { 
    id: '9', 
    clientName: 'Open Project Gamma', 
    deadline: '2026-02-15', 
    attempts: 0, 
    type: 'open-request',
    expectedTime: '6 hours',
    materials: 'Brass',
    machine: 'CNC Turning',
    extendedDescription: 'Precision threaded component for fluid system. Threads must be clean and free of burrs. Internal passages must be smooth. Pressure tested to 100 PSI required. All deburring and cleaning must be thorough.',
  },
];

const mockQuickServices: QuickService[] = [
  { id: 'qs1', job: 'Bracket Assembly', estimatedTime: '2 hours', qualityRating: 4.8, payPerProduct: 45, type: 'quick-service' },
  { id: 'qs2', job: 'Casing Component', estimatedTime: '3.5 hours', qualityRating: 4.9, payPerProduct: 68, type: 'quick-service' },
  { id: 'qs3', job: 'Mounting Plate', estimatedTime: '1.5 hours', qualityRating: 4.7, payPerProduct: 32, type: 'quick-service' },
  { id: 'qs4', job: 'Support Bracket', estimatedTime: '2.5 hours', qualityRating: 4.6, payPerProduct: 55, type: 'quick-service' },
];

const mockNewRequests: Service[] = [
  { id: '5', clientName: 'TechFlow Inc', deadline: '2026-02-03', attempts: 0 },
  { id: '6', clientName: 'Manufacturing Pro', deadline: '2026-02-06', attempts: 0 },
];

const mockLongTermCommissions: LongTermCommission[] = [
  { id: 'lt1', productName: 'Standard Bracket', assignedThisWeek: 8, completedThisWeek: 4 },
  { id: 'lt2', productName: 'Custom Housing', assignedThisWeek: 12, completedThisWeek: 9 },
  { id: 'lt3', productName: 'Base Plate', assignedThisWeek: 6, completedThisWeek: 6 },
];

export default function MakerDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'shop' | 'workflow' | 'devices' | 'financials'>('dashboard');
  const [financialsPassword, setFinancialsPassword] = useState('');
  const [financialsAuthenticated, setFinancialsAuthenticated] = useState(false);
  const [newRequestsCount, setNewRequestsCount] = useState(mockNewRequests.length);
  const [demoNotifications, setDemoNotifications] = useState<DemoJob[]>([]);
  const [demoActiveJobs, setDemoActiveJobs] = useState<DemoJob[]>([]);

  // Fetch demo data for Reva
  useEffect(() => {
    if (DEMO_MODE) {
      const notifications = getRevaNotifications();
      const activeJobs = getManufacturerJobs('reva_demo_id').filter(j => 
        j.status === 'accepted' || j.status === 'in_production'
      );
      setDemoNotifications(notifications);
      setDemoActiveJobs(activeJobs);
      setNewRequestsCount(notifications.length);
    }
  }, []);

  // Listen for storage changes (when new jobs are created)
  useEffect(() => {
    if (!DEMO_MODE) return;
    
    const handleStorageChange = () => {
      const notifications = getRevaNotifications();
      const activeJobs = getManufacturerJobs('reva_demo_id').filter(j => 
        j.status === 'accepted' || j.status === 'in_production'
      );
      setDemoNotifications(notifications);
      setDemoActiveJobs(activeJobs);
      setNewRequestsCount(notifications.length);
    };

    window.addEventListener('storage', handleStorageChange);
    // Also check periodically for local changes
    const interval = setInterval(handleStorageChange, 1000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);
  const statsRef = useRef<HTMLDivElement>(null);
  const sectionsRef = useRef<(HTMLDivElement | null)[]>([]);

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

    // Observe stats section - make it visible immediately
    if (statsRef.current) {
      statsRef.current.classList.add('fade-in');
      // Force visibility
      setTimeout(() => {
        if (statsRef.current) {
          statsRef.current.style.opacity = '1';
        }
      }, 50);
    }

    // Observe all scroll sections
    sectionsRef.current.forEach((section) => {
      if (section) {
        section.classList.add('observe-on-scroll');
        observer.observe(section);
      }
    });

    return () => {
      sectionsRef.current.forEach((section) => {
        if (section) observer.unobserve(section);
      });
    };
  }, []);

  const scrollLeft = (containerId: string) => {
    const container = document.getElementById(containerId);
    if (container) {
      container.scrollBy({ left: -400, behavior: 'smooth' });
    }
  };

  const scrollRight = (containerId: string) => {
    const container = document.getElementById(containerId);
    if (container) {
      container.scrollBy({ left: 400, behavior: 'smooth' });
    }
  };

  // Recommendations only include Quick Services and Open Requests (not Ongoing Services)
  const allRecommendations = [
    ...mockOpenRequests,
    ...mockQuickServices,
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-200 to-white p-0">
      {/* TEMPORARY: Development Testing Buttons */}
      <div className="bg-orange-100 border-b-2 border-orange-400 p-4">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-bold text-orange-800 mb-2">🔧 DEV MODE - Testing Buttons</p>
          <div className="flex flex-wrap gap-2">
            <Link href="/maker/dashboard" className="bg-orange-200 hover:bg-orange-300 text-orange-900 px-3 py-1 text-xs border border-orange-400 rounded">Maker Dashboard</Link>
            <Link href="/maker/workflow" className="bg-orange-200 hover:bg-orange-300 text-orange-900 px-3 py-1 text-xs border border-orange-400 rounded">Workflow (AI Scheduling)</Link>
            <Link href="/maker/jobs" className="bg-orange-200 hover:bg-orange-300 text-orange-900 px-3 py-1 text-xs border border-orange-400 rounded">View Jobs</Link>
            <Link href="/maker/jobs/active" className="bg-orange-200 hover:bg-orange-300 text-orange-900 px-3 py-1 text-xs border border-orange-400 rounded">Active Jobs</Link>
            <Link href="/maker/new-requests" className="bg-orange-200 hover:bg-orange-300 text-orange-900 px-3 py-1 text-xs border border-orange-400 rounded">New Requests</Link>
            <Link href="/maker/financials" className="bg-orange-200 hover:bg-orange-300 text-orange-900 px-3 py-1 text-xs border border-orange-400 rounded">Financials</Link>
            <Link href="/maker/jobs/test123/qc" className="bg-orange-200 hover:bg-orange-300 text-orange-900 px-3 py-1 text-xs border border-orange-400 rounded">QC Page (Example)</Link>
            <Link href="/maker/jobs/test123/ship" className="bg-orange-200 hover:bg-orange-300 text-orange-900 px-3 py-1 text-xs border border-orange-400 rounded">Ship Page (Example)</Link>
            <Link href="/client/dashboard" className="bg-yellow-200 hover:bg-yellow-300 text-yellow-900 px-3 py-1 text-xs border border-yellow-400 rounded">Client Dashboard</Link>
            <Link href="/client/new-order" className="bg-yellow-200 hover:bg-yellow-300 text-yellow-900 px-3 py-1 text-xs border border-yellow-400 rounded">Client New Order</Link>
            <Link href="/" className="bg-blue-200 hover:bg-blue-300 text-blue-900 px-3 py-1 text-xs border border-blue-400 rounded">Homepage</Link>
          </div>
        </div>
      </div>

      {/* Top Section - Navy with Hello, Maker */}
      <div className="bg-[#0a1929] p-8 pb-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-6">
              <Link
                href="/"
                className="bg-[#1a2332] hover:bg-[#253242] text-white px-6 py-3 border border-[#1a2332] hover:border-[#253242] transition-colors font-medium heading-font"
              >
                Home
              </Link>
              <h1 className="text-4xl font-semibold text-white heading-font">
                Hello, {DEMO_MODE ? DEMO_MAKER_NAME : 'Maker'}
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/maker/jobs"
                className="bg-[#1a2332] hover:bg-[#253242] text-white px-4 py-2 border border-[#1a2332] hover:border-[#253242] transition-colors font-medium text-sm"
              >
                View Jobs
              </Link>
              <Link
                href="/maker/jobs/active"
                className="bg-[#1a2332] hover:bg-[#253242] text-white px-4 py-2 border border-[#1a2332] hover:border-[#253242] transition-colors font-medium text-sm"
              >
                Active Work
              </Link>
              <Link
                href="/maker/financials"
                className="bg-[#1a2332] hover:bg-[#253242] text-white px-4 py-2 border border-[#1a2332] hover:border-[#253242] transition-colors font-medium text-sm"
              >
                Financials
              </Link>
              {/* Notification Button for New Requests */}
              <Link
                href="/maker/new-requests"
                className="relative bg-[#1a2332] hover:bg-[#253242] text-white px-6 py-3 border border-[#1a2332] hover:border-[#253242] transition-colors font-medium flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                New Requests
                {newRequestsCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                    {newRequestsCount}
                  </span>
                )}
              </Link>
              {/* Profile Icon */}
              <button className="flex flex-col items-center gap-1 hover:opacity-80 transition-opacity">
                <div className="w-10 h-10 bg-[#1a2332] border border-[#253242] flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <span className="text-white text-xs font-medium">Profile</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs - Navy Bar */}
          <div className="border-b border-[#1a2332]">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-6 py-3 font-medium transition-colors heading-font ${
                  activeTab === 'dashboard'
                    ? 'text-white border-b-2 border-white'
                    : 'text-[#9ca3af] hover:text-white'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('devices')}
                className={`px-6 py-3 font-medium transition-colors heading-font ${
                  activeTab === 'devices'
                    ? 'text-white border-b-2 border-white'
                    : 'text-[#9ca3af] hover:text-white'
                }`}
              >
                Devices
              </button>
              <button
                onClick={() => setActiveTab('shop')}
                className={`px-6 py-3 font-medium transition-colors heading-font ${
                  activeTab === 'shop'
                    ? 'text-white border-b-2 border-white'
                    : 'text-[#9ca3af] hover:text-white'
                }`}
              >
                Shop
              </button>
              <button
                onClick={() => router.push('/maker/workflow')}
                className={`px-6 py-3 font-medium transition-colors heading-font ${
                  activeTab === 'workflow'
                    ? 'text-white border-b-2 border-white'
                    : 'text-[#9ca3af] hover:text-white'
                }`}
              >
                Current Workflow
              </button>
              <button
                onClick={() => setActiveTab('financials')}
                className={`px-6 py-3 font-medium transition-colors heading-font ${
                  activeTab === 'financials'
                    ? 'text-white border-b-2 border-white'
                    : 'text-[#9ca3af] hover:text-white'
                }`}
              >
                Financials
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area - White Background */}
      <div className="bg-white p-8 pt-6">
        <div className="max-w-7xl mx-auto">
        {activeTab === 'dashboard' && (
          <>
            {/* Your Stats Section - Fade in first */}
            <div ref={statsRef} className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6 heading-font">
                Your Stats
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {/* Devices */}
                <div className="bg-[#0a1929] p-6 border border-[#1a2332]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[#9ca3af] text-sm font-medium">Devices Running</span>
                  </div>
                  <p className="text-3xl font-semibold text-white mb-4">12</p>
                  <button className="w-full bg-[#1a2332] hover:bg-[#253242] text-white px-4 py-2 border border-[#253242] hover:border-[#3a4552] transition-colors text-sm font-medium">
                    See Devices
                  </button>
                </div>
                
                {/* Parts Manufactured */}
                <div className="bg-[#0a1929] p-6 border border-[#1a2332]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[#9ca3af] text-sm font-medium">Parts Manufactured</span>
                  </div>
                  <p className="text-3xl font-semibold text-white">247</p>
                </div>
                
                {/* Dollars Made */}
                <div className="bg-[#0a1929] p-6 border border-[#1a2332]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[#9ca3af] text-sm font-medium">Dollars Made</span>
                  </div>
                  <p className="text-3xl font-semibold text-white">$24,580</p>
                </div>
              </div>
              
            </div>

            {/* Long-term Commissions Section - Scroll trigger */}
            <div ref={(el) => { sectionsRef.current[0] = el; }} className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 heading-font">
                Long-term Commissions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {mockLongTermCommissions.map((commission) => {
                  const percentage = (commission.completedThisWeek / commission.assignedThisWeek) * 100;
                  return (
                    <Link 
                      key={commission.id} 
                      href={`/maker/commissions/${commission.id}`}
                      className="bg-[#0a1929] p-6 border border-[#1a2332] hover:border-[#3a4552] transition-colors cursor-pointer"
                    >
                      <h3 className="text-lg font-semibold text-white mb-4">{commission.productName}</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[#9ca3af] text-sm">Quota This Week</span>
                          <span className="text-white text-sm font-medium">
                            {commission.completedThisWeek} / {commission.assignedThisWeek}
                          </span>
                        </div>
                        <div className="w-full bg-black h-2">
                          <div
                            className="bg-[#4a5562] h-2 progress-bar-animated transition-all duration-1000"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className="text-right">
                          <span className="text-[#9ca3af] text-xs">{Math.round(percentage)}% Complete</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Ongoing Services Section - Separate */}
            <div ref={(el) => { sectionsRef.current[1] = el; }} className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 heading-font">
                Ongoing Services
              </h2>
              
              <div className="relative">
                <button
                  onClick={() => scrollLeft('ongoing-services-container')}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-[#0a1929] hover:bg-[#1a2332] text-white p-3 border border-[#1a2332] hover:border-[#253242] transition-colors"
                  aria-label="Scroll left"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <div
                  id="ongoing-services-container"
                  className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {(() => {
                    // Combine active jobs + long-term commissions for ongoing services
                    const ongoingServices: Service[] = [];
                    
                    // Add active jobs
                    if (DEMO_MODE && demoActiveJobs.length > 0) {
                      demoActiveJobs.forEach((job) => {
                        const manufacturingType = job.manufacturing_type?.[0] || 'CNC / 3D Printing';
                        // Determine status based on job status
                        let status: 'running' | 'needs_work' | 'paused' = 'needs_work';
                        if (job.status === 'qc_pending') status = 'needs_work';
                        else if (job.status === 'in_production') status = 'running';
                        else if (job.status === 'accepted') status = 'needs_work'; // New jobs need to be started
                        
                        // For open requests, show only the assigned quantity to Reva
                        let displayQuantity = job.quantity;
                        if (job.order_type === 'open-request' && job.assigned_manufacturers) {
                          const revaAssignment = job.assigned_manufacturers.find(m => m.manufacturer_id === 'reva_demo_id');
                          if (revaAssignment) {
                            displayQuantity = revaAssignment.assigned_quantity;
                          }
                        }
                        
                        ongoingServices.push({
                          id: job.id,
                          clientName: job.client_name || 'Client',
                          deadline: job.deadline,
                          attempts: 1,
                          type: job.order_type === 'closed-commission' ? 'long-term-commission' : 'ongoing',
                          expectedTime: `${displayQuantity} units • ${manufacturingType}`,
                          materials: job.material,
                          machine: manufacturingType,
                          extendedDescription:
                            job.title +
                            ' • ' +
                            'Material: ' +
                            job.material +
                            ' • Quantity: ' +
                            displayQuantity +
                            (job.order_type === 'open-request' ? ` (your assigned quantity)` : '') +
                            '. This is an actively running service generated from the client workflow.',
                          status,
                          // For long-term commissions, show part progress
                          partProgress: job.order_type === 'closed-commission' ? 
                            `${Math.floor(Math.random() * 5) + 1}/${job.quantity}` : undefined,
                        } as Service);
                      });
                    } else {
                      ongoingServices.push(...mockActiveJobs);
                    }
                    
                    // Add long-term commissions
                    mockLongTermCommissions.forEach((commission) => {
                      ongoingServices.push({
                        id: commission.id,
                        clientName: 'Long-term Commission',
                        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                        attempts: 0,
                        type: 'long-term-commission',
                        expectedTime: `${commission.assignedThisWeek} per week`,
                        materials: 'Various',
                        machine: 'Multiple',
                        status: 'running',
                        partProgress: `${commission.completedThisWeek}/${commission.assignedThisWeek}`,
                        extendedDescription: `Weekly quota: ${commission.completedThisWeek} of ${commission.assignedThisWeek} parts completed this week for ${commission.productName}.`,
                      } as Service);
                    });
                    
                    return ongoingServices.map((service) => (
                      <ServiceCard key={service.id} service={service} />
                    ));
                  })()}
                </div>

                <button
                  onClick={() => scrollRight('ongoing-services-container')}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-[#0a1929] hover:bg-[#1a2332] text-white p-3 border border-[#1a2332] hover:border-[#253242] transition-colors"
                  aria-label="Scroll right"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Recommendations Section - Quick Services and Open Requests only */}
            <div ref={(el) => { sectionsRef.current[2] = el; }} className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 heading-font">
                Recommendations
              </h2>
              
              <div className="relative">
                <button
                  onClick={() => scrollLeft('recommendations-container')}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-[#0a1929] hover:bg-[#1a2332] text-white p-3 border border-[#1a2332] hover:border-[#253242] transition-colors"
                  aria-label="Scroll left"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <div
                  id="recommendations-container"
                  className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {allRecommendations.map((item) => {
                    if (item.type === 'quick-service') {
                      return <QuickServiceCard key={item.id} service={item as QuickService} isRecommendation={true} />;
                    }
                    return <ServiceCard key={item.id} service={item} isRecommendation={true} />;
                  })}
                </div>

                <button
                  onClick={() => scrollRight('recommendations-container')}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-[#0a1929] hover:bg-[#1a2332] text-white p-3 border border-[#1a2332] hover:border-[#253242] transition-colors"
                  aria-label="Scroll right"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </>
        )}

        {activeTab === 'devices' && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 heading-font">
              Devices
            </h2>
            <p className="text-[#6b7280] mb-6">Active devices currently running jobs</p>
            <div className="mb-4">
              <div className="bg-green-50 border border-green-200 p-3 rounded">
                <span className="text-green-800 font-medium">
                  {[
                    { name: 'Bambu Lab X1 Carbon', type: '3D Printer', status: 'Running', job: 'Acme Corp - Bracket', usage: '60%', needsMaintenance: false },
                    { name: 'Tormach PCNC 440', type: 'CNC Machine', status: 'Running', job: 'TechStart - Housing', usage: '45%', needsMaintenance: true },
                  ].filter(d => d.status === 'Running').length} device(s) currently active
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { name: 'Bambu Lab X1 Carbon', type: '3D Printer', status: 'Running', job: 'Acme Corp - Bracket', usage: '60%', needsMaintenance: false },
                { name: 'Tormach PCNC 440', type: 'CNC Machine', status: 'Running', job: 'TechStart - Housing', usage: '45%', needsMaintenance: true },
                { name: 'Prusa i3 MK3S+', type: '3D Printer', status: 'Idle', job: null, usage: '0%', needsMaintenance: false },
                { name: 'Formlabs Form 3', type: '3D Printer (SLA)', status: 'Idle', job: null, usage: '0%', needsMaintenance: false },
                { name: 'Creality Ender 3 V2', type: '3D Printer', status: 'Idle', job: null, usage: '0%', needsMaintenance: false },
                { name: 'ShopBot Desktop', type: 'CNC Router', status: 'Idle', job: null, usage: '0%', needsMaintenance: true },
                { name: 'HAAS Mini Mill', type: 'CNC Milling', status: 'Idle', job: null, usage: '0%', needsMaintenance: false },
                { name: 'Epilog Fusion Pro', type: 'Laser Cutter', status: 'Idle', job: null, usage: '0%', needsMaintenance: false },
                { name: 'Glowforge Pro', type: 'Laser Cutter', status: 'Idle', job: null, usage: '0%', needsMaintenance: false },
                { name: 'Arburg Allrounder', type: 'Injection Molder', status: 'Idle', job: null, usage: '0%', needsMaintenance: false },
                { name: 'Boy Machines 15A', type: 'Injection Molder', status: 'Idle', job: null, usage: '0%', needsMaintenance: false },
                { name: 'Thermwood M40', type: 'CNC Router', status: 'Idle', job: null, usage: '0%', needsMaintenance: false },
              ].map((device, index) => (
                <div key={index} className="bg-[#0a1929] p-6 border border-[#1a2332]">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">{device.name}</h3>
                      <span className="text-[#9ca3af] text-sm">{device.type}</span>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`text-xs px-2 py-1 border ${
                        device.status === 'Running' 
                          ? 'text-green-200 bg-green-900 border-green-700'
                          : 'text-[#9ca3af] bg-[#1a2332] border-[#253242]'
                      }`}>
                        {device.status}
                      </span>
                      {device.needsMaintenance && (
                        <span className="text-xs px-2 py-1 border text-red-200 bg-red-900 border-red-700" title="Device needs maintenance">
                          ⚠ Maintenance
                        </span>
                      )}
                    </div>
                  </div>
                  {device.status === 'Running' && device.job && (
                    <div className="mb-3 text-sm">
                      <span className="text-[#9ca3af]">Current Job: </span>
                      <span className="text-white">{device.job}</span>
                      <div className="mt-2">
                        <span className="text-[#9ca3af]">Usage: </span>
                        <span className="text-white">{device.usage}</span>
                      </div>
                    </div>
                  )}
                  <div className="pt-4 border-t border-[#1a2332]">
                    <button className="w-full bg-[#1a2332] hover:bg-[#253242] text-white px-4 py-2 border border-[#253242] hover:border-[#3a4552] transition-colors text-sm font-medium">
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'shop' && (
          <div className="bg-[#0a1929] p-8 text-center border border-[#1a2332]">
            <p className="text-white text-lg">Shop content coming soon...</p>
          </div>
        )}

        {activeTab === 'workflow' && (
          <div className="space-y-6">
            <div className="bg-[#0a1929] p-8 border border-[#1a2332]">
              <h2 className="text-3xl font-semibold text-white mb-6 heading-font">
                Current Workflow
              </h2>
              <div className="max-w-3xl space-y-4">
                <p className="text-white text-lg leading-relaxed">
                  Here we will schedule your tasks optimally for the week, ensuring your profit.
                </p>
                <p className="text-[#9ca3af] text-base leading-relaxed">
                  This will make sure devices and time are optimized.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'financials' && (
          <FinancialsTab 
            password={financialsPassword}
            setPassword={setFinancialsPassword}
            authenticated={financialsAuthenticated}
            setAuthenticated={setFinancialsAuthenticated}
          />
        )}
        </div>
      </div>
    </div>
  );
}

function FinancialsTab({ password, setPassword, authenticated, setAuthenticated }: {
  password: string;
  setPassword: (p: string) => void;
  authenticated: boolean;
  setAuthenticated: (a: boolean) => void;
}) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '123456') {
      setAuthenticated(true);
    } else {
      alert('Incorrect password');
    }
  };

  if (!authenticated) {
    return (
      <div className="bg-[#0a1929] border border-[#1a2332] p-8">
        <h2 className="text-2xl font-semibold text-white mb-4 heading-font">Financials - Password Required</h2>
        <form onSubmit={handleSubmit} className="max-w-md space-y-4">
          <div>
            <label className="block text-white mb-2">Enter Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#1a2332] border border-[#253242] text-white px-4 py-3 focus:outline-none focus:border-[#3a4552]"
              placeholder="Password"
            />
          </div>
          <button
            type="submit"
            className="bg-[#253242] hover:bg-[#3a4552] text-white px-6 py-3 border border-[#3a4552] transition-colors font-medium"
          >
            Access Financials
          </button>
        </form>
      </div>
    );
  }

  // Mock transaction data - expanded with more realistic data
  const transactions = [
    { id: 1, date: new Date(2024, 0, 5), job: 'Acme Corp Bracket', amount: 2450.00, status: 'completed' },
    { id: 2, date: new Date(2024, 0, 8), job: 'TechStart Housing', amount: 3200.00, status: 'completed' },
    { id: 3, date: new Date(2024, 0, 12), job: 'Industrial Sensor Case', amount: 1890.00, status: 'completed' },
    { id: 4, date: new Date(2024, 0, 15), job: 'Precision Mounting Plate', amount: 1850.00, status: 'completed' },
    { id: 5, date: new Date(2024, 0, 18), job: 'Global Manufacturing Cover', amount: 4120.00, status: 'completed' },
    { id: 6, date: new Date(2024, 0, 20), job: 'Aerospace Bracket Set', amount: 5600.00, status: 'completed' },
    { id: 7, date: new Date(2024, 0, 22), job: 'Custom Enclosure', amount: 2890.00, status: 'completed' },
    { id: 8, date: new Date(2024, 0, 25), job: 'Predator UAV Brackets', amount: 15000.00, status: 'pending' },
    { id: 9, date: new Date(2024, 0, 26), job: 'Prototype Housing', amount: 3200.00, status: 'pending' },
    { id: 10, date: new Date(2024, 0, 28), job: 'Support Assembly', amount: 4500.00, status: 'pending' },
  ];

  const materialsSpent = [
    { id: 1, date: new Date(2024, 0, 3), material: '6061-T6 Aluminum', amount: 450.00 },
    { id: 2, date: new Date(2024, 0, 7), material: '316 Stainless Steel', amount: 680.00 },
    { id: 3, date: new Date(2024, 0, 10), material: 'ABS Plastic', amount: 120.00 },
    { id: 4, date: new Date(2024, 0, 12), material: 'Polycarbonate', amount: 340.00 },
    { id: 5, date: new Date(2024, 0, 15), material: '7075 Aluminum', amount: 520.00 },
    { id: 6, date: new Date(2024, 0, 18), material: 'Titanium Grade 5', amount: 1200.00 },
    { id: 7, date: new Date(2024, 0, 20), material: 'Delrin (Acetal)', amount: 280.00 },
    { id: 8, date: new Date(2024, 0, 23), material: 'Nylon 6/6', amount: 195.00 },
    { id: 9, date: new Date(2024, 0, 25), material: 'Brass C360', amount: 380.00 },
  ];

  // Model predictions - AI-generated forecasts
  const modelPredictions = {
    expectedIncome: 45000,
    confidence: 0.87,
    factors: [
      { name: 'Current Pipeline', impact: 0.35, value: 15750 },
      { name: 'Historical Trends', impact: 0.28, value: 12600 },
      { name: 'Market Demand', impact: 0.22, value: 9900 },
      { name: 'Seasonal Adjustments', impact: 0.15, value: 6750 },
    ],
  };

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthTransactions = transactions.filter(t => t.date.getMonth() === currentMonth && t.date.getFullYear() === currentYear);
  const monthIncome = monthTransactions.filter(t => t.status === 'completed').reduce((sum, t) => sum + t.amount, 0);
  const monthMaterials = materialsSpent.filter(m => m.date.getMonth() === currentMonth && m.date.getFullYear() === currentYear).reduce((sum, m) => sum + m.amount, 0);
  const pendingIncome = monthTransactions.filter(t => t.status === 'pending').reduce((sum, t) => sum + t.amount, 0);
  const expectedMonthIncome = monthIncome + pendingIncome;

  return (
    <div className="space-y-6">
      <div className="bg-[#0a1929] border border-[#1a2332] p-6">
        <h2 className="text-2xl font-semibold text-white mb-6 heading-font">Financial Overview</h2>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-[#1a2332] border border-[#253242] p-4">
            <div className="text-[#9ca3af] text-sm mb-2">Income This Month</div>
            <div className="text-2xl font-bold text-white">${monthIncome.toFixed(2)}</div>
          </div>
          <div className="bg-[#1a2332] border border-[#253242] p-4">
            <div className="text-[#9ca3af] text-sm mb-2">Expected This Month</div>
            <div className="text-2xl font-bold text-white">${expectedMonthIncome.toFixed(2)}</div>
          </div>
          <div className="bg-[#1a2332] border border-[#253242] p-4">
            <div className="text-[#9ca3af] text-sm mb-2">Materials Spent</div>
            <div className="text-2xl font-bold text-white">${monthMaterials.toFixed(2)}</div>
          </div>
        </div>

        {/* AI Model Predictions */}
        <div className="bg-[#1a2332] border border-[#253242] p-4 mb-6">
          <h3 className="text-white font-semibold mb-2">AI Model Predictions</h3>
          <p className="text-[#9ca3af] text-sm mb-4">Expected monthly income forecast (Confidence: {(modelPredictions.confidence * 100).toFixed(0)}%)</p>
          <div className="space-y-2 mb-4">
            {modelPredictions.factors.map((factor, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-xs text-[#9ca3af] mb-1">
                  <span>{factor.name}</span>
                  <span>${factor.value.toFixed(2)}</span>
                </div>
                <div className="w-full bg-[#0a1929] h-2 border border-[#253242]">
                  <div 
                    className="bg-purple-600 h-full transition-all"
                    style={{ width: `${factor.impact * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="bg-[#0a1929] border border-[#253242] p-3 mt-4">
            <div className="flex justify-between items-center">
              <span className="text-[#9ca3af] text-sm">Total Expected Income:</span>
              <span className="text-white font-bold text-lg">${modelPredictions.expectedIncome.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Income Chart */}
        <div className="bg-[#1a2332] border border-[#253242] p-4 mb-6">
          <h3 className="text-white font-semibold mb-4">Income vs Expected - This Month</h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm text-[#9ca3af] mb-1">
                <span>Expected Income</span>
                <span>${expectedMonthIncome.toFixed(2)}</span>
              </div>
              <div className="w-full bg-[#0a1929] h-4 border border-[#253242]">
                <div 
                  className="bg-blue-600 h-full transition-all"
                  style={{ width: '100%' }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm text-[#9ca3af] mb-1">
                <span>Income Made</span>
                <span>${monthIncome.toFixed(2)}</span>
              </div>
              <div className="w-full bg-[#0a1929] h-4 border border-[#253242]">
                <div 
                  className="bg-green-600 h-full transition-all"
                  style={{ width: `${Math.min((monthIncome / expectedMonthIncome) * 100, 100)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm text-[#9ca3af] mb-1">
                <span>Materials Spent</span>
                <span>${monthMaterials.toFixed(2)}</span>
              </div>
              <div className="w-full bg-[#0a1929] h-4 border border-[#253242]">
                <div 
                  className="bg-red-600 h-full transition-all"
                  style={{ width: `${Math.min((monthMaterials / expectedMonthIncome) * 100, 100)}%` }}
                />
              </div>
            </div>
            <div className="pt-2 border-t border-[#253242]">
              <div className="flex justify-between text-sm">
                <span className="text-[#9ca3af]">Net Profit:</span>
                <span className="text-white font-semibold">${(monthIncome - monthMaterials).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-[#1a2332] border border-[#253242] p-4">
          <h3 className="text-white font-semibold mb-4">Recent Transactions</h3>
          <div className="space-y-2">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex justify-between items-center border-b border-[#253242] pb-2">
                <div>
                  <div className="text-white font-medium">{tx.job}</div>
                  <div className="text-[#9ca3af] text-sm">{tx.date.toLocaleDateString()}</div>
                </div>
                <div className="text-right">
                  <div className="text-white font-semibold">${tx.amount.toFixed(2)}</div>
                  <div className={`text-xs ${tx.status === 'completed' ? 'text-green-400' : 'text-yellow-400'}`}>
                    {tx.status === 'completed' ? 'Completed' : 'Pending'}
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

function ServiceCard({ service, isRecommendation = false }: { service: Service; isRecommendation?: boolean }) {
  const router = useRouter();
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getTypeLabel = () => {
    if (service.type === 'ongoing') return 'Ongoing Service';
    if (service.type === 'open-request') return 'Open Request';
    if (service.type === 'long-term-commission') return 'Long-term Commission';
    return 'Service';
  };

  const getStatusLabel = () => {
    if (!service.status) return null;
    if (service.status === 'running') return { text: 'Running on Device', color: 'text-green-400 bg-green-900 border-green-700' };
    if (service.status === 'needs_work') return { text: 'Needs Work', color: 'text-yellow-400 bg-yellow-900 border-yellow-700' };
    if (service.status === 'paused') return { text: 'Paused', color: 'text-gray-400 bg-gray-900 border-gray-700' };
    return null;
  };

  // Ongoing services should go to the ongoing services page, not individual job
  // Recommendations should show accept/decline modal instead of direct navigation
  const href = isRecommendation ? '#' : (service.type === 'ongoing' ? `/maker/jobs/active` : service.type === 'open-request' ? `/maker/jobs/${service.id}` : `/maker/jobs/${service.id}`);

  const handleRecommendationClick = (e: React.MouseEvent) => {
    if (isRecommendation) {
      e.preventDefault();
      setShowAcceptModal(true);
    }
  };

  const handleAccept = () => {
    // Import accept function
    if (typeof window !== 'undefined' && DEMO_MODE) {
      const { acceptJobForReva } = require('@/lib/demoData');
      // Pass the service data as recommendation data so it can create the job
      acceptJobForReva(service.id, undefined, service);
      // Update workflow
      const { updateRevaWorkflow } = require('@/lib/demoData');
      updateRevaWorkflow();
      setShowAcceptModal(false);
      // Force page reload to show updated ongoing services
      window.location.reload();
    }
  };

  const handleDecline = () => {
    setShowAcceptModal(false);
  };
  
  return (
    <>
    <div 
      onClick={isRecommendation ? handleRecommendationClick : undefined}
      className={`flex-shrink-0 w-80 bg-[#0a1929] border border-[#1a2332] hover:border-[#3a4552] overflow-hidden transition-colors relative ${isRecommendation ? 'cursor-pointer' : ''}`}
    >
      {!isRecommendation && (
        <Link href={href} className="block absolute inset-0 z-10" />
      )}
      {/* Type Label */}
      <div className="bg-[#1a2332] px-4 py-2 border-b border-[#253242]">
        <span className="text-[#9ca3af] text-xs font-medium uppercase tracking-wide">
          {getTypeLabel()}
        </span>
      </div>

      {/* Rotating STL Preview - Mesh of Dots */}
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

      {/* Service Info */}
      <div className="p-6 space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-xl font-semibold text-white">
              {service.type === 'long-term-commission' && service.partProgress 
                ? `Part ${service.partProgress}`
                : service.clientName}
            </h3>
            {service.status && getStatusLabel() && (
              <span className={`text-xs px-2 py-1 border ${getStatusLabel()?.color}`}>
                {getStatusLabel()?.text}
              </span>
            )}
          </div>
          {service.type === 'long-term-commission' && (
            <p className="text-[#9ca3af] text-sm">{service.clientName}</p>
          )}
        </div>

        <div className="space-y-2">
          {service.expectedTime && (
            <div className="flex items-center justify-between">
              <span className="text-[#9ca3af] text-sm">Expected Time:</span>
              <span className="text-white text-sm font-medium">{service.expectedTime}</span>
            </div>
          )}
          {service.materials && (
            <div className="flex items-center justify-between">
              <span className="text-[#9ca3af] text-sm">Material:</span>
              <span className="text-white text-sm font-medium">{service.materials}</span>
            </div>
          )}
          {service.machine && (
            <div className="flex items-center justify-between">
              <span className="text-[#9ca3af] text-sm">Machine:</span>
              <span className="text-white text-sm font-medium">{service.machine}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-[#9ca3af] text-sm">Deadline:</span>
            <span className="text-white text-sm font-medium">
              {formatDate(service.deadline)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#9ca3af] text-sm">Attempts:</span>
            <span className="text-white text-sm font-medium">
              {service.attempts}
            </span>
          </div>
        </div>

        {/* Make entire card clickable - no buttons, extended description shown on details page */}
      </div>
      {isRecommendation && showAcceptModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            e.stopPropagation();
            setShowAcceptModal(false);
          }}
        >
          <div 
            className="bg-[#0a1929] border border-[#1a2332] max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold text-white mb-4 heading-font">Task Details</h3>
            
            {/* Show full details */}
            <div className="space-y-4 mb-6">
              <div>
                <h4 className="text-white font-medium mb-2">{service.clientName || service.job}</h4>
                <p className="text-[#9ca3af] text-sm">Type: {service.type === 'quick-service' ? 'Quick Service' : 'Open Request'}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                {service.expectedTime && (
                  <div>
                    <span className="text-[#9ca3af]">Estimated Time:</span>
                    <span className="text-white ml-2">{service.expectedTime}</span>
                  </div>
                )}
                {service.materials && (
                  <div>
                    <span className="text-[#9ca3af]">Material:</span>
                    <span className="text-white ml-2">{service.materials}</span>
                  </div>
                )}
                {service.machine && (
                  <div>
                    <span className="text-[#9ca3af]">Machine:</span>
                    <span className="text-white ml-2">{service.machine}</span>
                  </div>
                )}
                <div>
                  <span className="text-[#9ca3af]">Deadline:</span>
                  <span className="text-white ml-2">{formatDate(service.deadline)}</span>
                </div>
                {service.type === 'quick-service' && (service as any).payPerProduct && (
                  <div>
                    <span className="text-[#9ca3af]">Pay Per Product:</span>
                    <span className="text-white ml-2 font-semibold">${(service as any).payPerProduct}</span>
                  </div>
                )}
                {service.type === 'quick-service' && (service as any).qualityRating && (
                  <div>
                    <span className="text-[#9ca3af]">Quality Rating:</span>
                    <span className="text-white ml-2">⭐ {(service as any).qualityRating}</span>
                  </div>
                )}
              </div>
              
              {service.extendedDescription && (
                <div className="pt-4 border-t border-[#253242]">
                  <p className="text-[#9ca3af] text-sm">{service.extendedDescription}</p>
                </div>
              )}
            </div>
            
            <p className="text-[#9ca3af] mb-6">Do you want to accept this {service.type === 'quick-service' ? 'quick service' : 'open request'} and add it to your ongoing services?</p>
            <div className="flex gap-4">
              <button
                onClick={handleDecline}
                className="flex-1 bg-[#1a2332] hover:bg-[#253242] text-white px-4 py-3 border border-[#253242] transition-colors"
              >
                Not Now
              </button>
              <button
                onClick={handleAccept}
                className="flex-1 bg-[#253242] hover:bg-[#3a4552] text-white px-4 py-3 border border-[#3a4552] transition-colors font-medium"
              >
                Accept
              </button>
            </div>
            <div className="mt-4 flex gap-2 justify-center">
              <button
                onClick={() => {
                  setShowAcceptModal(false);
                  router.push('/maker/dashboard');
                }}
                className="text-[#9ca3af] hover:text-white text-sm"
              >
                Back to Dashboard
              </button>
              <span className="text-[#9ca3af]">|</span>
              <Link
                href="/maker/workflow/open-tasks"
                className="text-[#9ca3af] hover:text-white text-sm"
                onClick={(e) => e.stopPropagation()}
              >
                View All Open Tasks
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}

function QuickServiceCard({ service, isRecommendation = false }: { service: QuickService; isRecommendation?: boolean }) {
  const router = useRouter();
  const [showAcceptModal, setShowAcceptModal] = useState(false);

  const handleRecommendationClick = (e: React.MouseEvent) => {
    if (isRecommendation) {
      e.preventDefault();
      setShowAcceptModal(true);
    }
  };

  const handleAccept = () => {
    if (typeof window !== 'undefined' && DEMO_MODE) {
      const { acceptJobForReva } = require('@/lib/demoData');
      // Pass the service data as recommendation data so it can create the job
      acceptJobForReva(service.id, undefined, service);
      const { updateRevaWorkflow } = require('@/lib/demoData');
      updateRevaWorkflow();
      setShowAcceptModal(false);
      // Force page reload to show updated ongoing services
      window.location.reload();
    }
  };

  const handleDecline = () => {
    setShowAcceptModal(false);
  };

  return (
    <div 
      onClick={isRecommendation ? handleRecommendationClick : undefined}
      className={`flex-shrink-0 w-80 bg-[#0a1929] border border-[#1a2332] hover:border-[#3a4552] overflow-hidden transition-colors relative ${isRecommendation ? 'cursor-pointer' : ''}`}
    >
      {!isRecommendation && (
        <Link href={`/maker/jobs/${service.id}`} className="block absolute inset-0 z-10" />
      )}
      {/* Type Label */}
      <div className="bg-[#1a2332] px-4 py-2 border-b border-[#253242]">
        <span className="text-[#9ca3af] text-xs font-medium uppercase tracking-wide">
          Quick Service
        </span>
      </div>

      {/* Rotating STL Preview - Mesh of Dots */}
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

      {/* Quick Service Info */}
      <div className="p-6 space-y-4">
        <div>
          <h3 className="text-xl font-semibold text-white mb-1">
            {service.job}
          </h3>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[#9ca3af] text-sm">Estimated Time:</span>
            <span className="text-white text-sm font-medium">
              {service.estimatedTime}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#9ca3af] text-sm">Quality Rating:</span>
            <span className="text-white text-sm font-medium flex items-center gap-1">
              ⭐ {service.qualityRating}
            </span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#1a2332]">
            <span className="text-[#9ca3af] text-sm">Pay Per Product:</span>
            <span className="text-white text-xl font-semibold">
              ${service.payPerProduct}
            </span>
          </div>
        </div>

        {/* Remove See More button - clicking card handles it */}
      </div>
      {isRecommendation && showAcceptModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            e.stopPropagation();
            setShowAcceptModal(false);
          }}
        >
          <div 
            className="bg-[#0a1929] border border-[#1a2332] max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold text-white mb-4 heading-font">Task Details</h3>
            
            {/* Show full details */}
            <div className="space-y-4 mb-6">
              <div>
                <h4 className="text-white font-medium mb-2">{service.job}</h4>
                <p className="text-[#9ca3af] text-sm">Type: Quick Service</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-[#9ca3af]">Estimated Time:</span>
                  <span className="text-white ml-2">{service.estimatedTime}</span>
                </div>
                <div>
                  <span className="text-[#9ca3af]">Quality Rating:</span>
                  <span className="text-white ml-2">⭐ {service.qualityRating}</span>
                </div>
                <div>
                  <span className="text-[#9ca3af]">Pay Per Product:</span>
                  <span className="text-white ml-2 font-semibold">${service.payPerProduct}</span>
                </div>
              </div>
            </div>
            
            <p className="text-[#9ca3af] mb-6">Do you want to accept this quick service and add it to your ongoing services?</p>
            <div className="flex gap-4">
              <button
                onClick={handleDecline}
                className="flex-1 bg-[#1a2332] hover:bg-[#253242] text-white px-4 py-3 border border-[#253242] transition-colors"
              >
                Not Now
              </button>
              <button
                onClick={handleAccept}
                className="flex-1 bg-[#253242] hover:bg-[#3a4552] text-white px-4 py-3 border border-[#3a4552] transition-colors font-medium"
              >
                Accept
              </button>
            </div>
            <div className="mt-4 flex gap-2 justify-center">
              <button
                onClick={() => {
                  setShowAcceptModal(false);
                  router.push('/maker/dashboard');
                }}
                className="text-[#9ca3af] hover:text-white text-sm"
              >
                Back to Dashboard
              </button>
              <span className="text-[#9ca3af]">|</span>
              <Link
                href="/maker/workflow/open-tasks"
                className="text-[#9ca3af] hover:text-white text-sm"
                onClick={(e) => e.stopPropagation()}
              >
                View All Open Tasks
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}