'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useToast } from '@/components/ui/toast';
import { TopNavigation } from '@/components/layout/TopNavigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Church,
  Plus,
  CheckCircle,
  Clock,
  XCircle,
  Filter,
  Calendar,
  Users,
} from 'lucide-react';
import { getUserReports, type FullReport } from '@/lib/api/reports';
import { getUserWorshipAttendance, type WorshipAttendanceWithDetails } from '@/lib/api/worship';

type ViewType = 'monthly' | 'weekly';

export default function RapportsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [viewType, setViewType] = useState<ViewType>('monthly');
  const [monthlyReports, setMonthlyReports] = useState<FullReport[]>([]);
  const [weeklyReports, setWeeklyReports] = useState<WorshipAttendanceWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const loadData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Charger les rapports mensuels
      const monthly = await getUserReports(user.id);
      setMonthlyReports(monthly);

      // Charger les rapports hebdomadaires
      const weekly = await getUserWorshipAttendance(user.id);
      setWeeklyReports(weekly);
    } catch (error) {
      console.error('Erreur chargement:', error);
      showToast('error', 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

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
      default:
        return null;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) return null;

  const canSubmitReport = user.role === 'house_lead' || user.role === 'center_lead';

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <TopNavigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold mb-2">Gestion des Rapports</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {monthlyReports.length} rapports mensuels • {weeklyReports.length} rapports hebdomadaires
          </p>
        </div>

        {/* Tabs mobile - Type de rapport */}
        <div className="mb-4 md:hidden">
          <div className="flex gap-2">
            <button
              onClick={() => setViewType('monthly')}
              className={`flex-1 px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors min-h-[48px] ${
                viewType === 'monthly'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-white border hover:bg-gray-50'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span className="text-sm font-medium">Mensuels</span>
              <Badge variant={viewType === 'monthly' ? 'secondary' : 'outline'} className="text-xs">
                {monthlyReports.length}
              </Badge>
            </button>

            <button
              onClick={() => setViewType('weekly')}
              className={`flex-1 px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors min-h-[48px] ${
                viewType === 'weekly'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-white border hover:bg-gray-50'
              }`}
            >
              <Church className="w-4 h-4" />
              <span className="text-sm font-medium">Cultes</span>
              <Badge variant={viewType === 'weekly' ? 'secondary' : 'outline'} className="text-xs">
                {weeklyReports.length}
              </Badge>
            </button>
          </div>
        </div>

        {/* Layout: Sidebar + Main */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
          {/* Sidebar - Type de rapport (Desktop only) */}
          <div className="hidden md:block md:col-span-3">
            <Card className="p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Type de rapport
              </h3>

              <div className="space-y-1">
                {/* Rapports mensuels */}
                <button
                  onClick={() => setViewType('monthly')}
                  className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition-colors ${
                    viewType === 'monthly'
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <span className="text-sm flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Rapports mensuels
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {monthlyReports.length}
                  </Badge>
                </button>

                {/* Rapports hebdomadaires */}
                <button
                  onClick={() => setViewType('weekly')}
                  className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition-colors ${
                    viewType === 'weekly'
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <span className="text-sm flex items-center gap-2">
                    <Church className="w-4 h-4" />
                    Cultes (dimanches)
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {weeklyReports.length}
                  </Badge>
                </button>
              </div>
            </Card>
          </div>

          {/* Main - Contenu */}
          <div className="md:col-span-9">
            {/* Vue: Rapports Mensuels */}
            {viewType === 'monthly' && (
              <Card className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                  <h3 className="font-semibold flex items-center gap-2 text-base sm:text-lg">
                    <FileText className="w-5 h-5 flex-shrink-0" />
                    <span className="hidden sm:inline">Rapports Mensuels</span>
                    <Badge className="text-xs">{monthlyReports.length}</Badge>
                  </h3>

                  {canSubmitReport && (
                    <Button
                      onClick={() => router.push('/rapports/nouveau')}
                      className="w-full sm:w-auto min-h-[44px]"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Nouveau rapport
                    </Button>
                  )}
                </div>

                {monthlyReports.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-sm sm:text-base">Aucun rapport mensuel</p>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {monthlyReports.map((report) => (
                      <div
                        key={report.id}
                        className="border rounded-lg p-4 sm:p-5 hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => router.push(`/rapports/${report.id}`)}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                              <FileText className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-base truncate">{report.period?.name}</p>
                              <p className="text-sm text-muted-foreground truncate">
                                {report.houseChurchName || report.centerName}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              {report.submitted_at
                                ? new Date(report.submitted_at).toLocaleDateString('fr-FR')
                                : 'Non soumis'}
                            </p>
                            {getStatusBadge(report.status)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* Vue: Rapports Hebdomadaires */}
            {viewType === 'weekly' && (
              <Card className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                  <h3 className="font-semibold flex items-center gap-2 text-base sm:text-lg">
                    <Church className="w-5 h-5 flex-shrink-0" />
                    <span className="hidden sm:inline">Participation aux Cultes</span>
                    <Badge className="text-xs">{weeklyReports.length}</Badge>
                  </h3>

                  {canSubmitReport && (
                    <Button
                      onClick={() => router.push('/rapports/culte/nouveau')}
                      className="w-full sm:w-auto min-h-[44px]"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Ajouter un culte
                    </Button>
                  )}
                </div>

                {weeklyReports.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Church className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-sm sm:text-base">Aucun culte enregistré</p>
                    {canSubmitReport && (
                      <Button
                        variant="outline"
                        className="mt-4 min-h-[44px]"
                        onClick={() => router.push('/rapports/culte/nouveau')}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Ajouter le premier culte
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {weeklyReports.map((worship) => (
                      <div
                        key={worship.id}
                        className="border rounded-lg p-4 sm:p-5 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start gap-3 mb-4">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                            <Church className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm sm:text-base">
                              {new Date(worship.worship_date).toLocaleDateString('fr-FR', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              })}
                            </p>
                            <p className="text-xs sm:text-sm text-muted-foreground truncate">
                              {worship.center_name}
                              {worship.house_church_name && ` • ${worship.house_church_name}`}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
                          <div className="text-center">
                            <p className="text-xl sm:text-2xl font-bold text-blue-600">
                              {worship.men_count}
                            </p>
                            <p className="text-xs text-muted-foreground">Hommes</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xl sm:text-2xl font-bold text-pink-600">
                              {worship.women_count}
                            </p>
                            <p className="text-xs text-muted-foreground">Femmes</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xl sm:text-2xl font-bold text-green-600">
                              {worship.children_count}
                            </p>
                            <p className="text-xs text-muted-foreground">Enfants</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xl sm:text-2xl font-bold text-gray-900">
                              {worship.total_count}
                            </p>
                            <p className="text-xs text-muted-foreground">Total</p>
                          </div>
                        </div>

                        {worship.notes && (
                          <div className="mt-3 p-3 bg-blue-50 rounded text-sm text-blue-700">
                            <strong>Notes:</strong> {worship.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
