/**
 * Demo Data Manager
 * Stores and manages demo data for Arham (client) and Reva (maker) interactions
 */

export const DEMO_MODE = process.env.NODE_ENV === 'development' || 
  typeof window !== 'undefined' && sessionStorage.getItem('demo_mode') === 'true';

export const DEMO_CLIENT_NAME = 'Arham';
export const DEMO_MAKER_NAME = 'Reva';

export interface DemoJob {
  id: string;
  client_id: string;
  client_name: string;
  title: string;
  order_type: 'quick-service' | 'closed-commission' | 'closed-request' | 'open-request';
  quantity: number;
  assigned_quantity?: number; // For open requests
  deadline: string;
  status: 'pending' | 'assigned' | 'accepted' | 'in_production' | 'qc_pending' | 'shipped';
  suggested_pay: number;
  material: string;
  tolerance: string;
  manufacturing_type: string[];
  stl_file_url?: string;
  selected_manufacturer_id?: string; // For closed requests/commissions
  assigned_manufacturers?: Array<{
    manufacturer_id: string;
    manufacturer_name: string;
    assigned_quantity: number;
    status: 'pending' | 'accepted' | 'in_production' | 'qc_pending' | 'shipped';
    estimated_delivery: string;
    pay_amount: number;
  }>;
  created_at: string;
}

export interface DemoAssignment {
  id: string;
  job_id: string;
  manufacturer_id: string;
  manufacturer_name: string;
  assigned_quantity: number;
  completed_quantity: number;
  status: 'pending' | 'accepted' | 'in_production' | 'qc_pending' | 'shipped';
  estimated_delivery_date: string;
  pay_amount_cents: number;
}

export interface DemoWorkflowTask {
  job_id: string;
  job_title: string;
  device_id: string;
  device_name: string;
  start_time: string;
  end_time: string;
  estimated_completion: string;
  priority: number;
  pay_amount: number;
  status: 'scheduled' | 'in_progress' | 'completed';
}

const STORAGE_KEY_JOBS = 'demo_jobs';
const STORAGE_KEY_NOTIFICATIONS = 'demo_notifications_reva';
const STORAGE_KEY_WORKFLOW = 'demo_workflow_reva';

// Internal helper to seed initial demo jobs (including plane open request)
function seedInitialJobs(): DemoJob[] {
  if (typeof window === 'undefined') return [];

  const now = new Date();

  const twoWeeks = 14 * 24 * 60 * 60 * 1000;
  const threeWeeks = 21 * 24 * 60 * 60 * 1000;

  const openPlaneJobId = 'demo_plane_open_2000';

  const planeOpenRequest: DemoJob = {
    id: openPlaneJobId,
    client_id: 'arham_demo_id',
    client_name: DEMO_CLIENT_NAME,
    title: 'Predator UAV – Wing Brackets (Open Request, 2000 units)',
    order_type: 'open-request',
    quantity: 2000,
    assigned_quantity: 2000,
    deadline: new Date(now.getTime() + threeWeeks).toISOString(),
    status: 'in_production',
    suggested_pay: 2000 * 45, // rough demo pay
    material: '6061-T6 Aluminum',
    tolerance: '±0.005" (0.127mm)',
    manufacturing_type: ['CNC Milling', '3D Printed (FDM)'],
    stl_file_url: '/Predator.stl',
    selected_manufacturer_id: undefined,
    assigned_manufacturers: [
      {
        manufacturer_id: 'reva_demo_id',
        manufacturer_name: DEMO_MAKER_NAME,
        assigned_quantity: 600,
        status: 'in_production',
        estimated_delivery: new Date(now.getTime() + twoWeeks).toISOString(),
        pay_amount: 600 * 45,
      },
      {
        manufacturer_id: 'mfg_001',
        manufacturer_name: 'Precision Makers LLC',
        assigned_quantity: 500,
        status: 'shipped',
        estimated_delivery: new Date(now.getTime() + twoWeeks).toISOString(),
        pay_amount: 500 * 44,
      },
      {
        manufacturer_id: 'mfg_002',
        manufacturer_name: 'TechFab Manufacturing',
        assigned_quantity: 400,
        status: 'in_production',
        estimated_delivery: new Date(now.getTime() + threeWeeks).toISOString(),
        pay_amount: 400 * 43,
      },
      {
        manufacturer_id: 'mfg_003',
        manufacturer_name: 'Custom Parts Co',
        assigned_quantity: 300,
        status: 'accepted',
        estimated_delivery: new Date(now.getTime() + threeWeeks).toISOString(),
        pay_amount: 300 * 42,
      },
      {
        manufacturer_id: 'mfg_004',
        manufacturer_name: 'Ozark CNC Works',
        assigned_quantity: 200,
        status: 'accepted',
        estimated_delivery: new Date(now.getTime() + threeWeeks).toISOString(),
        pay_amount: 200 * 42,
      },
    ],
    created_at: now.toISOString(),
  };

  const seededJobs: DemoJob[] = [planeOpenRequest];
  localStorage.setItem(STORAGE_KEY_JOBS, JSON.stringify(seededJobs));
  return seededJobs;
}

/**
 * Get all demo jobs
 */
export function getDemoJobs(): DemoJob[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEY_JOBS);
  if (stored) {
    const parsed: DemoJob[] = JSON.parse(stored);
    if (parsed.length > 0) {
      return parsed;
    }
  }
  // If no jobs yet in demo mode, seed initial demo jobs (plane request, etc.)
  if (DEMO_MODE) {
    return seedInitialJobs();
  }
  return [];
}

/**
 * Save a demo job
 */
export function saveDemoJob(job: DemoJob): void {
  if (typeof window === 'undefined') return;
  const jobs = getDemoJobs();
  const existingIndex = jobs.findIndex(j => j.id === job.id);
  if (existingIndex >= 0) {
    jobs[existingIndex] = job;
  } else {
    jobs.push(job);
  }
  localStorage.setItem(STORAGE_KEY_JOBS, JSON.stringify(jobs));
  
  // If job is assigned to Reva, create notification
  if (job.selected_manufacturer_id === 'reva_demo_id' || 
      job.assigned_manufacturers?.some(m => m.manufacturer_id === 'reva_demo_id')) {
    addNotificationForReva(job);
  }
}

/**
 * Get jobs for a specific client
 */
export function getClientJobs(clientId: string): DemoJob[] {
  return getDemoJobs().filter(job => job.client_id === clientId);
}

/**
 * Get jobs assigned to a specific manufacturer
 */
export function getManufacturerJobs(manufacturerId: string): DemoJob[] {
  const jobs = getDemoJobs();
  return jobs.filter(job => {
    if (job.selected_manufacturer_id === manufacturerId) return true;
    if (job.assigned_manufacturers?.some(m => m.manufacturer_id === manufacturerId)) return true;
    return false;
  });
}

/**
 * Get pending notifications for Reva
 */
export function getRevaNotifications(): DemoJob[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS);
  return stored ? JSON.parse(stored) : [];
}

/**
 * Add notification for Reva
 */
function addNotificationForReva(job: DemoJob): void {
  if (typeof window === 'undefined') return;
  const notifications = getRevaNotifications();
  // Only add if not already in notifications
  if (!notifications.find(n => n.id === job.id)) {
    notifications.push(job);
    localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(notifications));
  }
}

/**
 * Remove notification for Reva (when accepted)
 */
export function removeRevaNotification(jobId: string): void {
  if (typeof window === 'undefined') return;
  const notifications = getRevaNotifications();
  const filtered = notifications.filter(n => n.id !== jobId);
  localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(filtered));
}

/**
 * Accept job for Reva - can accept existing jobs or create new ones from recommendations
 */
export function acceptJobForReva(jobId: string, assignedQuantity?: number, recommendationData?: any): void {
  const jobs = getDemoJobs();
  let job = jobs.find(j => j.id === jobId);
  
  // If job doesn't exist and we have recommendation data, create it
  if (!job && recommendationData) {
    const newJob: DemoJob = {
      id: jobId,
      client_id: 'arham_demo_id',
      client_name: recommendationData.clientName || 'Client',
      title: recommendationData.job || recommendationData.clientName || 'New Job',
      order_type: recommendationData.type === 'quick-service' ? 'quick-service' : 
                  recommendationData.type === 'open-request' ? 'open-request' : 'closed-request',
      quantity: recommendationData.quantity || 1,
      deadline: recommendationData.deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'accepted',
      suggested_pay: recommendationData.payPerProduct ? recommendationData.payPerProduct * (recommendationData.quantity || 1) : 500,
      material: recommendationData.materials || '6061-T6 Aluminum',
      tolerance: '±0.005"',
      manufacturing_type: [recommendationData.machine || 'CNC / 3D Printing'],
      selected_manufacturer_id: 'reva_demo_id',
      created_at: new Date().toISOString(),
    };
    saveDemoJob(newJob);
    job = newJob;
  }
  
  if (!job) return;

  if (job.order_type === 'open-request' && assignedQuantity) {
    // For open requests, update the assigned manufacturer entry
    const assignedMfg = job.assigned_manufacturers?.find(m => m.manufacturer_id === 'reva_demo_id');
    if (assignedMfg) {
      assignedMfg.status = 'accepted';
      assignedMfg.assigned_quantity = assignedQuantity;
    } else {
      // Add new assignment
      if (!job.assigned_manufacturers) job.assigned_manufacturers = [];
      job.assigned_manufacturers.push({
        manufacturer_id: 'reva_demo_id',
        manufacturer_name: DEMO_MAKER_NAME,
        assigned_quantity: assignedQuantity,
        status: 'accepted',
        estimated_delivery: new Date(job.deadline).toISOString(),
        pay_amount: (job.suggested_pay / job.quantity) * assignedQuantity,
      });
    }
  } else {
    // For closed requests/commissions/quick-service
    job.selected_manufacturer_id = 'reva_demo_id';
    job.status = 'accepted';
  }

  saveDemoJob(job);
  removeRevaNotification(jobId);
  
  // Update workflow
  updateRevaWorkflow();
}

/**
 * Get Reva's workflow
 */
export function getRevaWorkflow(): DemoWorkflowTask[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEY_WORKFLOW);
  return stored ? JSON.parse(stored) : [];
}

/**
 * Update Reva's workflow based on accepted jobs
 * Export this so workflow page can trigger updates
 */
export function updateRevaWorkflow(): void {
  if (typeof window === 'undefined') return;
  
  const jobs = getManufacturerJobs('reva_demo_id').filter(j => 
    j.status === 'accepted' || j.status === 'in_production'
  );

  // Generate workflow tasks
  const tasks: DemoWorkflowTask[] = [];
  const devices = [
    { id: 'cnc_mill_01', name: 'CNC Milling Machine #1' },
    { id: '3d_printer_01', name: '3D Printer (FDM)' },
    { id: 'laser_cutter_01', name: 'Laser Cutter' },
  ];

  jobs.forEach((job, index) => {
    const device = devices[index % devices.length];
    const startTime = new Date();
    
    // Distribute tasks across the week (days 0-6, Sunday-Saturday)
    const dayOffset = index % 7;
    startTime.setDate(startTime.getDate() - startTime.getDay() + dayOffset); // Align to week start (Sunday)
    startTime.setHours(8 + (index % 3) * 4, 0, 0, 0); // Spread hours: 8am, 12pm, 4pm
    
    const endTime = new Date(startTime);
    endTime.setHours(startTime.getHours() + 6); // 6 hour task

    tasks.push({
      job_id: job.id,
      job_title: job.title,
      device_id: device.id,
      device_name: device.name,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      estimated_completion: endTime.toISOString(),
      priority: 10 - index, // Higher priority for first jobs
      pay_amount: job.suggested_pay,
      status: index === 0 ? 'in_progress' : 'scheduled',
    });
  });

  localStorage.setItem(STORAGE_KEY_WORKFLOW, JSON.stringify(tasks));
}

/**
 * Initialize demo mode
 */
export function initDemoMode(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem('demo_mode', 'true');
}

/**
 * Clear demo data
 */
export function clearDemoData(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY_JOBS);
  localStorage.removeItem(STORAGE_KEY_NOTIFICATIONS);
  localStorage.removeItem(STORAGE_KEY_WORKFLOW);
}

