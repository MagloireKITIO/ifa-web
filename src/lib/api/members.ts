import { supabase } from '../supabase';

export interface Member {
  id: string;
  full_name: string;
  phone: string;
  birth_year: number;
  conversion_year: number;
  joined_ifa_year: number;
  is_baptized: boolean;
  marriage_date: string | null;
  center_id: string;
  house_church_id: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

export async function getMembersByCenter(centerId: string): Promise<Member[]> {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('center_id', centerId)
    .order('full_name');

  if (error) {
    console.error('Error fetching members by center:', error);
    return [];
  }

  return data || [];
}

export async function getMembersByHouseChurch(houseChurchId: string): Promise<Member[]> {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('house_church_id', houseChurchId)
    .order('full_name');

  if (error) {
    console.error('Error fetching members by house church:', error);
    return [];
  }

  return data || [];
}

export async function getUnassignedMembers(centerId: string): Promise<Member[]> {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('center_id', centerId)
    .is('house_church_id', null)
    .order('full_name');

  if (error) {
    console.error('Error fetching unassigned members:', error);
    return [];
  }

  return data || [];
}

export async function assignMemberToHouseChurch(memberId: string, houseChurchId: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('members')
    .update({ house_church_id: houseChurchId })
    .eq('id', memberId);

  if (error) {
    console.error('Error assigning member:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function removeMemberFromHouseChurch(memberId: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('members')
    .update({ house_church_id: null })
    .eq('id', memberId);

  if (error) {
    console.error('Error removing member:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// Alias pour getHouseChurchMembers (utilisé dans MemberContributionList)
export async function getHouseChurchMembers(houseChurchId: string): Promise<Member[]> {
  return getMembersByHouseChurch(houseChurchId);
}

export async function transferMember(
  memberId: string,
  fromHouseChurchId: string | null,
  toHouseChurchId: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('members')
    .update({ house_church_id: toHouseChurchId })
    .eq('id', memberId);

  if (error) {
    console.error('Error transferring member:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
