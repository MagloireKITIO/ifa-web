import { supabase } from '../supabase';

export interface ReportingPeriod {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  fiscal_year: number;
  month_number: number;
  is_locked: boolean;
  created_at: string;
}

/**
 * Génère le nom d'une période au format "Janvier 2011"
 */
function getPeriodName(year: number, month: number): string {
  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  return `${monthNames[month - 1]} ${year}`;
}

/**
 * Calcule le premier et dernier jour d'un mois
 */
function getMonthBoundaries(year: number, month: number): { start: string; end: string } {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0); // Dernier jour du mois

  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

/**
 * Vérifie si une période existe déjà
 */
async function periodExists(year: number, month: number): Promise<boolean> {
  const { data, error } = await supabase
    .from('reporting_periods')
    .select('id')
    .eq('fiscal_year', year)
    .eq('month_number', month)
    .maybeSingle();

  if (error) {
    console.error('Error checking period existence:', error);
    return false;
  }

  return data !== null;
}

/**
 * Crée une période de reporting
 */
async function createPeriod(year: number, month: number): Promise<{ success: boolean; error?: string }> {
  try {
    // Vérifier si elle existe déjà
    const exists = await periodExists(year, month);
    if (exists) {
      return { success: true }; // Déjà créée, pas d'erreur
    }

    const boundaries = getMonthBoundaries(year, month);
    const name = getPeriodName(year, month);

    const { error } = await supabase
      .from('reporting_periods')
      .insert({
        name,
        start_date: boundaries.start,
        end_date: boundaries.end,
        fiscal_year: year,
        month_number: month,
        is_locked: false,
      });

    if (error) {
      console.error('Error creating period:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Période créée : ${name}`);
    return { success: true };
  } catch (error: any) {
    console.error('Error in createPeriod:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Génère toutes les périodes de l'année de création (2011) jusqu'à aujourd'hui
 */
export async function generateHistoricalPeriods(): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const FOUNDING_YEAR = 2011;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 0-11 → 1-12

    let createdCount = 0;

    // Générer toutes les périodes depuis 2011 jusqu'au mois actuel
    for (let year = FOUNDING_YEAR; year <= currentYear; year++) {
      const maxMonth = year === currentYear ? currentMonth : 12;

      for (let month = 1; month <= maxMonth; month++) {
        const result = await createPeriod(year, month);
        if (result.success) {
          createdCount++;
        } else if (result.error) {
          console.error(`Erreur pour ${month}/${year}:`, result.error);
        }
      }
    }

    console.log(`✅ Génération terminée : ${createdCount} périodes vérifiées/créées`);
    return { success: true, count: createdCount };
  } catch (error: any) {
    console.error('Error in generateHistoricalPeriods:', error);
    return { success: false, count: 0, error: error.message };
  }
}

/**
 * S'assure que la période actuelle existe (appelé au chargement de l'app)
 * Cette fonction sera appelée automatiquement pour créer le mois en cours
 */
export async function ensureCurrentPeriodExists(): Promise<{ success: boolean; created: boolean }> {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const exists = await periodExists(year, month);

    if (!exists) {
      console.log(`🔄 Création automatique de la période : ${getPeriodName(year, month)}`);
      const result = await createPeriod(year, month);
      return { success: result.success, created: true };
    }

    return { success: true, created: false };
  } catch (error: any) {
    console.error('Error in ensureCurrentPeriodExists:', error);
    return { success: false, created: false };
  }
}

/**
 * Récupère toutes les périodes disponibles (non verrouillées et <= mois actuel)
 */
export async function getAvailablePeriods(): Promise<ReportingPeriod[]> {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const { data, error } = await supabase
      .from('reporting_periods')
      .select('*')
      .lte('fiscal_year', currentYear)
      .order('fiscal_year', { ascending: false })
      .order('month_number', { ascending: false });

    if (error) {
      console.error('Error fetching available periods:', error);
      return [];
    }

    // Filtrer pour ne garder que les périodes <= mois actuel
    const filtered = (data || []).filter(period => {
      if (period.fiscal_year < currentYear) {
        return true; // Toutes les années passées
      }
      if (period.fiscal_year === currentYear) {
        return period.month_number <= currentMonth; // Mois actuel ou passés de l'année en cours
      }
      return false; // Années futures (ne devrait pas arriver)
    });

    return filtered;
  } catch (error: any) {
    console.error('Error in getAvailablePeriods:', error);
    return [];
  }
}

/**
 * Récupère les périodes par année (pour le sélecteur)
 */
export async function getYearsWithPeriods(): Promise<number[]> {
  try {
    const { data, error } = await supabase
      .from('reporting_periods')
      .select('fiscal_year')
      .order('fiscal_year', { ascending: false });

    if (error) {
      console.error('Error fetching years:', error);
      return [];
    }

    // Extraire les années uniques
    const years = Array.from(new Set((data || []).map(p => p.fiscal_year)));
    return years;
  } catch (error: any) {
    console.error('Error in getYearsWithPeriods:', error);
    return [];
  }
}

/**
 * Récupère les périodes d'une année donnée (pour le sélecteur de mois)
 */
export async function getMonthsForYear(year: number): Promise<ReportingPeriod[]> {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const { data, error } = await supabase
      .from('reporting_periods')
      .select('*')
      .eq('fiscal_year', year)
      .order('month_number', { ascending: false });

    if (error) {
      console.error('Error fetching months for year:', error);
      return [];
    }

    // Si c'est l'année en cours, filtrer les mois futurs
    if (year === currentYear) {
      return (data || []).filter(p => p.month_number <= currentMonth);
    }

    return data || [];
  } catch (error: any) {
    console.error('Error in getMonthsForYear:', error);
    return [];
  }
}

/**
 * Vérifie si un rapport existe déjà pour une période donnée et une entité
 */
export async function checkReportExists(
  periodId: string,
  centerId?: string,
  houseChurchId?: string
): Promise<boolean> {
  try {
    let query = supabase
      .from('reports')
      .select('id')
      .eq('period_id', periodId);

    if (houseChurchId) {
      query = query.eq('house_church_id', houseChurchId);
    } else if (centerId) {
      query = query.eq('center_id', centerId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      console.error('Error checking report existence:', error);
      return false;
    }

    return data !== null;
  } catch (error: any) {
    console.error('Error in checkReportExists:', error);
    return false;
  }
}
