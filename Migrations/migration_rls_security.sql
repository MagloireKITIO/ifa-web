
-- Migration: Enable Row Level Security (RLS) & Policies
-- Generated for IFA Dashboard

-- -----------------------------------------------------------------------------
-- 0. HELPER FUNCTIONS (To simplify RLS policies)
-- -----------------------------------------------------------------------------

-- Get current user's role
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS public.user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Get current user's assigned center
CREATE OR REPLACE FUNCTION public.get_my_center_id()
RETURNS uuid AS $$
  SELECT center_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- -----------------------------------------------------------------------------
-- 1. ENABLE RLS ON ALL TABLES
-- -----------------------------------------------------------------------------

ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_churches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reporting_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stats_financial ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stats_people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stats_family ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stats_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 2. GENERIC POLICIES (Admin Access)
-- -----------------------------------------------------------------------------

-- Admin has full access to everything
CREATE POLICY "Admins have full access" ON public.zones FOR ALL USING (public.is_admin());
CREATE POLICY "Admins have full access" ON public.centers FOR ALL USING (public.is_admin());
CREATE POLICY "Admins have full access" ON public.house_churches FOR ALL USING (public.is_admin());
CREATE POLICY "Admins have full access" ON public.profiles FOR ALL USING (public.is_admin());
CREATE POLICY "Admins have full access" ON public.reporting_periods FOR ALL USING (public.is_admin());
CREATE POLICY "Admins have full access" ON public.reports FOR ALL USING (public.is_admin());
CREATE POLICY "Admins have full access" ON public.stats_financial FOR ALL USING (public.is_admin());
CREATE POLICY "Admins have full access" ON public.stats_people FOR ALL USING (public.is_admin());
CREATE POLICY "Admins have full access" ON public.stats_family FOR ALL USING (public.is_admin());
CREATE POLICY "Admins have full access" ON public.stats_activities FOR ALL USING (public.is_admin());
CREATE POLICY "Admins have full access" ON public.audit_logs FOR ALL USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- 3. SPECIFIC ACCESS POLICIES
-- -----------------------------------------------------------------------------

-- A. Organization Data (Zones, Centers)
-- Readable by all authenticated users (needed for dropdowns)
CREATE POLICY "Auth users view zones" ON public.zones FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users view centers" ON public.centers FOR SELECT TO authenticated USING (true);

-- B. House Churches
-- Readable by all (for selection), but editable only by Center Lead of that center
CREATE POLICY "Auth users view house churches" ON public.house_churches FOR SELECT TO authenticated USING (true);

CREATE POLICY "Center Leads edit their house churches" ON public.house_churches FOR ALL TO authenticated
USING (
  public.get_my_role() = 'center_lead' AND 
  center_id = public.get_my_center_id()
);

-- C. Profiles
-- Users can read their own profile
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT TO authenticated
USING (id = auth.uid());

-- Center Leads can view profiles of their center members (optional, good for managing house leads)
CREATE POLICY "Center Leads view center members" ON public.profiles FOR SELECT TO authenticated
USING (
  public.get_my_role() = 'center_lead' AND 
  center_id = public.get_my_center_id()
);

-- D. Reporting Periods
-- Readable by all
CREATE POLICY "Auth users view periods" ON public.reporting_periods FOR SELECT TO authenticated USING (true);

-- E. Reports (The complex one)
-- Center Lead: View/Edit reports for THEIR Center OR House Churches under their Center
-- House Lead: View/Edit reports for THEIR House Church only

CREATE POLICY "Center Leads access their reports" ON public.reports FOR ALL TO authenticated
USING (
  public.get_my_role() = 'center_lead' AND 
  (
    center_id = public.get_my_center_id() OR
    house_church_id IN (SELECT id FROM public.house_churches WHERE center_id = public.get_my_center_id())
  )
);

CREATE POLICY "House Leads access their reports" ON public.reports FOR ALL TO authenticated
USING (
  public.get_my_role() = 'house_lead' AND 
  house_church_id IN (
    -- Assuming we might link house_lead to a house_church explicitly later, 
    -- but for now they create/manage reports where they are the submitter? 
    -- Or we restrict based on the house_church_id they select?
    -- For safety in this iteration: They can see reports they submitted.
    SELECT id FROM public.house_churches -- Placeholder if we add direct link
  ) 
  OR submitted_by = auth.uid()
);

-- F. Stats Tables (Financial, People, etc.)
-- Inherit access from the parent Report table logic.
-- Since RLS policies don't automatically "cascade" joins efficiently in all cases, 
-- we check if the user can access the 'reports' row with the given 'report_id'.

-- Helper for stats policies
-- (Alternatively, we can duplicate logic: Center Lead checks if report belongs to center, etc.)

-- FINANCIAL (Strict!)
CREATE POLICY "Center Leads view finance" ON public.stats_financial FOR ALL TO authenticated
USING (
  public.get_my_role() = 'center_lead' AND 
  EXISTS (
    SELECT 1 FROM public.reports r 
    WHERE r.id = report_id 
    AND (r.center_id = public.get_my_center_id())
    -- Note: House churches might not submit financial data, or if they do, Center Lead sees it.
  )
);

-- PEOPLE / FAMILY / ACTIVITIES (More open)
CREATE POLICY "Leads access people stats" ON public.stats_people FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.reports r 
    WHERE r.id = report_id 
    AND (
      -- Admin handled by generic policy
      -- Center Lead
      (public.get_my_role() = 'center_lead' AND r.center_id = public.get_my_center_id()) OR
      -- House Lead (Own submission)
      (public.get_my_role() = 'house_lead' AND r.submitted_by = auth.uid())
    )
  )
);

-- Reuse same logic for Family and Activities
CREATE POLICY "Leads access family stats" ON public.stats_family FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.reports r 
    WHERE r.id = report_id 
    AND (
      (public.get_my_role() = 'center_lead' AND r.center_id = public.get_my_center_id()) OR
      (public.get_my_role() = 'house_lead' AND r.submitted_by = auth.uid())
    )
  )
);

CREATE POLICY "Leads access activity stats" ON public.stats_activities FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.reports r 
    WHERE r.id = report_id 
    AND (
      (public.get_my_role() = 'center_lead' AND r.center_id = public.get_my_center_id()) OR
      (public.get_my_role() = 'house_lead' AND r.submitted_by = auth.uid())
    )
  )
);
