-- =============================================================================
-- 004 - Messaging + Shipping + Financials (demo-safe, RLS enabled)
-- =============================================================================

-- 1) Extend jobs with fields needed to connect client↔manufacturer and preserve order details
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS order_type TEXT;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS tolerance_thou FLOAT;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS manufacturing_types TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS finish_details TEXT;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS coatings TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS screw_dimensions TEXT;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS paint_color TEXT;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS stl_url TEXT;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS assigned_quantity INTEGER;

-- Optional: allow a job to be "accepted" by a maker while still tracking the client-selected manufacturer
-- selected_manufacturer_id already exists.

-- 2) Job messages (client ↔ manufacturer)
CREATE TABLE IF NOT EXISTS public.job_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_messages_job_id_created_at ON public.job_messages(job_id, created_at);
CREATE INDEX IF NOT EXISTS idx_job_messages_sender_id ON public.job_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_job_messages_recipient_id ON public.job_messages(recipient_id);

ALTER TABLE public.job_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants can read job messages" ON public.job_messages;
CREATE POLICY "Participants can read job messages"
ON public.job_messages
FOR SELECT
USING (
  auth.uid() = sender_id OR auth.uid() = recipient_id
);

DROP POLICY IF EXISTS "Participants can send job messages" ON public.job_messages;
CREATE POLICY "Participants can send job messages"
ON public.job_messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1
    FROM public.jobs j
    WHERE j.id = job_messages.job_id
      AND (
        (j.client_id = job_messages.sender_id AND j.selected_manufacturer_id = job_messages.recipient_id)
        OR
        (j.client_id = job_messages.recipient_id AND j.selected_manufacturer_id = job_messages.sender_id)
      )
  )
);

-- 3) Shipping records (manufacturer submits tracking)
CREATE TABLE IF NOT EXISTS public.shipping_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL UNIQUE REFERENCES public.jobs(id) ON DELETE CASCADE,
  manufacturer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  carrier TEXT NOT NULL,
  tracking_number TEXT NOT NULL,
  shipped_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.shipping_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants can read shipping" ON public.shipping_records;
CREATE POLICY "Participants can read shipping"
ON public.shipping_records
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.jobs j
    WHERE j.id = shipping_records.job_id
      AND (j.client_id = auth.uid() OR j.selected_manufacturer_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Manufacturer can create shipping" ON public.shipping_records;
CREATE POLICY "Manufacturer can create shipping"
ON public.shipping_records
FOR INSERT
WITH CHECK (
  auth.uid() = manufacturer_id
  AND EXISTS (
    SELECT 1
    FROM public.jobs j
    WHERE j.id = shipping_records.job_id
      AND j.selected_manufacturer_id = auth.uid()
  )
);

-- 4) Financial transactions (demo ledger)
DO $$ BEGIN
  CREATE TYPE public.transaction_status AS ENUM ('pending', 'authorized', 'paid', 'failed', 'refunded');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.financial_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  manufacturer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  status public.transaction_status NOT NULL DEFAULT 'pending',
  kind TEXT NOT NULL DEFAULT 'job_payment', -- job_payment, fee, refund
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_financial_transactions_client_id_created_at ON public.financial_transactions(client_id, created_at);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_manufacturer_id_created_at ON public.financial_transactions(manufacturer_id, created_at);

ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants can read financials" ON public.financial_transactions;
CREATE POLICY "Participants can read financials"
ON public.financial_transactions
FOR SELECT
USING (
  auth.uid() = client_id OR auth.uid() = manufacturer_id
);

-- Inserts/updates should be server-side only in a real system.
-- For demo we allow inserts when user is the client (creates payment intent placeholder).
DROP POLICY IF EXISTS "Client can create pending financials" ON public.financial_transactions;
CREATE POLICY "Client can create pending financials"
ON public.financial_transactions
FOR INSERT
WITH CHECK (
  auth.uid() = client_id
  AND status = 'pending'
);

-- updated_at trigger
DROP TRIGGER IF EXISTS update_financial_transactions_updated_at ON public.financial_transactions;
CREATE TRIGGER update_financial_transactions_updated_at
BEFORE UPDATE ON public.financial_transactions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();



