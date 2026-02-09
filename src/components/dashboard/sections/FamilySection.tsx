'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { StatCard } from '../StatCard';
import { EmptyState } from '../EmptyState';
import { Home, Heart, Baby, Users, MessageCircle } from 'lucide-react';
import {
  getFamilyKPIs,
  type FamilyKPIs,
} from '@/lib/api/analytics';

export function FamilySection() {
  const [kpis, setKpis] = useState<FamilyKPIs | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await getFamilyKPIs();
        setKpis(data);
      } catch (error) {
        console.error('Error loading family KPIs:', error);
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

  if (!kpis || !kpis.hasData) {
    return (
      <EmptyState
        icon={Home}
        title="Aucune donnée familiale"
        description="Les statistiques familiales seront disponibles une fois que des rapports mensuels avec données familiales auront été soumis."
        actionLabel="Créer un rapport"
        actionHref="/rapports/nouveau"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold mb-2">Famille & Communauté</h2>
        <p className="text-sm text-muted-foreground">
          Statistiques sur la vie familiale et le counseling
        </p>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Mariages Célébrés"
          value={kpis.totalMarriages}
          icon={Heart}
          iconColor="text-pink-600"
          iconBgColor="bg-pink-50"
          subtitle="Unions bénies"
        />
        <StatCard
          title="Naissances"
          value={kpis.totalBirths}
          icon={Baby}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-50"
          subtitle="Nouveaux-nés"
        />
        <StatCard
          title="Sessions Counseling"
          value={kpis.totalCounseling}
          icon={MessageCircle}
          iconColor="text-purple-600"
          iconBgColor="bg-purple-50"
          subtitle="Couples accompagnés"
        />
        <StatCard
          title="Fiançailles"
          value={kpis.totalEngagements}
          icon={Users}
          iconColor="text-orange-600"
          iconBgColor="bg-orange-50"
          subtitle="Couples fiancés"
        />
      </div>

      {/* Détails par Catégorie */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Unions & Célébrations */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-600" />
            Unions & Célébrations
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-pink-50 rounded-lg border border-pink-100">
              <div>
                <p className="font-medium">Mariages Célébrés</p>
                <p className="text-xs text-muted-foreground">
                  Cérémonies officielles
                </p>
              </div>
              <span className="text-2xl font-bold text-pink-600">
                {kpis.totalMarriages}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-100">
              <div>
                <p className="font-medium">Fiançailles</p>
                <p className="text-xs text-muted-foreground">
                  Couples engagés
                </p>
              </div>
              <span className="text-2xl font-bold text-orange-600">
                {kpis.totalEngagements}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div>
                <p className="font-medium">Naissances</p>
                <p className="text-xs text-muted-foreground">
                  Bébés dans la communauté
                </p>
              </div>
              <span className="text-2xl font-bold text-blue-600">
                {kpis.totalBirths}
              </span>
            </div>
          </div>
        </Card>

        {/* Accompagnement */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-purple-600" />
            Accompagnement & Counseling
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-100">
              <div>
                <p className="font-medium">Sessions de Counseling</p>
                <p className="text-xs text-muted-foreground">
                  Couples accompagnés
                </p>
              </div>
              <span className="text-2xl font-bold text-purple-600">
                {kpis.totalCounseling}
              </span>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">
                Membres mariés (profils)
              </p>
              <span className="text-2xl font-bold">
                {kpis.marriedMembers}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Résumé Global */}
      <Card className="p-6 bg-gradient-to-br from-pink-50 to-purple-50 border-pink-200">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Home className="w-5 h-5 text-pink-600" />
          Résumé de la Vie Familiale
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-muted-foreground mb-1">
              Total des événements familiaux
            </p>
            <p className="text-3xl font-bold text-pink-600">
              {kpis.totalMarriages +
                kpis.totalEngagements +
                kpis.totalBirths}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Mariages + Fiançailles + Naissances
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">
              Couples accompagnés
            </p>
            <p className="text-3xl font-bold text-purple-600">
              {kpis.totalCounseling}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Sessions de counseling effectuées
            </p>
          </div>
        </div>

        <div className="mt-6 p-4 bg-white rounded-lg border border-pink-200">
          <p className="text-xs text-pink-700">
            💒 <strong>Ministère familial :</strong> Ces statistiques reflètent
            l'accompagnement pastoral des familles et couples au sein de
            l'église. Continuez à créer des rapports pour suivre l'évolution.
          </p>
        </div>
      </Card>
    </div>
  );
}
