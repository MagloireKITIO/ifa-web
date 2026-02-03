'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { TopNavigation } from '@/components/layout/TopNavigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  FileEdit,
  TrendingUp,
  Users,
} from 'lucide-react';
import { getUserReports, getCenterHouseChurchesReports, getReportsStatistics, type FullReport } from '@/lib/api/reports';
import { loadDatabase } from '@/lib/api/db';

export default function RapportsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [reports, setReports] = useState<FullReport[]>([]);
  const [houseChurchReports, setHouseChurchReports] = useState<FullReport[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [currentPeriod, setCurrentPeriod] = useState<any>(null);
  const [entityName, setEntityName] = useState<string>('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    async function loadReportsData() {
      if (!user) return;

      try {
        setDataLoading(true);
        const db = await loadDatabase();

        // Trouver la période actuelle (non verrouillée)
        const openPeriods = db.reportingPeriods.filter((p) => !p.isLocked);
        if (openPeriods.length > 0) {
          setCurrentPeriod(openPeriods[0]);
        }

        // Charger les rapports selon le rôle
        const userReportsData = await getUserReports(user.id);
        setReports(userReportsData);

        // Pour center_lead et admin, charger aussi les rapports des house churches
        if (user.role === 'center_lead' && user.centerId) {
          const hcReports = await getCenterHouseChurchesReports(user.centerId);
          setHouseChurchReports(hcReports);

          const center = db.centers.find((c) => c.id === user.centerId);
          setEntityName(center?.name || 'Centre');
        } else if (user.role === 'house_lead' && user.houseChurchId) {
          const houseChurch = db.houseChurches.find((h) => h.id === user.houseChurchId);
          setEntityName(houseChurch?.name || 'Cellule');
        }

        // Pour admin, charger les statistiques globales
        if (user.role === 'admin') {
          const statistics = await getReportsStatistics();
          setStats(statistics);
        }
      } catch (error) {
        console.error('Erreur chargement rapports:', error);
      } finally {
        setDataLoading(false);
      }
    }

    if (user) {
      loadReportsData();
    }
  }, [user]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const canSubmitReport = user.role === 'house_lead' || user.role === 'center_lead';

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approuvé
          </Badge>
        );
      case 'submitted':
        return (
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
            <Clock className="w-3 h-3 mr-1" />
            En attente
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
            <XCircle className="w-3 h-3 mr-1" />
            Rejeté
          </Badge>
        );
      case 'draft':
        return (
          <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">
            <FileEdit className="w-3 h-3 mr-1" />
            Brouillon
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <TopNavigation />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {user.role === 'admin' ? 'Tous les Rapports' : 'Mes Rapports Mensuels'}
          </h1>
          {entityName && (
            <p className="text-muted-foreground">{entityName}</p>
          )}
        </div>

        {/* Statistiques Globales (Admin uniquement) */}
        {user.role === 'admin' && stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalReports}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.approvedReports}</p>
                  <p className="text-xs text-muted-foreground">Approuvés</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.submittedReports}</p>
                  <p className="text-xs text-muted-foreground">En attente</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.rejectedReports}</p>
                  <p className="text-xs text-muted-foreground">Rejetés</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">
                  <FileEdit className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.draftReports}</p>
                  <p className="text-xs text-muted-foreground">Brouillons</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Bouton Soumettre un Rapport */}
        {canSubmitReport && (
          <Card className="p-6 mb-6 bg-gradient-to-br from-green-50 to-blue-50 border-green-200">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold mb-2">
                  Soumettre un Nouveau Rapport
                </h2>
                {currentPeriod ? (
                  <p className="text-muted-foreground">
                    Période actuelle : <strong>{currentPeriod.name}</strong>
                  </p>
                ) : (
                  <p className="text-red-600 text-sm">
                    Aucune période de reporting ouverte
                  </p>
                )}
              </div>
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90"
                onClick={() => router.push('/rapports/nouveau')}
                disabled={!currentPeriod}
              >
                <Plus className="w-5 h-5 mr-2" />
                Nouveau Rapport
              </Button>
            </div>
          </Card>
        )}

        {/* Liste des Rapports */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {user.role === 'admin' ? 'Tous les Rapports' : 'Mes Rapports'}
          </h2>

          {dataLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-muted-foreground">Aucun rapport soumis</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/rapports/${report.id}`)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">{report.period?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {report.houseChurchName || report.centerName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-sm text-muted-foreground hidden sm:block">
                      {report.submittedAt
                        ? new Date(report.submittedAt).toLocaleDateString('fr-FR')
                        : 'Non soumis'}
                    </p>
                    {getStatusBadge(report.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Rapports des House Churches (Center Lead uniquement) */}
        {user.role === 'center_lead' && houseChurchReports.length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Rapports des Cellules
            </h2>
            <div className="space-y-3">
              {houseChurchReports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/rapports/${report.id}`)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">{report.houseChurchName}</p>
                      <p className="text-sm text-muted-foreground">
                        {report.period?.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-sm text-muted-foreground hidden sm:block">
                      Par {report.submitterName}
                    </p>
                    {getStatusBadge(report.status)}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
