
-- Migration: Initial Schema Setup
-- Generated from database_schema.dbml

-- Enable UUID extension if not already enabled
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
-- 2. TABLES & PRIMARY KEYS
-- -----------------------------------------------------------------------------

-- Organization Structure

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
  created_at timestamp DEFAULT now()
);

-- User Profiles (Linked to Supabase Auth)

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  role public.user_role DEFAULT 'viewer',
  center_id uuid REFERENCES public.centers(id),
  created_at timestamp DEFAULT now(),
  updated_at timestamp
);

-- Reporting Core

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

-- Metrics & Statistics

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

-- Audit Trail

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
-- 3. COMMENTS & DESCRIPTIONS
-- -----------------------------------------------------------------------------

COMMENT ON TABLE public.profiles IS 'Extended profile for users, handling roles and access scope.';
COMMENT ON COLUMN public.profiles.id IS 'Links to Supabase Auth';
COMMENT ON COLUMN public.profiles.role IS 'admin, center_lead, house_lead';
COMMENT ON COLUMN public.profiles.center_id IS 'Assigned Center';

COMMENT ON COLUMN public.zones.name IS 'e.g., Douala Nord, Douala Sud';

COMMENT ON TABLE public.centers IS 'Main worship centers.';
COMMENT ON COLUMN public.centers.name IS 'e.g., Akwa, Bonamoussadi';

COMMENT ON TABLE public.house_churches IS 'Home assemblies attached to a Center.';
COMMENT ON COLUMN public.house_churches.name IS 'e.g., Cellule Espoir';
COMMENT ON COLUMN public.house_churches.zone_area IS 'Specific neighborhood';
COMMENT ON COLUMN public.house_churches.host_name IS 'Name of the host (not necessarily the leader)';

COMMENT ON COLUMN public.reporting_periods.name IS 'e.g., January 2025';
COMMENT ON COLUMN public.reporting_periods.is_locked IS 'Prevents edits after closure';
COMMENT ON COLUMN public.reporting_periods.fiscal_year IS 'e.g., 2025';

COMMENT ON TABLE public.reports IS 'Header table for a monthly statistical submission.';
COMMENT ON COLUMN public.reports.center_id IS 'Polymorphic-like association: A report is either for a Center OR a House Church';

COMMENT ON COLUMN public.stats_financial.tithes IS 'Dîmes';
COMMENT ON COLUMN public.stats_financial.offerings_general IS 'Offrandes courantes';
COMMENT ON COLUMN public.stats_financial.offerings_events IS 'Offrandes évènements';
COMMENT ON COLUMN public.stats_financial.offerings_investment IS 'Offrandes investissements';
COMMENT ON COLUMN public.stats_financial.expense_admin IS 'Expenses (Aggregated for reporting)';

COMMENT ON COLUMN public.stats_people.attendance_total IS 'Calculated or manual entry';
COMMENT ON COLUMN public.stats_people.new_converts IS 'Gagner les perdus';
COMMENT ON COLUMN public.stats_people.members_lost IS 'Churn';

COMMENT ON COLUMN public.stats_family.engagements IS 'Fiançailles';
COMMENT ON COLUMN public.stats_family.births IS 'Naissances';

COMMENT ON COLUMN public.audit_logs.action IS 'INSERT, UPDATE, DELETE';
