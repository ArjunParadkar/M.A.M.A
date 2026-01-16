'use client';

import { useState, useEffect, useRef } from 'react';

interface Service {
  id: string;
  clientName: string;
  deadline: string;
  attempts: number;
  type?: 'ongoing' | 'open-request' | 'quick-service';
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

const mockServices: Service[] = [
  { id: '1', clientName: 'Acme Corp', deadline: '2026-01-25', attempts: 2, type: 'ongoing' },
  { id: '2', clientName: 'TechStart Inc', deadline: '2026-01-28', attempts: 1, type: 'ongoing' },
  { id: '3', clientName: 'Industrial Solutions', deadline: '2026-02-01', attempts: 3, type: 'ongoing' },
  { id: '4', clientName: 'Global Manufacturing', deadline: '2026-02-05', attempts: 1, type: 'ongoing' },
];

const mockOpenRequests: Service[] = [
  { id: '7', clientName: 'Open Project Alpha', deadline: '2026-02-10', attempts: 0, type: 'open-request' },
  { id: '8', clientName: 'Open Project Beta', deadline: '2026-02-12', attempts: 0, type: 'open-request' },
  { id: '9', clientName: 'Open Project Gamma', deadline: '2026-02-15', attempts: 0, type: 'open-request' },
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'shop' | 'workflow' | 'devices'>('dashboard');
  const [newRequestsCount, setNewRequestsCount] = useState(mockNewRequests.length);
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
      {/* Top Section - Navy with Hello, Maker */}
      <div className="bg-[#0a1929] p-8 pb-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-4xl font-semibold text-white heading-font">
              Hello, Maker
            </h1>
            <div className="flex items-center gap-4">
              {/* Notification Button for New Requests */}
              <button className="relative bg-[#1a2332] hover:bg-[#253242] text-white px-6 py-3 border border-[#1a2332] hover:border-[#253242] transition-colors font-medium flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                New Requests
                {newRequestsCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                    {newRequestsCount}
                  </span>
                )}
              </button>
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
                onClick={() => setActiveTab('workflow')}
                className={`px-6 py-3 font-medium transition-colors heading-font ${
                  activeTab === 'workflow'
                    ? 'text-white border-b-2 border-white'
                    : 'text-[#9ca3af] hover:text-white'
                }`}
              >
                Current Workflow
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
                    <span className="text-[#9ca3af] text-sm font-medium">Devices</span>
                  </div>
                  <p className="text-3xl font-semibold text-white mb-4">12</p>
                  <button className="w-full bg-[#1a2332] hover:bg-[#253242] text-white px-4 py-2 border border-[#253242] hover:border-[#3a4552] transition-colors text-sm font-medium">
                    See devices
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
              
              {/* View Buttons */}
              <div className="flex gap-4">
                <button className="bg-[#0a1929] hover:bg-[#1a2332] text-white px-6 py-3 border border-[#1a2332] hover:border-[#253242] transition-colors font-medium">
                  View All Stats
                </button>
                <button className="bg-[#0a1929] hover:bg-[#1a2332] text-white px-6 py-3 border border-[#1a2332] hover:border-[#253242] transition-colors font-medium">
                  View Financials
                </button>
              </div>
            </div>

            {/* Long-term Commissions Section - Scroll trigger */}
            <div ref={(el) => (sectionsRef.current[0] = el)} className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 heading-font">
                Long-term Commissions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {mockLongTermCommissions.map((commission) => {
                  const percentage = (commission.completedThisWeek / commission.assignedThisWeek) * 100;
                  return (
                    <div key={commission.id} className="bg-[#0a1929] p-6 border border-[#1a2332]">
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
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Ongoing Services Section - Separate */}
            <div ref={(el) => (sectionsRef.current[1] = el)} className="mb-8">
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
                  {mockServices.map((service) => (
                    <ServiceCard key={service.id} service={service} />
                  ))}
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
            <div ref={(el) => (sectionsRef.current[2] = el)} className="mb-8">
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
                      return <QuickServiceCard key={item.id} service={item as QuickService} />;
                    }
                    return <ServiceCard key={item.id} service={item} />;
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
          <div className="bg-[#0a1929] p-8 text-center border border-[#1a2332]">
            <p className="text-white text-lg">Devices content coming soon...</p>
          </div>
        )}

        {activeTab === 'shop' && (
          <div className="bg-[#0a1929] p-8 text-center border border-[#1a2332]">
            <p className="text-white text-lg">Shop content coming soon...</p>
          </div>
        )}

        {activeTab === 'workflow' && (
          <div className="bg-[#0a1929] p-8 text-center border border-[#1a2332]">
            <p className="text-white text-lg">Current Workflow (Build Scheduling) coming soon...</p>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

function ServiceCard({ service }: { service: Service }) {
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
    return 'Service';
  };

  const getSeeMoreText = () => {
    if (service.type === 'ongoing') return 'See more ongoing services';
    if (service.type === 'open-request') return 'See more open requests';
    return 'See more';
  };

  return (
    <div className="flex-shrink-0 w-80 bg-[#0a1929] border border-[#1a2332] overflow-hidden">
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
          <h3 className="text-xl font-semibold text-white mb-1">
            {service.clientName}
          </h3>
        </div>

        <div className="space-y-2">
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

        {/* See More Button */}
        <button className="w-full mt-4 bg-[#1a2332] hover:bg-[#253242] text-white px-4 py-2 border border-[#253242] hover:border-[#3a4552] transition-colors text-sm font-medium">
          {getSeeMoreText()}
        </button>
      </div>
    </div>
  );
}

function QuickServiceCard({ service }: { service: QuickService }) {
  return (
    <div className="flex-shrink-0 w-80 bg-[#0a1929] border border-[#1a2332] overflow-hidden">
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

        {/* See More Button */}
        <button className="w-full mt-4 bg-[#1a2332] hover:bg-[#253242] text-white px-4 py-2 border border-[#253242] hover:border-[#3a4552] transition-colors text-sm font-medium">
          See more quick services
        </button>
      </div>
    </div>
  );
}