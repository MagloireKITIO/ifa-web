'use client';

import { Card } from '@/components/ui/card';
import { TrendingUp, Building2, Users, DollarSign } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface YearData {
  year: number;
  members?: number;
  centers?: number;
  houses?: number;
  revenue?: number;
  expenses?: number;
}

interface EvolutionChartsProps {
  data: YearData[];
  type: 'members' | 'structure' | 'financial';
}

export function EvolutionCharts({ data, type }: EvolutionChartsProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground py-12">
          <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Données d'évolution non disponibles</p>
          <p className="text-xs mt-2">
            Les graphiques apparaîtront lorsque des données historiques seront
            enregistrées
          </p>
        </div>
      </Card>
    );
  }

  return (
    <>
      {type === 'members' && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Évolution des Membres (2011-2026)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="year"
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
              <Line
                type="monotone"
                dataKey="members"
                name="Membres"
                stroke="#3B82F6"
                strokeWidth={3}
                dot={{ fill: '#3B82F6', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-xs text-muted-foreground mt-4 text-center">
            📈 Croissance totale:{' '}
            {data.length > 1
              ? `${data[data.length - 1].members! - data[0].members!} membres`
              : 'N/A'}
          </p>
        </Card>
      )}

      {type === 'structure' && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-green-600" />
            Croissance de la Structure (Centres & Assemblées)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="year"
                tick={{ fill: '#6B7280', fontSize: 12 }}
              />
              <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar
                dataKey="centers"
                name="Centres"
                fill="#10B981"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="houses"
                name="Assemblées"
                fill="#8B5CF6"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-muted-foreground mt-4 text-center">
            🏢 Centres: {data[data.length - 1]?.centers || 0} • 🏠 Assemblées:{' '}
            {data[data.length - 1]?.houses || 0}
          </p>
        </Card>
      )}

      {type === 'financial' && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            Évolution Financière (Revenus vs Dépenses)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="year"
                tick={{ fill: '#6B7280', fontSize: 12 }}
              />
              <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="revenue"
                name="Revenus"
                stroke="#10B981"
                fill="#10B981"
                fillOpacity={0.3}
              />
              <Area
                type="monotone"
                dataKey="expenses"
                name="Dépenses"
                stroke="#EF4444"
                fill="#EF4444"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-2 gap-4 text-center">
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-xs text-muted-foreground">Total Revenus</p>
              <p className="text-lg font-bold text-green-600">
                {data.reduce((sum, d) => sum + (d.revenue || 0), 0).toLocaleString()} XAF
              </p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <p className="text-xs text-muted-foreground">Total Dépenses</p>
              <p className="text-lg font-bold text-red-600">
                {data.reduce((sum, d) => sum + (d.expenses || 0), 0).toLocaleString()} XAF
              </p>
            </div>
          </div>
        </Card>
      )}
    </>
  );
}
