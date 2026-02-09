import { supabase } from '../supabase';
import type { User, UserRole } from '@/types';

export interface UserFormData {
  email: string;
  full_name: string;
  role: UserRole;
  center_id?: string | null;
  house_church_id?: string | null;
  password?: string;
}

/**
 * Récupère tous les utilisateurs
 */
export async function getUsers(): Promise<User[]> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        centers(id, name),
        house_churches(id, name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      return [];
    }

    return (data as any[]) || [];
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

/**
 * Crée un nouvel utilisateur via le système d'invitation
 * Un email d'invitation sera envoyé à l'utilisateur pour qu'il définisse son mot de passe
 */
export async function createUser(
  userData: UserFormData
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validation des données
    if (!userData.email || !userData.full_name || !userData.role) {
      return { success: false, error: 'Données incomplètes' };
    }

    // Validation selon le rôle
    if (userData.role === 'center_lead' && !userData.center_id) {
      return { success: false, error: 'Un responsable de centre doit être assigné à un centre' };
    }

    if (userData.role === 'house_lead' && (!userData.house_church_id || !userData.center_id)) {
      return {
        success: false,
        error: "Un responsable d'assemblée doit être assigné à une assemblée et un centre",
      };
    }

    // Appeler l'API Route d'invitation (utilise l'API Admin de Supabase)
    const response = await fetch('/api/admin/invite-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: userData.email,
        full_name: userData.full_name,
        role: userData.role,
        center_id: userData.center_id || null,
        house_church_id: userData.house_church_id || null,
      }),
    });

    const result = await response.json();

    if (!result.success) {
      return { success: false, error: result.error || 'Erreur lors de l\'invitation' };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error creating user:', error);
    return { success: false, error: error.message || 'Erreur inconnue' };
  }
}

/**
 * Met à jour un utilisateur
 */
export async function updateUser(
  userId: string,
  userData: Partial<UserFormData>
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validation selon le rôle
    if (userData.role === 'center_lead' && !userData.center_id) {
      return { success: false, error: 'Un responsable de centre doit être assigné à un centre' };
    }

    if (userData.role === 'house_lead' && (!userData.house_church_id || !userData.center_id)) {
      return {
        success: false,
        error: "Un responsable d'assemblée doit être assigné à une assemblée et un centre",
      };
    }

    // Si le rôle change vers admin ou viewer, retirer les assignations
    if (userData.role === 'admin' || userData.role === 'viewer') {
      userData.center_id = null;
      userData.house_church_id = null;
    }

    // Mettre à jour le profil (le trigger sync_email_to_auth synchronisera automatiquement l'email vers auth.users)
    const { error } = await supabase
      .from('profiles')
      .update({
        email: userData.email,
        full_name: userData.full_name,
        role: userData.role,
        center_id: userData.center_id,
        house_church_id: userData.house_church_id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      console.error('Error updating user:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error updating user:', error);
    return { success: false, error: error.message || 'Erreur inconnue' };
  }
}

/**
 * Supprime un utilisateur
 */
export async function deleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Supprimer le profil (le trigger RLS supprimera l'utilisateur auth)
    const { error } = await supabase.from('profiles').delete().eq('id', userId);

    if (error) {
      console.error('Error deleting user:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return { success: false, error: error.message || 'Erreur inconnue' };
  }
}

/**
 * Active/Désactive un utilisateur
 */
export async function toggleUserStatus(
  userId: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      console.error('Error toggling user status:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error toggling user status:', error);
    return { success: false, error: error.message || 'Erreur inconnue' };
  }
}

/**
 * Réinitialise le mot de passe d'un utilisateur
 */
export async function resetPassword(
  email: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      console.error('Error resetting password:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error resetting password:', error);
    return { success: false, error: error.message || 'Erreur inconnue' };
  }
}
