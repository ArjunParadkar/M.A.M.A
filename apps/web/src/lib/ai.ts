// AI service utilities

export interface RankingResult {
  manufacturer_id: string;
  score: number;
  factors: string[];
}

export interface PayEstimateResult {
  suggested_pay: number;
  range_low: number;
  range_high: number;
  breakdown: {
    time: number;
    material: number;
    complexity: number;
    urgency: number;
  };
}

export interface QCResult {
  score: number;
  status: 'pass' | 'review' | 'fail';
  similarity: number;
  notes?: string;
}

export async function rankManufacturers(
  jobId: string,
  manufacturers: any[]
): Promise<RankingResult[]> {
  // This will call the AI API endpoint
  const response = await fetch(`/api/ai/rank`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobId, manufacturers }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to rank manufacturers');
  }
  
  return response.json();
}

export async function estimatePay(jobId: string, jobData: any): Promise<PayEstimateResult> {
  const response = await fetch(`/api/ai/pay`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobId, jobData }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to estimate pay');
  }
  
  return response.json();
}

export async function runQC(
  jobId: string,
  evidencePaths: string[],
  stlPath: string
): Promise<QCResult> {
  const response = await fetch(`/api/ai/qc`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobId, evidencePaths, stlPath }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to run QC check');
  }
  
  return response.json();
}

