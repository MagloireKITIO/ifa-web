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
  memberName?: string;
  memberPhone?: string;
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

/**
 * Récupère un rapport par son ID avec toutes ses données
 */
export async function getReportById(reportId: string): Promise<FullReport | null> {
  const { data, error } = await getReportsQuery()
    .eq('id', reportId)
    .single();

  if (error) {
    console.error('Error fetching report by ID:', error);
    return null;
  }

  if (!data) return null;

  // Fetch member contributions if this is a house church report
  let memberContributions: MemberContribution[] = [];
  if (data.house_church_id) {
    const { data: contributions, error: contribError } = await supabase
      .from('member_contributions')
      .select(`
        *,
        members(full_name, phone)
      `)
      .eq('report_id', reportId);

    if (!contribError && contributions) {
      memberContributions = contributions.map((c: any) => ({
        id: c.id,
        reportId: c.report_id,
        memberId: c.member_id,
        periodId: c.period_id,
        houseChurchId: c.house_church_id,
        contributionType: c.contribution_type,
        amount: c.amount,
        currency: c.currency,
        recordedBy: c.recorded_by,
        recordedAt: c.recorded_at,
        memberName: c.members?.full_name,
        memberPhone: c.members?.phone,
      }));
    }
  }

  const fullReport = mapReportFromDB(data);
  fullReport.memberContributions = memberContributions;

  return fullReport;
}

/**
 * Récupère l'historique d'audit d'un rapport
 */
export async function getReportAuditLogs(reportId: string) {
  const { data, error } = await supabase
    .from('audit_logs')
    .select(`
      *,
      profiles:performed_by(full_name)
    `)
    .eq('table_name', 'reports')
    .eq('record_id', reportId)
    .order('performed_at', { ascending: false });

  if (error) {
    console.error('Error fetching audit logs:', error);
    return [];
  }

  return data || [];
}

/**
 * Approuve un rapport
 */
export async function approveReport(
  reportId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Vérifier que l'utilisateur a le droit d'approuver
    const { data: user } = await supabase
      .from('profiles')
      .select('role, center_id')
      .eq('id', userId)
      .single();

    if (!user) {
      return { success: false, error: 'Utilisateur introuvable' };
    }

    // Récupérer le rapport pour vérifier les permissions
    const { data: report } = await supabase
      .from('reports')
      .select('*, house_churches(center_id)')
      .eq('id', reportId)
      .single();

    if (!report) {
      return { success: false, error: 'Rapport introuvable' };
    }

    // Vérifier les permissions
    const canApprove =
      user.role === 'admin' ||
      (user.role === 'center_lead' &&
        (report.center_id === user.center_id ||
          report.house_churches?.center_id === user.center_id));

    if (!canApprove) {
      return { success: false, error: 'Vous n\'avez pas la permission d\'approuver ce rapport' };
    }

    // Approuver le rapport
    const { error } = await supabase
      .from('reports')
      .update({ status: 'approved' })
      .eq('id', reportId);

    if (error) {
      console.error('Error approving report:', error);
      return { success: false, error: error.message };
    }

    // Créer un log d'audit
    await supabase.from('audit_logs').insert({
      table_name: 'reports',
      record_id: reportId,
      action: 'approve',
      old_data: { status: report.status },
      new_data: { status: 'approved' },
      performed_by: userId,
      performed_at: new Date().toISOString(),
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error in approveReport:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Rejette un rapport avec un motif
 */
export async function rejectReport(
  reportId: string,
  userId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Vérifier que l'utilisateur a le droit de rejeter
    const { data: user } = await supabase
      .from('profiles')
      .select('role, center_id')
      .eq('id', userId)
      .single();

    if (!user) {
      return { success: false, error: 'Utilisateur introuvable' };
    }

    // Récupérer le rapport pour vérifier les permissions
    const { data: report } = await supabase
      .from('reports')
      .select('*, house_churches(center_id)')
      .eq('id', reportId)
      .single();

    if (!report) {
      return { success: false, error: 'Rapport introuvable' };
    }

    // Vérifier les permissions
    const canReject =
      user.role === 'admin' ||
      (user.role === 'center_lead' &&
        (report.center_id === user.center_id ||
          report.house_churches?.center_id === user.center_id));

    if (!canReject) {
      return { success: false, error: 'Vous n\'avez pas la permission de rejeter ce rapport' };
    }

    if (!reason || reason.trim().length < 10) {
      return { success: false, error: 'Le motif de rejet doit contenir au moins 10 caractères' };
    }

    // Rejeter le rapport
    const { error } = await supabase
      .from('reports')
      .update({ status: 'rejected' })
      .eq('id', reportId);

    if (error) {
      console.error('Error rejecting report:', error);
      return { success: false, error: error.message };
    }

    // Créer un log d'audit avec le motif
    await supabase.from('audit_logs').insert({
      table_name: 'reports',
      record_id: reportId,
      action: 'reject',
      old_data: { status: report.status },
      new_data: { status: 'rejected', reason: reason },
      performed_by: userId,
      performed_at: new Date().toISOString(),
    });

    // TODO: Créer une notification pour l'auteur du rapport
    await supabase.from('notifications').insert({
      user_id: report.submitted_by,
      type: 'report_rejected',
      title: 'Rapport rejeté',
      message: `Votre rapport a été rejeté. Motif : ${reason}`,
      action_url: `/rapports/${reportId}`,
      is_read: false,
      created_at: new Date().toISOString(),
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error in rejectReport:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Crée un nouveau rapport avec toutes ses statistiques
 */
export async function createReport(reportData: {
  periodId: string;
  userId: string;
  centerId?: string;
  houseChurchId?: string;
  financial: {
    tithes: number;
    offeringsGeneral: number;
    offeringsEvents: number;
    offeringsInvestment: number;
    expenseAdmin: number;
    expenseRent: number;
    expenseMission: number;
    expenseEvents: number;
    notes: string;
  };
  people: {
    attendanceMen: number;
    attendanceWomen: number;
    attendanceChildren: number;
    newConverts: number;
    firstTimers: number;
    baptisms: number;
    membersActiveStart: number;
    membersGained: number;
    membersLost: number;
  };
  family: {
    marriages: number;
    engagements: number;
    births: number;
    couplesCounseled: number;
  };
  activities: {
    peopleTrained: number;
    pastorsCertified: number;
    socialActionsCount: number;
    mealsDistributed: number;
    youthMentored: number;
    homeVisits: number;
    evangelismOutreachCount: number;
  };
  memberContributions?: Array<{
    memberId: string;
    amount: number;
    hasContributed: boolean;
  }>;
}): Promise<{ success: boolean; reportId?: string; error?: string }> {
  try {
    // 1. Créer le rapport principal
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .insert({
        period_id: reportData.periodId,
        center_id: reportData.centerId || null,
        house_church_id: reportData.houseChurchId || null,
        submitted_by: reportData.userId,
        submitted_at: new Date().toISOString(),
        status: 'submitted',
      })
      .select()
      .single();

    if (reportError || !report) {
      console.error('Error creating report:', reportError);
      return { success: false, error: reportError?.message || 'Erreur lors de la création du rapport' };
    }

    // 2. Créer les statistiques financières
    const { error: financialError } = await supabase
      .from('stats_financial')
      .insert({
        report_id: report.id,
        currency: 'XAF',
        tithes: reportData.financial.tithes,
        offerings_general: reportData.financial.offeringsGeneral,
        offerings_events: reportData.financial.offeringsEvents,
        offerings_investment: reportData.financial.offeringsInvestment,
        expense_admin: reportData.financial.expenseAdmin,
        expense_rent: reportData.financial.expenseRent,
        expense_mission: reportData.financial.expenseMission,
        expense_events: reportData.financial.expenseEvents,
        notes: reportData.financial.notes || null,
      });

    if (financialError) {
      console.error('Error creating financial stats:', financialError);
      return { success: false, error: 'Erreur lors de la sauvegarde des statistiques financières' };
    }

    // 3. Créer les statistiques personnes
    const attendanceTotal =
      reportData.people.attendanceMen +
      reportData.people.attendanceWomen +
      reportData.people.attendanceChildren;

    const membersActiveEnd =
      reportData.people.membersActiveStart +
      reportData.people.membersGained -
      reportData.people.membersLost;

    const { error: peopleError } = await supabase
      .from('stats_people')
      .insert({
        report_id: report.id,
        attendance_men: reportData.people.attendanceMen,
        attendance_women: reportData.people.attendanceWomen,
        attendance_children: reportData.people.attendanceChildren,
        attendance_total: attendanceTotal,
        new_converts: reportData.people.newConverts,
        first_timers: reportData.people.firstTimers,
        baptisms: reportData.people.baptisms,
        members_active_start: reportData.people.membersActiveStart,
        members_gained: reportData.people.membersGained,
        members_lost: reportData.people.membersLost,
        members_active_end: membersActiveEnd,
      });

    if (peopleError) {
      console.error('Error creating people stats:', peopleError);
      return { success: false, error: 'Erreur lors de la sauvegarde des statistiques personnes' };
    }

    // 4. Créer les statistiques famille
    const { error: familyError } = await supabase
      .from('stats_family')
      .insert({
        report_id: report.id,
        marriages: reportData.family.marriages,
        engagements: reportData.family.engagements,
        births: reportData.family.births,
        couples_counseled: reportData.family.couplesCounseled,
      });

    if (familyError) {
      console.error('Error creating family stats:', familyError);
      return { success: false, error: 'Erreur lors de la sauvegarde des statistiques famille' };
    }

    // 5. Créer les statistiques activités
    const { error: activitiesError } = await supabase
      .from('stats_activities')
      .insert({
        report_id: report.id,
        people_trained: reportData.activities.peopleTrained,
        pastors_certified: reportData.activities.pastorsCertified,
        social_actions_count: reportData.activities.socialActionsCount,
        meals_distributed: reportData.activities.mealsDistributed,
        youth_mentored: reportData.activities.youthMentored,
        home_visits: reportData.activities.homeVisits,
        evangelism_outreach_count: reportData.activities.evangelismOutreachCount,
      });

    if (activitiesError) {
      console.error('Error creating activities stats:', activitiesError);
      return { success: false, error: 'Erreur lors de la sauvegarde des statistiques activités' };
    }

    // 6. Créer les contributions de membres (si fourni)
    if (reportData.memberContributions && reportData.memberContributions.length > 0) {
      const contributions = reportData.memberContributions
        .filter(c => c.hasContributed && c.amount > 0)
        .map(c => ({
          report_id: report.id,
          member_id: c.memberId,
          period_id: reportData.periodId,
          house_church_id: reportData.houseChurchId || null,
          contribution_type: 'tithe',
          amount: c.amount,
          currency: 'XAF',
          recorded_by: reportData.userId,
          recorded_at: new Date().toISOString(),
        }));

      if (contributions.length > 0) {
        const { error: contributionsError } = await supabase
          .from('member_contributions')
          .insert(contributions);

        if (contributionsError) {
          console.error('Error creating member contributions:', contributionsError);
          // Ne pas bloquer la création du rapport pour cette erreur
        }
      }
    }

    return { success: true, reportId: report.id };
  } catch (error: any) {
    console.error('Error in createReport:', error);
    return { success: false, error: error.message || 'Erreur inconnue' };
  }
}
