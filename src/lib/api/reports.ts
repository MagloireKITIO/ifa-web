import { supabase } from '../supabase';
import type {
  Report,
  ReportingPeriod,
  StatsFinancial,
  StatsPeople,
  StatsFamily,
  StatsActivities,
  User,
  Database,
} from '@/types';

// Interface pour les contributions de membres
export interface MemberContribution {
  id: string;
  reportId: string;
  memberId: string;
  periodId: string;
  houseChurchId: string;
  contributionType: 'tithe' | 'offering' | 'special';
  amount: number;
  currency: string;
  recordedBy: string;
  recordedAt: string;
}

// Interface pour un rapport complet avec toutes ses stats
export interface FullReport extends Report {
  statsFinancial?: StatsFinancial;
  statsPeople?: StatsPeople;
  statsFamily?: StatsFamily;
  statsActivities?: StatsActivities;
  memberContributions?: MemberContribution[];
  period?: ReportingPeriod;
  centerName?: string;
  houseChurchName?: string;
  submitterName?: string;
}

/**
 * Helper to map DB result to FullReport
 */
function mapReportFromDB(data: any): FullReport {
  // data is the report object with joined tables
  const report = data as Report; // Assumes Report type matches DB columns (snake_case)
  
  return {
    ...report,
    statsFinancial: data.stats_financial?.[0] || data.stats_financial || undefined,
    statsPeople: data.stats_people?.[0] || data.stats_people || undefined,
    statsFamily: data.stats_family?.[0] || data.stats_family || undefined,
    statsActivities: data.stats_activities?.[0] || data.stats_activities || undefined,
    period: data.reporting_periods || undefined,
    centerName: data.centers?.name,
    houseChurchName: data.house_churches?.name,
    submitterName: data.profiles?.full_name,
    // memberContributions is not currently populated in enrichReports, so leaving undefined
  };
}

/**
 * Common query builder for reports
 */
function getReportsQuery() {
  return supabase.from('reports').select(`
    *,
    stats_financial(*),
    stats_people(*),
    stats_family(*),
    stats_activities(*),
    reporting_periods(*),
    centers(name),
    house_churches(name),
    profiles:submitted_by(full_name)
  `);
}

/**
 * Récupère les rapports d'un utilisateur spécifique
 */
export async function getUserReports(userId: string): Promise<FullReport[]> {
  // First fetch the user profile to determine role
  const { data: user, error: userError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (userError || !user) {
    console.error('Error fetching user profile:', userError);
    return [];
  }

  let query = getReportsQuery();

  if (user.role === 'house_lead' && user.house_church_id) {
    // House leader: ses rapports de house church
    query = query.eq('house_church_id', user.house_church_id);
  } else if (user.role === 'center_lead' && user.center_id) {
    // Center leader: ses rapports de centre
    // Note: This logic assumes center leader only sees center reports, 
    // but original code was: reports.filter((r) => r.centerId === user.centerId && !r.houseChurchId);
    // This implies strictly center reports, not house church reports under the center.
    // We'll replicate that logic.
    query = query.eq('center_id', user.center_id).is('house_church_id', null);
  } else if (user.role === 'admin') {
    // Admin: tous les rapports
    // No filter
  } else {
    // Viewer or other: maybe just their own submissions? 
    // Original code didn't handle other roles explicitly (returned empty/filtered implicitly)
    // We'll default to reports submitted by them if they have no role-based scope
    query = query.eq('submitted_by', userId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching user reports:', error);
    return [];
  }

  return (data || []).map(mapReportFromDB);
}

/**
 * Récupère les rapports d'un centre spécifique
 */
export async function getCenterReports(centerId: string): Promise<FullReport[]> {
  const { data, error } = await getReportsQuery()
    .eq('center_id', centerId);

  if (error) {
    console.error('Error fetching center reports:', error);
    return [];
  }

  return (data || []).map(mapReportFromDB);
}

/**
 * Récupère les rapports d'une house church spécifique
 */
export async function getHouseChurchReports(houseChurchId: string): Promise<FullReport[]> {
  const { data, error } = await getReportsQuery()
    .eq('house_church_id', houseChurchId);

  if (error) {
    console.error('Error fetching house church reports:', error);
    return [];
  }

  return (data || []).map(mapReportFromDB);
}

/**
 * Récupère tous les rapports (admin uniquement)
 */
export async function getAllReports(): Promise<FullReport[]> {
  const { data, error } = await getReportsQuery();

  if (error) {
    console.error('Error fetching all reports:', error);
    return [];
  }

  return (data || []).map(mapReportFromDB);
}

/**
 * Récupère les périodes de reporting ouvertes (non verrouillées)
 */
export async function getOpenPeriods(): Promise<ReportingPeriod[]> {
  const { data, error } = await supabase
    .from('reporting_periods')
    .select('*')
    .eq('is_locked', false);

  if (error) {
    console.error('Error fetching open periods:', error);
    return [];
  }

  return data || [];
}

/**
 * Récupère toutes les périodes de reporting
 */
export async function getAllPeriods(): Promise<ReportingPeriod[]> {
  const { data, error } = await supabase
    .from('reporting_periods')
    .select('*');

  if (error) {
    console.error('Error fetching all periods:', error);
    return [];
  }

  return data || [];
}

/**
 * Vérifie si un rapport existe déjà pour une période et une entité
 */
export async function checkExistingReport(
  periodId: string,
  centerId?: string | null,
  houseChurchId?: string | null
): Promise<Report | null> {
  let query = supabase.from('reports').select('*').eq('period_id', periodId);

  if (houseChurchId) {
    query = query.eq('house_church_id', houseChurchId);
  } else if (centerId) {
    query = query.eq('center_id', centerId);
  } else {
    return null;
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    console.error('Error checking existing report:', error);
    return null;
  }

  return data;
}

/**
 * Calcule les statistiques globales des rapports
 */
export async function getReportsStatistics() {
  const { data, error } = await supabase
    .from('reports')
    .select('status');

  if (error) {
    console.error('Error fetching reports statistics:', error);
    return {
      totalReports: 0,
      approvedReports: 0,
      submittedReports: 0,
      rejectedReports: 0,
      draftReports: 0,
    };
  }

  const reports = (data || []) as Report[];
  
  return {
    totalReports: reports.length,
    approvedReports: reports.filter((r) => r.status === 'approved').length,
    submittedReports: reports.filter((r) => r.status === 'submitted').length,
    rejectedReports: reports.filter((r) => r.status === 'rejected').length,
    draftReports: reports.filter((r) => r.status === 'draft').length,
  };
}

/**
 * Récupère les rapports des house churches d'un centre
 * (Pour les center leaders)
 */
export async function getCenterHouseChurchesReports(centerId: string): Promise<FullReport[]> {
  // First fetch house churches for this center
  const { data: houseChurches, error: hcError } = await supabase
    .from('house_churches')
    .select('id')
    .eq('center_id', centerId);

  if (hcError || !houseChurches || houseChurches.length === 0) {
    return [];
  }

  const houseChurchIds = houseChurches.map((hc: any) => hc.id);

  // Then fetch reports
  const { data, error } = await getReportsQuery()
    .in('house_church_id', houseChurchIds);

  if (error) {
    console.error('Error fetching center house churches reports:', error);
    return [];
  }

  return (data || []).map(mapReportFromDB);
}
