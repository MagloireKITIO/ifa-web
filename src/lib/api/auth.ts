import type { User } from '@/types';
import { loadDatabase } from './db';

const AUTH_STORAGE_KEY = 'ifa_auth_user';

/**
 * Authentifie un utilisateur avec email/mot de passe
 * (Pour le prototype, on vérifie juste l'email)
 */
export async function login(email: string, password: string): Promise<User> {
  const db = await loadDatabase();

  // Dans le prototype, on accepte n'importe quel mot de passe
  const user = db.users.find(u => u.email === email);

  if (!user) {
    throw new Error('Email ou mot de passe incorrect');
  }

  // Stocker l'utilisateur dans localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  }

  return user;
}

/**
 * Déconnecte l'utilisateur
 */
export function logout(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}

/**
 * Récupère l'utilisateur actuellement connecté
 */
export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser) as User;
  } catch {
    return null;
  }
}

/**
 * Vérifie si l'utilisateur est authentifié
 */
export function isAuthenticated(): boolean {
  return getCurrentUser() !== null;
}

/**
 * Vérifie si l'utilisateur a un rôle spécifique
 */
export function hasRole(role: User['role'] | User['role'][]): boolean {
  const user = getCurrentUser();
  if (!user) return false;

  if (Array.isArray(role)) {
    return role.includes(user.role);
  }

  return user.role === role;
}
