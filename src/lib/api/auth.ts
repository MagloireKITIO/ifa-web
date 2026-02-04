import { supabase } from '../supabase';
import type { User } from '@/types';

/**
 * Authentifie un utilisateur avec email/mot de passe
 */
export async function login(email: string, password: string): Promise<User> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.user) {
    throw new Error('Erreur lors de la connexion');
  }

  // Récupérer le profil utilisateur complet
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  if (profileError || !profile) {
    console.error('Error fetching profile:', profileError);
    // Fallback: create a temporary user object from auth data if profile missing
    // But ideally we should ensure profile exists.
    // For now, throw error to ensure data consistency.
    throw new Error('Profil utilisateur introuvable');
  }

  return profile as User;
}

/**
 * Déconnecte l'utilisateur
 */
export async function logout(): Promise<void> {
  await supabase.auth.signOut();
}

/**
 * Récupère l'utilisateur actuellement connecté
 */
export async function getCurrentUser(): Promise<User | null> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    return null;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  return (profile as User) || null;
}

/**
 * Vérifie si l'utilisateur est authentifié
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}

/**
 * Vérifie si l'utilisateur a un rôle spécifique
 */
export async function hasRole(role: User['role'] | User['role'][]): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  if (Array.isArray(role)) {
    return role.includes(user.role);
  }

  return user.role === role;
}
