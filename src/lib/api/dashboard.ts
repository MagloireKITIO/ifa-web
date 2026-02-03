import { loadDatabase } from './db';
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
  const db = await loadDatabase();

  // Calculer le total des membres actifs (dernier rapport)
  const latestPeopleStats = db.statsPeople.slice(-10); // 10 derniers rapports
  const totalMembers = latestPeopleStats.reduce(
    (sum, stat) => sum + stat.attendanceTotal,
    0
  );
  const avgMembers = Math.round(totalMembers / latestPeopleStats.length);

  // Calculer les nouveaux cette semaine (simulation)
  const recentStats = db.statsPeople.slice(-3);
  const newThisWeek = recentStats.reduce(
    (sum, stat) => sum + stat.newConverts + stat.firstTimers,
    0
  );

  // Taux de participation (simulation basée sur membres actifs)
  const participationRate = 78; // Pourcentage fixe pour le prototype

  // Actions sociales
  const socialActions = db.statsActivities.reduce(
    (sum, stat) => sum + stat.socialActionsCount,
    0
  );

  // Tendances (comparaison avec période précédente - simulation)
  const trends = {
    members: 5.2,
    newMembers: 12.5,
    participation: -2.3,
    social: 8.7,
  };

  return {
    totalMembers: avgMembers,
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
  const db = await loadDatabase();

  // Agréger les 5 derniers rapports pour avoir une moyenne
  const recentStats = db.statsPeople.slice(-5);

  const men = Math.round(
    recentStats.reduce((sum, stat) => sum + stat.attendanceMen, 0) /
      recentStats.length
  );
  const women = Math.round(
    recentStats.reduce((sum, stat) => sum + stat.attendanceWomen, 0) /
      recentStats.length
  );
  const children = Math.round(
    recentStats.reduce((sum, stat) => sum + stat.attendanceChildren, 0) /
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
  const db = await loadDatabase();

  // Créer 12 mois de données (simulation)
  const months = [
    'Jan',
    'Fév',
    'Mar',
    'Avr',
    'Mai',
    'Jun',
    'Jul',
    'Aoû',
    'Sep',
    'Oct',
    'Nov',
    'Déc',
  ];

  // Grouper les stats par mois (simulation - on prend des échantillons)
  const monthlyData: MonthlyGrowth[] = months.map((month, index) => {
    // Prendre des échantillons de statsPeople
    const sampleStats = db.statsPeople.filter((_, i) => i % 12 === index);

    if (sampleStats.length === 0) {
      return {
        month,
        members: 0,
        men: 0,
        women: 0,
        children: 0,
      };
    }

    const avgStats = {
      men: Math.round(
        sampleStats.reduce((sum, s) => sum + s.attendanceMen, 0) /
          sampleStats.length
      ),
      women: Math.round(
        sampleStats.reduce((sum, s) => sum + s.attendanceWomen, 0) /
          sampleStats.length
      ),
      children: Math.round(
        sampleStats.reduce((sum, s) => sum + s.attendanceChildren, 0) /
          sampleStats.length
      ),
    };

    return {
      month,
      members: avgStats.men + avgStats.women + avgStats.children,
      men: avgStats.men,
      women: avgStats.women,
      children: avgStats.children,
    };
  });

  return monthlyData;
}

/**
 * Récupère les statistiques financières
 */
export async function getFinancialStats(): Promise<FinancialStats> {
  const db = await loadDatabase();

  // Sommer toutes les finances
  const totalTithes = db.statsFinancial.reduce(
    (sum, stat) => sum + stat.tithes,
    0
  );
  const totalOfferings = db.statsFinancial.reduce(
    (sum, stat) =>
      sum +
      stat.offeringsGeneral +
      stat.offeringsEvents +
      stat.offeringsInvestment,
    0
  );
  const totalExpenses = db.statsFinancial.reduce(
    (sum, stat) =>
      sum +
      stat.expenseAdmin +
      stat.expenseRent +
      stat.expenseMission +
      stat.expenseEvents,
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
  const db = await loadDatabase();

  const totalBaptisms = db.statsPeople.reduce(
    (sum, stat) => sum + stat.baptisms,
    0
  );
  const totalNewConverts = db.statsPeople.reduce(
    (sum, stat) => sum + stat.newConverts,
    0
  );
  const totalTrained = db.statsActivities.reduce(
    (sum, stat) => sum + stat.peopleTrained,
    0
  );

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
  const db = await loadDatabase();

  const totalMarriages = db.statsFamily.reduce(
    (sum, stat) => sum + stat.marriages,
    0
  );
  const totalBirths = db.statsFamily.reduce(
    (sum, stat) => sum + stat.births,
    0
  );
  const totalCounseling = db.statsFamily.reduce(
    (sum, stat) => sum + stat.couplesCounseled,
    0
  );

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
