import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

/**
 * Middleware Next.js pour protéger les routes
 * Basé sur le pattern officiel Supabase SSR
 *
 * 🔒 SÉCURITÉ:
 * - Rafraîchit automatiquement les tokens d'authentification
 * - Vérifie l'authentification sur toutes les routes protégées
 * - Redirige vers /login si non authentifié
 * - Vérifie les rôles pour les routes admin
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 📋 Routes publiques (accessibles sans authentification)
  const publicRoutes = [
    '/login',
    '/reset-password',
    '/set-password',
    '/sourcing/public',
  ];

  // Permettre l'accès immédiat aux routes publiques
  // SANS appeler updateSession pour éviter les problèmes de cookies
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Pour toutes les autres routes : refresh session et vérifier auth
  const { supabaseResponse, user, supabase } = await updateSession(request);

  // Si pas d'utilisateur = redirection vers login
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    if (pathname !== '/' && pathname !== '/login') {
      url.searchParams.set('redirect', pathname);
    }
    return NextResponse.redirect(url);
  }

  // ✅ Utilisateur authentifié

  // 🔒 Vérifications spécifiques par route
  // Routes admin uniquement (/parametres)
  if (pathname.startsWith('/parametres')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
  }

  // Routes API admin
  if (pathname.startsWith('/api/admin')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return new NextResponse(
        JSON.stringify({ success: false, error: 'Accès refusé' }),
        { status: 403, headers: { 'content-type': 'application/json' } }
      );
    }
  }

  // Si l'utilisateur est authentifié et sur /login, rediriger vers dashboard
  if (pathname === '/login') {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // Retourner la réponse avec les cookies rafraîchis
  return supabaseResponse;
}

/**
 * Configuration du middleware
 * Exclut les fichiers statiques pour optimiser les performances
 */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf)$).*)',
  ],
};
