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

export async function deleteZone(id: string): Promise<{ success: boolean; error?: string }> {
  // Vérifier si la zone a des centres
  const { data: centers } = await supabase
    .from('centers')
    .select('id')
    .eq('zone_id', id);

  if (centers && centers.length > 0) {
    return {
      success: false,
      error: `Impossible de supprimer cette zone. Elle contient ${centers.length} centre(s).`
    };
  }

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

export async function deleteCenter(id: string): Promise<{ success: boolean; error?: string }> {
  // Vérifier si le centre a des house churches
  const { data: houses } = await supabase
    .from('house_churches')
    .select('id')
    .eq('center_id', id);

  if (houses && houses.length > 0) {
    return {
      success: false,
      error: `Impossible de supprimer ce centre. Il contient ${houses.length} cellule(s).`
    };
  }

  // Vérifier si le centre a des membres
  const { data: members } = await supabase
    .from('members')
    .select('id')
    .eq('center_id', id);

  if (members && members.length > 0) {
    return {
      success: false,
      error: `Impossible de supprimer ce centre. Il contient ${members.length} membre(s).`
    };
  }

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

export async function deleteHouseChurch(id: string): Promise<{ success: boolean; error?: string }> {
  // Vérifier si la cellule a des membres
  const { data: members } = await supabase
    .from('members')
    .select('id')
    .eq('house_church_id', id);

  if (members && members.length > 0) {
    return {
      success: false,
      error: `Impossible de supprimer cette cellule. Elle contient ${members.length} membre(s).`
    };
  }

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
