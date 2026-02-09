import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { queryKeys, longCacheOptions } from './config';
import {
  getOverviewKPIs,
  getMembersKPIs,
  getFinancialKPIs,
  getMinistryKPIs,
  getFamilyKPIs,
  getExpansionKPIs,
  getWorshipStats,
  getTimelineEvents,
  getHistoricalData,
  type OverviewKPIs,
  type MembersKPIs,
  type FinancialKPIs,
  type MinistryKPIs,
  type FamilyKPIs,
  type ExpansionKPIs,
  type WorshipStats,
  type TimelineEvent,
  type HistoricalData,
} from '@/lib/api/analytics';

/**
 * Hook pour récupérer les KPIs de la vue d'ensemble
 * Cache: 5 minutes
 */
export function useOverviewKPIs(): UseQueryResult<OverviewKPIs, Error> {
  return useQuery({
    queryKey: queryKeys.overview,
    queryFn: getOverviewKPIs,
  });
}

/**
 * Hook pour récupérer les KPIs des membres
 * Cache: 5 minutes
 */
export function useMembersKPIs(): UseQueryResult<MembersKPIs, Error> {
  return useQuery({
    queryKey: queryKeys.members,
    queryFn: getMembersKPIs,
  });
}

/**
 * Hook pour récupérer les KPIs financiers
 * Cache: 5 minutes
 */
export function useFinancialKPIs(): UseQueryResult<FinancialKPIs, Error> {
  return useQuery({
    queryKey: queryKeys.financial,
    queryFn: getFinancialKPIs,
  });
}

/**
 * Hook pour récupérer les KPIs du ministère
 * Cache: 5 minutes
 */
export function useMinistryKPIs(): UseQueryResult<MinistryKPIs, Error> {
  return useQuery({
    queryKey: queryKeys.ministry,
    queryFn: getMinistryKPIs,
  });
}

/**
 * Hook pour récupérer les KPIs de la famille
 * Cache: 5 minutes
 */
export function useFamilyKPIs(): UseQueryResult<FamilyKPIs, Error> {
  return useQuery({
    queryKey: queryKeys.family,
    queryFn: getFamilyKPIs,
  });
}

/**
 * Hook pour récupérer les KPIs d'expansion
 * Cache: 15 minutes (données structurelles qui changent rarement)
 */
export function useExpansionKPIs(): UseQueryResult<ExpansionKPIs, Error> {
  return useQuery({
    queryKey: queryKeys.expansion,
    queryFn: getExpansionKPIs,
    ...longCacheOptions, // Cache plus long car structure change rarement
  });
}

/**
 * Hook pour récupérer les statistiques de culte
 * Cache: 5 minutes
 */
export function useWorshipStats(): UseQueryResult<WorshipStats, Error> {
  return useQuery({
    queryKey: queryKeys.worship,
    queryFn: getWorshipStats,
  });
}

/**
 * Hook pour récupérer la timeline des événements
 * Cache: 15 minutes (historique qui ne change pas souvent)
 */
export function useTimelineEvents(): UseQueryResult<TimelineEvent[], Error> {
  return useQuery({
    queryKey: queryKeys.timeline,
    queryFn: getTimelineEvents,
    ...longCacheOptions,
  });
}

/**
 * Hook pour récupérer les données historiques
 * Cache: 15 minutes
 */
export function useHistoricalData(): UseQueryResult<HistoricalData[], Error> {
  return useQuery({
    queryKey: queryKeys.historical,
    queryFn: getHistoricalData,
    ...longCacheOptions,
  });
}
