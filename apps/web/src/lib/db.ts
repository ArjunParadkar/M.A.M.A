import { createServerSupabase } from './supabaseClient';
import type { Job, JobRecommendation, PayEstimate, QCRecord, Manufacturer } from '@shared/types';

export async function getJobsByClient(clientId: string) {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });
  
  return { data, error };
}

export async function getJobsByManufacturer(manufacturerId: string) {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('selected_manufacturer_id', manufacturerId)
    .order('created_at', { ascending: false });
  
  return { data, error };
}

export async function getJobById(jobId: string) {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .single();
  
  return { data, error };
}

export async function getJobRecommendations(jobId: string) {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from('job_recommendations')
    .select(`
      *,
      manufacturers (
        id,
        location_state,
        location_zip,
        equipment,
        materials,
        tolerance_tier,
        capacity_score
      )
    `)
    .eq('job_id', jobId)
    .order('rank_score', { ascending: false });
  
  return { data, error };
}

export async function getPayEstimate(jobId: string) {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from('pay_estimates')
    .select('*')
    .eq('job_id', jobId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  return { data, error };
}

export async function getQCRecord(jobId: string) {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from('qc_records')
    .select('*')
    .eq('job_id', jobId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  return { data, error };
}

export async function getDisputes() {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from('disputes')
    .select(`
      *,
      jobs (*),
      profiles!disputes_client_id_fkey (*),
      profiles!disputes_manufacturer_id_fkey (*)
    `)
    .eq('status', 'open')
    .order('created_at', { ascending: false });
  
  return { data, error };
}

export async function getDisputeById(disputeId: string) {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from('disputes')
    .select(`
      *,
      jobs (*),
      profiles!disputes_client_id_fkey (*),
      profiles!disputes_manufacturer_id_fkey (*)
    `)
    .eq('id', disputeId)
    .single();
  
  return { data, error };
}

