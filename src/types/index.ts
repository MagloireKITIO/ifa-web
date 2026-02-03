// Types pour les utilisateurs et l'authentification
export type UserRole = 'admin' | 'center_lead' | 'house_lead' | 'viewer';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  centerId: string | null;
  houseChurchId: string | null;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

// Types pour la structure organisationnelle
export interface Zone {
  id: string;
  name: string;
  region: string;
  createdAt: string;
}

export interface Center {
  id: string;
  name: string;
  zoneId: string;
  address: string;
  foundedDate: string;
  status: 'active' | 'inactive';
  latitude?: number;
  longitude?: number;
  createdAt: string;
}

export interface HouseChurch {
  id: string;
  name: string;
  centerId: string;
  zoneArea: string;
  hostName: string;
  status: 'active' | 'inactive';
  latitude?: number;
  longitude?: number;
  createdAt: string;
}

// Types pour le reporting
export type ReportStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

export interface ReportingPeriod {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isLocked: boolean;
  fiscalYear: number;
}

export interface Report {
  id: string;
  periodId: string;
  centerId: string | null;
  houseChurchId: string | null;
  submittedBy: string;
  submittedAt: string | null;
  status: ReportStatus;
}

export interface StatsFinancial {
  reportId: string;
  currency: string;
  tithes: number;
  offeringsGeneral: number;
  offeringsEvents: number;
  offeringsInvestment: number;
  expenseAdmin: number;
  expenseRent: number;
  expenseMission: number;
  expenseEvents: number;
  notes: string | null;
}

export interface StatsPeople {
  reportId: string;
  attendanceMen: number;
  attendanceWomen: number;
  attendanceChildren: number;
  attendanceTotal: number;
  newConverts: number;
  firstTimers: number;
  baptisms: number;
  membersActiveStart: number;
  membersGained: number;
  membersLost: number;
  membersActiveEnd: number;
}

export interface StatsFamily {
  reportId: string;
  marriages: number;
  engagements: number;
  births: number;
  couplesCounseled: number;
}

export interface StatsActivities {
  reportId: string;
  peopleTrained: number;
  pastorsCertified: number;
  socialActionsCount: number;
  mealsDistributed: number;
  youthMentored: number;
  homeVisits: number;
  evangelismOutreachCount: number;
}

// Types pour le sourcing
export type SourcingCampaignStatus = 'active' | 'closed';
export type SourcingResponseStatus = 'new' | 'treated' | 'verified' | 'rejected';

export interface SourcingCampaign {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: SourcingCampaignStatus;
  type: string;
  centerIds: string[];
  uniqueLink: string;
  qrCode: string;
  fields: string[];
  responsesCount: number;
  createdAt: string;
  createdBy: string;
}

export interface SourcingResponse {
  id: string;
  campaignId: string;
  submittedAt: string;
  status: SourcingResponseStatus;
  data: Record<string, any>;
}

// Types pour les notifications
export type NotificationType =
  | 'period_opened'
  | 'reminder'
  | 'report_approved'
  | 'report_rejected'
  | 'sourcing_response'
  | 'comment'
  | 'system';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
}

// Types pour les logs d'audit
export interface AuditLog {
  id: string;
  tableName: string;
  recordId: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  oldData: Record<string, any> | null;
  newData: Record<string, any> | null;
  performedBy: string;
  performedAt: string;
}

// Type pour la base de données complète
export interface Database {
  users: User[];
  zones: Zone[];
  centers: Center[];
  houseChurches: HouseChurch[];
  reportingPeriods: ReportingPeriod[];
  reports: Report[];
  statsFinancial: StatsFinancial[];
  statsPeople: StatsPeople[];
  statsFamily: StatsFamily[];
  statsActivities: StatsActivities[];
  sourcingCampaigns: SourcingCampaign[];
  sourcingResponses: SourcingResponse[];
  notifications: Notification[];
  auditLogs: AuditLog[];
}
