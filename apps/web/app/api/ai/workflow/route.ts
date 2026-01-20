/**
 * F4: Workflow Scheduling API Route
 * Optimizes manufacturer's task schedule
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { manufacturer_id, week_start, week_end } = body;
    
    if (!manufacturer_id) {
      return NextResponse.json(
        { error: 'manufacturer_id is required' },
        { status: 400 }
      );
    }
    
    // Fetch active jobs for this manufacturer
    const supabase = await createClient();
    const { data: activeJobs, error: jobsError } = await supabase
      .from('active_jobs')
      .select(`
        job_id,
        jobs!inner (
          id,
          material,
          quantity,
          tolerance_tier,
          deadline,
          suggested_pay,
          estimated_hours,
          manufacturing_types,
          stl_file_url
        )
      `)
      .eq('manufacturer_id', manufacturer_id)
      .eq('status', 'in_progress');
    
    if (jobsError) {
      console.error('Error fetching active jobs:', jobsError);
      return NextResponse.json(
        { error: 'Failed to fetch active jobs', details: jobsError.message },
        { status: 500 }
      );
    }
    
    // Fetch manufacturer devices
    const { data: devices, error: devicesError } = await supabase
      .from('manufacturer_devices')
      .select('*')
      .eq('manufacturer_id', manufacturer_id);
    
    if (devicesError) {
      console.error('Error fetching devices:', devicesError);
      return NextResponse.json(
        { error: 'Failed to fetch devices', details: devicesError.message },
        { status: 500 }
      );
    }
    
    // Convert jobs to tasks
    const tasks = (activeJobs || []).map((aj: any) => {
      const job = aj.jobs;
      const deadline = job.deadline ? new Date(job.deadline) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      
      // Determine device types from manufacturing types
      const deviceTypes = (job.manufacturing_types || []).map((mt: string) => {
        if (mt.includes('3d') || mt.includes('3D')) return '3d_printer';
        if (mt.includes('cnc') || mt.includes('CNC')) return 'cnc_mill';
        if (mt.includes('injection')) return 'injection_molder';
        if (mt.includes('laser')) return 'laser_cutter';
        return 'general';
      });
      
      // Calculate priority (1-10) based on deadline urgency
      const daysUntilDeadline = (deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      let priority = 5; // default
      if (daysUntilDeadline < 3) priority = 10;
      else if (daysUntilDeadline < 7) priority = 8;
      else if (daysUntilDeadline < 14) priority = 6;
      else priority = 4;
      
      return {
        job_id: job.id,
        priority: priority,
        estimated_hours: job.estimated_hours || (job.quantity || 1) * 2.0,
        deadline: deadline.toISOString(),
        required_device_types: deviceTypes.length > 0 ? deviceTypes : ['general'],
        pay_amount: job.suggested_pay || 0,
        materials_needed: [job.material || 'Unknown'],
        tolerance_tier: job.tolerance_tier || 'medium',
      };
    });
    
    // Convert devices to device data
    const deviceData = (devices || []).map((device: any) => {
      // Generate available hours for the week
      const availableHours: Record<string, number> = {};
      const start = week_start ? new Date(week_start) : new Date();
      const end = week_end ? new Date(week_end) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        availableHours[dateStr] = 8.0; // Default 8 hours/day
      }
      
      return {
        device_id: device.id || device.device_id,
        device_type: device.device_type || device.type || 'general',
        available_hours_per_day: availableHours,
        current_tasks: [],
        efficiency_factor: 1.0,
      };
    });
    
    // Default week range if not provided
    const weekStart = week_start || new Date().toISOString();
    const weekEnd = week_end || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    
    // Call FastAPI F4 Workflow Scheduling endpoint
    const response = await fetch(`${FASTAPI_URL}/api/ai/workflow/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tasks: tasks,
        devices: deviceData,
        week_start: weekStart,
        week_end: weekEnd,
        manufacturer_capacity_hours_per_day: 16.0,
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('FastAPI workflow error:', error);
      return NextResponse.json(
        { error: 'Workflow scheduling failed', details: error },
        { status: response.status }
      );
    }
    
    const scheduleResults = await response.json();
    
    return NextResponse.json(scheduleResults);
    
  } catch (error: any) {
    console.error('Error in F4 workflow scheduling:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

