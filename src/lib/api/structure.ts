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
