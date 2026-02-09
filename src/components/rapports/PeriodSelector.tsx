'use client';

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  getYearsWithPeriods,
  getMonthsForYear,
  checkReportExists,
  ensureCurrentPeriodExists,
  type ReportingPeriod,
} from '@/lib/api/periods';

interface PeriodSelectorProps {
  selectedPeriodId?: string;
  onPeriodChange: (periodId: string, periodName: string) => void;
  centerId?: string;
  houseChurchId?: string;
  className?: string;
}

export function PeriodSelector({
  selectedPeriodId,
  onPeriodChange,
  centerId,
  houseChurchId,
  className = '',
}: PeriodSelectorProps) {
  const [years, setYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [months, setMonths] = useState<ReportingPeriod[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<ReportingPeriod | null>(null);
  const [reportExists, setReportExists] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checkingReport, setCheckingReport] = useState(false);

  // Initialisation : S'assurer que la période actuelle existe
  useEffect(() => {
    ensureCurrentPeriodExists();
  }, []);

  // Charger les années disponibles
  useEffect(() => {
    async function loadYears() {
      try {
        setLoading(true);
        const availableYears = await getYearsWithPeriods();
        setYears(availableYears);

        // Par défaut : année actuelle
        const currentYear = new Date().getFullYear();
        if (availableYears.includes(currentYear)) {
          setSelectedYear(currentYear);
        } else if (availableYears.length > 0) {
          setSelectedYear(availableYears[0]);
        }
      } catch (error) {
        console.error('Erreur chargement années:', error);
      } finally {
        setLoading(false);
      }
    }

    loadYears();
  }, []);

  // Charger les mois quand l'année change
  useEffect(() => {
    async function loadMonths() {
      if (!selectedYear) return;

      try {
        const availableMonths = await getMonthsForYear(selectedYear);
        setMonths(availableMonths);

        // Par défaut : mois actuel (si même année) ou dernier mois
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;

        if (selectedYear === currentYear) {
          const currentPeriod = availableMonths.find(
            (m) => m.month_number === currentMonth
          );
          if (currentPeriod) {
            setSelectedMonth(currentPeriod);
          } else if (availableMonths.length > 0) {
            setSelectedMonth(availableMonths[0]);
          }
        } else {
          // Année passée : prendre le dernier mois (décembre)
          if (availableMonths.length > 0) {
            setSelectedMonth(availableMonths[0]);
          }
        }
      } catch (error) {
        console.error('Erreur chargement mois:', error);
      }
    }

    loadMonths();
  }, [selectedYear]);

  // Vérifier si un rapport existe pour cette période
  useEffect(() => {
    let cancelled = false;

    async function checkReport() {
      if (!selectedMonth) return;

      setCheckingReport(true);
      try {
        const exists = await checkReportExists(
          selectedMonth.id,
          centerId,
          houseChurchId
        );
        if (!cancelled) {
          setReportExists(exists);
        }
      } catch (error) {
        console.error('Erreur vérification rapport:', error);
        if (!cancelled) {
          setReportExists(false);
        }
      } finally {
        if (!cancelled) {
          setCheckingReport(false);
        }
      }
    }

    checkReport();

    return () => {
      cancelled = true;
    };
  }, [selectedMonth?.id, centerId, houseChurchId]);

  // Notifier le parent quand la période change (mais pas à l'initialisation)
  useEffect(() => {
    if (selectedMonth) {
      onPeriodChange(selectedMonth.id, selectedMonth.name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth?.id]); // Uniquement quand l'ID change

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedYear(parseInt(e.target.value));
    setSelectedMonth(null); // Reset le mois
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const periodId = e.target.value;
    const period = months.find((m) => m.id === periodId);
    if (period) {
      setSelectedMonth(period);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 bg-gray-200 rounded"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* En-tête */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center">
          <Calendar className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-semibold">Période de Reporting</h3>
          <p className="text-sm text-muted-foreground">
            Sélectionnez le mois pour lequel vous soumettez ce rapport
          </p>
        </div>
      </div>

      {/* Sélecteurs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Année */}
        <div className="space-y-2">
          <Label htmlFor="year" className="text-sm font-medium">
            Année <span className="text-red-500">*</span>
          </Label>
          <select
            id="year"
            value={selectedYear}
            onChange={handleYearChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-base font-medium"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        {/* Mois */}
        <div className="space-y-2">
          <Label htmlFor="month" className="text-sm font-medium">
            Mois <span className="text-red-500">*</span>
          </Label>
          <select
            id="month"
            value={selectedMonth?.id || ''}
            onChange={handleMonthChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-base font-medium"
            disabled={months.length === 0}
          >
            {months.length === 0 ? (
              <option>Aucun mois disponible</option>
            ) : (
              months.map((month) => (
                <option key={month.id} value={month.id}>
                  {month.name.split(' ')[0]}{' '}
                  {/* Afficher seulement le nom du mois */}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* Informations sur la période sélectionnée */}
      {selectedMonth && (
        <div className="space-y-3">
          {/* Résumé de la période */}
          <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-800 font-medium">
                  Rapport pour la période :
                </p>
                <p className="text-lg font-bold text-blue-900">
                  {selectedMonth.name}
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Du {new Date(selectedMonth.start_date).toLocaleDateString('fr-FR')}{' '}
                  au {new Date(selectedMonth.end_date).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          {/* Statut du rapport */}
          {checkingReport ? (
            <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
              <p className="text-sm text-gray-600">Vérification...</p>
            </div>
          ) : reportExists ? (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-900">
                  ⚠️ Un rapport existe déjà pour cette période
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  Vous ne pouvez pas soumettre un nouveau rapport. Consultez le rapport existant.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-green-50 border border-green-200 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-900">
                  ✅ Aucun rapport pour cette période
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Vous pouvez créer un nouveau rapport pour {selectedMonth.name}.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Aide contextuelle */}
      <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
        <p className="text-xs text-gray-600">
          💡 <strong>Astuce :</strong> Vous ne pouvez créer un rapport que pour des mois déjà écoulés. Les mois futurs ne sont pas disponibles.
        </p>
      </div>
    </div>
  );
}
