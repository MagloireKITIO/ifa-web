'use client';

import { Card } from '@/components/ui/card';
import { StatCard } from '../StatCard';
import { EmptyState } from '../EmptyState';
import { DashboardLoader } from '../DashboardLoader';
import {
  Heart,
  UserPlus,
  GraduationCap,
  HandHeart,
  Home as HomeIcon,
  Radio,
  Utensils,
  Users,
  FileText,
} from 'lucide-react';
import { useMinistryKPIs } from '@/lib/react-query/hooks';

export function MinistrySection() {
  // Utilisation du hook React Query avec cache intelligent
  const { data: kpis, isLoading: loading } = useMinistryKPIs();

  if (loading) {
    return <DashboardLoader loadingStates={[loading]} />;
  }

  if (!kpis || !kpis.hasData) {
    return (
      <EmptyState
        icon={Heart}
        title="Aucune donnée de ministère"
        description="Les statistiques de ministère seront disponibles une fois que des rapports mensuels auront été soumis."
        actionLabel="Créer un rapport"
        actionHref="/rapports/nouveau"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold mb-2">
          Ministère & Activités Spirituelles
        </h2>
        <p className="text-sm text-muted-foreground">
          Statistiques cumulées de toutes les activités depuis le début
        </p>
      </div>

      {/* 8 KPIs - Grid 2x4 */}
      <div>
        <h3 className="text-md font-semibold mb-4">
          Indicateurs Clés du Ministère
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KPI 1: Baptêmes */}
          <StatCard
            title="Baptêmes"
            value={kpis.totalBaptisms}
            icon={Heart}
            iconColor="text-blue-600"
            iconBgColor="bg-blue-50"
            subtitle="Total effectués"
          />

          {/* KPI 2: Nouveaux Convertis */}
          <StatCard
            title="Nouveaux Convertis"
            value={kpis.totalNewConverts}
            icon={UserPlus}
            iconColor="text-green-600"
            iconBgColor="bg-green-50"
            subtitle="Acceptations de Christ"
          />

          {/* KPI 3: Personnes Formées */}
          <StatCard
            title="Personnes Formées"
            value={kpis.totalTrainedPeople}
            icon={GraduationCap}
            iconColor="text-purple-600"
            iconBgColor="bg-purple-50"
            subtitle="Formations dispensées"
          />

          {/* KPI 4: Actions Sociales */}
          <StatCard
            title="Actions Sociales"
            value={kpis.totalSocialActions}
            icon={HandHeart}
            iconColor="text-pink-600"
            iconBgColor="bg-pink-50"
            subtitle="Œuvres caritatives"
          />

          {/* KPI 5: Visites à Domicile */}
          <StatCard
            title="Visites à Domicile"
            value={kpis.totalHomeVisits}
            icon={HomeIcon}
            iconColor="text-orange-600"
            iconBgColor="bg-orange-50"
            subtitle="Accompagnement pastoral"
          />

          {/* KPI 6: Campagnes d'Évangélisation */}
          <StatCard
            title="Évangélisations"
            value={kpis.totalEvangelismOutreach}
            icon={Radio}
            iconColor="text-indigo-600"
            iconBgColor="bg-indigo-50"
            subtitle="Sorties missionnaires"
          />

          {/* KPI 7: Repas Distribués */}
          <StatCard
            title="Repas Distribués"
            value={kpis.totalMealsDistributed}
            icon={Utensils}
            iconColor="text-yellow-600"
            iconBgColor="bg-yellow-50"
            subtitle="Aide alimentaire"
          />

          {/* KPI 8: Jeunes Mentorés */}
          <StatCard
            title="Jeunes Mentorés"
            value={kpis.totalYouthMentored}
            icon={Users}
            iconColor="text-teal-600"
            iconBgColor="bg-teal-50"
            subtitle="Mentorat jeunesse"
          />
        </div>
      </div>

      {/* Détails par Catégorie */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Croissance Spirituelle */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-blue-600" />
            Croissance Spirituelle
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium">Baptêmes</span>
              <span className="text-lg font-bold text-blue-600">
                {kpis.totalBaptisms}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="text-sm font-medium">Nouveaux Convertis</span>
              <span className="text-lg font-bold text-green-600">
                {kpis.totalNewConverts}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <span className="text-sm font-medium">Personnes Formées</span>
              <span className="text-lg font-bold text-purple-600">
                {kpis.totalTrainedPeople}
              </span>
            </div>
          </div>
        </Card>

        {/* Impact Social */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <HandHeart className="w-5 h-5 text-pink-600" />
            Impact Social & Communautaire
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-pink-50 rounded-lg">
              <span className="text-sm font-medium">Actions Sociales</span>
              <span className="text-lg font-bold text-pink-600">
                {kpis.totalSocialActions}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <span className="text-sm font-medium">Repas Distribués</span>
              <span className="text-lg font-bold text-yellow-600">
                {kpis.totalMealsDistributed}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <span className="text-sm font-medium">Visites à Domicile</span>
              <span className="text-lg font-bold text-orange-600">
                {kpis.totalHomeVisits}
              </span>
            </div>
          </div>
        </Card>

        {/* Mission & Jeunesse */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Radio className="w-5 h-5 text-indigo-600" />
            Mission & Évangélisation
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg">
              <span className="text-sm font-medium">
                Campagnes d'Évangélisation
              </span>
              <span className="text-lg font-bold text-indigo-600">
                {kpis.totalEvangelismOutreach}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-teal-50 rounded-lg">
              <span className="text-sm font-medium">Jeunes Mentorés</span>
              <span className="text-lg font-bold text-teal-600">
                {kpis.totalYouthMentored}
              </span>
            </div>
          </div>
        </Card>

        {/* Résumé Global */}
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Résumé de l'Impact
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Total des personnes touchées
              </p>
              <p className="text-3xl font-bold text-blue-600">
                {kpis.totalNewConverts +
                  kpis.totalTrainedPeople +
                  kpis.totalYouthMentored}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Total des activités réalisées
              </p>
              <p className="text-3xl font-bold text-purple-600">
                {kpis.totalBaptisms +
                  kpis.totalSocialActions +
                  kpis.totalHomeVisits +
                  kpis.totalEvangelismOutreach}
              </p>
            </div>
            <p className="text-xs text-blue-700 mt-4">
              📊 Ces statistiques sont basées sur les rapports mensuels soumis.
              Pour les enrichir, continuez à créer des rapports régulièrement.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
