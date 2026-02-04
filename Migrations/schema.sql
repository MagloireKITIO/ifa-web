
-- Integrity For All (IFA) Dashboard - Complete Database Schema
-- Generated: 2026-02-04

-- -----------------------------------------------------------------------------
-- 0. EXTENSIONS & CONFIGURATION
-- -----------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. ENUMS
-- -----------------------------------------------------------------------------

CREATE TYPE public.user_role AS ENUM (
  'admin',
  'center_lead',
  'house_lead',
  'viewer'
);

CREATE TYPE public.report_status AS ENUM (
  'draft',
  'submitted',
  'approved',
  'rejected'
);

-- -----------------------------------------------------------------------------
-- 2. TABLES
-- -----------------------------------------------------------------------------

-- A. Organization Structure

CREATE TABLE public.zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  region text DEFAULT 'Littoral',
  created_at timestamp DEFAULT now()
);

CREATE TABLE public.centers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  zone_id uuid REFERENCES public.zones(id),
  address text,
  founded_date date,
  status text DEFAULT 'active',
  created_at timestamp DEFAULT now()
);

CREATE TABLE public.house_churches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  center_id uuid REFERENCES public.centers(id),
  zone_area text,
  host_name text,
  status text DEFAULT 'active',
  created_at timestamp DEFAULT now());

-- B. User Profiles (Linked to Supabase Auth)

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  role public.user_role DEFAULT 'viewer',
  center_id uuid REFERENCES public.centers(id),
  created_at timestamp DEFAULT now(),
  updated_at timestamp
);

-- C. Members (Detailed Records)

CREATE TABLE public.members (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name text NOT NULL,
    phone text,
    
    -- Dates & Years
    birth_year int,
    conversion_year int,
    joined_ifa_year int,
    
    -- Sacraments
    is_baptized boolean DEFAULT false,
    marriage_date date,
    
    -- Structure
    center_id uuid REFERENCES public.centers(id),
    house_church_id uuid REFERENCES public.house_churches(id),
    
    -- Status & Metadata
    status text DEFAULT 'active',
    notes text,
    created_at timestamp DEFAULT now()
);

-- D. Reporting Core

CREATE TABLE public.reporting_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  start_date date,
  end_date date,
  is_locked boolean DEFAULT false,
  fiscal_year int
);

CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id uuid REFERENCES public.reporting_periods(id),
  center_id uuid REFERENCES public.centers(id),
  house_church_id uuid REFERENCES public.house_churches(id),
  submitted_by uuid REFERENCES public.profiles(id),
  submitted_at timestamp,
  status public.report_status DEFAULT 'draft'
);

-- E. Metrics & Statistics (Aggregates)

CREATE TABLE public.stats_financial (
  report_id uuid PRIMARY KEY REFERENCES public.reports(id) ON DELETE CASCADE,
  currency text DEFAULT 'XAF',
  tithes decimal(15,2) DEFAULT 0,
  offerings_general decimal(15,2) DEFAULT 0,
  offerings_events decimal(15,2) DEFAULT 0,
  offerings_investment decimal(15,2) DEFAULT 0,
  expense_admin decimal(15,2) DEFAULT 0,
  expense_rent decimal(15,2) DEFAULT 0,
  expense_mission decimal(15,2) DEFAULT 0,
  expense_events decimal(15,2) DEFAULT 0,
  notes text
);

CREATE TABLE public.stats_people (
  report_id uuid PRIMARY KEY REFERENCES public.reports(id) ON DELETE CASCADE,
  attendance_men int DEFAULT 0,
  attendance_women int DEFAULT 0,
  attendance_children int DEFAULT 0,
  attendance_total int,
  new_converts int DEFAULT 0,
  first_timers int DEFAULT 0,
  baptisms int DEFAULT 0,
  members_active_start int,
  members_gained int,
  members_lost int,
  members_active_end int
);

CREATE TABLE public.stats_family (
  report_id uuid PRIMARY KEY REFERENCES public.reports(id) ON DELETE CASCADE,
  marriages int DEFAULT 0,
  engagements int DEFAULT 0,
  births int DEFAULT 0,
  couples_counseled int DEFAULT 0
);

CREATE TABLE public.stats_activities (
  report_id uuid PRIMARY KEY REFERENCES public.reports(id) ON DELETE CASCADE,
  people_trained int DEFAULT 0,
  pastors_certified int DEFAULT 0,
  social_actions_count int DEFAULT 0,
  meals_distributed int DEFAULT 0,
  youth_mentored int DEFAULT 0,
  home_visits int DEFAULT 0,
  evangelism_outreach_count int DEFAULT 0
);

-- F. Audit

CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text,
  record_id uuid,
  action text,
  old_data jsonb,
  new_data jsonb,
  performed_by uuid REFERENCES public.profiles(id),
  performed_at timestamp DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 3. SECURITY (RLS) & HELPER FUNCTIONS
-- -----------------------------------------------------------------------------

-- Helper Functions
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS public.user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.get_my_center_id()
RETURNS uuid AS $$
  SELECT center_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Enable RLS
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_churches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reporting_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stats_financial ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stats_people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stats_family ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stats_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies (Condensed)

-- Admin Access
CREATE POLICY "Admins full access zones" ON public.zones FOR ALL USING (public.is_admin());
CREATE POLICY "Admins full access centers" ON public.centers FOR ALL USING (public.is_admin());
CREATE POLICY "Admins full access houses" ON public.house_churches FOR ALL USING (public.is_admin());
CREATE POLICY "Admins full access profiles" ON public.profiles FOR ALL USING (public.is_admin());
CREATE POLICY "Admins full access members" ON public.members FOR ALL USING (public.is_admin());
CREATE POLICY "Admins full access reports" ON public.reports FOR ALL USING (public.is_admin());
-- (Note: In a full script, explicit admin policies for all tables are recommended, omitting brevity here for common tables)

-- Read Access (Public Lists)
CREATE POLICY "Auth view zones" ON public.zones FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth view centers" ON public.centers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth view houses" ON public.house_churches FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth view periods" ON public.reporting_periods FOR SELECT TO authenticated USING (true);

-- Role-Based Access
CREATE POLICY "Center Leads edit their house churches" ON public.house_churches FOR ALL TO authenticated
USING (public.get_my_role() = 'center_lead' AND center_id = public.get_my_center_id());

CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());

-- Members Access
CREATE POLICY "Center Leads manage center members" ON public.members FOR ALL TO authenticated
USING (public.get_my_role() = 'center_lead' AND center_id = public.get_my_center_id());

CREATE POLICY "House Leads view house members" ON public.members FOR SELECT TO authenticated
USING (public.get_my_role() = 'house_lead'); -- Needs strict house linking logic in future

-- Reporting Access
CREATE POLICY "Center Leads reports" ON public.reports FOR ALL TO authenticated
USING (public.get_my_role() = 'center_lead' AND (center_id = public.get_my_center_id() OR house_church_id IN (SELECT id FROM public.house_churches WHERE center_id = public.get_my_center_id())));

CREATE POLICY "House Leads reports" ON public.reports FOR ALL TO authenticated
USING (public.get_my_role() = 'house_lead' AND submitted_by = auth.uid());

-- Stats Access (Financial)
CREATE POLICY "Center Leads finance" ON public.stats_financial FOR ALL TO authenticated
USING (public.get_my_role() = 'center_lead' AND EXISTS (SELECT 1 FROM public.reports r WHERE r.id = report_id AND r.center_id = public.get_my_center_id()));

-- -----------------------------------------------------------------------------
-- 4. ANALYTICS VIEWS (KPIs)
-- -----------------------------------------------------------------------------

-- KPI 1: Integrations per year
CREATE VIEW public.kpi_integrations_per_year AS
SELECT joined_ifa_year, COUNT(*) as total_integrations
FROM public.members WHERE joined_ifa_year IS NOT NULL
GROUP BY joined_ifa_year ORDER BY joined_ifa_year DESC;

-- KPI 2: Cumulative Integrations
CREATE VIEW public.kpi_integrations_cumulative AS
SELECT joined_ifa_year, COUNT(*) as yearly_count, SUM(COUNT(*)) OVER (ORDER BY joined_ifa_year) as cumulative_total
FROM public.members WHERE joined_ifa_year IS NOT NULL
GROUP BY joined_ifa_year ORDER BY joined_ifa_year;

-- KPI 3: Marriage Evolution
CREATE VIEW public.kpi_marriages_evolution AS
SELECT EXTRACT(YEAR FROM marriage_date) as marriage_year, COUNT(*) as total_marriages
FROM public.members WHERE marriage_date IS NOT NULL
GROUP BY EXTRACT(YEAR FROM marriage_date) ORDER BY marriage_year DESC;

