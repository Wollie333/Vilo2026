-- ============================================================================
-- Migration: Create Add-ons Table with Type and Max Quantity
-- Description: Creates add_ons table if not exists, adds type and max_quantity
-- ============================================================================

-- Create addon_pricing_type enum if not exists
DO $$ BEGIN
  CREATE TYPE addon_pricing_type AS ENUM (
    'per_booking',
    'per_night',
    'per_guest',
    'per_guest_per_night'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create addon_type enum for categorizing add-ons
DO $$ BEGIN
  CREATE TYPE addon_type AS ENUM ('service', 'product', 'experience');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create add_ons table if not exists
CREATE TABLE IF NOT EXISTS public.add_ons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,

  -- Details
  name VARCHAR(100) NOT NULL,
  description TEXT,

  -- Pricing
  price DECIMAL(12, 2) NOT NULL,
  pricing_type addon_pricing_type NOT NULL DEFAULT 'per_booking',
  currency VARCHAR(3) NOT NULL DEFAULT 'ZAR',

  -- Type categorization (service, product, experience)
  type addon_type NOT NULL DEFAULT 'service',

  -- Quantity limits
  max_quantity INTEGER NOT NULL DEFAULT 1,

  -- Availability
  is_active BOOLEAN DEFAULT true,

  -- Room-specific (null = available for all rooms)
  room_ids JSONB DEFAULT NULL,

  -- Media
  image_url TEXT,

  -- Sort order
  sort_order INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraint for max_quantity range
  CONSTRAINT add_ons_max_quantity_check CHECK (max_quantity >= 1 AND max_quantity <= 100)
);

-- Add columns to existing table if they don't exist (for upgrades)
DO $$ BEGIN
  ALTER TABLE public.add_ons
    ADD COLUMN IF NOT EXISTS type addon_type NOT NULL DEFAULT 'service';
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.add_ons
    ADD COLUMN IF NOT EXISTS max_quantity INTEGER NOT NULL DEFAULT 1;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- Add constraint if not exists (for upgrades)
DO $$ BEGIN
  ALTER TABLE public.add_ons
    ADD CONSTRAINT add_ons_max_quantity_check
    CHECK (max_quantity >= 1 AND max_quantity <= 100);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Comments for documentation
COMMENT ON TABLE public.add_ons IS 'Purchasable extras for bookings';
COMMENT ON COLUMN public.add_ons.pricing_type IS 'per_booking, per_night, per_guest, per_guest_per_night';
COMMENT ON COLUMN public.add_ons.room_ids IS 'If set, only available for these room IDs (null = all rooms)';
COMMENT ON COLUMN public.add_ons.type IS 'Category of add-on: service (transfers, cleaning), product (baskets, minibar), experience (spa, tours)';
COMMENT ON COLUMN public.add_ons.max_quantity IS 'Maximum quantity a guest can select (1-100). If 1, shows toggle; if >1, shows quantity selector';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_addons_property ON public.add_ons(property_id);
CREATE INDEX IF NOT EXISTS idx_addons_active ON public.add_ons(is_active);
CREATE INDEX IF NOT EXISTS idx_addons_sort ON public.add_ons(property_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_addons_type ON public.add_ons(type);
CREATE INDEX IF NOT EXISTS idx_addons_property_type_active ON public.add_ons(property_id, type, is_active);

-- Enable RLS
ALTER TABLE public.add_ons ENABLE ROW LEVEL SECURITY;

-- RLS Policies (simplified - owner-based access)
DROP POLICY IF EXISTS "Users can view add-ons for their properties" ON public.add_ons;
CREATE POLICY "Users can view add-ons for their properties"
  ON public.add_ons FOR SELECT
  USING (
    property_id IN (
      SELECT id FROM public.properties WHERE owner_id = auth.uid()
    )
    OR is_active = true
  );

DROP POLICY IF EXISTS "Users can manage add-ons for their properties" ON public.add_ons;
CREATE POLICY "Users can manage add-ons for their properties"
  ON public.add_ons FOR ALL
  USING (
    property_id IN (
      SELECT id FROM public.properties WHERE owner_id = auth.uid()
    )
  );

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_add_ons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS add_ons_updated_at ON public.add_ons;
CREATE TRIGGER add_ons_updated_at
  BEFORE UPDATE ON public.add_ons
  FOR EACH ROW
  EXECUTE FUNCTION update_add_ons_updated_at();
