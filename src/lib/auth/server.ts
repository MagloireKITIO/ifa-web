import { createClient } from '@supabase/supabase-js';
import { createServerClient as createSSRClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { User } from '@/types';

/**
 * Crée un client Supabase côté serveur avec le contexte de l'utilisateur
 * Utilise les cookies pour récupérer la session
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // Utiliser @supabase/ssr pour une meilleure gestion des cookies
  const supabase = createSSRClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: any) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch (error) {
          // Les cookies peuvent être en lecture seule dans certains contextes
        }
      },
      remove(name: string, options: any) {
        try {
          cookieStore.set({ name, value: '', ...options });
        } catch (error) {
          // Les cookies peuvent être en lecture seule dans certains contextes
        }
      },
    },
  });

  return supabase;
}

/**
 * Crée un client Supabase Admin (Service Role)
 * ⚠️ ATTENTION: Contourne RLS - À utiliser UNIQUEMENT dans les API routes protégées
 */
export function createAdminSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Vérifie si l'utilisateur est authentifié et retourne son profil
 * Retourne null si non authentifié
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const supabase = await createServerSupabaseClient();

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      return null;
    }

    // Récupérer le profil complet
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profileError || !profile) {
      return null;
    }

    return profile as User;
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    return null;
  }
}

/**
 * Vérifie si l'utilisateur actuel est admin
 * Retourne false si non authentifié ou non admin
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === 'admin';
}

/**
 * Vérifie si l'utilisateur a l'un des rôles spécifiés
 */
export async function hasRole(allowedRoles: User['role'][]): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  return allowedRoles.includes(user.role);
}

/**
 * Middleware de vérification d'authentification pour les API routes
 * Retourne l'utilisateur si authentifié, sinon retourne une réponse d'erreur 401
 */
export async function requireAuth(): Promise<{ user: User } | { error: Response }> {
  const user = await getCurrentUser();

  if (!user) {
    return {
      error: Response.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      ),
    };
  }

  return { user };
}

/**
 * Middleware de vérification admin pour les API routes
 * Retourne l'utilisateur si admin, sinon retourne une réponse d'erreur 401/403
 */
export async function requireAdmin(): Promise<{ user: User } | { error: Response }> {
  const user = await getCurrentUser();

  if (!user) {
    return {
      error: Response.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      ),
    };
  }

  if (user.role !== 'admin') {
    return {
      error: Response.json(
        { success: false, error: 'Accès refusé. Privilèges administrateur requis.' },
        { status: 403 }
      ),
    };
  }

  return { user };
}

/**
 * Middleware de vérification de rôle pour les API routes
 */
export async function requireRole(allowedRoles: User['role'][]): Promise<{ user: User } | { error: Response }> {
  const user = await getCurrentUser();

  if (!user) {
    return {
      error: Response.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      ),
    };
  }

  if (!allowedRoles.includes(user.role)) {
    return {
      error: Response.json(
        { success: false, error: `Accès refusé. Rôles autorisés: ${allowedRoles.join(', ')}` },
        { status: 403 }
      ),
    };
  }

  return { user };
}
