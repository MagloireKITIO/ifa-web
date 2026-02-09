'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import {
  Lightbulb,
  AlertTriangle,
  TrendingUp,
  CheckCircle,
  Target,
  ArrowRight,
} from 'lucide-react';

export interface Insight {
  type: 'info' | 'warning' | 'success' | 'goal';
  icon: any;
  title: string;
  description: string;
  action?: string;
  actionHref?: string;
}

interface InsightsPanelProps {
  insights: Insight[];
}

export function InsightsPanel({ insights }: InsightsPanelProps) {
  const router = useRouter();

  if (!insights || insights.length === 0) {
    return null;
  }

  const getInsightStyle = (type: string) => {
    switch (type) {
      case 'warning':
        return {
          bg: 'bg-orange-50',
          border: 'border-orange-200',
          iconBg: 'bg-orange-100',
          iconColor: 'text-orange-600',
          textColor: 'text-orange-900',
        };
      case 'success':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          iconBg: 'bg-green-100',
          iconColor: 'text-green-600',
          textColor: 'text-green-900',
        };
      case 'goal':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          textColor: 'text-blue-900',
        };
      default: // info
        return {
          bg: 'bg-purple-50',
          border: 'border-purple-200',
          iconBg: 'bg-purple-100',
          iconColor: 'text-purple-600',
          textColor: 'text-purple-900',
        };
    }
  };

  return (
    <Card className="p-6">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <Lightbulb className="w-5 h-5 text-yellow-600" />
        Insights & Recommandations
      </h3>

      <div className="space-y-3">
        {insights.map((insight, index) => {
          const Icon = insight.icon;
          const style = getInsightStyle(insight.type);

          return (
            <div
              key={index}
              className={`p-4 rounded-lg border ${style.bg} ${style.border}`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-lg ${style.iconBg} flex items-center justify-center flex-shrink-0`}
                >
                  <Icon className={`w-5 h-5 ${style.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-sm ${style.textColor}`}>
                    {insight.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {insight.description}
                  </p>
                  {insight.action && insight.actionHref && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(insight.actionHref!)}
                      className="mt-3 text-xs h-8"
                    >
                      {insight.action}
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// Helper function to generate insights based on data
export function generateInsights(data: {
  totalMembers: number;
  totalCenters: number;
  totalHouseChurches: number;
  profileCompletionRate: number;
  pendingSourcing: number;
  centersDistribution?: Array<{ centerName: string; memberCount: number; percentage: number }>;
  hasReports: boolean;
  hasWorshipData: boolean;
}): Insight[] {
  const insights: Insight[] = [];

  // Insight 1: Taux de complétion des profils
  if (data.profileCompletionRate < 30) {
    insights.push({
      type: 'warning',
      icon: AlertTriangle,
      title: `Seulement ${data.profileCompletionRate}% des profils sont complets`,
      description:
        'La plupart des membres n\'ont pas de données de contact. Lancez une campagne de sourcing pour enrichir les profils.',
      action: 'Lancer le sourcing',
      actionHref: '/sourcing/public',
    });
  } else if (data.profileCompletionRate >= 70) {
    insights.push({
      type: 'success',
      icon: CheckCircle,
      title: `Excellent ! ${data.profileCompletionRate}% des profils sont complets`,
      description:
        'Vos données membres sont bien renseignées. Continuez les efforts pour atteindre 100%.',
    });
  }

  // Insight 2: Soumissions en attente
  if (data.pendingSourcing > 0) {
    insights.push({
      type: 'info',
      icon: Lightbulb,
      title: `${data.pendingSourcing} profil${data.pendingSourcing > 1 ? 's' : ''} en attente de validation`,
      description:
        'Des membres ont soumis des informations. Validez-les pour enrichir votre base de données.',
      action: 'Voir les soumissions',
      actionHref: '/membres',
    });
  }

  // Insight 3: Distribution des membres
  if (data.centersDistribution && data.centersDistribution.length > 0) {
    const topCenter = data.centersDistribution[0];
    if (topCenter.percentage > 35) {
      insights.push({
        type: 'warning',
        icon: AlertTriangle,
        title: `${topCenter.centerName} représente ${topCenter.percentage}% de vos membres`,
        description:
          'Une forte concentration dans un seul centre peut indiquer un besoin de subdivision ou de création de nouvelles assemblées.',
      });
    }
  }

  // Insight 4: Ratio membres/assemblées
  const membersPerHouse = Math.round(data.totalMembers / data.totalHouseChurches);
  if (membersPerHouse > 15) {
    insights.push({
      type: 'goal',
      icon: Target,
      title: `Moyenne de ${membersPerHouse} membres par assemblée`,
      description:
        'Certaines assemblées pourraient être surchargées. Envisagez de créer de nouvelles assemblées pour un meilleur encadrement.',
      action: 'Voir les membres',
      actionHref: '/membres',
    });
  } else if (membersPerHouse >= 8 && membersPerHouse <= 15) {
    insights.push({
      type: 'success',
      icon: CheckCircle,
      title: `Excellente répartition : ${membersPerHouse} membres/assemblée`,
      description:
        'La taille de vos assemblées est idéale pour un bon encadrement pastoral.',
    });
  }

  // Insight 5: Rapports manquants
  if (!data.hasReports) {
    insights.push({
      type: 'warning',
      icon: AlertTriangle,
      title: 'Aucun rapport mensuel enregistré',
      description:
        'Pour avoir des statistiques détaillées (finances, baptêmes, etc.), créez des rapports mensuels régulièrement.',
      action: 'Créer un rapport',
      actionHref: '/rapports/nouveau',
    });
  }

  // Insight 6: Cultes manquants
  if (!data.hasWorshipData) {
    insights.push({
      type: 'info',
      icon: Lightbulb,
      title: 'Aucun culte enregistré',
      description:
        'Enregistrez les participations aux cultes hebdomadaires pour suivre l\'assiduité des membres.',
      action: 'Enregistrer un culte',
      actionHref: '/rapports/culte/nouveau',
    });
  }

  // Insight 7: Croissance projetée
  if (data.totalMembers >= 400) {
    const projectedMembers = Math.round(data.totalMembers * 1.1); // +10%
    insights.push({
      type: 'goal',
      icon: TrendingUp,
      title: 'Projection : 500+ membres atteignables',
      description: `Avec une croissance de 10%, vous pourriez atteindre ${projectedMembers} membres d'ici la fin de l'année. Continuez vos efforts !`,
    });
  }

  return insights;
}
