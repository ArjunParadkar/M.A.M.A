'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-200 to-white">
      {/* Hero Section - Navy */}
      <div className="bg-[#0a1929] text-white">
        <div className="max-w-7xl mx-auto px-8 py-20">
          <div className="flex items-center justify-between mb-12">
            <h1 className="text-5xl font-semibold heading-font">M.A.M.A</h1>
            <div className="flex gap-4">
              <Link
                href="/maker/dashboard"
                className="bg-[#1a2332] hover:bg-[#253242] text-white px-6 py-3 border border-[#1a2332] hover:border-[#253242] transition-colors font-medium heading-font"
              >
                Maker Dashboard
              </Link>
              <Link
                href="/client/dashboard"
                className="bg-[#1a2332] hover:bg-[#253242] text-white px-6 py-3 border border-[#1a2332] hover:border-[#253242] transition-colors font-medium heading-font"
              >
                Client Dashboard
              </Link>
              <Link
                href="/auth/sign-in"
                className="bg-[#1a2332] hover:bg-[#253242] text-white px-6 py-3 border border-[#1a2332] hover:border-[#253242] transition-colors font-medium"
              >
                Sign In
              </Link>
              <Link
                href="/auth/sign-up"
                className="bg-[#1a2332] hover:bg-[#253242] text-white px-6 py-3 border border-[#1a2332] hover:border-[#253242] transition-colors font-medium"
              >
                Sign Up
              </Link>
            </div>
          </div>
          
          <div className="max-w-3xl">
            <h2 className="text-4xl font-semibold mb-6 heading-font">
              Make America Make Again
            </h2>
            <p className="text-xl text-[#d1d5db] mb-8 leading-relaxed">
              A distributed manufacturing marketplace connecting clients with skilled makers through AI-powered matching, fair pricing, and quality assurance.
            </p>
          </div>
        </div>
      </div>

      {/* Problem Section */}
      <div className="max-w-7xl mx-auto px-8 py-16">
        <h2 className="text-3xl font-semibold text-gray-900 mb-6 heading-font">
          The Problem
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-[#0a1929] p-6 border border-[#1a2332]">
            <h3 className="text-xl font-semibold text-white mb-3 heading-font">
              Fragmented Manufacturing
            </h3>
            <p className="text-[#9ca3af] leading-relaxed">
              Finding the right manufacturer for custom parts is time-consuming and inefficient. Traditional methods rely on outdated directories and word-of-mouth.
            </p>
          </div>
          <div className="bg-[#0a1929] p-6 border border-[#1a2332]">
            <h3 className="text-xl font-semibold text-white mb-3 heading-font">
              Pricing Uncertainty
            </h3>
            <p className="text-[#9ca3af] leading-relaxed">
              Unclear pricing leads to disputes and delays. Clients and makers struggle to agree on fair compensation for work.
            </p>
          </div>
          <div className="bg-[#0a1929] p-6 border border-[#1a2332]">
            <h3 className="text-xl font-semibold text-white mb-3 heading-font">
              Quality Assurance
            </h3>
            <p className="text-[#9ca3af] leading-relaxed">
              Verifying that produced parts meet specifications requires manual inspection, leading to disputes and rework.
            </p>
          </div>
          <div className="bg-[#0a1929] p-6 border border-[#1a2332]">
            <h3 className="text-xl font-semibold text-white mb-3 heading-font">
              Lack of Trust
            </h3>
            <p className="text-[#9ca3af] leading-relaxed">
              Both clients and makers need transparent systems to build confidence in the manufacturing process.
            </p>
          </div>
        </div>
      </div>

      {/* Solution Section */}
      <div className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-8 py-16">
          <h2 className="text-3xl font-semibold text-gray-900 mb-6 heading-font">
            Our Solution
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <div className="bg-[#0a1929] p-6 border border-[#1a2332]">
                <h3 className="text-lg font-semibold text-white mb-2 heading-font">
                  For Clients
                </h3>
                <ul className="text-[#9ca3af] space-y-2 text-sm">
                  <li>• Upload STL files and requirements</li>
                  <li>• Receive AI-ranked manufacturer recommendations</li>
                  <li>• Get fair pay estimates upfront</li>
                  <li>• Automated quality control checks</li>
                  <li>• Dispute resolution system</li>
                </ul>
              </div>
            </div>
            <div className="space-y-4">
              <div className="bg-[#0a1929] p-6 border border-[#1a2332]">
                <h3 className="text-lg font-semibold text-white mb-2 heading-font">
                  For Makers
                </h3>
                <ul className="text-[#9ca3af] space-y-2 text-sm">
                  <li>• Showcase equipment and capabilities</li>
                  <li>• Browse jobs matched to your skills</li>
                  <li>• Fair compensation guarantees</li>
                  <li>• Build reputation through quality work</li>
                  <li>• Long-term commission opportunities</li>
                </ul>
              </div>
            </div>
            <div className="space-y-4">
              <div className="bg-[#0a1929] p-6 border border-[#1a2332]">
                <h3 className="text-lg font-semibold text-white mb-2 heading-font">
                  For Admins
                </h3>
                <ul className="text-[#9ca3af] space-y-2 text-sm">
                  <li>• Comprehensive dispute management</li>
                  <li>• Evidence packet review system</li>
                  <li>• AI output transparency</li>
                  <li>• Platform oversight and quality control</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Touchpoints Section */}
      <div className="bg-gradient-to-b from-gray-200 to-white">
        <div className="max-w-7xl mx-auto px-8 py-16">
          <h2 className="text-3xl font-semibold text-gray-900 mb-4 heading-font">
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
      <div className="bg-[#0a1929] text-white">
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