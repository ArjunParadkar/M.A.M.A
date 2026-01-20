-- =============================================================================
-- 12. Job Assignments for Multi-Manufacturer Open Requests (005)
-- =============================================================================

-- For large open requests, multiple manufacturers can each accept a portion.
-- This table tracks each manufacturer's assignment (quantity, delivery date, status).

CREATE TABLE IF NOT EXISTS public.job_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  manufacturer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_quantity INTEGER NOT NULL CHECK (assigned_quantity > 0),
  estimated_delivery_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'accepted' CHECK (status IN ('accepted', 'in_production', 'qc_pending', 'shipped', 'delivered', 'cancelled')),
  completed_quantity INTEGER NOT NULL DEFAULT 0 CHECK (completed_quantity >= 0),
  pay_amount_cents INTEGER NOT NULL CHECK (pay_amount_cents >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(job_id, manufacturer_id) -- One assignment per manufacturer per job
);

CREATE INDEX IF NOT EXISTS idx_job_assignments_job_id ON public.job_assignments(job_id);
CREATE INDEX IF NOT EXISTS idx_job_assignments_manufacturer_id ON public.job_assignments(manufacturer_id);
CREATE INDEX IF NOT EXISTS idx_job_assignments_status ON public.job_assignments(status);

ALTER TABLE public.job_assignments ENABLE ROW LEVEL SECURITY;

-- Clients can view assignments for their jobs
DROP POLICY IF EXISTS "Clients can view their job assignments" ON public.job_assignments;
CREATE POLICY "Clients can view their job assignments"
ON public.job_assignments
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.jobs j
    WHERE j.id = job_assignments.job_id
      AND j.client_id = auth.uid()
  )
);

-- Manufacturers can view their own assignments
DROP POLICY IF EXISTS "Manufacturers can view their assignments" ON public.job_assignments;
CREATE POLICY "Manufacturers can view their assignments"
ON public.job_assignments
FOR SELECT
USING (auth.uid() = manufacturer_id);

-- Manufacturers can create assignments when accepting open requests
DROP POLICY IF EXISTS "Manufacturers can create assignments" ON public.job_assignments;
CREATE POLICY "Manufacturers can create assignments"
ON public.job_assignments
FOR INSERT
WITH CHECK (
  auth.uid() = manufacturer_id
  AND EXISTS (
    SELECT 1
    FROM public.jobs j
    WHERE j.id = job_assignments.job_id
      AND j.order_type = 'open-request'
      AND j.status IN ('posted', 'assigned')
      -- Check that total assigned doesn't exceed job quantity
      AND (
        SELECT COALESCE(SUM(ja.assigned_quantity), 0)
        FROM public.job_assignments ja
        WHERE ja.job_id = j.id
      ) + job_assignments.assigned_quantity <= j.quantity
  )
);

-- Manufacturers can update their own assignments (progress, status)
DROP POLICY IF EXISTS "Manufacturers can update their assignments" ON public.job_assignments;
CREATE POLICY "Manufacturers can update their assignments"
ON public.job_assignments
FOR UPDATE
USING (auth.uid() = manufacturer_id);

-- Trigger to update updated_at
DROP TRIGGER IF EXISTS update_job_assignments_updated_at ON public.job_assignments;
CREATE TRIGGER update_job_assignments_updated_at
BEFORE UPDATE ON public.job_assignments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- When a manufacturer accepts an open request, create an assignment
-- (This will be done via API, but we ensure data integrity here)


