'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '../StatCard';
import { EmptyState } from '../EmptyState';
import {
  Users,
  UserCheck,
  Calendar,
  TrendingUp,
  Phone,
  AlertCircle,
} from 'lucide-react';
import {
  getMembersKPIs,
  type MembersKPIs,
} from '@/lib/api/analytics';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const COLORS = {
  blue: '#3B82F6',
  green: '#10B981',
  orange: '#F59E0B',
  purple: '#8B5CF6',
  red: '#EF4444',
  pink: '#EC4899',
};

export function MembersSection() {
  const [kpis, setKpis] = useState<MembersKPIs | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await getMembersKPIs();
        setKpis(data);
      } catch (error) {
        console.error('Error loading members KPIs:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-64 bg-white rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!kpis || kpis.totalMembers === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Aucun membre enregistré"
        description="Commencez par ajouter des membres via le formulaire de sourcing."
        actionLabel="Ajouter des membres"
        actionHref="/sourcing/public"
      />
    );
  }

  // Prepare age group data for pie chart
  const ageGroupData = kpis.ageGroupDistribution
    .filter((g) => g.group !== 'Non renseigné')
    .map((g) => ({
      name: g.group,
      value: g.count,
    }));

  const hasAgeData = ageGroupData.some((d) => d.value > 0);

  // Prepare center data for bar chart (top 8)
  const centerData = kpis.membersByCenter.slice(0, 8).map((c) => ({
    name: c.centerName.length > 15 ? c.centerName.substring(0, 15) + '...' : c.centerName,
    members: c.memberCount,
  }));

  return (
    <div className="space-y-6">
      {/* KPIs Grid */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Statistiques Membres</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Membres Totaux"
            value={kpis.totalMembers}
            icon={Users}
            iconColor="text-blue-600"
            iconBgColor="bg-blue-50"
          />
          <StatCard
            title="Baptisés"
            value={kpis.baptizedMembers}
            icon={UserCheck}
            iconColor="text-green-600"
            iconBgColor="bg-green-50"
            subtitle={`${kpis.baptismRate}% du total`}
          />
          <StatCard
            title="Âge Moyen"
            value={kpis.averageAge > 0 ? `${kpis.averageAge} ans` : 'N/A'}
            icon={Calendar}
            iconColor="text-purple-600"
            iconBgColor="bg-purple-50"
            subtitle={kpis.averageAge > 0 ? 'Calculé sur données disponibles' : 'Données manquantes'}
          />
          <StatCard
            title="Taux Complétion"
            value={`${kpis.completionStats.phoneRate}%`}
            icon={TrendingUp}
            iconColor="text-orange-600"
            iconBgColor="bg-orange-50"
            subtitle="Contacts disponibles"
          />
        </div>
      </div>

      {/* Répartition par Tranche d'Âge */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Répartition par Tranche d'Âge</h3>
        {hasAgeData ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={ageGroupData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {ageGroupData.map((entry, index) => (
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

            {/* Legend + Stats */}
            <div className="flex flex-col justify-center space-y-2">
              {kpis.ageGroupDistribution.map((group, index) => (
                <div
                  key={group.group}
                  className="flex items-center justify-between p-2 rounded hover:bg-gray-50"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded"
                      style={{
                        backgroundColor:
                          index === 0
                            ? COLORS.blue
                            : index === 1
                            ? COLORS.green
                            : index === 2
                            ? COLORS.orange
                            : index === 3
                            ? COLORS.purple
                            : COLORS.red,
                      }}
                    />
                    <span className="text-sm">{group.group}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold">{group.count}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      ({group.percentage}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Données d'âge non disponibles</p>
            <p className="text-xs mt-2">
              Complétez les profils pour afficher ce graphique
            </p>
          </div>
        )}
      </Card>

      {/* Répartition par Centre */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Membres par Centre (Top 8)</h3>
        {centerData.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={centerData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis type="number" tick={{ fill: '#6B7280', fontSize: 12 }} />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: '#6B7280', fontSize: 12 }}
                width={120}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="members" fill={COLORS.blue} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>Aucune donnée de répartition</p>
          </div>
        )}
      </Card>

      {/* Répartition par Zone */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Membres par Zone
        </h3>
        <div className="space-y-3">
          {kpis.membersByZone.map((zone, index) => (
            <div
              key={zone.zoneName}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    index === 0 ? 'bg-blue-100' : 'bg-green-100'
                  }`}
                >
                  <span
                    className={`font-bold ${
                      index === 0 ? 'text-blue-600' : 'text-green-600'
                    }`}
                  >
                    {zone.zoneName.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-medium">{zone.zoneName}</p>
                  <p className="text-xs text-muted-foreground">
                    {zone.percentage}% du total
                  </p>
                </div>
              </div>
              <Badge className="text-lg px-3 py-1">{zone.count}</Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* Complétion des Profils */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Phone className="w-5 h-5" />
          Complétion des Profils
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Téléphones */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Numéros de téléphone</span>
              <span className="text-sm font-bold">
                {kpis.completionStats.phoneRate}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full"
                style={{ width: `${kpis.completionStats.phoneRate}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {kpis.completionStats.withPhone} / {kpis.completionStats.totalMembers}
            </p>
          </div>

          {/* Dates de naissance */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Dates de naissance</span>
              <span className="text-sm font-bold">
                {kpis.completionStats.birthRate}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full"
                style={{ width: `${kpis.completionStats.birthRate}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {kpis.completionStats.withBirthYear} / {kpis.completionStats.totalMembers}
            </p>
          </div>

          {/* Conversion */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Année de conversion</span>
              <span className="text-sm font-bold">
                {kpis.completionStats.conversionRate}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-500 h-2 rounded-full"
                style={{ width: `${kpis.completionStats.conversionRate}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {kpis.completionStats.withConversionYear} / {kpis.completionStats.totalMembers}
            </p>
          </div>

          {/* Intégration IFA */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Intégration IFA</span>
              <span className="text-sm font-bold">
                {kpis.completionStats.joinedRate}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-orange-500 h-2 rounded-full"
                style={{ width: `${kpis.completionStats.joinedRate}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {kpis.completionStats.withJoinedYear} / {kpis.completionStats.totalMembers}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
