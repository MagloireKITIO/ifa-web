'use client';

import { Card } from '@/components/ui/card';
import { StatCard } from '../StatCard';
import { EmptyState } from '../EmptyState';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  AlertCircle,
} from 'lucide-react';
import { useFinancialKPIs } from '@/lib/react-query/hooks';
import { formatCurrency } from '@/lib/api/analytics';

export function FinancialSection() {
  // Utilisation du hook React Query avec cache intelligent
  const { data: kpis, isLoading: loading } = useFinancialKPIs();

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-64 bg-white rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!kpis || !kpis.hasData) {
    return (
      <EmptyState
        icon={DollarSign}
        title="Aucune donnée financière"
        description="Les statistiques financières seront disponibles une fois que des rapports mensuels avec données financières auront été soumis."
        actionLabel="Créer un rapport"
        actionHref="/rapports/nouveau"
      />
    );
  }

  const isHealthy = kpis.financialHealth >= 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold mb-2">Finances</h2>
        <p className="text-sm text-muted-foreground">
          Vue d'ensemble des revenus et dépenses cumulés
        </p>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Revenus Totaux"
          value={formatCurrency(kpis.totalRevenue)}
          icon={TrendingUp}
          iconColor="text-green-600"
          iconBgColor="bg-green-50"
          subtitle="Dîmes + Offrandes"
        />
        <StatCard
          title="Dépenses Totales"
          value={formatCurrency(kpis.totalExpenses)}
          icon={TrendingDown}
          iconColor="text-red-600"
          iconBgColor="bg-red-50"
          subtitle="Toutes catégories"
        />
        <StatCard
          title="Balance"
          value={formatCurrency(kpis.balance)}
          icon={Wallet}
          iconColor={kpis.balance >= 0 ? 'text-green-600' : 'text-red-600'}
          iconBgColor={kpis.balance >= 0 ? 'bg-green-50' : 'bg-red-50'}
          subtitle={kpis.balance >= 0 ? 'Excédent' : 'Déficit'}
        />
        <StatCard
          title="Santé Financière"
          value={`${kpis.financialHealth}%`}
          icon={isHealthy ? TrendingUp : AlertCircle}
          iconColor={isHealthy ? 'text-blue-600' : 'text-orange-600'}
          iconBgColor={isHealthy ? 'bg-blue-50' : 'bg-orange-50'}
          subtitle={isHealthy ? 'Excellente' : 'À surveiller'}
        />
      </div>

      {/* Détails Revenus */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-600" />
          Détails des Revenus
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-green-50 rounded-lg border border-green-100">
            <div className="flex items-center gap-3 mb-2">
              <PiggyBank className="w-5 h-5 text-green-600" />
              <span className="font-medium">Dîmes</span>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(kpis.tithes)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {kpis.totalRevenue > 0
                ? Math.round((kpis.tithes / kpis.totalRevenue) * 100)
                : 0}
              % des revenus totaux
            </p>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-5 h-5 text-blue-600" />
              <span className="font-medium">Offrandes</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(kpis.offerings)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {kpis.totalRevenue > 0
                ? Math.round((kpis.offerings / kpis.totalRevenue) * 100)
                : 0}
              % des revenus totaux
            </p>
          </div>
        </div>
      </Card>

      {/* Santé Financière */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Indicateur de Santé Financière</h3>
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              Ratio Revenus / Dépenses
            </span>
            <span className="text-lg font-bold">{kpis.financialHealth}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className={`h-4 rounded-full transition-all ${
                kpis.financialHealth >= 100
                  ? 'bg-green-500'
                  : kpis.financialHealth >= 80
                  ? 'bg-orange-500'
                  : 'bg-red-500'
              }`}
              style={{
                width: `${Math.min(kpis.financialHealth, 100)}%`,
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="p-4 bg-gray-50 rounded-lg text-center">
            <p className="text-xs text-muted-foreground mb-1">Revenus</p>
            <p className="text-lg font-bold text-green-600">
              {formatCurrency(kpis.totalRevenue)}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg text-center">
            <p className="text-xs text-muted-foreground mb-1">Dépenses</p>
            <p className="text-lg font-bold text-red-600">
              {formatCurrency(kpis.totalExpenses)}
            </p>
          </div>
          <div
            className={`p-4 rounded-lg text-center ${
              kpis.balance >= 0
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            <p className="text-xs text-muted-foreground mb-1">Balance</p>
            <p
              className={`text-lg font-bold ${
                kpis.balance >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {formatCurrency(kpis.balance)}
            </p>
          </div>
        </div>

        {/* Interprétation */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            <strong>📊 Interprétation :</strong>
            <br />
            {kpis.financialHealth >= 120 && (
              <span className="text-blue-700">
                ✅ Excellente santé financière ! Les revenus dépassent largement
                les dépenses.
              </span>
            )}
            {kpis.financialHealth >= 100 && kpis.financialHealth < 120 && (
              <span className="text-blue-700">
                ✅ Bonne santé financière. Les revenus couvrent les dépenses
                avec un léger excédent.
              </span>
            )}
            {kpis.financialHealth >= 80 && kpis.financialHealth < 100 && (
              <span className="text-orange-700">
                ⚠️ Attention : Les dépenses approchent les revenus. Surveillez
                les dépenses ou augmentez les revenus.
              </span>
            )}
            {kpis.financialHealth < 80 && (
              <span className="text-red-700">
                ❌ Déficit important. Les dépenses dépassent les revenus.
                Actions correctives nécessaires.
              </span>
            )}
          </p>
        </div>
      </Card>
    </div>
  );
}
