'use client';

import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';

export default function Home() {
  const [glowIntensity, setGlowIntensity] = useState(1);
  const [firstImageOpacity, setFirstImageOpacity] = useState(1);
  const [showFirstImage, setShowFirstImage] = useState(true);
  const [showSecondImage, setShowSecondImage] = useState(false);
  const [heroOpacity, setHeroOpacity] = useState(1);
  const [activeProblemIndex, setActiveProblemIndex] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [expandedSolution, setExpandedSolution] = useState<string | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let animationFrame: number;
    let startTime = Date.now();
    const duration = 2500; // Glow for 2.5 seconds
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Create a gentle pulsing glow effect (oscillating between 1 and 1.3)
      const pulse = 1 + Math.sin(progress * Math.PI * 6) * 0.15; // 3 pulses over duration
      setGlowIntensity(pulse);
      
      // After glow duration, fade out first image and show second
      if (progress >= 1) {
        setFirstImageOpacity(0);
        setTimeout(() => {
          setShowFirstImage(false);
          setShowSecondImage(true);
        }, 800);
      } else {
        animationFrame = requestAnimationFrame(animate);
      }
    };
    
    animate();

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        const heroHeight = heroRef.current.offsetHeight;
        const scrollY = window.scrollY;
        const scrollProgress = Math.min(scrollY / (heroHeight * 0.5), 1);
        // Fade out as user scrolls down
        setHeroOpacity(1 - scrollProgress);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-rotate problem section
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveProblemIndex((prev) => (prev + 1) % 4);
    }, 4000); // Rotate every 4 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-200 to-white">
      {/* Navigation Bar - Fixed at top */}
      <nav className="bg-[#0a1929] text-white px-4 md:px-8 py-4 fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between relative">
          {/* Left side - Home Icon and Hamburger Menu */}
          <div className="flex items-center gap-2">
            {/* Home Icon */}
              <Link
              href="/"
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center hover:opacity-80 transition-opacity p-2"
            >
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              </Link>

            {/* Hamburger Menu */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex flex-col gap-1.5 p-2 hover:bg-[#1a2332] rounded transition-colors"
              aria-label="Toggle menu"
            >
              <div className="w-6 h-0.5 bg-white"></div>
              <div className="w-6 h-0.5 bg-white"></div>
              <div className="w-6 h-0.5 bg-white"></div>
            </button>
          </div>

          {/* M.A.M.A Logo in center */}
          <h1 className="text-3xl md:text-4xl font-semibold heading-font absolute left-1/2 transform -translate-x-1/2">
            M.A.M.A
          </h1>

          {/* Right side - Buttons */}
          <div className="flex items-center gap-3 md:gap-4 ml-auto">
              <Link
                href="/auth/sign-in"
              className="text-sm md:text-base px-4 py-2 hover:bg-[#1a2332] rounded transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/auth/sign-up"
              className="text-sm md:text-base bg-[#1a2332] hover:bg-[#253242] px-4 py-2 rounded transition-colors"
              >
                Sign Up
              </Link>
            </div>
          </div>
      </nav>

      {/* Sidebar Menu */}
      <div
        className={`fixed top-0 left-0 h-full w-80 bg-[#0a1929] text-white z-40 transform transition-transform duration-300 ease-in-out ${
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-8 pt-20">
          <h2 className="text-2xl font-semibold heading-font mb-8">Navigation</h2>
          <ul className="space-y-4">
            <li>
              <a
                href="#home"
                onClick={() => {
                  setIsMenuOpen(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="block py-2 hover:text-blue-300 transition-colors cursor-pointer text-blue-400"
              >
                Home
              </a>
            </li>
            <li>
              <a
                href="#problems"
                onClick={() => {
                  setIsMenuOpen(false);
                  const problemsSection = document.querySelector('[class*="Problem Section"]')?.parentElement || document.querySelector('.min-h-screen.relative');
                  problemsSection?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="block py-2 hover:text-blue-300 transition-colors cursor-pointer text-blue-400"
              >
                The Problem
              </a>
            </li>
            <li>
              <a
                href="#solutions"
                onClick={() => {
                  setIsMenuOpen(false);
                  // Scroll to solution section
                }}
                className="block py-2 hover:text-blue-300 transition-colors cursor-pointer text-blue-400"
              >
                Our Solution
              </a>
            </li>
            <li>
              <a
                href="#ai-features"
                onClick={() => {
                  setIsMenuOpen(false);
                  // Scroll to AI features section
                }}
                className="block py-2 hover:text-blue-300 transition-colors cursor-pointer text-blue-400"
              >
                AI-Powered Features
              </a>
            </li>
            <li>
              <a
                href="#cta"
                onClick={() => {
                  setIsMenuOpen(false);
                  // Scroll to CTA section
                }}
                className="block py-2 hover:text-blue-300 transition-colors cursor-pointer text-blue-400"
              >
                Get Started
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Overlay when menu is open */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Hero Section */}
      <div 
        ref={heroRef}
        className={`relative h-screen w-full overflow-hidden bg-black transition-transform duration-300 ease-in-out ${
          isMenuOpen ? 'translate-x-80' : 'translate-x-0'
        }`}
        style={{ 
          opacity: heroOpacity, 
          paddingTop: '80px',
          transition: 'opacity 0.5s ease-out'
        }}
      >
        {/* First Image - Glowing then Fading */}
        {showFirstImage && (
          <div 
            className="absolute inset-0 w-full h-full flex items-center justify-center"
            style={{ 
              opacity: firstImageOpacity,
              transition: firstImageOpacity < 1 ? 'opacity 0.8s ease-out' : 'none'
            }}
          >
            <img 
              src="/eagle-gear-emblem.png"
              alt="Eagle and Gear Emblem"
              className="w-full h-full object-contain"
              style={{
                filter: `brightness(${glowIntensity}) drop-shadow(0 0 ${glowIntensity * 20}px rgba(255, 255, 255, ${(glowIntensity - 1) * 0.5}))`,
                transition: 'filter 0.1s ease-out'
              }}
            />
          </div>
        )}

        {/* Second Image - Logo with White Background and Text (Smooth fade in) */}
        {showSecondImage && (
          <div 
            className="absolute inset-0 w-full h-full bg-white flex items-center justify-center"
            style={{
              opacity: showSecondImage ? 1 : 0,
              transition: 'opacity 1s ease-in'
            }}
          >
            <div className="flex flex-col items-center justify-center max-w-3xl px-8" style={{ paddingTop: '28%', paddingBottom: '30%' }}>
              {/* Logo Image */}
              <img 
                src="/eagle-perched-logo-1.png"
                alt="M.A.M.A Logo"
                className="w-auto h-auto max-w-2xl max-h-80 md:max-h-96 object-contain"
              />
              
              {/* Subtitle beneath logo */}
              <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold heading-font text-center text-[#0a1929] mt-4 whitespace-nowrap">
                Make America Make Again
              </h2>
            </div>
          </div>
        )}
        
        {/* Bottom fade to navy blue gradient overlay - seamless transition to Problem section */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-1/3 pointer-events-none"
          style={{
            background: 'linear-gradient(to top, #0a1929 0%, #0a1929 8%, rgba(10, 25, 41, 0.99) 12%, rgba(10, 25, 41, 0.95) 18%, rgba(10, 25, 41, 0.88) 25%, rgba(10, 25, 41, 0.78) 33%, rgba(10, 25, 41, 0.65) 42%, rgba(10, 25, 41, 0.50) 52%, rgba(10, 25, 41, 0.35) 62%, rgba(10, 25, 41, 0.22) 72%, rgba(10, 25, 41, 0.12) 82%, rgba(10, 25, 41, 0.05) 90%, transparent 100%)'
          }}
        />
      </div>

      {/* Problem Section - Full Page Carousel */}
      <div 
        id="problems" 
        className="relative min-h-screen"
      >
        {[
          {
            title: "Fragmented Manufacturing",
            description: "Finding the right manufacturer for custom parts is time-consuming and inefficient. Traditional methods rely on outdated directories and word-of-mouth."
          },
          {
            title: "Pricing Uncertainty",
            description: "Unclear pricing leads to disputes and delays. Clients and makers struggle to agree on fair compensation for work."
          },
          {
            title: "Quality Assurance",
            description: "Verifying that produced parts meet specifications requires manual inspection, leading to disputes and rework."
          },
          {
            title: "Lack of Trust",
            description: "Both clients and makers need transparent systems to build confidence in the manufacturing process."
          }
        ].map((problem, index) => (
          <div
            key={index}
            className={`min-h-screen flex flex-col transition-opacity duration-1000 ease-in-out ${
              activeProblemIndex === index 
                ? 'opacity-100 relative z-10' 
                : 'opacity-0 absolute inset-0 z-0 pointer-events-none'
            }`}
          >
            {/* Vignette overlay */}
            <div className="absolute inset-0 bg-[#0a1929] pointer-events-none" 
              style={{
                boxShadow: 'inset 0 0 200px rgba(0, 0, 0, 0.8), inset 0 0 100px rgba(0, 0, 0, 0.5)'
              }}
            />
          
          {/* Full page layout */}
          <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-8 py-20 relative z-10">
            {/* Heading at top */}
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-12 heading-font text-center">
              The Problem
            </h2>
            
            {/* Content area - full height */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              {/* Left side - Text content */}
              <div className="flex flex-col justify-center space-y-6">
                <h3 className="text-3xl md:text-4xl font-semibold text-white heading-font">
                  {problem.title}
            </h3>
                <p className="text-lg md:text-xl text-gray-200 leading-relaxed">
                  {problem.description}
            </p>
          </div>

              {/* Right side - Image placeholder */}
              <div className="relative w-full h-[400px] md:h-[500px] bg-[#1a2332] border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <svg
                    className="w-32 h-32 mx-auto mb-4 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-lg font-medium text-gray-300">Image Placeholder</p>
                </div>
              </div>
            </div>

            {/* Navigation arrows and indicator dots */}
            <div className="flex items-center justify-between mt-12">
              {/* Back arrow */}
              <button
                onClick={() => setActiveProblemIndex((prev) => (prev - 1 + 4) % 4)}
                className="p-3 rounded-full bg-white/10 text-white hover:bg-white/20 border border-white/20 transition-all duration-300"
                aria-label="Previous problem"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>

              {/* Indicator dots */}
              <div className="flex justify-center gap-3">
                {[0, 1, 2, 3].map((dotIndex) => (
                  <button
                    key={dotIndex}
                    onClick={() => setActiveProblemIndex(dotIndex)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      activeProblemIndex === dotIndex
                        ? 'bg-white w-10'
                        : 'bg-white/30 hover:bg-white/50 w-2'
                    }`}
                    aria-label={`Go to problem ${dotIndex + 1}`}
                  />
                ))}
              </div>

              {/* Forward arrow */}
              <button
                onClick={() => setActiveProblemIndex((prev) => (prev + 1) % 4)}
                className="p-3 rounded-full bg-white/10 text-white hover:bg-white/20 border border-white/20 transition-all duration-300"
                aria-label="Next problem"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ))}
      </div>

      {/* Solution Section */}
      <div 
        id="solutions" 
        className="bg-white border-t border-gray-200"
      >
        <div className="max-w-7xl mx-auto px-8 py-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 heading-font">
            Our Solution
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <button
              onClick={() => setExpandedSolution(expandedSolution === 'clients' ? null : 'clients')}
              className="bg-[#0a1929] border border-[#1a2332] hover:scale-105 transition-transform duration-300 cursor-pointer overflow-hidden group"
            >
              <div className="w-full h-64 bg-[#1a2332] flex flex-col items-center justify-center relative">
                <img 
                  src="/handshake-image.jpg"
                  alt="Client"
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <h3 className="text-2xl font-semibold text-white heading-font drop-shadow-lg relative z-10">Client</h3>
                  <div className="absolute inset-8 border-2 border-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
              </div>
            </button>
            <button
              onClick={() => setExpandedSolution(expandedSolution === 'makers' ? null : 'makers')}
              className="bg-[#0a1929] border border-[#1a2332] hover:scale-105 transition-transform duration-300 cursor-pointer overflow-hidden group"
            >
              <div className="w-full h-64 bg-[#1a2332] flex flex-col items-center justify-center relative">
                <img 
                  src="/3d-printer-rendering.avif"
                  alt="Maker"
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <h3 className="text-2xl font-semibold text-white heading-font drop-shadow-lg relative z-10">Maker</h3>
                  <div className="absolute inset-8 border-2 border-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
              </div>
            </button>
            <button
              onClick={() => setExpandedSolution(expandedSolution === 'admins' ? null : 'admins')}
              className="bg-[#0a1929] border border-[#1a2332] hover:scale-105 transition-transform duration-300 cursor-pointer overflow-hidden group"
            >
              <div className="w-full h-64 bg-[#1a2332] flex flex-col items-center justify-center relative">
                <img 
                  src="/leader-image.jpg"
                  alt="Admin"
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <h3 className="text-2xl font-semibold text-white heading-font drop-shadow-lg relative z-10">Admin</h3>
                  <div className="absolute inset-8 border-2 border-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Solution Modal */}
      {expandedSolution && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-8 animate-zoom-in"
          style={{
            backgroundImage: expandedSolution === 'clients' 
              ? 'url(/handshake-image.jpg)'
              : expandedSolution === 'makers'
              ? 'url(/3d-printer-rendering.avif)'
              : 'url(/leader-image.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
          onClick={() => setExpandedSolution(null)}
        >
          <div className="absolute inset-0 bg-black/60"></div>
          <div
            className="max-w-4xl w-full bg-[#0a1929] border border-[#1a2332] p-8 relative max-h-[90vh] overflow-y-auto z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setExpandedSolution(null)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-20"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {expandedSolution === 'clients' && (
              <div>
                <h3 className="text-3xl font-semibold text-white mb-6 heading-font">
                  For Clients
                </h3>
                <ul className="text-[#9ca3af] space-y-3 text-lg">
                  <li>• Upload STL files and requirements</li>
                  <li>• Receive AI-ranked manufacturer recommendations</li>
                  <li>• Get fair pay estimates upfront</li>
                  <li>• Automated quality control checks</li>
                  <li>• Dispute resolution system</li>
                </ul>
              </div>
            )}

            {expandedSolution === 'makers' && (
              <div>
                <h3 className="text-3xl font-semibold text-white mb-6 heading-font">
                  For Makers
                </h3>
                <ul className="text-[#9ca3af] space-y-3 text-lg">
                  <li>• Showcase equipment and capabilities</li>
                  <li>• Browse jobs matched to your skills</li>
                  <li>• Fair compensation guarantees</li>
                  <li>• Build reputation through quality work</li>
                  <li>• Long-term commission opportunities</li>
                </ul>
              </div>
            )}

            {expandedSolution === 'admins' && (
              <div>
                <h3 className="text-3xl font-semibold text-white mb-6 heading-font">
                  For Admins
                </h3>
                <ul className="text-[#9ca3af] space-y-3 text-lg">
                  <li>• Comprehensive dispute management</li>
                  <li>• Evidence packet review system</li>
                  <li>• AI output transparency</li>
                  <li>• Platform oversight and quality control</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Touchpoints Section */}
      <div 
        id="ai-features" 
        className="bg-gradient-to-b from-gray-200 to-white"
      >
        <div className="max-w-7xl mx-auto px-8 py-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 heading-font">
            AI-Powered Features
          </h2>
          <p className="text-gray-600 mb-12 max-w-2xl">
            Our platform leverages four AI systems to ensure optimal matching, fair pricing, quality assurance, and efficient workflow scheduling.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* AI #1 - Maker Ranking */}
            <div className="bg-[#0a1929] p-6 border border-[#1a2332]">
              <div className="mb-4">
                <span className="text-[#9ca3af] text-sm font-medium">AI System #1</span>
                <h3 className="text-xl font-semibold text-white mt-2 heading-font">
                  Maker Ranking
                </h3>
              </div>
              <p className="text-[#9ca3af] mb-4 leading-relaxed">
                Intelligently matches jobs with the best manufacturers based on:
              </p>
              <ul className="text-[#9ca3af] space-y-2 text-sm mb-4">
                <li>• Equipment and material compatibility</li>
                <li>• Tolerance tier matching</li>
                <li>• Reliability and QC history</li>
                <li>• Capacity and location</li>
              </ul>
              <div className="pt-4 border-t border-[#1a2332]">
                <span className="text-[#9ca3af] text-xs">Provides ranked list with scores and top 3 factors</span>
              </div>
            </div>

            {/* AI #2 - Fair Pay Estimation */}
            <div className="bg-[#0a1929] p-6 border border-[#1a2332]">
              <div className="mb-4">
                <span className="text-[#9ca3af] text-sm font-medium">AI System #2</span>
                <h3 className="text-xl font-semibold text-white mt-2 heading-font">
                  Fair Pay Estimator
                </h3>
              </div>
              <p className="text-[#9ca3af] mb-4 leading-relaxed">
                Calculates fair compensation considering:
              </p>
              <ul className="text-[#9ca3af] space-y-2 text-sm mb-4">
                <li>• Material costs</li>
                <li>• Time estimates</li>
                <li>• Complexity tiers</li>
                <li>• Urgency multipliers</li>
              </ul>
              <div className="pt-4 border-t border-[#1a2332]">
                <span className="text-[#9ca3af] text-xs">Provides suggested pay with range and breakdown</span>
              </div>
            </div>

            {/* AI #3 - Quality Control */}
            <div className="bg-[#0a1929] p-6 border border-[#1a2332]">
              <div className="mb-4">
                <span className="text-[#9ca3af] text-sm font-medium">AI System #3</span>
                <h3 className="text-xl font-semibold text-white mt-2 heading-font">
                  Quality Control
                </h3>
              </div>
              <p className="text-[#9ca3af] mb-4 leading-relaxed">
                Automated verification using:
              </p>
              <ul className="text-[#9ca3af] space-y-2 text-sm mb-4">
                <li>• Vision-based part inspection</li>
                <li>• STL comparison algorithms</li>
                <li>• Similarity scoring</li>
                <li>• Defect detection</li>
              </ul>
              <div className="pt-4 border-t border-[#1a2332]">
                <span className="text-[#9ca3af] text-xs">Returns QC score, status (pass/review/fail), and similarity metric</span>
              </div>
            </div>

            {/* AI #4 - Workload/Workflow Scheduling */}
            <div className="bg-[#0a1929] p-6 border border-[#1a2332]">
              <div className="mb-4">
                <span className="text-[#9ca3af] text-sm font-medium">AI System #4</span>
                <h3 className="text-xl font-semibold text-white mt-2 heading-font">
                  Workflow Scheduling
                </h3>
              </div>
              <p className="text-[#9ca3af] mb-4 leading-relaxed">
                Optimizes task scheduling for:
              </p>
              <ul className="text-[#9ca3af] space-y-2 text-sm mb-4">
                <li>• Weekly task optimization</li>
                <li>• Device utilization</li>
                <li>• Time management</li>
                <li>• Profit maximization</li>
              </ul>
              <div className="pt-4 border-t border-[#1a2332]">
                <span className="text-[#9ca3af] text-xs">Schedules tasks optimally for the week, ensuring profit and device/time optimization</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div 
        id="cta" 
        className="bg-[#0a1929] text-white"
      >
        <div className="max-w-7xl mx-auto px-8 py-16 text-center">
          <h2 className="text-4xl font-semibold mb-6 heading-font">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-[#d1d5db] mb-8 max-w-2xl mx-auto">
            Join M.A.M.A today and experience the future of distributed manufacturing.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/auth/sign-up"
              className="bg-[#1a2332] hover:bg-[#253242] text-white px-8 py-4 border border-[#1a2332] hover:border-[#253242] transition-colors font-medium"
            >
              I'm a Client
            </Link>
            <Link
              href="/auth/sign-up"
              className="bg-[#1a2332] hover:bg-[#253242] text-white px-8 py-4 border border-[#1a2332] hover:border-[#253242] transition-colors font-medium"
            >
              I'm a Maker
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}