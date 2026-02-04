import { supabase } from '../supabase';
import type {
  Database,
  StatsPeople,
  StatsFinancial,
  StatsFamily,
  StatsActivities,
} from '@/types';

export interface DashboardKPIs {
  totalMembers: number;
  newThisWeek: number;
  participationRate: number;
  socialActions: number;
  trends: {
    members: number;
    newMembers: number;
    participation: number;
    social: number;
  };
}

export interface GenderDistribution {
  men: number;
  women: number;
  children: number;
  total: number;
}

export interface MonthlyGrowth {
  month: string;
  members: number;
  men: number;
  women: number;
  children: number;
}

export interface FinancialStats {
  tithes: number;
  offerings: number;
  expenses: number;
  balance: number;
  currency: string;
}

export interface SpiritualStats {
  baptisms: number;
  newConverts: number;
  trainedPeople: number;
}

export interface FamilyStats {
  marriages: number;
  births: number;
  counselingSessions: number;
}

/**
 * Calcule les KPIs principaux du dashboard
 */
export async function getDashboardKPIs(): Promise<DashboardKPIs> {
  // Fetch last 10 submitted reports with stats_people and stats_activities
  const { data: reports, error } = await supabase
    .from('reports')
    .select(`
      id,
      submitted_at,
      stats_people(*),
      stats_activities(*)
    `)
    .eq('status', 'submitted') // Only submitted/approved reports? Mock used all. Let's use submitted/approved.
    .order('submitted_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching dashboard KPIs:', error);
    return {
      totalMembers: 0,
      newThisWeek: 0,
      participationRate: 0,
      socialActions: 0,
      trends: { members: 0, newMembers: 0, participation: 0, social: 0 },
    };
  }

  const reportList = (reports || []) as any[];

  const latestPeopleStats = reportList
    .map((r) => r.stats_people?.[0] || r.stats_people)
    .filter((s): s is StatsPeople => !!s);
  
  const latestActivityStats = reportList
    .map((r) => r.stats_activities?.[0] || r.stats_activities)
    .filter((s): s is StatsActivities => !!s);

  // Total members (avg of last 10)
  const totalMembers = latestPeopleStats.length > 0 
    ? Math.round(latestPeopleStats.reduce((sum: number, s: StatsPeople) => sum + s.attendance_total, 0) / latestPeopleStats.length)
    : 0;

  // New this week (last 3 reports approximation)
  const recentStats = latestPeopleStats.slice(0, 3);
  const newThisWeek = recentStats.reduce(
    (sum: number, stat: StatsPeople) => sum + stat.new_converts + stat.first_timers,
    0
  );

  // Participation rate (fixed for now as in mock)
  const participationRate = 78;

  // Social actions (total of fetched reports)
  const socialActions = latestActivityStats.reduce(
    (sum: number, stat: StatsActivities) => sum + stat.social_actions_count,
    0
  );

  // Trends (simulation)
  const trends = {
    members: 5.2,
    newMembers: 12.5,
    participation: -2.3,
    social: 8.7,
  };

  return {
    totalMembers,
    newThisWeek,
    participationRate,
    socialActions,
    trends,
  };
}

/**
 * Récupère la distribution par genre
 */
export async function getGenderDistribution(): Promise<GenderDistribution> {
  const { data: reports, error } = await supabase
    .from('reports')
    .select(`
      stats_people(*)
    `)
    .eq('status', 'submitted')
    .order('submitted_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error fetching gender distribution:', error);
    return { men: 0, women: 0, children: 0, total: 0 };
  }

  const reportList = (reports || []) as any[];

  const recentStats = reportList
    .map((r) => r.stats_people?.[0] || r.stats_people)
    .filter((s): s is StatsPeople => !!s);

  if (recentStats.length === 0) {
    return { men: 0, women: 0, children: 0, total: 0 };
  }

  const men = Math.round(
    recentStats.reduce((sum: number, stat: StatsPeople) => sum + stat.attendance_men, 0) /
      recentStats.length
  );
  const women = Math.round(
    recentStats.reduce((sum: number, stat: StatsPeople) => sum + stat.attendance_women, 0) /
      recentStats.length
  );
  const children = Math.round(
    recentStats.reduce((sum: number, stat: StatsPeople) => sum + stat.attendance_children, 0) /
      recentStats.length
  );

  return {
    men,
    women,
    children,
    total: men + women + children,
  };
}

/**
 * Récupère la croissance mensuelle sur 12 mois
 */
export async function getMonthlyGrowth(): Promise<MonthlyGrowth[]> {
  // Fetch reports for the last 12 months
  // This is complex to do purely in DB with the current structure without a date series join.
  // We'll fetch all reports and aggregate in JS for simplicity, assuming volume is manageable.
  // Or fetch last 50 reports.
  
  const { data: reports, error } = await supabase
    .from('reports')
    .select(`
      submitted_at,
      stats_people(*)
    `)
    .eq('status', 'submitted')
    .order('submitted_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching monthly growth:', error);
    return [];
  }

  // Group by month
  const monthlyStats = new Map<string, StatsPeople[]>();
  const months = [
    'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
    'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'
  ];

  reports.forEach(r => {
    if (!r.submitted_at || !r.stats_people) return;
    const date = new Date(r.submitted_at);
    const monthKey = months[date.getMonth()];
    const stats = Array.isArray(r.stats_people) ? r.stats_people[0] : r.stats_people;
    
    if (stats) {
      if (!monthlyStats.has(monthKey)) {
        monthlyStats.set(monthKey, []);
      }
      monthlyStats.get(monthKey)?.push(stats);
    }
  });

  // Create result array for last 12 months (or just map the fixed months array as in mock)
  // Mock mapped all 12 months.
  
  return months.map(month => {
    const stats = monthlyStats.get(month) || [];
    if (stats.length === 0) {
      return {
        month,
        members: 0,
        men: 0,
        women: 0,
        children: 0,
      };
    }

    const avgStats = {
      men: Math.round(stats.reduce((sum: number, s: StatsPeople) => sum + s.attendance_men, 0) / stats.length),
      women: Math.round(stats.reduce((sum: number, s: StatsPeople) => sum + s.attendance_women, 0) / stats.length),
      children: Math.round(stats.reduce((sum: number, s: StatsPeople) => sum + s.attendance_children, 0) / stats.length),
    };

    return {
      month,
      members: avgStats.men + avgStats.women + avgStats.children,
      men: avgStats.men,
      women: avgStats.women,
      children: avgStats.children,
    };
  });
}

/**
 * Récupère les statistiques financières
 */
export async function getFinancialStats(): Promise<FinancialStats> {
  // Fetch all financial stats
  // Note: Aggregation over ALL time might be heavy.
  // Assuming reasonable dataset size.
  const { data, error } = await supabase
    .from('stats_financial')
    .select('*');

  if (error) {
    console.error('Error fetching financial stats:', error);
    return {
      tithes: 0,
      offerings: 0,
      expenses: 0,
      balance: 0,
      currency: 'XAF',
    };
  }

  const stats = data || [];

  const totalTithes = stats.reduce((sum, s) => sum + s.tithes, 0);
  const totalOfferings = stats.reduce(
    (sum, s) =>
      sum +
      s.offerings_general +
      s.offerings_events +
      s.offerings_investment,
    0
  );
  const totalExpenses = stats.reduce(
    (sum, s) =>
      sum +
      s.expense_admin +
      s.expense_rent +
      s.expense_mission +
      s.expense_events,
    0
  );

  return {
    tithes: totalTithes,
    offerings: totalOfferings,
    expenses: totalExpenses,
    balance: totalTithes + totalOfferings - totalExpenses,
    currency: 'XAF',
  };
}

/**
 * Récupère les statistiques spirituelles
 */
export async function getSpiritualStats(): Promise<SpiritualStats> {
  const { data: peopleData, error: peopleError } = await supabase
    .from('stats_people')
    .select('baptisms, new_converts');
    
  const { data: activityData, error: activityError } = await supabase
    .from('stats_activities')
    .select('people_trained');

  if (peopleError || activityError) {
    console.error('Error fetching spiritual stats:', peopleError || activityError);
    return { baptisms: 0, newConverts: 0, trainedPeople: 0 };
  }

  const totalBaptisms = (peopleData || []).reduce((sum, s) => sum + s.baptisms, 0);
  const totalNewConverts = (peopleData || []).reduce((sum, s) => sum + s.new_converts, 0);
  const totalTrained = (activityData || []).reduce((sum, s) => sum + s.people_trained, 0);

  return {
    baptisms: totalBaptisms,
    newConverts: totalNewConverts,
    trainedPeople: totalTrained,
  };
}

/**
 * Récupère les statistiques familiales
 */
export async function getFamilyStats(): Promise<FamilyStats> {
  const { data, error } = await supabase
    .from('stats_family')
    .select('*');

  if (error) {
    console.error('Error fetching family stats:', error);
    return { marriages: 0, births: 0, counselingSessions: 0 };
  }

  const totalMarriages = (data || []).reduce((sum: number, s: StatsFamily) => sum + s.marriages, 0);
  const totalBirths = (data || []).reduce((sum: number, s: StatsFamily) => sum + s.births, 0);
  const totalCounseling = (data || []).reduce((sum: number, s: StatsFamily) => sum + s.couples_counseled, 0);

  return {
    marriages: totalMarriages,
    births: totalBirths,
    counselingSessions: totalCounseling,
  };
}

/**
 * Formate un nombre en devise
 */
export function formatCurrency(
  amount: number,
  currency: string = 'XAF'
): string {
  if (currency === 'XAF') {
    return `${(amount / 1000000).toFixed(1)}M XAF`;
  }
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
