'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DEMO_MODE, getRevaWorkflow, getManufacturerJobs, type DemoWorkflowTask, type DemoJob } from '@/lib/demoData';

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

type CalendarView = 'daily' | 'weekly' | 'monthly';

export default function WorkflowPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [schedule, setSchedule] = useState<WorkflowSchedule | null>(null);
  const [manufacturerId, setManufacturerId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<CalendarView>('weekly');
  const [currentDate, setCurrentDate] = useState(new Date());

  const loadDemoWorkflow = () => {
    setLoading(true);
    try {
      // Get all accepted/in-progress jobs from ongoing services
      const jobs = getManufacturerJobs('reva_demo_id').filter(j => 
        j.status === 'accepted' || j.status === 'in_production' || j.status === 'in_production'
      );

      // Always update workflow from current jobs to ensure it's fresh
      let tasks = getRevaWorkflow();
      if (jobs.length > 0) {
        // Update workflow to reflect current accepted jobs
        const { updateRevaWorkflow } = require('@/lib/demoData');
        updateRevaWorkflow();
        tasks = getRevaWorkflow();
      }

      // Calculate total profit from unique jobs (not tasks, to avoid duplication)
      const uniqueJobIds = new Set(tasks.map(t => t.job_id));
      const totalProfit = jobs
        .filter(j => uniqueJobIds.has(j.id))
        .reduce((sum, job) => {
          // For open requests, get Reva's assigned pay
          if (job.assigned_manufacturers) {
            const revaAssignment = job.assigned_manufacturers.find(m => m.manufacturer_id === 'reva_demo_id');
            return sum + (revaAssignment?.pay_amount || 0);
          }
          return sum + job.suggested_pay;
        }, 0);
      
      const deviceUtilization: Record<string, number> = {};
      
      tasks.forEach(task => {
        if (!deviceUtilization[task.device_id]) {
          deviceUtilization[task.device_id] = 0;
        }
        // Calculate utilization based on task duration
        const start = new Date(task.start_time);
        const end = new Date(task.end_time);
        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        // Assume 40 hours per week capacity per device
        deviceUtilization[task.device_id] += (hours / 40) * 100;
      });

      const demoSchedule: WorkflowSchedule = {
        scheduled_tasks: tasks.map(task => ({
          job_id: task.job_id,
          device_id: task.device_id,
          start_time: task.start_time,
          end_time: task.end_time,
          estimated_completion: task.estimated_completion,
          priority: task.priority,
          pay_amount: task.pay_amount,
        })),
        unscheduled_tasks: [],
        total_profit: totalProfit,
        device_utilization: deviceUtilization,
        schedule_efficiency: tasks.length > 0 ? 0.85 : 0, // Demo efficiency
        conflicts: [],
        model_version: 'demo',
      };

      setSchedule(demoSchedule);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error loading demo workflow:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check demo mode inside useEffect to ensure it's defined
    const isDemoMode = typeof window !== 'undefined' && (process.env.NODE_ENV === 'development' || sessionStorage.getItem('demo_mode') === 'true');
    
    if (isDemoMode) {
      // Use demo workflow data
      setManufacturerId('reva_demo_id');
      loadDemoWorkflow();
      
      // Set up polling to refresh workflow when jobs change
      const interval = setInterval(() => {
        loadDemoWorkflow();
      }, 3000); // Poll every 3 seconds
      
      return () => clearInterval(interval);
    } else {
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
          setManufacturerId('demo_mfg_001');
          loadSchedule('demo_mfg_001');
        }
      };

      fetchManufacturerId();
    }
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

  // Helper function to get job title (for demo mode)
  const getJobTitle = (jobId: string): string => {
    if (typeof window !== 'undefined' && (process.env.NODE_ENV === 'development' || sessionStorage.getItem('demo_mode') === 'true')) {
      const jobs = getManufacturerJobs('reva_demo_id');
      const job = jobs.find(j => j.id === jobId);
      return job?.title || `Job #${jobId.slice(-6)}`;
    }
    return `Job #${jobId.slice(-6)}`;
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

  // Get ALL devices Reva has (not just ones with tasks)
  const getAllDevices = (): Array<{id: string, name: string}> => {
    // List of all devices Reva owns (from dashboard)
    const allDevices = [
      { id: 'bambu_lab_x1_carbon', name: 'Bambu Lab X1 Carbon' },
      { id: 'tormach_pcnc_440', name: 'Tormach PCNC 440' },
      { id: 'prusa_i3_mk3s', name: 'Prusa i3 MK3S+' },
      { id: 'formlabs_form_3', name: 'Formlabs Form 3' },
      { id: 'creality_ender_3_v2', name: 'Creality Ender 3 V2' },
      { id: 'shopbot_desktop', name: 'ShopBot Desktop' },
      { id: 'haas_mini_mill', name: 'HAAS Mini Mill' },
      { id: 'epilog_fusion_pro', name: 'Epilog Fusion Pro' },
      { id: 'glowforge_pro', name: 'Glowforge Pro' },
      { id: 'arburg_allrounder', name: 'Arburg Allrounder' },
      { id: 'boy_machines_15a', name: 'Boy Machines 15A' },
      { id: 'thermwood_m40', name: 'Thermwood M40' },
      // Also include the demo devices that might have tasks
      { id: 'cnc_mill_01', name: 'CNC Milling Machine #1' },
      { id: '3d_printer_01', name: '3D Printer (FDM)' },
      { id: 'laser_cutter_01', name: 'Laser Cutter' },
    ];
    
    // Remove duplicates by ID, keep all unique devices
    const uniqueDevices = new Map<string, {id: string, name: string}>();
    allDevices.forEach(d => {
      if (!uniqueDevices.has(d.id)) {
        uniqueDevices.set(d.id, d);
      }
    });
    
    // If we have tasks, merge in any device IDs from tasks that aren't in our list
    if (schedule) {
      schedule.scheduled_tasks.forEach(task => {
        if (!uniqueDevices.has(task.device_id)) {
          uniqueDevices.set(task.device_id, {
            id: task.device_id,
            name: getDeviceName(task.device_id),
          });
        }
      });
    }
    
    return Array.from(uniqueDevices.values()).sort((a, b) => a.name.localeCompare(b.name));
  };

  // Get device display name
  const getDeviceName = (deviceId: string): string => {
    // Check if we have a device object with proper name
    const allDevices = getAllDevices();
    const device = allDevices.find(d => d.id === deviceId);
    if (device) return device.name;
    return deviceId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Group tasks by device
  const getTasksByDevice = (deviceId: string): ScheduledTask[] => {
    if (!schedule) return [];
    return schedule.scheduled_tasks
      .filter(task => task.device_id === deviceId)
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  };

  // Get time slots for calendar (hourly)
  const getTimeSlots = (): Date[] => {
    const slots: Date[] = [];
    const base = new Date(currentDate);
    
    if (viewMode === 'daily') {
      base.setHours(0, 0, 0, 0);
      for (let i = 0; i < 24; i++) {
        const slot = new Date(base);
        slot.setHours(i);
        slots.push(slot);
      }
    } else if (viewMode === 'weekly') {
      // Get week start (Sunday)
      const weekStart = new Date(currentDate);
      weekStart.setDate(currentDate.getDate() - currentDate.getDay());
      weekStart.setHours(0, 0, 0, 0);
      
      for (let day = 0; day < 7; day++) {
        for (let hour = 0; hour < 24; hour++) {
          const slot = new Date(weekStart);
          slot.setDate(weekStart.getDate() + day);
          slot.setHours(hour);
          slots.push(slot);
        }
      }
    } else {
      // Monthly - show days
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      for (let day = 1; day <= monthEnd.getDate(); day++) {
        const slot = new Date(monthStart);
        slot.setDate(day);
        slots.push(slot);
      }
    }
    
    return slots;
  };

  // Calculate task position and width for timeline
  const getTaskStyle = (task: ScheduledTask) => {
    if (!schedule) return {};
    
    const taskStart = new Date(task.start_time);
    const taskEnd = new Date(task.end_time);
    const viewStart = new Date(currentDate);
    
    if (viewMode === 'daily') {
      viewStart.setHours(0, 0, 0, 0);
      const hoursFromStart = (taskStart.getTime() - viewStart.getTime()) / (1000 * 60 * 60);
      const durationHours = (taskEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60);
      
      return {
        left: `${(hoursFromStart / 24) * 100}%`,
        width: `${(durationHours / 24) * 100}%`,
      };
    } else if (viewMode === 'weekly') {
      const weekStart = new Date(currentDate);
      weekStart.setDate(currentDate.getDate() - currentDate.getDay());
      weekStart.setHours(0, 0, 0, 0);
      
      // Check if task is within current week
      const taskWeekStart = new Date(taskStart);
      taskWeekStart.setDate(taskStart.getDate() - taskStart.getDay());
      taskWeekStart.setHours(0, 0, 0, 0);
      
      if (taskWeekStart.getTime() !== weekStart.getTime()) {
        // Task is not in current week, don't show it
        return { left: '-100%', width: '0%' };
      }
      
      const dayOfWeek = taskStart.getDay();
      const hoursFromStart = taskStart.getHours() + taskStart.getMinutes() / 60;
      const durationHours = (taskEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60);
      
      // Each day is 1/7 of width, each hour is 1/24 of a day
      const leftPercent = (dayOfWeek / 7) * 100 + (hoursFromStart / 24) * (100 / 7);
      const widthPercent = (durationHours / 24) * (100 / 7);
      
      return {
        left: `${leftPercent}%`,
        width: `${Math.max(0.5, widthPercent)}%`,
      };
    } else {
      // Monthly
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const dayOfMonth = taskStart.getDate() - 1;
      const totalDays = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
      
      return {
        left: `${(dayOfMonth / totalDays) * 100}%`,
        width: `${Math.max(1, (taskEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24) / totalDays) * 100}%`,
      };
    }
  };

  // Navigate dates
  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (viewMode === 'daily') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    } else if (viewMode === 'weekly') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    }
    setCurrentDate(newDate);
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
        {/* View Controls */}
        <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('daily')}
              className={`px-4 py-2 font-medium transition-colors ${
                viewMode === 'daily'
                  ? 'bg-[#253242] text-white border border-[#3a4552]'
                  : 'bg-[#1a2332] text-[#9ca3af] border border-[#253242] hover:border-[#3a4552]'
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setViewMode('weekly')}
              className={`px-4 py-2 font-medium transition-colors ${
                viewMode === 'weekly'
                  ? 'bg-[#253242] text-white border border-[#3a4552]'
                  : 'bg-[#1a2332] text-[#9ca3af] border border-[#253242] hover:border-[#3a4552]'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setViewMode('monthly')}
              className={`px-4 py-2 font-medium transition-colors ${
                viewMode === 'monthly'
                  ? 'bg-[#253242] text-white border border-[#3a4552]'
                  : 'bg-[#1a2332] text-[#9ca3af] border border-[#253242] hover:border-[#3a4552]'
              }`}
            >
              Monthly
            </button>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigateDate('prev')}
              className="px-4 py-2 bg-[#1a2332] text-white border border-[#253242] hover:border-[#3a4552] transition-colors"
            >
              ←
            </button>
            <div className="text-white font-semibold min-w-[200px] text-center">
              {viewMode === 'daily' && currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              {viewMode === 'weekly' && (() => {
                const weekStart = new Date(currentDate);
                weekStart.setDate(currentDate.getDate() - currentDate.getDay());
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);
                return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
              })()}
              {viewMode === 'monthly' && currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </div>
            <button
              onClick={() => navigateDate('next')}
              className="px-4 py-2 bg-[#1a2332] text-white border border-[#253242] hover:border-[#3a4552] transition-colors"
            >
              →
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-4 py-2 bg-[#253242] text-white border border-[#3a4552] hover:bg-[#3a4552] transition-colors text-sm"
            >
              Today
            </button>
          </div>
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

            {/* Materials Ordering Alert */}
            <div className="bg-yellow-900 border border-yellow-700 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-yellow-200 font-semibold mb-1">⚠️ Materials Need to be Ordered</div>
                  <div className="text-yellow-100 text-sm">
                    Order 6061-T6 Aluminum (50 lbs), ABS Plastic (25 lbs), 316 Stainless Steel (30 lbs) by Jan 28
                  </div>
                </div>
                <button className="bg-yellow-800 hover:bg-yellow-700 text-white px-4 py-2 border border-yellow-600 transition-colors text-sm">
                  Order Materials
                </button>
              </div>
            </div>

            {/* Calendar/Timeline View */}
            <div className="bg-[#0a1929] border border-[#1a2332] p-6">
              <h2 className="text-xl font-semibold text-white mb-4 heading-font">Device Schedule Calendar</h2>
              
              {schedule.scheduled_tasks.length === 0 ? (
                <div className="text-[#9ca3af] text-center py-12">
                  <div className="text-lg mb-2">No tasks scheduled for this period.</div>
                  <div className="text-sm">Accept jobs from your dashboard to see them scheduled here.</div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  {/* Calendar Header */}
                  <div className="border-b-2 border-[#253242]">
                    {viewMode === 'daily' && (
                      <div className="flex bg-[#1a2332] min-w-[2400px]">
                        <div className="w-48 p-3 border-r border-[#253242] text-white font-semibold">Device</div>
                        <div className="flex-1 grid grid-cols-24 gap-0">
                          {Array.from({ length: 24 }).map((_, i) => (
                            <div key={i} className="text-center text-[#9ca3af] text-xs py-2 border-r border-[#253242]">
                              <div className="font-semibold">{i}:00</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {viewMode === 'weekly' && (
                      <div className="flex bg-[#1a2332] min-w-[1400px]">
                        <div className="w-48 p-3 border-r-2 border-[#253242] text-white font-semibold">Device</div>
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, dayIdx) => {
                          const weekStart = new Date(currentDate);
                          weekStart.setDate(currentDate.getDate() - currentDate.getDay() + dayIdx);
                          return (
                            <div key={day} className="flex-1 border-r border-[#253242]">
                              <div className="bg-[#253242] text-center text-white font-semibold py-2 px-2 border-b border-[#3a4552]">
                                {day}
                              </div>
                              <div className="text-center text-[#9ca3af] text-xs py-1">
                                {weekStart.getMonth() + 1}/{weekStart.getDate()}
                              </div>
                              <div className="grid grid-cols-1 gap-0 border-t border-[#253242]">
                                {Array.from({ length: 24 }).map((_, i) => (
                                  <div key={i} className="h-3 border-b border-[#0a1929] text-center text-[#9ca3af] text-[8px]">
                                    {i % 6 === 0 ? i : ''}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {viewMode === 'monthly' && (
                      <div className="flex bg-[#1a2332] min-w-[3100px]">
                        <div className="w-48 p-3 border-r-2 border-[#253242] text-white font-semibold">Device</div>
                        {(() => {
                          const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                          const totalDays = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
                          const firstDayOfWeek = monthStart.getDay();
                          const days: (Date | null)[] = [];
                          
                          // Add empty cells for days before month starts
                          for (let i = 0; i < firstDayOfWeek; i++) {
                            days.push(null);
                          }
                          
                          // Add days of month
                          for (let i = 1; i <= totalDays; i++) {
                            const date = new Date(monthStart);
                            date.setDate(i);
                            days.push(date);
                          }
                          
                          // Fill to complete last week
                          while (days.length % 7 !== 0) {
                            days.push(null);
                          }
                          
                          return days.map((date, i) => {
                            if (!date) {
                              return <div key={i} className="flex-1 border-r border-[#253242] bg-[#0a1929] min-h-[50px]"></div>;
                            }
                            const isToday = date.toDateString() === new Date().toDateString();
                            return (
                              <div key={i} className={`flex-1 border-r border-[#253242] ${isToday ? 'bg-[#253242]' : ''} min-h-[50px]`}>
                                <div className={`text-center text-xs py-1 ${isToday ? 'text-white font-bold' : 'text-[#9ca3af]'}`}>
                                  {date.getDate()}
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    )}
                  </div>

                  {/* Device Rows - Calendar Grid */}
                  <div className="border-t-2 border-[#253242]">
                    {getAllDevices().length === 0 ? (
                      <div className="text-[#9ca3af] text-center py-8">No devices scheduled</div>
                    ) : (
                      getAllDevices().map((device) => {
                        const deviceTasks = getTasksByDevice(device.id);
                        return (
                          <div key={device.id} className="border-b border-[#253242] hover:bg-[#1a2332] transition-colors">
                            <div className="flex">
                              {/* Device Name Column */}
                              <div className="w-48 p-4 border-r-2 border-[#253242] bg-[#1a2332] flex-shrink-0">
                                <div className="text-white font-semibold text-sm mb-1">{device.name}</div>
                                <div className="text-[#9ca3af] text-xs">
                                  {deviceTasks.length} task{deviceTasks.length !== 1 ? 's' : ''}
                                </div>
                              </div>
                              
                              {/* Calendar Grid Column */}
                              <div className="flex-1 relative min-h-[80px]">
                                {viewMode === 'daily' && (
                                  <div className="absolute inset-0 grid grid-cols-24 gap-0">
                                    {Array.from({ length: 24 }).map((_, i) => (
                                      <div key={i} className="border-r border-[#253242] border-b border-[#0a1929]"></div>
                                    ))}
                                  </div>
                                )}
                                {viewMode === 'weekly' && (
                                  <div className="absolute inset-0 flex">
                                    {Array.from({ length: 7 }).map((_, dayIdx) => (
                                      <div key={dayIdx} className="flex-1 border-r border-[#253242]">
                                        {Array.from({ length: 24 }).map((_, hourIdx) => (
                                          <div key={hourIdx} className="h-3 border-b border-[#0a1929]"></div>
                                        ))}
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {viewMode === 'monthly' && (
                                  <div className="absolute inset-0 flex">
                                    {(() => {
                                      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                                      const totalDays = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
                                      const firstDayOfWeek = monthStart.getDay();
                                      const days: (Date | null)[] = [];
                                      
                                      for (let i = 0; i < firstDayOfWeek; i++) days.push(null);
                                      for (let i = 1; i <= totalDays; i++) {
                                        const date = new Date(monthStart);
                                        date.setDate(i);
                                        days.push(date);
                                      }
                                      while (days.length % 7 !== 0) days.push(null);
                                      
                                      return days.map((_, i) => (
                                        <div key={i} className="flex-1 border-r border-[#253242] border-b border-[#0a1929]"></div>
                                      ));
                                    })()}
                                  </div>
                                )}
                                
                                {/* Task Blocks on Calendar */}
                                {deviceTasks.map((task, idx) => {
                                  const jobTitle = getJobTitle(task.job_id);
                                  const taskStyle = getTaskStyle(task);
                                  const taskStart = new Date(task.start_time);
                                  const taskEnd = new Date(task.end_time);
                                  const durationHours = (taskEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60);
                                  
                                  // Color based on priority
                                  const priorityColor = task.priority >= 8 ? 'bg-red-600' :
                                                       task.priority >= 5 ? 'bg-yellow-600' :
                                                       'bg-blue-600';
                                  
                                  return (
                                    <Link
                                      key={idx}
                                      href={`/maker/jobs/active/${task.job_id}`}
                                      className={`absolute ${priorityColor} border border-white/20 hover:opacity-90 transition-all px-2 py-1 overflow-hidden cursor-pointer z-10 rounded shadow-lg`}
                                      style={{
                                        ...taskStyle,
                                        minHeight: viewMode === 'daily' ? '40px' : viewMode === 'weekly' ? `${Math.max(24, durationHours * 3)}px` : '50px',
                                      }}
                                      title={`${jobTitle}\n${taskStart.toLocaleString()} - ${taskEnd.toLocaleString()}\n$${task.pay_amount.toFixed(2)}\nPriority: ${task.priority}`}
                                    >
                                      <div className="text-white text-xs font-semibold truncate leading-tight">{jobTitle}</div>
                                      <div className="text-white/90 text-[10px] truncate leading-tight mt-0.5">
                                        {taskStart.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} - {taskEnd.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                                      </div>
                                      <div className="text-white/80 text-[10px] mt-0.5">${task.pay_amount.toFixed(2)}</div>
                                    </Link>
                                  );
                                })}
                                
                                {/* Empty calendar cells with hover tooltips */}
                                {(() => {
                                  // Add hover tooltips to empty calendar slots
                                  // For weekly view, add tooltips on hour cells that have no tasks
                                  if (viewMode === 'weekly' && deviceTasks.length === 0) {
                                    return (
                                      <div className="absolute inset-0">
                                        {Array.from({ length: 7 }).map((_, dayIdx) => (
                                          <div key={dayIdx} className="absolute top-0 bottom-0 left-0" style={{ left: `${(dayIdx / 7) * 100}%`, width: `${(1 / 7) * 100}%` }}>
                                            {Array.from({ length: 24 }).map((_, hourIdx) => {
                                              const hasTask = deviceTasks.some(task => {
                                                const taskStart = new Date(task.start_time);
                                                return taskStart.getDay() === dayIdx && taskStart.getHours() === hourIdx;
                                              });
                                              if (!hasTask) {
                                                return (
                                                  <div
                                                    key={hourIdx}
                                                    className="absolute h-3 w-full group cursor-pointer"
                                                    style={{ top: `${(hourIdx / 24) * 100}%` }}
                                                    title="Nothing at this time, look for open tasks?"
                                                  >
                                                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-[#1a2332]/50 flex items-center justify-center">
                                                      <Link
                                                        href="/maker/workflow/open-tasks"
                                                        className="bg-[#253242] text-[#9ca3af] text-[8px] px-1 py-0.5 border border-[#3a4552] hover:bg-[#3a4552] hover:text-white transition-colors rounded"
                                                        onClick={(e) => e.stopPropagation()}
                                                      >
                                                        Open tasks?
                                                      </Link>
                                                    </div>
                                                  </div>
                                                );
                                              }
                                              return null;
                                            })}
                                          </div>
                                        ))}
                                      </div>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Device Utilization */}
            <div className="bg-[#0a1929] border border-[#1a2332] p-6">
              <h2 className="text-xl font-semibold text-white mb-4 heading-font">Device Utilization</h2>
              <div className="space-y-3">
                {Object.entries(schedule.device_utilization).map(([deviceId, utilization]) => (
                  <div key={deviceId} className="bg-[#1a2332] border border-[#253242] p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white">{getDeviceName(deviceId)}</span>
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

