import { supabase } from '../supabase';

// ============================================
// INTERFACES
// ============================================

export interface ReportMarriage {
  id: string;
  report_id: string;
  spouse1_id: string;
  spouse2_id: string;
  marriage_date: string;
  notes: string | null;
  created_at: string;
}

export interface ReportMarriageWithDetails extends ReportMarriage {
  spouse1?: {
    id: string;
    full_name: string;
  };
  spouse2?: {
    id: string;
    full_name: string;
  };
}

export interface ReportBirth {
  id: string;
  report_id: string;
  child_id: string | null;
  father_id: string | null;
  mother_id: string | null;
  birth_date: string;
  notes: string | null;
  created_at: string;
}

export interface ReportBirthWithDetails extends ReportBirth {
  child?: {
    id: string;
    first_name: string;
    gender: 'M' | 'F';
  };
  father?: {
    id: string;
    full_name: string;
  };
  mother?: {
    id: string;
    full_name: string;
  };
}

// ============================================
// MARIAGES
// ============================================

/**
 * Récupère tous les mariages d'un rapport
 */
export async function getReportMarriages(
  reportId: string
): Promise<ReportMarriageWithDetails[]> {
  const { data, error } = await supabase
    .from('report_marriages')
    .select(`
      *,
      spouse1:spouse1_id(id, full_name),
      spouse2:spouse2_id(id, full_name)
    `)
    .eq('report_id', reportId)
    .order('marriage_date', { ascending: false });

  if (error) {
    console.error('Error fetching report marriages:', error);
    return [];
  }

  return data || [];
}

/**
 * Ajoute un mariage à un rapport
 * ⚠️ Déclenche automatiquement la mise à jour des profils membres (trigger)
 */
export async function addReportMarriage(data: {
  report_id: string;
  spouse1_id: string;
  spouse2_id: string;
  marriage_date: string;
  notes?: string;
}): Promise<{ success: boolean; error?: string; marriageId?: string }> {
  // Validation
  if (data.spouse1_id === data.spouse2_id) {
    return { success: false, error: 'Les deux conjoints doivent être différents' };
  }

  const { data: marriage, error } = await supabase
    .from('report_marriages')
    .insert(data)
    .select()
    .single();

  if (error) {
    console.error('Error adding report marriage:', error);
    return { success: false, error: error.message };
  }

  // Le trigger met automatiquement à jour :
  // - members.marriage_date pour les 2 conjoints
  // - members.marital_status = 'married'
  // - stats_family.marriages pour ce rapport

  return { success: true, marriageId: marriage.id };
}

/**
 * Supprime un mariage d'un rapport
 */
export async function deleteReportMarriage(
  marriageId: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('report_marriages')
    .delete()
    .eq('id', marriageId);

  if (error) {
    console.error('Error deleting report marriage:', error);
    return { success: false, error: error.message };
  }

  // Le trigger recalcule automatiquement stats_family.marriages

  return { success: true };
}

// ============================================
// NAISSANCES
// ============================================

/**
 * Récupère toutes les naissances d'un rapport
 */
export async function getReportBirths(
  reportId: string
): Promise<ReportBirthWithDetails[]> {
  const { data, error } = await supabase
    .from('report_births')
    .select(`
      *,
      child:child_id(id, first_name, gender),
      father:father_id(id, full_name),
      mother:mother_id(id, full_name)
    `)
    .eq('report_id', reportId)
    .order('birth_date', { ascending: false });

  if (error) {
    console.error('Error fetching report births:', error);
    return [];
  }

  return data || [];
}

/**
 * Ajoute une naissance à un rapport
 * ⚠️ Crée automatiquement l'enfant dans la table children
 */
export async function addReportBirth(data: {
  report_id: string;
  child_first_name: string;
  child_gender: 'M' | 'F';
  birth_date: string;
  father_id?: string;
  mother_id?: string;
  notes?: string;
}): Promise<{ success: boolean; error?: string; birthId?: string; childId?: string }> {
  try {
    // 1. Créer l'enfant dans la table children
    const childData: any = {
      first_name: data.child_first_name,
      gender: data.child_gender,
      birth_date: data.birth_date,
      father_id: data.father_id || null,
      mother_id: data.mother_id || null,
      status: 'active',
    };

    // Hériter le centre/assemblée du père ou de la mère
    if (data.father_id) {
      const { data: father } = await supabase
        .from('members')
        .select('center_id, house_church_id')
        .eq('id', data.father_id)
        .single();

      if (father) {
        childData.center_id = father.center_id;
        childData.house_church_id = father.house_church_id;
      }
    } else if (data.mother_id) {
      const { data: mother } = await supabase
        .from('members')
        .select('center_id, house_church_id')
        .eq('id', data.mother_id)
        .single();

      if (mother) {
        childData.center_id = mother.center_id;
        childData.house_church_id = mother.house_church_id;
      }
    }

    const { data: child, error: childError } = await supabase
      .from('children')
      .insert(childData)
      .select()
      .single();

    if (childError) {
      console.error('Error creating child:', childError);
      return { success: false, error: childError.message };
    }

    // 2. Créer l'entrée dans report_births
    const { data: birth, error: birthError } = await supabase
      .from('report_births')
      .insert({
        report_id: data.report_id,
        child_id: child.id,
        father_id: data.father_id || null,
        mother_id: data.mother_id || null,
        birth_date: data.birth_date,
        notes: data.notes || null,
      })
      .select()
      .single();

    if (birthError) {
      console.error('Error creating report birth:', birthError);
      return { success: false, error: birthError.message };
    }

    // Le trigger recalcule automatiquement stats_family.births

    return {
      success: true,
      birthId: birth.id,
      childId: child.id,
    };
  } catch (err: any) {
    console.error('Error in addReportBirth:', err);
    return { success: false, error: err.message || 'Erreur inconnue' };
  }
}

/**
 * Supprime une naissance d'un rapport
 * ⚠️ Ne supprime PAS l'enfant de la table children (juste le lien)
 */
export async function deleteReportBirth(
  birthId: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('report_births')
    .delete()
    .eq('id', birthId);

  if (error) {
    console.error('Error deleting report birth:', error);
    return { success: false, error: error.message };
  }

  // Le trigger recalcule automatiquement stats_family.births

  return { success: true };
}

// ============================================
// STATISTIQUES
// ============================================

/**
 * Récupère les statistiques des mariages par année
 */
export async function getMarriagesByYear(): Promise<
  Array<{ year: number; count: number }>
> {
  const { data, error } = await supabase
    .from('report_marriages')
    .select('marriage_date');

  if (error) {
    console.error('Error fetching marriages by year:', error);
    return [];
  }

  const yearMap = new Map<number, number>();
  data.forEach((m) => {
    const year = new Date(m.marriage_date).getFullYear();
    yearMap.set(year, (yearMap.get(year) || 0) + 1);
  });

  return Array.from(yearMap.entries())
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => b.year - a.year);
}

/**
 * Récupère les statistiques des naissances par année
 */
export async function getBirthsByYear(): Promise<
  Array<{ year: number; count: number; boys: number; girls: number }>
> {
  const { data, error } = await supabase
    .from('report_births')
    .select('birth_date, child:child_id(gender)');

  if (error) {
    console.error('Error fetching births by year:', error);
    return [];
  }

  const yearMap = new Map<
    number,
    { count: number; boys: number; girls: number }
  >();

  data.forEach((b: any) => {
    const year = new Date(b.birth_date).getFullYear();
    const current = yearMap.get(year) || { count: 0, boys: 0, girls: 0 };

    current.count++;
    if (b.child?.gender === 'M') current.boys++;
    if (b.child?.gender === 'F') current.girls++;

    yearMap.set(year, current);
  });

  return Array.from(yearMap.entries())
    .map(([year, stats]) => ({ year, ...stats }))
    .sort((a, b) => b.year - a.year);
}
