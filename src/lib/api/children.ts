import { supabase } from '../supabase';

export interface Child {
  id: string;
  first_name: string;
  gender: 'M' | 'F';
  birth_date: string;
  father_id: string | null;
  mother_id: string | null;
  center_id: string | null;
  house_church_id: string | null;
  is_baptized: boolean;
  baptism_date: string | null;
  status: 'active' | 'deceased' | 'moved';
  notes: string | null;
  created_at: string;
}

export interface ChildWithParents extends Child {
  father?: {
    id: string;
    full_name: string;
  };
  mother?: {
    id: string;
    full_name: string;
  };
}

/**
 * Récupère tous les enfants actifs
 */
export async function getAllChildren(): Promise<ChildWithParents[]> {
  const { data, error } = await supabase
    .from('children')
    .select(`
      *,
      father:father_id(id, full_name),
      mother:mother_id(id, full_name)
    `)
    .eq('status', 'active')
    .order('birth_date', { ascending: false });

  if (error) {
    console.error('Error fetching children:', error);
    return [];
  }

  return data || [];
}

/**
 * Récupère les enfants d'un parent spécifique
 */
export async function getChildrenByParent(parentId: string): Promise<Child[]> {
  const { data, error } = await supabase
    .from('children')
    .select('*')
    .or(`father_id.eq.${parentId},mother_id.eq.${parentId}`)
    .eq('status', 'active')
    .order('birth_date', { ascending: false });

  if (error) {
    console.error('Error fetching children by parent:', error);
    return [];
  }

  return data || [];
}

/**
 * Récupère les enfants d'un centre
 */
export async function getChildrenByCenter(centerId: string): Promise<ChildWithParents[]> {
  const { data, error } = await supabase
    .from('children')
    .select(`
      *,
      father:father_id(id, full_name),
      mother:mother_id(id, full_name)
    `)
    .eq('center_id', centerId)
    .eq('status', 'active')
    .order('birth_date', { ascending: false });

  if (error) {
    console.error('Error fetching children by center:', error);
    return [];
  }

  return data || [];
}

/**
 * Crée un nouvel enfant
 */
export async function createChild(
  childData: Omit<Child, 'id' | 'created_at'>
): Promise<{ success: boolean; error?: string; childId?: string }> {
  const { data, error } = await supabase
    .from('children')
    .insert(childData)
    .select()
    .single();

  if (error) {
    console.error('Error creating child:', error);
    return { success: false, error: error.message };
  }

  return { success: true, childId: data.id };
}

/**
 * Met à jour un enfant
 */
export async function updateChild(
  childId: string,
  updates: Partial<Omit<Child, 'id' | 'created_at'>>
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('children')
    .update(updates)
    .eq('id', childId);

  if (error) {
    console.error('Error updating child:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Supprime un enfant (soft delete en changeant le status)
 */
export async function deleteChild(
  childId: string,
  reason: 'deceased' | 'moved'
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('children')
    .update({ status: reason })
    .eq('id', childId);

  if (error) {
    console.error('Error deleting child:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Récupère les statistiques des enfants
 */
export async function getChildrenStats(): Promise<{
  total: number;
  boys: number;
  girls: number;
  familiesWithChildren: number;
}> {
  const { data, error } = await supabase
    .from('kpi_children_summary')
    .select('*')
    .single();

  if (error) {
    console.error('Error fetching children stats:', error);
    return { total: 0, boys: 0, girls: 0, familiesWithChildren: 0 };
  }

  return {
    total: data.total_children || 0,
    boys: data.boys_count || 0,
    girls: data.girls_count || 0,
    familiesWithChildren: data.families_with_children || 0,
  };
}

/**
 * Récupère les naissances de l'année en cours
 */
export async function getBirthsCurrentYear(): Promise<{
  total: number;
  boys: number;
  girls: number;
}> {
  const { data, error } = await supabase
    .from('kpi_births_current_year')
    .select('*')
    .single();

  if (error) {
    console.error('Error fetching births current year:', error);
    return { total: 0, boys: 0, girls: 0 };
  }

  return {
    total: data.total_births || 0,
    boys: data.boys || 0,
    girls: data.girls || 0,
  };
}
