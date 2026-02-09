'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '../StatCard';
import { HistoryTimeline } from '../HistoryTimeline';
import { EvolutionCharts } from '../EvolutionCharts';
import { InsightsPanel, generateInsights } from '../InsightsPanel';
import {
  Users,
  Building2,
  Home,
  MapPin,
  AlertCircle,
  Clock,
  TrendingUp,
} from 'lucide-react';
import {
  getOverviewKPIs,
  getMembersKPIs,
  getTimelineEvents,
  getHistoricalData,
  type OverviewKPIs,
  type TimelineEvent,
  type HistoricalData,
} from '@/lib/api/analytics';
import { useRouter } from 'next/navigation';

export function OverviewSection() {
  const router = useRouter();
  const [kpis, setKpis] = useState<OverviewKPIs | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [kpisData, timeline, historical] = await Promise.all([
          getOverviewKPIs(),
          getTimelineEvents(),
          getHistoricalData(),
        ]);
        setKpis(kpisData);
        setTimelineEvents(timeline);
        setHistoricalData(historical);
      } catch (error) {
        console.error('Error loading overview data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-24 bg-white rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!kpis) {
    return (
      <Card className="p-8">
        <div className="text-center text-muted-foreground">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Erreur de chargement des données</p>
        </div>
      </Card>
    );
  }

  // Générer les insights
  const insights = generateInsights({
    totalMembers: kpis.totalMembers,
    totalCenters: kpis.totalCenters,
    totalHouseChurches: kpis.totalHouseChurches,
    profileCompletionRate: kpis.profileCompletionRate,
    pendingSourcing: kpis.pendingSourcing,
    hasReports: false, // À déterminer
    hasWorshipData: false, // À déterminer
  });

  return (
    <div className="space-y-6">
      {/* Hero KPIs */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Indicateurs Clés</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            title="Membres Actifs"
            value={kpis.totalMembers}
            icon={Users}
            iconColor="text-blue-600"
            iconBgColor="bg-blue-50"
            subtitle="Total dans la base"
          />
          <StatCard
            title="Centres Actifs"
            value={kpis.totalCenters}
            icon={Building2}
            iconColor="text-green-600"
            iconBgColor="bg-green-50"
            subtitle={`Répartis en ${kpis.totalZones} zone${kpis.totalZones > 1 ? 's' : ''}`}
          />
          <StatCard
            title="Assemblées"
            value={kpis.totalHouseChurches}
            icon={Home}
            iconColor="text-purple-600"
            iconBgColor="bg-purple-50"
            subtitle="Maisons d'assemblée"
          />
        </div>
      </div>

      {/* Timeline Visuelle */}
      <div>
        <HistoryTimeline events={timelineEvents} />
      </div>

      {/* Graphiques d'Évolution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EvolutionCharts data={historicalData} type="members" />
        <EvolutionCharts data={historicalData} type="structure" />
      </div>

      {/* Insights & Recommandations */}
      {insights.length > 0 && <InsightsPanel insights={insights} />}

      {/* Structure Overview */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Structure Organisationnelle
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">Zones Géographiques</p>
                <p className="text-xs text-muted-foreground">
                  Couverture territoriale
                </p>
              </div>
            </div>
            <Badge className="text-lg px-3 py-1">{kpis.totalZones}</Badge>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium">Centres d'Église</p>
                <p className="text-xs text-muted-foreground">
                  Moyenne:{' '}
                  {Math.round(kpis.totalMembers / (kpis.totalCenters || 1))}{' '}
                  membres/centre
                </p>
              </div>
            </div>
            <Badge className="text-lg px-3 py-1">{kpis.totalCenters}</Badge>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Home className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium">Assemblées de Maison</p>
                <p className="text-xs text-muted-foreground">
                  Moyenne:{' '}
                  {Math.round(
                    kpis.totalMembers / (kpis.totalHouseChurches || 1)
                  )}{' '}
                  membres/assemblée
                </p>
              </div>
            </div>
            <Badge className="text-lg px-3 py-1">
              {kpis.totalHouseChurches}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Data Completion */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          État de Complétion des Données
        </h3>

        <div className="space-y-4">
          {/* Completion Bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Profils complétés</span>
              <span className="text-sm font-bold text-blue-600">
                {kpis.profileCompletionRate}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${
                  kpis.profileCompletionRate >= 70
                    ? 'bg-green-500'
                    : kpis.profileCompletionRate >= 40
                    ? 'bg-orange-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${kpis.profileCompletionRate}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Basé sur les données de contact disponibles
            </p>
          </div>

          {/* Pending Sourcing */}
          {kpis.pendingSourcing > 0 && (
            <div
              className="p-4 bg-orange-50 border border-orange-200 rounded-lg cursor-pointer hover:bg-orange-100 transition-colors"
              onClick={() => router.push('/membres')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="font-medium text-orange-900">
                      Profils en attente de validation
                    </p>
                    <p className="text-xs text-orange-700">
                      Cliquez pour valider les soumissions
                    </p>
                  </div>
                </div>
                <Badge className="bg-orange-500 text-white text-lg px-3 py-1">
                  {kpis.pendingSourcing}
                </Badge>
              </div>
            </div>
          )}

          {/* Info message */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>📊 Comment enrichir les données ?</strong>
              <br />
              <span className="text-blue-700">
                • Complétez les profils via le{' '}
                <button
                  onClick={() => router.push('/sourcing/public')}
                  className="underline font-medium hover:text-blue-900"
                >
                  formulaire de sourcing
                </button>
                <br />• Créez des{' '}
                <button
                  onClick={() => router.push('/rapports/nouveau')}
                  className="underline font-medium hover:text-blue-900"
                >
                  rapports mensuels
                </button>{' '}
                pour alimenter les statistiques
                <br />• Enregistrez les{' '}
                <button
                  onClick={() => router.push('/rapports/culte/nouveau')}
                  className="underline font-medium hover:text-blue-900"
                >
                  cultes hebdomadaires
                </button>
              </span>
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
