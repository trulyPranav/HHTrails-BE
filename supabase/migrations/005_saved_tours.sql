-- ============================================================
-- Migration 005: Saved Tours Table
-- Run this in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.saved_tours (
  id         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  user_id    uuid                     NOT NULL,
  tour_id    uuid                     NOT NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT saved_tours_pkey      PRIMARY KEY (id),
  CONSTRAINT unique_user_tour      UNIQUE (user_id, tour_id),
  CONSTRAINT saved_tours_tour_fkey FOREIGN KEY (tour_id)
    REFERENCES public.tours (id) ON DELETE CASCADE,
  CONSTRAINT saved_tours_user_fkey FOREIGN KEY (user_id)
    REFERENCES public.user_profiles (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Index for fast lookup of a user's saved tours
CREATE INDEX IF NOT EXISTS idx_saved_tours_user_id
  ON public.saved_tours USING btree (user_id) TABLESPACE pg_default;

-- RLS
ALTER TABLE public.saved_tours ENABLE ROW LEVEL SECURITY;

-- Users can only read their own saved tours
CREATE POLICY "Users can view own saved tours"
  ON public.saved_tours FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own saved tours
CREATE POLICY "Users can save tours"
  ON public.saved_tours FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own saved tours
CREATE POLICY "Users can remove saved tours"
  ON public.saved_tours FOR DELETE
  USING (auth.uid() = user_id);
