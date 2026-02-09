import { QueryClient } from '@tanstack/react-query';

/**
 * Configuration du QueryClient React Query pour l'application IFA
 *
 * Configuration optimisée pour les dashboards avec:
 * - Cache de 5 minutes (considère les données fraîches)
 * - Garde en mémoire pendant 30 minutes
 * - Pas de refetch automatique au focus (évite requêtes inutiles)
 * - 1 seul retry en cas d'erreur
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Durée pendant laquelle les données sont considérées "fraîches"
      // Pendant ce temps, aucune requête n'est effectuée
      staleTime: 5 * 60 * 1000, // 5 minutes

      // Durée de conservation en cache (même si stale)
      // Affiche les données en cache pendant un refetch
      gcTime: 30 * 60 * 1000, // 30 minutes (anciennement cacheTime)

      // Désactiver le refetch automatique au focus de la fenêtre
      // (évite des requêtes inutiles quand l'utilisateur revient sur l'onglet)
      refetchOnWindowFocus: false,

      // Désactiver le refetch au reconnect
      refetchOnReconnect: false,

      // Nombre de tentatives en cas d'erreur
      retry: 1,

      // Délai entre les tentatives (exponentiel)
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

/**
 * Configuration pour des données qui changent rarement
 * (structure organisationnelle, zones, centres)
 */
export const longCacheOptions = {
  staleTime: 15 * 60 * 1000, // 15 minutes
  gcTime: 60 * 60 * 1000, // 1 heure
};

/**
 * Configuration pour des données qui changent fréquemment
 * (sourcing pending, rapports en attente)
 */
export const shortCacheOptions = {
  staleTime: 1 * 60 * 1000, // 1 minute
  gcTime: 5 * 60 * 1000, // 5 minutes
};

/**
 * Clés de requêtes pour une gestion cohérente du cache
 */
export const queryKeys = {
  // Dashboard Analytics
  overview: ['overview-kpis'] as const,
  members: ['members-kpis'] as const,
  financial: ['financial-kpis'] as const,
  ministry: ['ministry-kpis'] as const,
  family: ['family-kpis'] as const,
  expansion: ['expansion-kpis'] as const,
  worship: ['worship-stats'] as const,
  timeline: ['timeline-events'] as const,
  historical: ['historical-data'] as const,

  // Structure
  zones: ['zones'] as const,
  centers: ['centers'] as const,
  houseChurches: ['house-churches'] as const,

  // Membres
  membersList: ['members', 'list'] as const,
  memberById: (id: string) => ['members', id] as const,

  // Rapports
  reports: ['reports'] as const,
  reportById: (id: string) => ['reports', id] as const,

  // Sourcing
  pendingSourcing: ['sourcing', 'pending'] as const,

  // Utilisateurs
  users: ['users'] as const,
  userById: (id: string) => ['users', id] as const,
} as const;
