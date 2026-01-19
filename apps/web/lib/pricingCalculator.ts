/**
 * F2: Fair Pay Estimator
 * Calculates accurate pricing based on materials, labor, overhead, margin, and urgency
 */

interface PricingInput {
  material: string;
  quantity: number;
  toleranceThou?: string; // Tolerance in thousandths
  estimatedHours: number;
  setupHours?: number;
  deadline?: string; // ISO date string
  standardDeliveryDays?: number;
  manufacturingTypes?: string[];
}

interface PricingOutput {
  suggested_pay: number;
  range_low: number;
  range_high: number;
  breakdown: {
    materials: number;
    labor: number;
    overhead: number;
    margin: number;
    urgency_multiplier?: number;
    base_subtotal?: number;
  };
}

// Material cost per unit (in USD) - realistic prices
const MATERIAL_COSTS: Record<string, number> = {
  // Metals
  '6061-T6 Aluminum': 4.90,
  '7075 Aluminum': 6.50,
  '304 Stainless Steel': 5.80,
  '316 Stainless Steel': 7.20,
  'Mild Steel (A36)': 3.50,
  'Carbon Steel': 4.20,
  'Titanium (Grade 5)': 45.00,
  'Brass': 8.50,
  'Copper': 6.80,
  'Bronze': 9.20,
  
  // Plastics
  'ABS': 0.08,
  'PLA': 0.06,
  'PETG': 0.09,
  'Nylon': 0.12,
  'Polycarbonate': 0.15,
  'Delrin (Acetal)': 0.18,
  'HDPE': 0.10,
  'UHMW': 0.14,
  'Acrylic': 0.11,
  'Polypropylene': 0.09,
  'PEEK': 0.85,
  'Ultem': 1.20,
  
  // Other
  'Wood': 0.15,
  'Ceramic': 0.25,
  'Composite': 0.45,
  'Rubber': 0.20,
  'Glass': 0.35,
};

// Market hourly rate for manufacturing
const HOURLY_RATE = 45.0; // Realistic CNC/machining hourly rate

export function calculateFairPay(input: PricingInput): PricingOutput {
  // Get material cost per unit
  const materialCostPerUnit = MATERIAL_COSTS[input.material] || 0.10;
  const materialCost = materialCostPerUnit * input.quantity;

  // Calculate complexity multiplier based on tolerance
  let complexityMultiplier = 1.0;
  if (input.toleranceThou) {
    const tolerance = parseFloat(input.toleranceThou);
    if (tolerance <= 0.001) {
      complexityMultiplier = 1.5; // Very high precision
    } else if (tolerance <= 0.003) {
      complexityMultiplier = 1.3; // High precision
    } else if (tolerance <= 0.005) {
      complexityMultiplier = 1.2; // Medium-high precision
    } else if (tolerance <= 0.010) {
      complexityMultiplier = 1.1; // Medium precision
    }
  }

  // Manufacturing type complexity adjustment
  if (input.manufacturingTypes?.includes('Injection Molding')) {
    complexityMultiplier *= 1.15; // Injection molding typically more complex
  }
  if (input.manufacturingTypes?.includes('3D Resin Printing')) {
    complexityMultiplier *= 1.1;
  }

  // Labor cost
  const setupHours = input.setupHours || 1.0;
  const totalHours = input.estimatedHours + setupHours;
  const laborCost = totalHours * HOURLY_RATE * complexityMultiplier;

  // Overhead (15% of labor)
  const overhead = laborCost * 0.15;

  // Subtotal
  const subtotal = materialCost + laborCost + overhead;

  // Margin (20% for maker profit)
  const margin = subtotal * 0.20;

  // Urgency multiplier
  let urgencyMultiplier = 1.0;
  if (input.deadline) {
    const standardDays = input.standardDeliveryDays || 14;
    const deadline = new Date(input.deadline);
    const now = new Date();
    const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDeadline < standardDays * 0.3) {
      urgencyMultiplier = 1.5; // Rush job
    } else if (daysUntilDeadline < standardDays * 0.5) {
      urgencyMultiplier = 1.3;
    } else if (daysUntilDeadline < standardDays * 0.7) {
      urgencyMultiplier = 1.2;
    } else if (daysUntilDeadline < standardDays) {
      urgencyMultiplier = 1.1;
    }
  }

  // Final suggested pay
  const suggestedPay = (subtotal + margin) * urgencyMultiplier;

  return {
    suggested_pay: Math.round(suggestedPay * 100) / 100,
    range_low: Math.round(suggestedPay * 0.85 * 100) / 100,
    range_high: Math.round(suggestedPay * 1.15 * 100) / 100,
    breakdown: {
      materials: Math.round(materialCost * 100) / 100,
      labor: Math.round(laborCost * 100) / 100,
      overhead: Math.round(overhead * 100) / 100,
      margin: Math.round(margin * 100) / 100,
      urgency_multiplier: Math.round(urgencyMultiplier * 100) / 100,
      base_subtotal: Math.round(subtotal * 100) / 100,
    },
  };
}

