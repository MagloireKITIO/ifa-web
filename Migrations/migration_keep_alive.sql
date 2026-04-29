-- ============================================================================
-- Migration: Add keep_alive function
-- Date: 2026-04-29
-- Description: Creates a keep_alive function to be called by GitHub Actions 
--              to prevent the Supabase database from pausing due to inactivity.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.keep_alive()
RETURNS text AS $$
BEGIN
  RETURN 'OK';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.keep_alive() IS
'Fonction appelée par GitHub Actions pour maintenir la base de données Supabase active.';
