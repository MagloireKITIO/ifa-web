
-- Migration: Add Members Table with KPI support
-- Includes fields for Integration, Marriage tracking, and IFA Join Date

-- 1. Create Members Table
CREATE TABLE public.members (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name text NOT NULL,
    phone text,
    
    -- Dates & Years
    birth_year int,
    conversion_year int,
    joined_ifa_year int, -- NEW: Year they joined IFA specifically
    
    -- Sacraments
    is_baptized boolean DEFAULT false,
    marriage_date date, -- NEW: For "Evolution des mariages"
    
    -- Structure
    center_id uuid REFERENCES public.centers(id),
    house_church_id uuid REFERENCES public.house_churches(id),
    
    -- Status & Metadata
    status text DEFAULT 'active', -- active, visitor, child, relocated
    notes text,
    created_at timestamp DEFAULT now()
);

-- 2. Enable Security
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- Center Lead: Full access to members in their center
CREATE POLICY "Center Leads manage center members" ON public.members 
FOR ALL TO authenticated
USING (
  public.get_my_role() = 'center_lead' AND 
  center_id = public.get_my_center_id()
);

-- House Lead: View members in their house church (Read-only usually, or edit if desired)
CREATE POLICY "House Leads view house members" ON public.members 
FOR SELECT TO authenticated
USING (
  public.get_my_role() = 'house_lead' AND 
  house_church_id IN (SELECT id FROM public.house_churches WHERE host_name = 'TODO: Link House Lead') 
  -- Note: We might need a better link between Profile <-> HouseChurch later
);

-- Admin: Full Access
CREATE POLICY "Admins manage all members" ON public.members 
FOR ALL TO authenticated
USING (public.is_admin());


-- 4. KPI Views (Prepared Calculations)
-- These views allow us to instantly query the requested KPIs without complex joins later.

-- KPI 1: Sommes des intégrations sur année (Sum of integrations per year)
CREATE VIEW public.kpi_integrations_per_year AS
SELECT 
    joined_ifa_year,
    COUNT(*) as total_integrations
FROM public.members
WHERE joined_ifa_year IS NOT NULL
GROUP BY joined_ifa_year
ORDER BY joined_ifa_year DESC;

-- KPI 2: Évolution cumulé des intégrations (Cumulative evolution)
CREATE VIEW public.kpi_integrations_cumulative AS
SELECT 
    joined_ifa_year,
    COUNT(*) as yearly_count,
    SUM(COUNT(*)) OVER (ORDER BY joined_ifa_year) as cumulative_total
FROM public.members
WHERE joined_ifa_year IS NOT NULL
GROUP BY joined_ifa_year
ORDER BY joined_ifa_year;

-- KPI 3: Evolution des mariages à l'eglise (Marriage evolution)
CREATE VIEW public.kpi_marriages_evolution AS
SELECT 
    EXTRACT(YEAR FROM marriage_date) as marriage_year,
    COUNT(*) as total_marriages
FROM public.members
WHERE marriage_date IS NOT NULL
GROUP BY EXTRACT(YEAR FROM marriage_date)
ORDER BY marriage_year DESC;
