import { loadDatabase } from './db';
import type { Database } from '@/types';

// Interface pour un membre
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
 * Récupère tous les membres d'une house church
 */
export async function getHouseChurchMembers(houseChurchId: string): Promise<Member[]> {
  const db = await loadDatabase();

  // Pour l'instant, on retourne un tableau vide car la table members sera créée
  // Elle sera alimentée par le formulaire de sourcing
  const members = (db as any).members || [];

  return members.filter((m: Member) => m.houseChurchId === houseChurchId && m.status === 'active');
}

/**
 * Récupère tous les membres d'un centre
 */
export async function getCenterMembers(centerId: string): Promise<Member[]> {
  const db = await loadDatabase();
  const members = (db as any).members || [];

  return members.filter((m: Member) => m.centerId === centerId && m.status === 'active');
}

/**
 * Récupère tous les membres
 */
export async function getAllMembers(): Promise<Member[]> {
  const db = await loadDatabase();
  const members = (db as any).members || [];
  return members;
}

/**
 * Récupère un membre par son ID
 */
export async function getMemberById(memberId: string): Promise<Member | null> {
  const db = await loadDatabase();
  const members = (db as any).members || [];
  return members.find((m: Member) => m.id === memberId) || null;
}

/**
 * Récupère les contributions d'un membre
 */
export async function getMemberContributions(memberId: string): Promise<MemberContribution[]> {
  const db = await loadDatabase();
  const contributions = (db as any).memberContributions || [];

  return contributions.filter((c: MemberContribution) => c.memberId === memberId);
}

/**
 * Récupère les contributions pour un rapport spécifique
 */
export async function getReportContributions(reportId: string): Promise<MemberContribution[]> {
  const db = await loadDatabase();
  const contributions = (db as any).memberContributions || [];

  return contributions.filter((c: MemberContribution) => c.reportId === reportId);
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
