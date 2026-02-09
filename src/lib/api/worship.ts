import { supabase } from '../supabase';

// Interface pour un rapport de culte
export interface WorshipAttendance {
  id: string;
  worship_date: string;
  center_id: string;
  house_church_id: string | null;
  men_count: number;
  women_count: number;
  children_count: number;
  total_count: number;
  notes: string | null;
  submitted_by: string;
  created_at: string;
  updated_at: string;
}

// Interface étendue avec noms
export interface WorshipAttendanceWithDetails extends WorshipAttendance {
  center_name?: string;
  house_church_name?: string;
  submitter_name?: string;
}

/**
 * Récupérer tous les rapports de culte (avec filtres optionnels)
 */
export async function getWorshipAttendance(filters?: {
  centerId?: string;
  houseChurchId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<WorshipAttendanceWithDetails[]> {
  let query = supabase
    .from('worship_attendance')
    .select(`
      *,
      centers(name),
      house_churches(name),
      profiles:submitted_by(full_name)
    `)
    .order('worship_date', { ascending: false });

  if (filters?.centerId) {
    query = query.eq('center_id', filters.centerId);
  }

  if (filters?.houseChurchId) {
    query = query.eq('house_church_id', filters.houseChurchId);
  }

  if (filters?.startDate) {
    query = query.gte('worship_date', filters.startDate);
  }

  if (filters?.endDate) {
    query = query.lte('worship_date', filters.endDate);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching worship attendance:', error);
    return [];
  }

  return (data || []).map((item: any) => ({
    ...item,
    center_name: item.centers?.name,
    house_church_name: item.house_churches?.name,
    submitter_name: item.profiles?.full_name,
  }));
}

/**
 * Récupérer les rapports de culte selon le rôle de l'utilisateur
 */
export async function getUserWorshipAttendance(userId: string): Promise<WorshipAttendanceWithDetails[]> {
  // Récupérer le profil utilisateur
  const { data: user, error: userError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (userError || !user) {
    console.error('Error fetching user profile:', userError);
    return [];
  }

  // Admin : tous les rapports
  if (user.role === 'admin') {
    return getWorshipAttendance();
  }

  // Center Lead : rapports de son centre
  if (user.role === 'center_lead' && user.center_id) {
    return getWorshipAttendance({ centerId: user.center_id });
  }

  // House Lead : rapports de son assemblée
  if (user.role === 'house_lead' && user.house_church_id) {
    return getWorshipAttendance({ houseChurchId: user.house_church_id });
  }

  return [];
}

/**
 * Créer un rapport de culte
 */
export async function createWorshipAttendance(data: {
  worship_date: string;
  center_id: string;
  house_church_id?: string;
  men_count: number;
  women_count: number;
  children_count: number;
  notes?: string;
  submitted_by: string;
}): Promise<{ success: boolean; error?: string; id?: string }> {
  // Vérifier si un rapport existe déjà pour cette date et ce centre/assemblée
  const existingQuery = supabase
    .from('worship_attendance')
    .select('id')
    .eq('worship_date', data.worship_date)
    .eq('center_id', data.center_id);

  if (data.house_church_id) {
    existingQuery.eq('house_church_id', data.house_church_id);
  } else {
    existingQuery.is('house_church_id', null);
  }

  const { data: existing } = await existingQuery.single();

  if (existing) {
    return {
      success: false,
      error: 'Un rapport existe déjà pour ce culte',
    };
  }

  // Créer le rapport
  const { data: created, error } = await supabase
    .from('worship_attendance')
    .insert({
      worship_date: data.worship_date,
      center_id: data.center_id,
      house_church_id: data.house_church_id || null,
      men_count: data.men_count,
      women_count: data.women_count,
      children_count: data.children_count,
      notes: data.notes || null,
      submitted_by: data.submitted_by,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating worship attendance:', error);
    return { success: false, error: error.message };
  }

  return { success: true, id: created.id };
}

/**
 * Mettre à jour un rapport de culte
 */
export async function updateWorshipAttendance(
  id: string,
  data: {
    men_count?: number;
    women_count?: number;
    children_count?: number;
    notes?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('worship_attendance')
    .update(data)
    .eq('id', id);

  if (error) {
    console.error('Error updating worship attendance:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Supprimer un rapport de culte
 */
export async function deleteWorshipAttendance(id: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('worship_attendance')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting worship attendance:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Obtenir les statistiques pour une période
 */
export async function getWorshipStats(filters?: {
  centerId?: string;
  houseChurchId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<{
  total_services: number;
  avg_men: number;
  avg_women: number;
  avg_children: number;
  avg_total: number;
  total_attendance: number;
}> {
  const attendances = await getWorshipAttendance(filters);

  if (attendances.length === 0) {
    return {
      total_services: 0,
      avg_men: 0,
      avg_women: 0,
      avg_children: 0,
      avg_total: 0,
      total_attendance: 0,
    };
  }

  const totals = attendances.reduce(
    (acc, curr) => ({
      men: acc.men + curr.men_count,
      women: acc.women + curr.women_count,
      children: acc.children + curr.children_count,
      total: acc.total + curr.total_count,
    }),
    { men: 0, women: 0, children: 0, total: 0 }
  );

  return {
    total_services: attendances.length,
    avg_men: Math.round(totals.men / attendances.length),
    avg_women: Math.round(totals.women / attendances.length),
    avg_children: Math.round(totals.children / attendances.length),
    avg_total: Math.round(totals.total / attendances.length),
    total_attendance: totals.total,
  };
}

/**
 * Obtenir les dimanches d'un mois
 */
export function getSundaysInMonth(year: number, month: number): Date[] {
  const sundays: Date[] = [];
  const date = new Date(year, month - 1, 1);

  while (date.getMonth() === month - 1) {
    if (date.getDay() === 0) {
      // 0 = Dimanche
      sundays.push(new Date(date));
    }
    date.setDate(date.getDate() + 1);
  }

  return sundays;
}

/**
 * Vérifier si une date est un dimanche
 */
export function isSunday(date: string | Date): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.getDay() === 0;
}
