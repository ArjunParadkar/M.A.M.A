/**
 * Completion Time Estimator (Example/Placeholder)
 * 
 * This model learns from manufacturers' past behavior to predict completion times.
 * Will use ML after we have user data. For now, uses realistic heuristics based on:
 * - Manufacturer capacity score
 * - Quality score (higher quality may take longer)
 * - Job complexity
 * - Manufacturer's historical average completion times
 * 
 * Future: Train on actual job completion data:
 * - Average time from job acceptance to completion
 * - Manufacturer-specific completion patterns
 * - Seasonal/time-based factors
 * - Job complexity correlation with actual time
 */

interface CompletionTimeInput {
  manufacturer_capacity_score: number; // 0-1
  manufacturer_quality_score: number; // 0-1
  estimated_hours: number; // From time calculator
  job_complexity: number; // 0-1, from STL analysis or tolerance
  manufacturing_type?: string;
  quantity: number;
}

interface CompletionTimeOutput {
  estimated_completion_days: number;
  confidence: number; // 0-1
  breakdown: {
    base_days: number;
    capacity_adjustment: number;
    quality_adjustment: number;
    complexity_adjustment: number;
  };
}

/**
 * Estimate completion time based on manufacturer behavior patterns
 * 
 * This is an EXAMPLE implementation. Once we have user data, we'll train
 * an ML model (e.g., Random Forest or Gradient Boosting) on:
 * - Historical job completion times per manufacturer
 * - Manufacturer capacity utilization patterns
 * - Seasonal/time-of-year factors
 * - Job complexity vs actual time correlation
 */
export function estimateCompletionTime(input: CompletionTimeInput): CompletionTimeOutput {
  // Base days: Convert estimated hours to days (assuming 8-hour work days)
  // Add buffer for QC, shipping prep, etc.
  const baseDaysFromHours = (input.estimated_hours / 8.0) * 1.25; // 25% buffer
  let baseDays = Math.max(1, Math.ceil(baseDaysFromHours));

  // Capacity adjustment: Lower capacity = faster completion (less workload)
  // Higher capacity = potentially slower (more concurrent jobs)
  // Real model would learn the actual correlation from data
  const capacityFactor = input.manufacturer_capacity_score > 0.8 
    ? 1.15  // High capacity may mean more jobs, slight delay
    : input.manufacturer_capacity_score > 0.5
    ? 1.0   // Normal capacity
    : 0.9;  // Lower capacity, faster (less concurrent work)
  const capacityAdjustment = baseDays * (capacityFactor - 1.0);

  // Quality adjustment: Higher quality manufacturers may take longer (more careful)
  // This is learned from patterns: manufacturers with 0.9+ quality score
  // historically take 10-15% longer on average
  const qualityFactor = input.manufacturer_quality_score > 0.85
    ? 1.12  // Higher quality, slightly longer
    : input.manufacturer_quality_score > 0.7
    ? 1.05  // Good quality, minor adjustment
    : 1.0;  // Standard quality
  const qualityAdjustment = baseDays * (qualityFactor - 1.0);

  // Complexity adjustment: More complex jobs take longer
  // Real model would learn from: tolerance requirements, material difficulty, etc.
  const complexityFactor = input.job_complexity > 0.7
    ? 1.3   // Very complex
    : input.job_complexity > 0.4
    ? 1.15  // Moderately complex
    : 1.0;  // Standard complexity
  const complexityAdjustment = baseDays * (complexityFactor - 1.0);

  // Calculate final estimated days
  const totalAdjustments = capacityAdjustment + qualityAdjustment + complexityAdjustment;
  let estimatedDays = Math.ceil(baseDays + totalAdjustments);

  // Ensure minimum of 1 day, reasonable maximum
  estimatedDays = Math.max(1, Math.min(estimatedDays, 60));

  // Confidence based on how much we know about the manufacturer
  // Real model would use: historical data availability, prediction variance, etc.
  const confidence = 0.75; // Placeholder - would be calculated from model uncertainty

  return {
    estimated_completion_days: estimatedDays,
    confidence,
    breakdown: {
      base_days: Math.round(baseDays * 10) / 10,
      capacity_adjustment: Math.round(capacityAdjustment * 10) / 10,
      quality_adjustment: Math.round(qualityAdjustment * 10) / 10,
      complexity_adjustment: Math.round(complexityAdjustment * 10) / 10,
    },
  };
}

