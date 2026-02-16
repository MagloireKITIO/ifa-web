import { supabase } from '../supabase';
import type { Center, HouseChurch, Zone, User } from '@/types';

export async function getCenters(): Promise<Center[]> {
  const { data, error } = await supabase
    .from('centers')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching centers:', error);
    return [];
  }

  return data || [];
}

export async function getZones(): Promise<Zone[]> {
  const { data, error } = await supabase
    .from('zones')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching zones:', error);
    return [];
  }

  return data || [];
}

export async function getHouseChurches(): Promise<HouseChurch[]> {
  const { data, error } = await supabase
    .from('house_churches')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching house churches:', error);
    return [];
  }

  return data || [];
}

export async function getCenterById(id: string): Promise<Center | null> {
  const { data, error } = await supabase
    .from('centers')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching center by id:', error);
    return null;
  }

  return data;
}

export async function getHouseChurchesByCenter(centerId: string): Promise<HouseChurch[]> {
  const { data, error } = await supabase
    .from('house_churches')
    .select('*')
    .eq('center_id', centerId)
    .order('name');

  if (error) {
    console.error('Error fetching house churches by center:', error);
    return [];
  }

  return data || [];
}

export async function getCenterLeader(centerId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'center_lead')
    .eq('center_id', centerId)
    .single();

  if (error) {
    // It's possible no leader is assigned, not necessarily an error
    return null;
  }

  return data as User;
}

// ============================================
// CREATE OPERATIONS
// ============================================

export async function createZone(zoneData: Omit<Zone, 'id' | 'created_at'>): Promise<Zone | null> {
  const { data, error } = await supabase
    .from('zones')
    .insert([zoneData])
    .select()
    .single();

  if (error) {
    console.error('Error creating zone:', error);
    return null;
  }

  return data;
}

export async function createCenter(centerData: Omit<Center, 'id' | 'created_at'>): Promise<Center | null> {
  const { data, error } = await supabase
    .from('centers')
    .insert([centerData])
    .select()
    .single();

  if (error) {
    console.error('Error creating center:', error);
    return null;
  }

  return data;
}

export async function createHouseChurch(houseData: Omit<HouseChurch, 'id' | 'created_at'>): Promise<HouseChurch | null> {
  const { data, error } = await supabase
    .from('house_churches')
    .insert([houseData])
    .select()
    .single();

  if (error) {
    console.error('Error creating house church:', error);
    return null;
  }

  return data;
}

// ============================================
// UPDATE OPERATIONS
// ============================================

export async function updateZone(id: string, updates: Partial<Omit<Zone, 'id' | 'created_at'>>): Promise<Zone | null> {
  const { data, error } = await supabase
    .from('zones')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating zone:', error);
    return null;
  }

  return data;
}

export async function updateCenter(id: string, updates: Partial<Omit<Center, 'id' | 'created_at'>>): Promise<Center | null> {
  const { data, error } = await supabase
    .from('centers')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating center:', error);
    return null;
  }

  return data;
}

export async function updateHouseChurch(id: string, updates: Partial<Omit<HouseChurch, 'id' | 'created_at'>>): Promise<HouseChurch | null> {
  const { data, error } = await supabase
    .from('house_churches')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating house church:', error);
    return null;
  }

  return data;
}

// ============================================
// DELETE OPERATIONS (avec validations)
// ============================================

export async function deleteZone(id: string, cascade: boolean = false): Promise<{ success: boolean; error?: string; centersCount?: number }> {
  // Vérifier si la zone a des centres
  const { data: centers } = await supabase
    .from('centers')
    .select('id')
    .eq('zone_id', id);

  const centersCount = centers?.length || 0;

  // Si pas en mode cascade, retourner seulement les infos sans supprimer
  if (!cascade) {
    return {
      success: false,
      centersCount,
      error: centersCount > 0
        ? `Cette zone contient ${centersCount} centre(s).`
        : 'Vérification effectuée'
    };
  }

  // Mode cascade : supprimer tous les centres (qui géreront leurs propres dépendances)
  if (centersCount > 0) {
    for (const center of centers || []) {
      const result = await deleteCenter(center.id, true);
      if (!result.success) {
        return { success: false, error: `Erreur lors de la suppression du centre: ${result.error}` };
      }
    }
  }

  // Supprimer la zone
  const { error } = await supabase
    .from('zones')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting zone:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function deleteCenter(id: string, cascade: boolean = false): Promise<{ success: boolean; error?: string; housesCount?: number; membersCount?: number; profilesCount?: number; childrenCount?: number; reportsCount?: number }> {
  // Vérifier toutes les tables qui référencent center_id
  const [houses, members, profiles, children, reports] = await Promise.all([
    supabase.from('house_churches').select('id').eq('center_id', id),
    supabase.from('members').select('id').eq('center_id', id),
    supabase.from('profiles').select('id').eq('center_id', id),
    supabase.from('children').select('id').eq('center_id', id),
    supabase.from('reports').select('id').eq('center_id', id),
  ]);

  const housesCount = houses.data?.length || 0;
  const membersCount = members.data?.length || 0;
  const profilesCount = profiles.data?.length || 0;
  const childrenCount = children.data?.length || 0;
  const reportsCount = reports.data?.length || 0;

  const totalCount = housesCount + membersCount + profilesCount + childrenCount + reportsCount;

  // Si pas en mode cascade, retourner seulement les infos sans supprimer
  if (!cascade) {
    return {
      success: false,
      housesCount,
      membersCount,
      profilesCount,
      childrenCount,
      reportsCount,
      error: totalCount > 0
        ? `Ce centre a des dépendances (${housesCount} cellules, ${membersCount} membres, ${profilesCount} profils, ${childrenCount} enfants, ${reportsCount} rapports).`
        : 'Vérification effectuée'
    };
  }

  // Mode cascade : supprimer en cascade
  // 1. Supprimer toutes les cellules du centre (qui gèrera leurs propres dépendances)
  if (housesCount > 0) {
    for (const house of houses.data || []) {
      const result = await deleteHouseChurch(house.id, true);
      if (!result.success) {
        return { success: false, error: `Erreur lors de la suppression de la cellule: ${result.error}` };
      }
    }
  }

  // 2. Mettre à NULL toutes les références directes au centre
  const updates = await Promise.all([
    supabase.from('members').update({ center_id: null }).eq('center_id', id),
    supabase.from('profiles').update({ center_id: null }).eq('center_id', id),
    supabase.from('children').update({ center_id: null }).eq('center_id', id),
    supabase.from('reports').update({ center_id: null }).eq('center_id', id),
  ]);

  // Vérifier les erreurs
  const errors = updates.filter(u => u.error);
  if (errors.length > 0) {
    console.error('Error updating references:', errors);
    return { success: false, error: 'Erreur lors de la mise à jour des références' };
  }

  // 3. Supprimer le centre
  const { error } = await supabase
    .from('centers')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting center:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function deleteHouseChurch(id: string, cascade: boolean = false): Promise<{ success: boolean; error?: string; membersCount?: number; profilesCount?: number; childrenCount?: number; reportsCount?: number; contributionsCount?: number }> {
  // Vérifier toutes les tables qui référencent house_church_id
  const [members, profiles, children, reports, contributions] = await Promise.all([
    supabase.from('members').select('id').eq('house_church_id', id),
    supabase.from('profiles').select('id').eq('house_church_id', id),
    supabase.from('children').select('id').eq('house_church_id', id),
    supabase.from('reports').select('id').eq('house_church_id', id),
    supabase.from('member_contributions').select('id').eq('house_church_id', id),
  ]);

  const membersCount = members.data?.length || 0;
  const profilesCount = profiles.data?.length || 0;
  const childrenCount = children.data?.length || 0;
  const reportsCount = reports.data?.length || 0;
  const contributionsCount = contributions.data?.length || 0;

  const totalCount = membersCount + profilesCount + childrenCount + reportsCount + contributionsCount;

  // Si pas en mode cascade, retourner seulement les infos sans supprimer
  if (!cascade) {
    return {
      success: false,
      membersCount,
      profilesCount,
      childrenCount,
      reportsCount,
      contributionsCount,
      error: totalCount > 0
        ? `Cette cellule a des dépendances (${membersCount} membres, ${profilesCount} profils, ${childrenCount} enfants, ${reportsCount} rapports, ${contributionsCount} contributions).`
        : 'Vérification effectuée'
    };
  }

  // Mode cascade : mettre à NULL toutes les références avant suppression
  const updates = await Promise.all([
    supabase.from('members').update({ house_church_id: null }).eq('house_church_id', id),
    supabase.from('profiles').update({ house_church_id: null }).eq('house_church_id', id),
    supabase.from('children').update({ house_church_id: null }).eq('house_church_id', id),
    supabase.from('reports').update({ house_church_id: null }).eq('house_church_id', id),
    supabase.from('member_contributions').update({ house_church_id: null }).eq('house_church_id', id),
  ]);

  // Vérifier les erreurs
  const errors = updates.filter(u => u.error);
  if (errors.length > 0) {
    console.error('Error updating references:', errors);
    return { success: false, error: 'Erreur lors de la mise à jour des références' };
  }

  // Supprimer la cellule
  const { error } = await supabase
    .from('house_churches')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting house church:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
