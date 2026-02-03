import { loadDatabase } from './db';
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
 * Récupère les rapports d'un utilisateur spécifique
 */
export async function getUserReports(userId: string): Promise<FullReport[]> {
  const db = await loadDatabase();
  const user = db.users.find((u) => u.id === userId);

  if (!user) return [];

  let reports: Report[] = [];

  if (user.role === 'house_lead' && user.houseChurchId) {
    // House leader: ses rapports de house church
    reports = db.reports.filter((r) => r.houseChurchId === user.houseChurchId);
  } else if (user.role === 'center_lead' && user.centerId) {
    // Center leader: ses rapports de centre
    reports = db.reports.filter((r) => r.centerId === user.centerId && !r.houseChurchId);
  } else if (user.role === 'admin') {
    // Admin: tous les rapports
    reports = db.reports;
  }

  return enrichReports(reports, db);
}

/**
 * Récupère les rapports d'un centre spécifique
 */
export async function getCenterReports(centerId: string): Promise<FullReport[]> {
  const db = await loadDatabase();
  const reports = db.reports.filter((r) => r.centerId === centerId);
  return enrichReports(reports, db);
}

/**
 * Récupère les rapports d'une house church spécifique
 */
export async function getHouseChurchReports(houseChurchId: string): Promise<FullReport[]> {
  const db = await loadDatabase();
  const reports = db.reports.filter((r) => r.houseChurchId === houseChurchId);
  return enrichReports(reports, db);
}

/**
 * Récupère tous les rapports (admin uniquement)
 */
export async function getAllReports(): Promise<FullReport[]> {
  const db = await loadDatabase();
  return enrichReports(db.reports, db);
}

/**
 * Récupère les périodes de reporting ouvertes (non verrouillées)
 */
export async function getOpenPeriods(): Promise<ReportingPeriod[]> {
  const db = await loadDatabase();
  return db.reportingPeriods.filter((p) => !p.isLocked);
}

/**
 * Récupère toutes les périodes de reporting
 */
export async function getAllPeriods(): Promise<ReportingPeriod[]> {
  const db = await loadDatabase();
  return db.reportingPeriods;
}

/**
 * Vérifie si un rapport existe déjà pour une période et une entité
 */
export async function checkExistingReport(
  periodId: string,
  centerId?: string | null,
  houseChurchId?: string | null
): Promise<Report | null> {
  const db = await loadDatabase();

  const report = db.reports.find(
    (r) =>
      r.periodId === periodId &&
      r.centerId === centerId &&
      r.houseChurchId === houseChurchId
  );

  return report || null;
}

/**
 * Enrichit les rapports avec toutes les données associées
 */
function enrichReports(reports: Report[], db: Database): FullReport[] {
  return reports.map((report) => {
    const statsFinancial = db.statsFinancial?.find((s) => s.reportId === report.id);
    const statsPeople = db.statsPeople?.find((s) => s.reportId === report.id);
    const statsFamily = db.statsFamily?.find((s) => s.reportId === report.id);
    const statsActivities = db.statsActivities?.find((s) => s.reportId === report.id);
    const period = db.reportingPeriods.find((p) => p.id === report.periodId);

    const center = report.centerId
      ? db.centers.find((c) => c.id === report.centerId)
      : undefined;
    const houseChurch = report.houseChurchId
      ? db.houseChurches.find((h) => h.id === report.houseChurchId)
      : undefined;
    const submitter = db.users.find((u) => u.id === report.submittedBy);

    return {
      ...report,
      statsFinancial,
      statsPeople,
      statsFamily,
      statsActivities,
      period,
      centerName: center?.name,
      houseChurchName: houseChurch?.name,
      submitterName: submitter?.fullName,
    };
  });
}

/**
 * Calcule les statistiques globales des rapports
 */
export async function getReportsStatistics() {
  const db = await loadDatabase();

  const totalReports = db.reports.length;
  const approvedReports = db.reports.filter((r) => r.status === 'approved').length;
  const submittedReports = db.reports.filter((r) => r.status === 'submitted').length;
  const rejectedReports = db.reports.filter((r) => r.status === 'rejected').length;
  const draftReports = db.reports.filter((r) => r.status === 'draft').length;

  return {
    totalReports,
    approvedReports,
    submittedReports,
    rejectedReports,
    draftReports,
  };
}

/**
 * Récupère les rapports des house churches d'un centre
 * (Pour les center leaders)
 */
export async function getCenterHouseChurchesReports(centerId: string): Promise<FullReport[]> {
  const db = await loadDatabase();

  // Trouver toutes les house churches de ce centre
  const houseChurches = db.houseChurches.filter((h) => h.centerId === centerId);
  const houseChurchIds = houseChurches.map((h) => h.id);

  // Trouver tous les rapports de ces house churches
  const reports = db.reports.filter(
    (r) => r.houseChurchId && houseChurchIds.includes(r.houseChurchId)
  );

  return enrichReports(reports, db);
}
