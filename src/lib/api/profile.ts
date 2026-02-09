import { supabase } from '../supabase';
import type { User } from '@/types';

export interface ProfileUpdateData {
  full_name?: string;
  avatar?: string;
}

export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
}

export interface UserStats {
  reportsCount: number;
  reportsSubmittedOnTime: number;
  membersCount: number;
  activeMembersCount: number;
}

/**
 * Met à jour le profil de l'utilisateur connecté
 */
export async function updateProfile(
  userId: string,
  data: ProfileUpdateData
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      console.error('Error updating profile:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error updating profile:', error);
    return { success: false, error: error.message || 'Erreur inconnue' };
  }
}

/**
 * Change le mot de passe de l'utilisateur connecté
 */
export async function changePassword(
  data: PasswordChangeData
): Promise<{ success: boolean; error?: string }> {
  try {
    // Vérifier que le nouveau mot de passe est valide
    if (data.newPassword.length < 6) {
      return { success: false, error: 'Le mot de passe doit contenir au moins 6 caractères' };
    }

    // Supabase Auth - Changer le mot de passe
    const { error } = await supabase.auth.updateUser({
      password: data.newPassword,
    });

    if (error) {
      console.error('Error changing password:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error changing password:', error);
    return { success: false, error: error.message || 'Erreur inconnue' };
  }
}

/**
 * Upload l'avatar de l'utilisateur
 */
export async function uploadAvatar(
  userId: string,
  file: File
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      return { success: false, error: 'Le fichier doit être une image' };
    }

    // Vérifier la taille (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return { success: false, error: "L'image ne doit pas dépasser 2 Mo" };
    }

    // Générer un nom de fichier unique
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    // Upload vers Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        upsert: true,
      });

    if (uploadError) {
      console.error('Error uploading avatar:', uploadError);
      return { success: false, error: uploadError.message };
    }

    // Récupérer l'URL publique
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);

    if (!urlData.publicUrl) {
      return { success: false, error: "Erreur lors de la récupération de l'URL" };
    }

    // Mettre à jour le profil avec la nouvelle URL
    const updateResult = await updateProfile(userId, { avatar: urlData.publicUrl });

    if (!updateResult.success) {
      return updateResult;
    }

    return { success: true, url: urlData.publicUrl };
  } catch (error: any) {
    console.error('Error uploading avatar:', error);
    return { success: false, error: error.message || 'Erreur inconnue' };
  }
}

/**
 * Récupère les statistiques de l'utilisateur
 */
export async function getUserStats(user: User): Promise<UserStats> {
  try {
    const stats: UserStats = {
      reportsCount: 0,
      reportsSubmittedOnTime: 0,
      membersCount: 0,
      activeMembersCount: 0,
    };

    // Compter les rapports soumis
    if (user.role === 'center_lead' || user.role === 'house_lead') {
      const query = supabase.from('reports').select('id, submitted_at, period_id', { count: 'exact' });

      if (user.role === 'center_lead' && user.center_id) {
        query.eq('center_id', user.center_id);
      } else if (user.role === 'house_lead' && user.house_church_id) {
        query.eq('house_church_id', user.house_church_id);
      }

      const { count, data } = await query;
      stats.reportsCount = count || 0;

      // Calculer les rapports soumis à temps (avant la fin de la période)
      if (data) {
        const { data: periods } = await supabase.from('reporting_periods').select('id, end_date');

        if (periods) {
          const onTimeCount = data.filter((report) => {
            if (!report.submitted_at) return false;
            const period = periods.find((p) => p.id === report.period_id);
            if (!period) return false;
            return new Date(report.submitted_at) <= new Date(period.end_date);
          }).length;

          stats.reportsSubmittedOnTime = onTimeCount;
        }
      }
    }

    // Compter les membres
    if (user.role === 'center_lead' && user.center_id) {
      const { count: totalCount } = await supabase
        .from('members')
        .select('id', { count: 'exact' })
        .eq('center_id', user.center_id);

      stats.membersCount = totalCount || 0;

      // Membres actifs (ayant au moins un champ complété récemment)
      const { count: activeCount } = await supabase
        .from('members')
        .select('id', { count: 'exact' })
        .eq('center_id', user.center_id)
        .not('phone', 'is', null);

      stats.activeMembersCount = activeCount || 0;
    } else if (user.role === 'house_lead' && user.house_church_id) {
      const { count: totalCount } = await supabase
        .from('members')
        .select('id', { count: 'exact' })
        .eq('house_church_id', user.house_church_id);

      stats.membersCount = totalCount || 0;

      const { count: activeCount } = await supabase
        .from('members')
        .select('id', { count: 'exact' })
        .eq('house_church_id', user.house_church_id)
        .not('phone', 'is', null);

      stats.activeMembersCount = activeCount || 0;
    }

    return stats;
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return {
      reportsCount: 0,
      reportsSubmittedOnTime: 0,
      membersCount: 0,
      activeMembersCount: 0,
    };
  }
}
