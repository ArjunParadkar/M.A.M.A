// Shared TypeScript types for ForgeNet

export type UserRole = 'client' | 'manufacturer' | 'admin';

export type ToleranceTier = 'low' | 'medium' | 'high';

export type JobStatus = 
  | 'draft' 
  | 'posted' 
  | 'assigned' 
  | 'in_production' 
  | 'qc_pending' 
  | 'qc_done' 
  | 'accepted' 
  | 'disputed' 
  | 'resolved';

export interface Profile {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  created_at: string;
}

export interface Manufacturer {
  id: string;
  location_state: string;
  location_zip: string;
  equipment: {
    fdm?: boolean;
    sla?: boolean;
    cnc?: boolean;
    [key: string]: boolean | undefined;
  };
  materials: string[];
  tolerance_tier: ToleranceTier;
  capacity_score: number;
  created_at: string;
}

export interface Job {
  id: string;
  client_id: string;
  title: string;
  description: string;
  material: string;
  quantity: number;
  tolerance_tier: ToleranceTier;
  deadline: string;
  status: JobStatus;
  selected_manufacturer_id: string | null;
  stl_path: string | null;
  created_at: string;
}

export interface JobRecommendation {
  id: string;
  job_id: string;
  manufacturer_id: string;
  rank_score: number;
  explanations: {
    factors: string[];
    [key: string]: any;
  };
  model_version: string;
  created_at: string;
}

export interface PayEstimate {
  id: string;
  job_id: string;
  suggested_pay: number;
  range_low: number;
  range_high: number;
  breakdown: {
    time?: number;
    material?: number;
    complexity?: number;
    urgency?: number;
    [key: string]: any;
  };
  model_version: string;
  created_at: string;
}

export interface QCRecord {
  id: string;
  job_id: string;
  manufacturer_id: string;
  qc_score: number;
  status: 'pass' | 'review' | 'fail';
  similarity: number;
  evidence_paths: string[];
  model_version: string;
  created_at: string;
}

export interface Dispute {
  id: string;
  job_id: string;
  client_id: string;
  manufacturer_id: string;
  reason: string;
  status: 'open' | 'resolved';
  resolution: string | null;
  resolved_by: string | null;
  created_at: string;
}

