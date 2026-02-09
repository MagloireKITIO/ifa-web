import { supabase } from '../supabase';

// ============================================
// INTERFACES
// ============================================

export interface OverviewKPIs {
  totalMembers: number;
  totalCenters: number;
  totalHouseChurches: number;
  totalZones: number;
  profileCompletionRate: number;
  pendingSourcing: number;
}

export interface MembersKPIs {
  totalMembers: number;
  baptizedMembers: number;
  baptismRate: number;
  averageAge: number;
  ageGroupDistribution: AgeGroup[];
  membersByCenter: CenterDistribution[];
  membersByZone: ZoneDistribution[];
  completionStats: CompletionStats;
}

export interface FinancialKPIs {
  totalRevenue: number;
  totalExpenses: number;
  balance: number;
  tithes: number;
  offerings: number;
  financialHealth: number; // Revenue/Expenses ratio
  hasData: boolean;
}

export interface MinistryKPIs {
  totalBaptisms: number;
  totalNewConverts: number;
  totalTrainedPeople: number;
  totalSocialActions: number;
  totalHomeVisits: number;
  totalEvangelismOutreach: number;
  totalMealsDistributed: number;
  totalYouthMentored: number;
  hasData: boolean;
}

export interface FamilyKPIs {
  totalMarriages: number;
  totalBirths: number;
  totalCounseling: number;
  totalEngagements: number;
  marriedMembers: number;
  hasData: boolean;
}

export interface ExpansionKPIs {
  centersByZone: ZoneDistribution[];
  centersWithGPS: number;
  totalCentersWithGPS: number;
  centersTimeline: CenterTimeline[];
  housesTimeline: HouseTimeline[];
}

export interface AgeGroup {
  group: string;
  count: number;
  percentage: number;
}

export interface CenterDistribution {
  centerName: string;
  memberCount: number;
  percentage: number;
}

export interface ZoneDistribution {
  zoneName: string;
  count: number;
  percentage: number;
}

export interface CompletionStats {
  totalMembers: number;
  withPhone: number;
  withBirthYear: number;
  withConversionYear: number;
  withJoinedYear: number;
  phoneRate: number;
  birthRate: number;
  conversionRate: number;
  joinedRate: number;
}

export interface CenterTimeline {
  year: number;
  centerName: string;
  zoneName: string;
}

export interface HouseTimeline {
  year: number;
  houseName: string;
  centerName: string;
}

export interface WorshipStats {
  totalRecords: number;
  averageAttendance: number;
  lastWorshipDate: string | null;
  monthlyAverage: MonthlyWorshipAverage[];
}

export interface MonthlyWorshipAverage {
  month: string;
  avgMen: number;
  avgWomen: number;
  avgChildren: number;
  avgTotal: number;
}

export interface TimelineEvent {
  year: number;
  type: 'zone' | 'center' | 'house' | 'milestone';
  title: string;
  description?: string;
  count?: number;
}

export interface HistoricalData {
  year: number;
  members?: number;
  centers?: number;
  houses?: number;
  revenue?: number;
  expenses?: number;
}

// ============================================
// VUE D'ENSEMBLE
// ============================================

export async function getOverviewKPIs(): Promise<OverviewKPIs> {
  try {
    // Count members
    const { count: totalMembers } = await supabase
      .from('members')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    // Count centers
    const { count: totalCenters } = await supabase
      .from('centers')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    // Count house churches
    const { count: totalHouseChurches } = await supabase
      .from('house_churches')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    // Count zones
    const { count: totalZones } = await supabase
      .from('zones')
      .select('*', { count: 'exact', head: true });

    // Completion rate (phone as proxy)
    const { data: membersData } = await supabase
      .from('members')
      .select('phone')
      .eq('status', 'active');

    const withPhone = membersData?.filter((m) => m.phone).length || 0;
    const profileCompletionRate =
      totalMembers && totalMembers > 0
        ? Math.round((withPhone / totalMembers) * 100)
        : 0;

    // Pending sourcing
    const { count: pendingSourcing } = await supabase
      .from('sourcing_responses')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    return {
      totalMembers: totalMembers || 0,
      totalCenters: totalCenters || 0,
      totalHouseChurches: totalHouseChurches || 0,
      totalZones: totalZones || 0,
      profileCompletionRate,
      pendingSourcing: pendingSourcing || 0,
    };
  } catch (error) {
    console.error('Error fetching overview KPIs:', error);
    return {
      totalMembers: 0,
      totalCenters: 0,
      totalHouseChurches: 0,
      totalZones: 0,
      profileCompletionRate: 0,
      pendingSourcing: 0,
    };
  }
}

// ============================================
// MEMBRES & DÉMOGRAPHIE
// ============================================

export async function getMembersKPIs(): Promise<MembersKPIs> {
  try {
    // Get all active members with details
    const { data: members, error } = await supabase
      .from('members')
      .select(
        `
        id,
        phone,
        birth_year,
        conversion_year,
        joined_ifa_year,
        is_baptized,
        marriage_date,
        center_id,
        centers(id, name, zone_id, zones(id, name))
      `
      )
      .eq('status', 'active');

    if (error) throw error;

    const totalMembers = members?.length || 0;
    const baptizedMembers =
      members?.filter((m) => m.is_baptized).length || 0;
    const baptismRate =
      totalMembers > 0
        ? Math.round((baptizedMembers / totalMembers) * 100)
        : 0;

    // Average age
    const membersWithAge = members?.filter((m) => m.birth_year) || [];
    const averageAge =
      membersWithAge.length > 0
        ? Math.round(
            membersWithAge.reduce(
              (sum, m) => sum + (2026 - (m.birth_year || 0)),
              0
            ) / membersWithAge.length
          )
        : 0;

    // Age group distribution
    const ageGroups = [
      { group: '0-17 ans', min: 0, max: 17, count: 0 },
      { group: '18-30 ans', min: 18, max: 30, count: 0 },
      { group: '31-50 ans', min: 31, max: 50, count: 0 },
      { group: '51+ ans', min: 51, max: 999, count: 0 },
      { group: 'Non renseigné', min: -1, max: -1, count: 0 },
    ];

    members?.forEach((m) => {
      if (!m.birth_year) {
        ageGroups[4].count++;
      } else {
        const age = 2026 - m.birth_year;
        const group = ageGroups.find(
          (g) => g.min !== -1 && age >= g.min && age <= g.max
        );
        if (group) group.count++;
      }
    });

    const ageGroupDistribution = ageGroups.map((g) => ({
      group: g.group,
      count: g.count,
      percentage:
        totalMembers > 0 ? Math.round((g.count / totalMembers) * 100) : 0,
    }));

    // Members by center
    const centerMap = new Map<string, number>();
    members?.forEach((m) => {
      const centerName = (m.centers as any)?.name || 'Non affecté';
      centerMap.set(centerName, (centerMap.get(centerName) || 0) + 1);
    });

    const membersByCenter = Array.from(centerMap.entries())
      .map(([centerName, memberCount]) => ({
        centerName,
        memberCount,
        percentage:
          totalMembers > 0
            ? Math.round((memberCount / totalMembers) * 100)
            : 0,
      }))
      .sort((a, b) => b.memberCount - a.memberCount);

    // Members by zone
    const zoneMap = new Map<string, number>();
    members?.forEach((m) => {
      const zoneName =
        ((m.centers as any)?.zones as any)?.name || 'Non affecté';
      zoneMap.set(zoneName, (zoneMap.get(zoneName) || 0) + 1);
    });

    const membersByZone = Array.from(zoneMap.entries())
      .map(([zoneName, count]) => ({
        zoneName,
        count,
        percentage:
          totalMembers > 0 ? Math.round((count / totalMembers) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // Completion stats
    const withPhone = members?.filter((m) => m.phone).length || 0;
    const withBirthYear = members?.filter((m) => m.birth_year).length || 0;
    const withConversionYear =
      members?.filter((m) => m.conversion_year).length || 0;
    const withJoinedYear =
      members?.filter((m) => m.joined_ifa_year).length || 0;

    const completionStats: CompletionStats = {
      totalMembers,
      withPhone,
      withBirthYear,
      withConversionYear,
      withJoinedYear,
      phoneRate:
        totalMembers > 0 ? Math.round((withPhone / totalMembers) * 100) : 0,
      birthRate:
        totalMembers > 0
          ? Math.round((withBirthYear / totalMembers) * 100)
          : 0,
      conversionRate:
        totalMembers > 0
          ? Math.round((withConversionYear / totalMembers) * 100)
          : 0,
      joinedRate:
        totalMembers > 0
          ? Math.round((withJoinedYear / totalMembers) * 100)
          : 0,
    };

    return {
      totalMembers,
      baptizedMembers,
      baptismRate,
      averageAge,
      ageGroupDistribution,
      membersByCenter,
      membersByZone,
      completionStats,
    };
  } catch (error) {
    console.error('Error fetching members KPIs:', error);
    return {
      totalMembers: 0,
      baptizedMembers: 0,
      baptismRate: 0,
      averageAge: 0,
      ageGroupDistribution: [],
      membersByCenter: [],
      membersByZone: [],
      completionStats: {
        totalMembers: 0,
        withPhone: 0,
        withBirthYear: 0,
        withConversionYear: 0,
        withJoinedYear: 0,
        phoneRate: 0,
        birthRate: 0,
        conversionRate: 0,
        joinedRate: 0,
      },
    };
  }
}

// ============================================
// FINANCES
// ============================================

export async function getFinancialKPIs(): Promise<FinancialKPIs> {
  try {
    const { data: financialData, error } = await supabase
      .from('stats_financial')
      .select('*');

    if (error) throw error;

    const hasData = financialData && financialData.length > 0;

    if (!hasData) {
      return {
        totalRevenue: 0,
        totalExpenses: 0,
        balance: 0,
        tithes: 0,
        offerings: 0,
        financialHealth: 0,
        hasData: false,
      };
    }

    const totalTithes = financialData.reduce((sum, s) => sum + s.tithes, 0);
    const totalOfferings = financialData.reduce(
      (sum, s) =>
        sum +
        s.offerings_general +
        s.offerings_events +
        s.offerings_investment,
      0
    );
    const totalExpenses = financialData.reduce(
      (sum, s) =>
        sum + s.expense_admin + s.expense_rent + s.expense_mission + s.expense_events,
      0
    );

    const totalRevenue = totalTithes + totalOfferings;
    const balance = totalRevenue - totalExpenses;
    const financialHealth =
      totalExpenses > 0
        ? Math.round((totalRevenue / totalExpenses) * 100)
        : 100;

    return {
      totalRevenue,
      totalExpenses,
      balance,
      tithes: totalTithes,
      offerings: totalOfferings,
      financialHealth,
      hasData: true,
    };
  } catch (error) {
    console.error('Error fetching financial KPIs:', error);
    return {
      totalRevenue: 0,
      totalExpenses: 0,
      balance: 0,
      tithes: 0,
      offerings: 0,
      financialHealth: 0,
      hasData: false,
    };
  }
}

// ============================================
// MINISTÈRE & ACTIVITÉS
// ============================================

export async function getMinistryKPIs(): Promise<MinistryKPIs> {
  try {
    // Fetch people stats
    const { data: peopleData, error: peopleError } = await supabase
      .from('stats_people')
      .select('baptisms, new_converts');

    // Fetch activity stats
    const { data: activityData, error: activityError } = await supabase
      .from('stats_activities')
      .select('*');

    if (peopleError || activityError) {
      throw peopleError || activityError;
    }

    const hasData =
      (peopleData && peopleData.length > 0) ||
      (activityData && activityData.length > 0);

    if (!hasData) {
      return {
        totalBaptisms: 0,
        totalNewConverts: 0,
        totalTrainedPeople: 0,
        totalSocialActions: 0,
        totalHomeVisits: 0,
        totalEvangelismOutreach: 0,
        totalMealsDistributed: 0,
        totalYouthMentored: 0,
        hasData: false,
      };
    }

    const totalBaptisms =
      peopleData?.reduce((sum, s) => sum + s.baptisms, 0) || 0;
    const totalNewConverts =
      peopleData?.reduce((sum, s) => sum + s.new_converts, 0) || 0;

    const totalTrainedPeople =
      activityData?.reduce((sum, s) => sum + s.people_trained, 0) || 0;
    const totalSocialActions =
      activityData?.reduce((sum, s) => sum + s.social_actions_count, 0) || 0;
    const totalHomeVisits =
      activityData?.reduce((sum, s) => sum + s.home_visits, 0) || 0;
    const totalEvangelismOutreach =
      activityData?.reduce((sum, s) => sum + s.evangelism_outreach_count, 0) ||
      0;
    const totalMealsDistributed =
      activityData?.reduce((sum, s) => sum + s.meals_distributed, 0) || 0;
    const totalYouthMentored =
      activityData?.reduce((sum, s) => sum + s.youth_mentored, 0) || 0;

    return {
      totalBaptisms,
      totalNewConverts,
      totalTrainedPeople,
      totalSocialActions,
      totalHomeVisits,
      totalEvangelismOutreach,
      totalMealsDistributed,
      totalYouthMentored,
      hasData: true,
    };
  } catch (error) {
    console.error('Error fetching ministry KPIs:', error);
    return {
      totalBaptisms: 0,
      totalNewConverts: 0,
      totalTrainedPeople: 0,
      totalSocialActions: 0,
      totalHomeVisits: 0,
      totalEvangelismOutreach: 0,
      totalMealsDistributed: 0,
      totalYouthMentored: 0,
      hasData: false,
    };
  }
}

// ============================================
// FAMILLE & COMMUNAUTÉ
// ============================================

export async function getFamilyKPIs(): Promise<FamilyKPIs> {
  try {
    const { data: familyData, error } = await supabase
      .from('stats_family')
      .select('*');

    if (error) throw error;

    const hasData = familyData && familyData.length > 0;

    if (!hasData) {
      return {
        totalMarriages: 0,
        totalBirths: 0,
        totalCounseling: 0,
        totalEngagements: 0,
        marriedMembers: 0,
        hasData: false,
      };
    }

    const totalMarriages = familyData.reduce((sum, s) => sum + s.marriages, 0);
    const totalBirths = familyData.reduce((sum, s) => sum + s.births, 0);
    const totalCounseling = familyData.reduce(
      (sum, s) => sum + s.couples_counseled,
      0
    );
    const totalEngagements = familyData.reduce(
      (sum, s) => sum + s.engagements,
      0
    );

    // Married members from members table
    const { count: marriedMembers } = await supabase
      .from('members')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .not('marriage_date', 'is', null);

    return {
      totalMarriages,
      totalBirths,
      totalCounseling,
      totalEngagements,
      marriedMembers: marriedMembers || 0,
      hasData: true,
    };
  } catch (error) {
    console.error('Error fetching family KPIs:', error);
    return {
      totalMarriages: 0,
      totalBirths: 0,
      totalCounseling: 0,
      totalEngagements: 0,
      marriedMembers: 0,
      hasData: false,
    };
  }
}

// ============================================
// EXPANSION & CROISSANCE
// ============================================

export async function getExpansionKPIs(): Promise<ExpansionKPIs> {
  try {
    // Centers by zone
    const { data: centers, error: centersError } = await supabase
      .from('centers')
      .select('id, name, zone_id, zones(id, name), latitude, longitude')
      .eq('status', 'active');

    if (centersError) throw centersError;

    const zoneMap = new Map<string, number>();
    let centersWithGPS = 0;

    centers?.forEach((c) => {
      const zoneName = (c.zones as any)?.name || 'Non affecté';
      zoneMap.set(zoneName, (zoneMap.get(zoneName) || 0) + 1);
      if (c.latitude && c.longitude) centersWithGPS++;
    });

    const centersByZone = Array.from(zoneMap.entries())
      .map(([zoneName, count]) => ({
        zoneName,
        count,
        percentage: centers ? Math.round((count / centers.length) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // Centers timeline (by founded_date)
    const { data: centersTimeline } = await supabase
      .from('centers')
      .select('name, founded_date, zones(name)')
      .eq('status', 'active')
      .not('founded_date', 'is', null)
      .order('founded_date');

    const centersTimelineData =
      centersTimeline?.map((c) => ({
        year: new Date(c.founded_date).getFullYear(),
        centerName: c.name,
        zoneName: (c.zones as any)?.name || 'N/A',
      })) || [];

    // House churches timeline
    const { data: housesTimeline } = await supabase
      .from('house_churches')
      .select('name, founded_date, centers(name)')
      .eq('status', 'active')
      .not('founded_date', 'is', null)
      .order('founded_date');

    const housesTimelineData =
      housesTimeline?.map((h) => ({
        year: new Date(h.founded_date).getFullYear(),
        houseName: h.name,
        centerName: (h.centers as any)?.name || 'N/A',
      })) || [];

    return {
      centersByZone,
      centersWithGPS,
      totalCentersWithGPS: centers?.length || 0,
      centersTimeline: centersTimelineData,
      housesTimeline: housesTimelineData,
    };
  } catch (error) {
    console.error('Error fetching expansion KPIs:', error);
    return {
      centersByZone: [],
      centersWithGPS: 0,
      totalCentersWithGPS: 0,
      centersTimeline: [],
      housesTimeline: [],
    };
  }
}

// ============================================
// WORSHIP STATS
// ============================================

export async function getWorshipStats(): Promise<WorshipStats> {
  try {
    const { data: worshipData, error } = await supabase
      .from('worship_attendance')
      .select('*')
      .order('worship_date', { ascending: false });

    if (error) throw error;

    const totalRecords = worshipData?.length || 0;

    if (totalRecords === 0) {
      return {
        totalRecords: 0,
        averageAttendance: 0,
        lastWorshipDate: null,
        monthlyAverage: [],
      };
    }

    const averageAttendance = Math.round(
      worshipData.reduce((sum, w) => sum + w.total_count, 0) / totalRecords
    );

    const lastWorshipDate = worshipData[0]?.worship_date || null;

    // Monthly average (last 12 months)
    const monthlyMap = new Map<string, {
      men: number[];
      women: number[];
      children: number[];
      total: number[];
    }>();

    worshipData.forEach((w) => {
      const date = new Date(w.worship_date);
      const monthKey = date.toLocaleString('fr-FR', { month: 'short' });

      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, { men: [], women: [], children: [], total: [] });
      }

      const monthData = monthlyMap.get(monthKey)!;
      monthData.men.push(w.men_count);
      monthData.women.push(w.women_count);
      monthData.children.push(w.children_count);
      monthData.total.push(w.total_count);
    });

    const monthlyAverage = Array.from(monthlyMap.entries()).map(
      ([month, data]) => ({
        month,
        avgMen: Math.round(data.men.reduce((a, b) => a + b, 0) / data.men.length),
        avgWomen: Math.round(
          data.women.reduce((a, b) => a + b, 0) / data.women.length
        ),
        avgChildren: Math.round(
          data.children.reduce((a, b) => a + b, 0) / data.children.length
        ),
        avgTotal: Math.round(
          data.total.reduce((a, b) => a + b, 0) / data.total.length
        ),
      })
    );

    return {
      totalRecords,
      averageAttendance,
      lastWorshipDate,
      monthlyAverage,
    };
  } catch (error) {
    console.error('Error fetching worship stats:', error);
    return {
      totalRecords: 0,
      averageAttendance: 0,
      lastWorshipDate: null,
      monthlyAverage: [],
    };
  }
}

// ============================================
// UTILS
// ============================================

export function formatCurrency(
  amount: number,
  currency: string = 'XAF'
): string {
  if (currency === 'XAF') {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M XAF`;
    }
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)}K XAF`;
    }
    return `${amount} XAF`;
  }
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ============================================
// DONNÉES HISTORIQUES POUR GRAPHIQUES
// ============================================

export async function getHistoricalData(): Promise<HistoricalData[]> {
  try {
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: currentYear - 2010 }, (_, i) => 2011 + i);
    const historicalData: HistoricalData[] = [];

    // Pour chaque année, calculer les stats cumulées jusqu'à cette année
    for (const year of years) {
      const endOfYear = `${year}-12-31`;

      // Compter les centres créés jusqu'à cette année
      const { count: centersCount } = await supabase
        .from('centers')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .or(`founded_date.is.null,founded_date.lte.${endOfYear}`);

      // Compter les assemblées créées jusqu'à cette année
      const { count: housesCount } = await supabase
        .from('house_churches')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .or(`founded_date.is.null,founded_date.lte.${endOfYear}`);

      // Pour les membres, on n'a pas de date de création
      // On va faire une estimation basée sur joined_ifa_year si disponible
      const { count: membersCount } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .or(`joined_ifa_year.is.null,joined_ifa_year.lte.${year}`);

      historicalData.push({
        year,
        members: membersCount || 0,
        centers: centersCount || 0,
        houses: housesCount || 0,
        revenue: 0, // À calculer si des rapports existent pour cette année
        expenses: 0,
      });
    }

    return historicalData;
  } catch (error) {
    console.error('Error fetching historical data:', error);
    return [];
  }
}

export async function getTimelineEvents(): Promise<TimelineEvent[]> {
  try {
    const events: TimelineEvent[] = [];

    // Événements des centres
    const { data: centers } = await supabase
      .from('centers')
      .select('name, founded_date, zones(name)')
      .eq('status', 'active')
      .not('founded_date', 'is', null)
      .order('founded_date');

    centers?.forEach((center) => {
      const year = new Date(center.founded_date).getFullYear();
      events.push({
        year,
        type: 'center',
        title: center.name,
        description: `Zone: ${(center.zones as any)?.name || 'N/A'}`,
      });
    });

    // Événements des assemblées
    const { data: houses } = await supabase
      .from('house_churches')
      .select('name, founded_date, centers(name)')
      .eq('status', 'active')
      .not('founded_date', 'is', null)
      .order('founded_date');

    houses?.forEach((house) => {
      const year = new Date(house.founded_date).getFullYear();
      events.push({
        year,
        type: 'house',
        title: house.name,
        description: `Centre: ${(house.centers as any)?.name || 'N/A'}`,
      });
    });

    // Ajouter des jalons basés sur les données
    const { count: totalMembers } = await supabase
      .from('members')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    if (totalMembers && totalMembers >= 100) {
      // Jalon: 100 membres (estimation)
      events.push({
        year: 2015, // Estimation
        type: 'milestone',
        title: '100 membres atteints',
        description: 'Première centaine de membres',
      });
    }

    if (totalMembers && totalMembers >= 400) {
      const currentYear = new Date().getFullYear();
      events.push({
        year: currentYear - 1,
        type: 'milestone',
        title: '400+ membres',
        description: 'Croissance significative',
      });
    }

    // Trier par année
    return events.sort((a, b) => a.year - b.year);
  } catch (error) {
    console.error('Error fetching timeline events:', error);
    return [];
  }
}
