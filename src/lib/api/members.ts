import { supabase } from '../supabase';
import type { Database } from '@/types';

// Interface pour un membre (Frontend)
export interface Member {
  id: string;
  fullName: string;
  email: string | null;
  phone: string;
  gender: 'Homme' | 'Femme';
  birthDate: string;
  address: string | null;
  maritalStatus: string | null;
  hasChildren: boolean;
  numberOfChildren: number | null;
  houseChurchId: string;
  centerId: string;
  spiritualStatus: 'Membre' | 'Visiteur' | 'Nouveau Converti';
  isBaptized: boolean;
  baptismDate: string | null;
  joinedDate: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

// Interface pour une contribution de membre
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

// Interface pour les statistiques de contribution d'un membre
export interface MemberContributionStats {
  memberId: string;
  memberName: string;
  totalContributions: number;
  averageAmount: number;
  monthsContributed: number;
  totalMonths: number;
  faithfulnessPercentage: number;
  lastContributionDate: string | null;
  contributions: MemberContribution[];
}

/**
 * Helper function to map DB member to Frontend Member
 */
function mapMemberFromDB(dbMember: any): Member {
  return {
    id: dbMember.id,
    fullName: dbMember.full_name,
    email: null, // Not in DB
    phone: dbMember.phone || '',
    gender: 'Homme', // Default as missing in DB
    birthDate: dbMember.birth_year ? `${dbMember.birth_year}-01-01` : '',
    address: null, // Not in DB
    maritalStatus: dbMember.marriage_date ? 'Marié(e)' : 'Célibataire',
    hasChildren: false, // Not in DB
    numberOfChildren: null, // Not in DB
    houseChurchId: dbMember.house_church_id,
    centerId: dbMember.center_id,
    spiritualStatus: 'Membre', // Default
    isBaptized: dbMember.is_baptized,
    baptismDate: null, // Not in DB
    joinedDate: dbMember.joined_ifa_year ? `${dbMember.joined_ifa_year}-01-01` : new Date().toISOString(),
    status: dbMember.status as 'active' | 'inactive',
    createdAt: dbMember.created_at,
    updatedAt: dbMember.created_at, // No updated_at in DB
  };
}

/**
 * Helper function to map DB contribution to Frontend Contribution
 */
function mapContributionFromDB(dbContrib: any): MemberContribution {
  return {
    id: dbContrib.id,
    reportId: dbContrib.report_id,
    memberId: dbContrib.member_id,
    periodId: dbContrib.period_id,
    houseChurchId: dbContrib.house_church_id,
    contributionType: dbContrib.contribution_type as 'tithe' | 'offering' | 'special',
    amount: dbContrib.amount,
    currency: dbContrib.currency,
    recordedBy: dbContrib.recorded_by,
    recordedAt: dbContrib.recorded_at,
  };
}

/**
 * Récupère tous les membres d'une house church
 */
export async function getHouseChurchMembers(houseChurchId: string): Promise<Member[]> {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('house_church_id', houseChurchId)
    .eq('status', 'active');

  if (error) {
    console.error('Error fetching house church members:', error);
    return [];
  }

  return (data || []).map(mapMemberFromDB);
}

/**
 * Récupère tous les membres d'un centre
 */
export async function getCenterMembers(centerId: string): Promise<Member[]> {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('center_id', centerId)
    .eq('status', 'active');

  if (error) {
    console.error('Error fetching center members:', error);
    return [];
  }

  return (data || []).map(mapMemberFromDB);
}

/**
 * Récupère tous les membres
 */
export async function getAllMembers(): Promise<Member[]> {
  const { data, error } = await supabase
    .from('members')
    .select('*');

  if (error) {
    console.error('Error fetching all members:', error);
    return [];
  }

  return (data || []).map(mapMemberFromDB);
}

/**
 * Récupère un membre par son ID
 */
export async function getMemberById(memberId: string): Promise<Member | null> {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('id', memberId)
    .single();

  if (error) {
    console.error('Error fetching member by id:', error);
    return null;
  }

  return data ? mapMemberFromDB(data) : null;
}

/**
 * Récupère les contributions d'un membre
 */
export async function getMemberContributions(memberId: string): Promise<MemberContribution[]> {
  const { data, error } = await supabase
    .from('member_contributions')
    .select('*')
    .eq('member_id', memberId);

  if (error) {
    console.error('Error fetching member contributions:', error);
    return [];
  }

  return (data || []).map(mapContributionFromDB);
}

/**
 * Récupère les contributions pour un rapport spécifique
 */
export async function getReportContributions(reportId: string): Promise<MemberContribution[]> {
  const { data, error } = await supabase
    .from('member_contributions')
    .select('*')
    .eq('report_id', reportId);

  if (error) {
    console.error('Error fetching report contributions:', error);
    return [];
  }

  return (data || []).map(mapContributionFromDB);
}

/**
 * Calcule les statistiques de contribution d'un membre
 */
export async function getMemberContributionStats(
  memberId: string,
  months: number = 12
): Promise<MemberContributionStats | null> {
  const member = await getMemberById(memberId);
  if (!member) return null;

  const contributions = await getMemberContributions(memberId);

  // Filtrer les contributions des X derniers mois
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - months);

  const recentContributions = contributions.filter(
    (c) => new Date(c.recordedAt) >= cutoffDate
  );

  const totalAmount = recentContributions.reduce((sum, c) => sum + c.amount, 0);
  const monthsContributed = new Set(
    recentContributions.map((c) => {
      const date = new Date(c.recordedAt);
      return `${date.getFullYear()}-${date.getMonth()}`;
    })
  ).size;

  const faithfulnessPercentage = (monthsContributed / months) * 100;

  const lastContribution = recentContributions.sort(
    (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
  )[0];

  return {
    memberId,
    memberName: member.fullName,
    totalContributions: totalAmount,
    averageAmount: recentContributions.length > 0 ? totalAmount / recentContributions.length : 0,
    monthsContributed,
    totalMonths: months,
    faithfulnessPercentage,
    lastContributionDate: lastContribution ? lastContribution.recordedAt : null,
    contributions: recentContributions,
  };
}

/**
 * Récupère les statistiques de tous les membres d'une house church
 */
export async function getHouseChurchMembersStats(
  houseChurchId: string,
  months: number = 12
): Promise<MemberContributionStats[]> {
  const members = await getHouseChurchMembers(houseChurchId);

  const stats = await Promise.all(
    members.map((m) => getMemberContributionStats(m.id, months))
  );

  return stats.filter((s) => s !== null) as MemberContributionStats[];
}

/**
 * Identifie les membres nécessitant un suivi pastoral
 * (n'ayant pas contribué depuis X mois)
 */
export async function getMembersNeedingFollowUp(
  houseChurchId: string,
  monthsThreshold: number = 3
): Promise<Member[]> {
  const members = await getHouseChurchMembers(houseChurchId);
  const stats = await getHouseChurchMembersStats(houseChurchId, monthsThreshold);

  const membersNeedingFollowUp: Member[] = [];

  for (const member of members) {
    const memberStats = stats.find((s) => s.memberId === member.id);
    if (!memberStats || memberStats.monthsContributed === 0) {
      membersNeedingFollowUp.push(member);
    }
  }

  return membersNeedingFollowUp;
}
