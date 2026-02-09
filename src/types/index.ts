// Types pour les utilisateurs et l'authentification
export type UserRole = 'admin' | 'center_lead' | 'house_lead' | 'viewer';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  center_id: string | null;
  house_church_id: string | null;
  avatar?: string;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

// Types pour la structure organisationnelle
export interface Zone {
  id: string;
  name: string;
  region: string;
  created_at: string;
}

export interface Center {
  id: string;
  name: string;
  zone_id: string;
  address: string;
  founded_date: string;
  status: 'active' | 'inactive';
  latitude?: number;
  longitude?: number;
  created_at: string;
}

export interface HouseChurch {
  id: string;
  name: string;
  center_id: string;
  zone_area: string;
  host_name: string;
  status: 'active' | 'inactive';
  latitude?: number;
  longitude?: number;
  created_at: string;
}

// Types pour le reporting
export type ReportStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

export interface ReportingPeriod {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_locked: boolean;
  fiscal_year: number;
}

export interface Report {
  id: string;
  period_id: string;
  center_id: string | null;
  house_church_id: string | null;
  submitted_by: string;
  submitted_at: string | null;
  status: ReportStatus;
}

export interface StatsFinancial {
  report_id: string;
  currency: string;
  tithes: number;
  offerings_general: number;
  offerings_events: number;
  offerings_investment: number;
  expense_admin: number;
  expense_rent: number;
  expense_mission: number;
  expense_events: number;
  notes: string | null;
}

export interface StatsPeople {
  report_id: string;
  attendance_men: number;
  attendance_women: number;
  attendance_children: number;
  attendance_total: number;
  new_converts: number;
  first_timers: number;
  baptisms: number;
  members_active_start: number;
  members_gained: number;
  members_lost: number;
  members_active_end: number;
}

export interface StatsFamily {
  report_id: string;
  marriages: number;
  engagements: number;
  births: number;
  couples_counseled: number;
}

export interface StatsActivities {
  report_id: string;
  people_trained: number;
  pastors_certified: number;
  social_actions_count: number;
  meals_distributed: number;
  youth_mentored: number;
  home_visits: number;
  evangelism_outreach_count: number;
}

// Types pour le sourcing
export type SourcingCampaignStatus = 'active' | 'closed';
export type SourcingResponseStatus = 'new' | 'treated' | 'verified' | 'rejected';

export interface SourcingCampaign {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  status: SourcingCampaignStatus;
  type: string;
  center_ids: string[];
  unique_link: string;
  qr_code: string;
  fields: string[];
  responses_count: number;
  created_at: string;
  created_by: string;
}

export interface SourcingResponse {
  id: string;
  campaign_id: string;
  submitted_at: string;
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
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  action_url?: string;
}

// Types pour les logs d'audit
export interface AuditLog {
  id: string;
  table_name: string;
  record_id: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  old_data: Record<string, any> | null;
  new_data: Record<string, any> | null;
  performed_by: string;
  performed_at: string;
}

// Type pour la base de données complète
export interface Database {
  users: User[];
  zones: Zone[];
  centers: Center[];
  house_churches: HouseChurch[];
  reporting_periods: ReportingPeriod[];
  reports: Report[];
  stats_financial: StatsFinancial[];
  stats_people: StatsPeople[];
  stats_family: StatsFamily[];
  stats_activities: StatsActivities[];
  sourcing_campaigns: SourcingCampaign[];
  sourcing_responses: SourcingResponse[];
  notifications: Notification[];
  audit_logs: AuditLog[];
}
