import { supabase } from '../supabase';

export interface MemberStatusHistory {
  id: string;
  member_id: string;
  old_status: string | null;
  new_status: string;
  change_date: string;
  reason: 'death' | 'relocation' | 'left_church' | 'discipline' | 'other' | null;
  notes: string | null;
  changed_by: string | null;
  created_at: string;
}

export interface MemberStatusHistoryWithDetails extends MemberStatusHistory {
  member?: {
    id: string;
    full_name: string;
  };
  changed_by_user?: {
    id: string;
    full_name: string;
  };
}

/**
 * Récupère l'historique des changements de statut d'un membre
 */
export async function getMemberStatusHistory(
  memberId: string
): Promise<MemberStatusHistoryWithDetails[]> {
  const { data, error } = await supabase
    .from('member_status_history')
    .select(`
      *,
      member:member_id(id, full_name),
      changed_by_user:changed_by(id, full_name)
    `)
    .eq('member_id', memberId)
    .order('change_date', { ascending: false });

  if (error) {
    console.error('Error fetching member status history:', error);
    return [];
  }

  return data || [];
}

/**
 * Enregistre un changement de statut
 */
export async function recordStatusChange(data: {
  member_id: string;
  old_status: string | null;
  new_status: string;
  change_date: string;
  reason?: 'death' | 'relocation' | 'left_church' | 'discipline' | 'other';
  notes?: string;
  changed_by?: string;
}): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('member_status_history')
    .insert(data);

  if (error) {
    console.error('Error recording status change:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Récupère tous les départs (membres lost) avec raisons
 */
export async function getAllDepartures(): Promise<MemberStatusHistoryWithDetails[]> {
  const { data, error } = await supabase
    .from('member_status_history')
    .select(`
      *,
      member:member_id(id, full_name),
      changed_by_user:changed_by(id, full_name)
    `)
    .in('new_status', ['inactive', 'relocated', 'deceased'])
    .order('change_date', { ascending: false });

  if (error) {
    console.error('Error fetching departures:', error);
    return [];
  }

  return data || [];
}

/**
 * Récupère les statistiques des départs par raison
 */
export async function getDepartureStats(): Promise<{
  total: number;
  byReason: Record<string, number>;
}> {
  const { data, error } = await supabase
    .from('member_status_history')
    .select('reason')
    .in('new_status', ['inactive', 'relocated', 'deceased']);

  if (error) {
    console.error('Error fetching departure stats:', error);
    return { total: 0, byReason: {} };
  }

  const byReason: Record<string, number> = {};
  data.forEach((item) => {
    const reason = item.reason || 'unknown';
    byReason[reason] = (byReason[reason] || 0) + 1;
  });

  return {
    total: data.length,
    byReason,
  };
}
