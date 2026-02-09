'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Filter, RotateCcw } from 'lucide-react';

export interface FilterState {
  year: number | null; // null = "Toutes"
  month: number | null; // null = "Tous"
  zoneId: string | null;
  centerId: string | null;
  houseChurchId: string | null;
  startDate: string | null;
  endDate: string | null;
}

interface Zone {
  id: string;
  name: string;
}

interface Center {
  id: string;
  name: string;
  zone_id: string;
}

interface HouseChurch {
  id: string;
  name: string;
  center_id: string;
}

interface PeriodFilterProps {
  onFilterChange: (filters: FilterState) => void;
  zones: Zone[];
  centers: Center[];
  houseChurches: HouseChurch[];
}

const MONTHS = [
  { value: 1, label: 'Janvier' },
  { value: 2, label: 'Février' },
  { value: 3, label: 'Mars' },
  { value: 4, label: 'Avril' },
  { value: 5, label: 'Mai' },
  { value: 6, label: 'Juin' },
  { value: 7, label: 'Juillet' },
  { value: 8, label: 'Août' },
  { value: 9, label: 'Septembre' },
  { value: 10, label: 'Octobre' },
  { value: 11, label: 'Novembre' },
  { value: 12, label: 'Décembre' },
];

export function PeriodFilter({
  onFilterChange,
  zones,
  centers,
  houseChurches,
}: PeriodFilterProps) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2010 }, (_, i) => 2011 + i);

  const [filters, setFilters] = useState<FilterState>({
    year: null,
    month: null,
    zoneId: null,
    centerId: null,
    houseChurchId: null,
    startDate: null,
    endDate: null,
  });

  // Filtrer les centres par zone sélectionnée
  const filteredCenters = filters.zoneId
    ? centers.filter((c) => c.zone_id === filters.zoneId)
    : centers;

  // Filtrer les assemblées par centre sélectionné
  const filteredHouseChurches = filters.centerId
    ? houseChurches.filter((h) => h.center_id === filters.centerId)
    : houseChurches;

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    const newFilters = { ...filters, [key]: value };

    // Reset cascading filters
    if (key === 'zoneId') {
      newFilters.centerId = null;
      newFilters.houseChurchId = null;
    }
    if (key === 'centerId') {
      newFilters.houseChurchId = null;
    }

    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleReset = () => {
    const resetFilters: FilterState = {
      year: null,
      month: null,
      zoneId: null,
      centerId: null,
      houseChurchId: null,
      startDate: null,
      endDate: null,
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== null);

  return (
    <Card className="p-4 sm:p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Filtres
        </h3>
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="text-xs"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Réinitialiser
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Année */}
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-2">
            📅 Année
          </label>
          <select
            value={filters.year || ''}
            onChange={(e) =>
              handleFilterChange(
                'year',
                e.target.value ? Number(e.target.value) : null
              )
            }
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Toutes les années</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        {/* Mois */}
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-2">
            📆 Mois
          </label>
          <select
            value={filters.month || ''}
            onChange={(e) =>
              handleFilterChange(
                'month',
                e.target.value ? Number(e.target.value) : null
              )
            }
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            disabled={!filters.year}
          >
            <option value="">Tous les mois</option>
            {MONTHS.map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
        </div>

        {/* Zone */}
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-2">
            🗺️ Zone
          </label>
          <select
            value={filters.zoneId || ''}
            onChange={(e) => handleFilterChange('zoneId', e.target.value || null)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Toutes les zones</option>
            {zones.map((zone) => (
              <option key={zone.id} value={zone.id}>
                {zone.name}
              </option>
            ))}
          </select>
        </div>

        {/* Centre */}
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-2">
            🏢 Centre
          </label>
          <select
            value={filters.centerId || ''}
            onChange={(e) =>
              handleFilterChange('centerId', e.target.value || null)
            }
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            disabled={filteredCenters.length === 0}
          >
            <option value="">Tous les centres</option>
            {filteredCenters.map((center) => (
              <option key={center.id} value={center.id}>
                {center.name}
              </option>
            ))}
          </select>
        </div>

        {/* Assemblée */}
        <div className="md:col-span-2 lg:col-span-1">
          <label className="text-xs font-medium text-muted-foreground block mb-2">
            🏠 Assemblée
          </label>
          <select
            value={filters.houseChurchId || ''}
            onChange={(e) =>
              handleFilterChange('houseChurchId', e.target.value || null)
            }
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            disabled={filteredHouseChurches.length === 0}
          >
            <option value="">Toutes les assemblées</option>
            {filteredHouseChurches.map((house) => (
              <option key={house.id} value={house.id}>
                {house.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Filtres actifs */}
      {hasActiveFilters && (
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="text-xs text-muted-foreground">Filtres actifs:</span>
          {filters.year && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
              📅 {filters.year}
            </span>
          )}
          {filters.month && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
              📆 {MONTHS.find((m) => m.value === filters.month)?.label}
            </span>
          )}
          {filters.zoneId && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
              🗺️ {zones.find((z) => z.id === filters.zoneId)?.name}
            </span>
          )}
          {filters.centerId && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
              🏢 {centers.find((c) => c.id === filters.centerId)?.name}
            </span>
          )}
          {filters.houseChurchId && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs">
              🏠{' '}
              {houseChurches.find((h) => h.id === filters.houseChurchId)?.name}
            </span>
          )}
        </div>
      )}
    </Card>
  );
}
