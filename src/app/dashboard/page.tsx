'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { TopNavigation } from '@/components/layout/TopNavigation';
import { KPICard } from '@/components/dashboard/KPICard';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  UserPlus,
  TrendingUp,
  Heart,
  BookOpen,
  DollarSign,
  Home,
  Download,
  Plus,
  Activity,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  getDashboardKPIs,
  getGenderDistribution,
  getMonthlyGrowth,
  getFinancialStats,
  getSpiritualStats,
  getFamilyStats,
  formatCurrency,
  type DashboardKPIs,
  type GenderDistribution,
  type MonthlyGrowth,
  type FinancialStats,
  type SpiritualStats,
  type FamilyStats,
} from '@/lib/api/dashboard';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [genderDist, setGenderDist] = useState<GenderDistribution | null>(null);
  const [monthlyGrowth, setMonthlyGrowth] = useState<MonthlyGrowth[]>([]);
  const [financialStats, setFinancialStats] = useState<FinancialStats | null>(
    null
  );
  const [spiritualStats, setSpiritualStats] = useState<SpiritualStats | null>(
    null
  );
  const [familyStats, setFamilyStats] = useState<FamilyStats | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setDataLoading(true);
        const [kpisData, genderData, growthData, finData, spirData, famData] =
          await Promise.all([
            getDashboardKPIs(),
            getGenderDistribution(),
            getMonthlyGrowth(),
            getFinancialStats(),
            getSpiritualStats(),
            getFamilyStats(),
          ]);

        setKpis(kpisData);
        setGenderDist(genderData);
        setMonthlyGrowth(growthData);
        setFinancialStats(finData);
        setSpiritualStats(spirData);
        setFamilyStats(famData);
      } catch (error) {
        console.error('Erreur chargement dashboard:', error);
      } finally {
        setDataLoading(false);
      }
    }

    if (user) {
      loadDashboardData();
    }
  }, [user]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const pieData = genderDist
    ? [
        { name: 'Hommes', value: genderDist.men, color: '#3B82F6' },
        { name: 'Femmes', value: genderDist.women, color: '#EC4899' },
        { name: 'Enfants', value: genderDist.children, color: '#F59E0B' },
      ]
    : [];

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Top Navigation */}
      <TopNavigation />

      {/* Hero Section avec dégradé bleu */}
      <section className="relative bg-gradient-to-br from-blue-600 to-blue-700 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/5" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2">
                Vue d'Ensemble - IFA Dashboard
              </h1>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-blue-100">
                <span className="text-xs sm:text-sm">Statistiques en temps réel</span>
                <span className="hidden sm:inline">•</span>
                <span className="text-xs sm:text-sm">
                  {kpis ? `${kpis.totalMembers} membres` : 'Chargement...'}
                </span>
              </div>
            </div>
            <Badge className="bg-white text-blue-700 hover:bg-white/90 whitespace-nowrap self-start sm:self-auto text-xs sm:text-sm px-2 sm:px-3 py-1">
              Dernière mise à jour : Aujourd'hui
            </Badge>
          </div>

          {/* 4 mini KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {dataLoading ? (
              <>
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-32 bg-white/10 rounded-xl animate-pulse"
                  />
                ))}
              </>
            ) : (
              <>
                <KPICard
                  title="Membres Totaux"
                  value={kpis?.totalMembers || 0}
                  icon={Users}
                  iconColor="text-blue-600"
                  iconBgColor="bg-blue-50"
                  trend={{
                    value: kpis?.trends.members || 0,
                    isPositive: (kpis?.trends.members || 0) > 0,
                  }}
                />
                <KPICard
                  title="Nouveaux Cette Semaine"
                  value={kpis?.newThisWeek || 0}
                  icon={UserPlus}
                  iconColor="text-green-600"
                  iconBgColor="bg-green-50"
                  trend={{
                    value: kpis?.trends.newMembers || 0,
                    isPositive: (kpis?.trends.newMembers || 0) > 0,
                  }}
                />
                <KPICard
                  title="Taux de Participation"
                  value={`${kpis?.participationRate || 0}%`}
                  icon={TrendingUp}
                  iconColor="text-orange-600"
                  iconBgColor="bg-orange-50"
                  trend={{
                    value: kpis?.trends.participation || 0,
                    isPositive: (kpis?.trends.participation || 0) > 0,
                  }}
                />
                <KPICard
                  title="Actions Sociales"
                  value={kpis?.socialActions || 0}
                  icon={Heart}
                  iconColor="text-pink-600"
                  iconBgColor="bg-pink-50"
                  trend={{
                    value: kpis?.trends.social || 0,
                    isPositive: (kpis?.trends.social || 0) > 0,
                  }}
                />
              </>
            )}
          </div>
        </div>
      </section>

      {/* Section Graphiques Principaux */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Graphique Croissance (60% / 3 colonnes) */}
          <Card className="lg:col-span-3 p-4 sm:p-6 bg-white shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-foreground">
                Croissance des Membres
              </h2>
              <select className="text-xs sm:text-sm border border-gray-200 rounded-lg px-2 sm:px-3 py-1.5 text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option>12 derniers mois</option>
                <option>6 derniers mois</option>
                <option>3 derniers mois</option>
              </select>
            </div>

            {dataLoading ? (
              <div className="h-80 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={monthlyGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                  />
                  <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="men"
                    name="Hommes"
                    fill="#3B82F6"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="women"
                    name="Femmes"
                    fill="#EC4899"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="children"
                    name="Enfants"
                    fill="#F59E0B"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* Graphique Répartition (40% / 2 colonnes) */}
          <Card className="lg:col-span-2 p-4 sm:p-6 bg-white shadow-md">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-4 sm:mb-6">
              Répartition par Genre
            </h2>

            {dataLoading ? (
              <div className="h-80 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>

                {/* Légende personnalisée */}
                <div className="w-full mt-4 space-y-2">
                  {pieData.map((entry) => (
                    <div
                      key={entry.name}
                      className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-sm text-muted-foreground">
                          {entry.name}
                        </span>
                      </div>
                      <span className="text-sm font-semibold">
                        {entry.value} (
                        {genderDist
                          ? Math.round((entry.value / genderDist.total) * 100)
                          : 0}
                        %)
                      </span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between py-2 pt-3 border-t-2 border-gray-200">
                    <span className="text-sm font-semibold">Total</span>
                    <span className="text-base font-bold">
                      {genderDist?.total || 0}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </section>

      {/* Section Statistiques Détaillées */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-6 sm:pb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Activités Spirituelles */}
          {dataLoading ? (
            <div className="h-64 bg-white rounded-xl animate-pulse" />
          ) : (
            <StatsCard
              title="Activités Spirituelles"
              icon={BookOpen}
              iconColor="text-blue-600"
              iconBgColor="bg-blue-50"
              stats={[
                {
                  label: 'Baptêmes (ce mois)',
                  value: spiritualStats?.baptisms || 0,
                },
                {
                  label: 'Nouveaux Convertis',
                  value: spiritualStats?.newConverts || 0,
                },
                {
                  label: 'Formations',
                  value: `${spiritualStats?.trainedPeople || 0} personnes`,
                },
              ]}
            />
          )}

          {/* Finances */}
          {dataLoading ? (
            <div className="h-64 bg-white rounded-xl animate-pulse" />
          ) : (
            <StatsCard
              title="Finances"
              icon={DollarSign}
              iconColor="text-green-600"
              iconBgColor="bg-green-50"
              stats={[
                {
                  label: 'Dîmes reçues',
                  value: formatCurrency(financialStats?.tithes || 0),
                },
                {
                  label: 'Offrandes',
                  value: formatCurrency(financialStats?.offerings || 0),
                },
                {
                  label: 'Dépenses',
                  value: formatCurrency(financialStats?.expenses || 0),
                },
              ]}
            />
          )}

          {/* Famille & Communauté */}
          {dataLoading ? (
            <div className="h-64 bg-white rounded-xl animate-pulse" />
          ) : (
            <StatsCard
              title="Famille & Communauté"
              icon={Home}
              iconColor="text-orange-600"
              iconBgColor="bg-orange-50"
              stats={[
                { label: 'Mariages', value: familyStats?.marriages || 0 },
                { label: 'Naissances', value: familyStats?.births || 0 },
                {
                  label: 'Sessions de counseling',
                  value: familyStats?.counselingSessions || 0,
                },
              ]}
            />
          )}
        </div>
      </section>

      {/* Section Actions Rapides */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-6 sm:pb-8">
        <Card className="p-6 bg-gray-50 border-gray-200">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => router.push('/membres')}
            >
              <Users className="w-4 h-4 mr-2" />
              Voir Tous les Membres
            </Button>
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => alert('Fonctionnalité en développement')}
            >
              <Download className="w-4 h-4 mr-2" />
              Exporter les Données
            </Button>
            <Button
              className="w-full sm:w-auto bg-primary hover:bg-primary/90"
              onClick={() => router.push('/sourcing')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Lancer Nouvelle Campagne
            </Button>
          </div>
        </Card>
      </section>
    </div>
  );
}
