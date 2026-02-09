'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '../StatCard';
import { TrendingUp, MapPin, Building2, Home, Calendar } from 'lucide-react';
import {
  getExpansionKPIs,
  type ExpansionKPIs,
} from '@/lib/api/analytics';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const COLORS = {
  blue: '#3B82F6',
  green: '#10B981',
  orange: '#F59E0B',
  purple: '#8B5CF6',
};

export function ExpansionSection() {
  const [kpis, setKpis] = useState<ExpansionKPIs | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await getExpansionKPIs();
        setKpis(data);
      } catch (error) {
        console.error('Error loading expansion KPIs:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-64 bg-white rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!kpis) {
    return (
      <Card className="p-8">
        <div className="text-center text-muted-foreground">
          <p>Erreur de chargement des données d'expansion</p>
        </div>
      </Card>
    );
  }

  // Prepare data for pie chart
  const zoneData = kpis.centersByZone.map((z) => ({
    name: z.zoneName,
    value: z.count,
  }));

  // Group timeline by year
  const timelineByYear = kpis.centersTimeline.reduce((acc, center) => {
    if (!acc[center.year]) {
      acc[center.year] = [];
    }
    acc[center.year].push(center);
    return acc;
  }, {} as Record<number, typeof kpis.centersTimeline>);

  const years = Object.keys(timelineByYear)
    .map(Number)
    .sort((a, b) => b - a);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold mb-2">Expansion Géographique</h2>
        <p className="text-sm text-muted-foreground">
          Croissance et déploiement territorial
        </p>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Centres Géolocalisés"
          value={`${kpis.centersWithGPS}/${kpis.totalCentersWithGPS}`}
          icon={MapPin}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-50"
          subtitle={`${Math.round((kpis.centersWithGPS / kpis.totalCentersWithGPS) * 100)}% avec GPS`}
        />
        <StatCard
          title="Zones Couvertes"
          value={kpis.centersByZone.length}
          icon={TrendingUp}
          iconColor="text-green-600"
          iconBgColor="bg-green-50"
          subtitle="Zones géographiques"
        />
        <StatCard
          title="Centres Créés"
          value={kpis.centersTimeline.length}
          icon={Building2}
          iconColor="text-purple-600"
          iconBgColor="bg-purple-50"
          subtitle="Avec date de fondation"
        />
      </div>

      {/* Centres par Zone */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Répartition des Centres par Zone</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          {zoneData.length > 0 && (
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={zoneData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {zoneData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          index === 0
                            ? COLORS.blue
                            : index === 1
                            ? COLORS.green
                            : index === 2
                            ? COLORS.orange
                            : COLORS.purple
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* List */}
          <div className="space-y-2">
            {kpis.centersByZone.map((zone, index) => (
              <div
                key={zone.zoneName}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded"
                    style={{
                      backgroundColor:
                        index === 0
                          ? COLORS.blue
                          : index === 1
                          ? COLORS.green
                          : COLORS.orange,
                    }}
                  />
                  <span className="font-medium">{zone.zoneName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{zone.count}</span>
                  <span className="text-xs text-muted-foreground">
                    ({zone.percentage}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Timeline d'Expansion */}
      {years.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Chronologie d'Expansion
          </h3>
          <div className="space-y-4">
            {years.map((year) => (
              <div key={year}>
                <div className="flex items-center gap-3 mb-2">
                  <Badge className="text-lg px-3 py-1">{year}</Badge>
                  <div className="h-px bg-gray-300 flex-1" />
                </div>
                <div className="ml-6 space-y-2">
                  {timelineByYear[year].map((center) => (
                    <div
                      key={center.centerName}
                      className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg"
                    >
                      <Building2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {center.centerName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Zone: {center.zoneName}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Assemblées Timeline */}
      {kpis.housesTimeline.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Home className="w-5 h-5" />
            Création des Assemblées
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {kpis.housesTimeline.map((house) => (
              <div
                key={`${house.year}-${house.houseName}`}
                className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg"
              >
                <Badge variant="outline" className="flex-shrink-0">
                  {house.year}
                </Badge>
                <Home className="w-4 h-4 text-purple-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {house.houseName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    Centre: {house.centerName}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Info GPS */}
      {kpis.centersWithGPS < kpis.totalCentersWithGPS && (
        <Card className="p-6 bg-orange-50 border-orange-200">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-orange-900 mb-1">
                Géolocalisation Incomplète
              </h3>
              <p className="text-sm text-orange-700">
                {kpis.totalCentersWithGPS - kpis.centersWithGPS} centre(s) sur{' '}
                {kpis.totalCentersWithGPS} n'ont pas de coordonnées GPS. Ajoutez
                les coordonnées pour afficher une carte interactive de
                l'expansion géographique.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
