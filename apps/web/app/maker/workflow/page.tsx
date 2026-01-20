'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface ScheduledTask {
  job_id: string;
  device_id: string;
  start_time: string;
  end_time: string;
  estimated_completion: string;
  priority: number;
  pay_amount: number;
}

interface WorkflowSchedule {
  scheduled_tasks: ScheduledTask[];
  unscheduled_tasks: string[];
  total_profit: number;
  device_utilization: Record<string, number>;
  schedule_efficiency: number;
  conflicts: string[];
  model_version: string;
}

export default function WorkflowPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [schedule, setSchedule] = useState<WorkflowSchedule | null>(null);
  const [manufacturerId, setManufacturerId] = useState<string | null>(null);

  useEffect(() => {
    // Get manufacturer ID from session
    const fetchManufacturerId = async () => {
      try {
        const response = await fetch('/api/auth/session');
        const data = await response.json();
        if (data.user) {
          // Fetch manufacturer profile
          const mfgResponse = await fetch(`/api/manufacturers/by-user/${data.user.id}`);
          const mfgData = await mfgResponse.json();
          if (mfgData.id) {
            setManufacturerId(mfgData.id);
            loadSchedule(mfgData.id);
          }
        }
      } catch (error) {
        console.error('Error fetching manufacturer ID:', error);
        // Use mock for demo
        setManufacturerId('demo_mfg_001');
        loadSchedule('demo_mfg_001');
      }
    };

    fetchManufacturerId();
  }, []);

  const loadSchedule = async (mfgId: string) => {
    setLoading(true);
    try {
      // Calculate week range (current week)
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      weekEnd.setHours(23, 59, 59, 999);

      const response = await fetch('/api/ai/workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          manufacturer_id: mfgId,
          week_start: weekStart.toISOString(),
          week_end: weekEnd.toISOString(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSchedule(data);
      } else {
        console.error('Failed to load schedule');
      }
    } catch (error) {
      console.error('Error loading schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-200 to-white">
      {/* Top Navigation Bar */}
      <div className="bg-[#0a1929] text-white py-4 px-8 border-b border-[#1a2332]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/maker/dashboard" className="text-white hover:text-[#9ca3af] transition-colors">
            ← Back to Dashboard
          </Link>
          <h1 className="text-xl font-semibold heading-font">Current Workflow</h1>
          <div className="w-24"></div> {/* Spacer for centering */}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="mb-6">
          <p className="text-[#6b7280]">
            AI-optimized schedule for the week. This algorithm ensures your devices and time are optimized for maximum profit.
          </p>
        </div>

        {loading ? (
          <div className="bg-[#0a1929] border border-[#1a2332] p-8 text-center">
            <div className="text-white">Loading optimized schedule...</div>
          </div>
        ) : schedule ? (
          <div className="space-y-6">
            {/* Schedule Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#0a1929] border border-[#1a2332] p-6">
                <div className="text-[#9ca3af] text-sm mb-2">Total Profit</div>
                <div className="text-2xl font-bold text-white heading-font">
                  ${schedule.total_profit.toFixed(2)}
                </div>
              </div>
              <div className="bg-[#0a1929] border border-[#1a2332] p-6">
                <div className="text-[#9ca3af] text-sm mb-2">Schedule Efficiency</div>
                <div className="text-2xl font-bold text-white heading-font">
                  {(schedule.schedule_efficiency * 100).toFixed(1)}%
                </div>
              </div>
              <div className="bg-[#0a1929] border border-[#1a2332] p-6">
                <div className="text-[#9ca3af] text-sm mb-2">Scheduled Tasks</div>
                <div className="text-2xl font-bold text-white heading-font">
                  {schedule.scheduled_tasks.length} / {schedule.scheduled_tasks.length + schedule.unscheduled_tasks.length}
                </div>
              </div>
            </div>

            {/* Conflicts/Warnings */}
            {schedule.conflicts && schedule.conflicts.length > 0 && (
              <div className="bg-yellow-900 border border-yellow-700 p-4">
                <div className="text-yellow-200 font-semibold mb-2">⚠️ Schedule Warnings</div>
                <ul className="text-yellow-100 text-sm space-y-1">
                  {schedule.conflicts.map((conflict, idx) => (
                    <li key={idx}>• {conflict}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Scheduled Tasks */}
            <div className="bg-[#0a1929] border border-[#1a2332] p-6">
              <h2 className="text-xl font-semibold text-white mb-4 heading-font">Scheduled Tasks</h2>
              
              {schedule.scheduled_tasks.length === 0 ? (
                <div className="text-[#9ca3af] text-center py-8">
                  No tasks scheduled for this week.
                </div>
              ) : (
                <div className="space-y-4">
                  {schedule.scheduled_tasks.map((task, idx) => (
                    <div
                      key={idx}
                      className="bg-[#1a2332] border border-[#253242] p-4 hover:border-[#3a4552] transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-white font-semibold">Job #{task.job_id.slice(-6)}</span>
                            <span className={`px-2 py-1 text-xs ${
                              task.priority >= 8 ? 'bg-red-900 text-red-200' :
                              task.priority >= 5 ? 'bg-yellow-900 text-yellow-200' :
                              'bg-blue-900 text-blue-200'
                            }`}>
                              Priority {task.priority}
                            </span>
                          </div>
                          <div className="text-[#9ca3af] text-sm space-y-1">
                            <div>Device: {task.device_id}</div>
                            <div>Start: {formatDateTime(task.start_time)}</div>
                            <div>End: {formatDateTime(task.end_time)}</div>
                            <div>Pay: ${task.pay_amount.toFixed(2)}</div>
                          </div>
                        </div>
                        <Link
                          href={`/maker/jobs/active/${task.job_id}`}
                          className="text-white hover:text-[#9ca3af] text-sm underline"
                        >
                          View Job →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Unscheduled Tasks */}
            {schedule.unscheduled_tasks.length > 0 && (
              <div className="bg-[#0a1929] border border-[#1a2332] p-6">
                <h2 className="text-xl font-semibold text-white mb-4 heading-font">Unscheduled Tasks</h2>
                <div className="text-[#9ca3af] text-sm">
                  {schedule.unscheduled_tasks.length} task(s) could not be scheduled due to capacity or device constraints.
                </div>
                <div className="mt-4 space-y-2">
                  {schedule.unscheduled_tasks.map((jobId, idx) => (
                    <div key={idx} className="bg-[#1a2332] border border-[#253242] p-3">
                      <div className="text-white">Job #{jobId.slice(-6)}</div>
                      <Link
                        href={`/maker/jobs/active/${jobId}`}
                        className="text-[#9ca3af] hover:text-white text-sm underline"
                      >
                        View Details →
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Device Utilization */}
            <div className="bg-[#0a1929] border border-[#1a2332] p-6">
              <h2 className="text-xl font-semibold text-white mb-4 heading-font">Device Utilization</h2>
              <div className="space-y-3">
                {Object.entries(schedule.device_utilization).map(([deviceId, utilization]) => (
                  <div key={deviceId} className="bg-[#1a2332] border border-[#253242] p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white">{deviceId}</span>
                      <span className="text-[#9ca3af]">{utilization.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-[#0a1929] border border-[#253242] h-2">
                      <div
                        className="bg-[#3a4552] h-full transition-all"
                        style={{ width: `${Math.min(100, utilization)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-[#0a1929] border border-[#1a2332] p-8 text-center">
            <div className="text-white">Failed to load schedule.</div>
            <button
              onClick={() => manufacturerId && loadSchedule(manufacturerId)}
              className="mt-4 bg-[#253242] hover:bg-[#3a4552] text-white px-4 py-2 border border-[#3a4552] transition-colors"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

