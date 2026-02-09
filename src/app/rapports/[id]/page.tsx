'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { TopNavigation } from '@/components/layout/TopNavigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  FileEdit,
  DollarSign,
  Users,
  Heart,
  Briefcase,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import {
  getReportById,
  approveReport,
  rejectReport,
  type FullReport,
} from '@/lib/api/reports';
import { RejectDialog } from '@/components/rapports/RejectDialog';

export default function RapportDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading: authLoading } = useAuth();
  const [report, setReport] = useState<FullReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const reportId = params.id as string;

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function loadReport() {
      if (!reportId) return;

      try {
        setLoading(true);
        const reportData = await getReportById(reportId);
        setReport(reportData);
      } catch (error) {
        console.error('Erreur chargement rapport:', error);
      } finally {
        setLoading(false);
      }
    }

    if (user && reportId) {
      loadReport();
    }
  }, [user, reportId]);

  const handleApprove = async () => {
    if (!user || !reportId) return;

    setActionLoading(true);
    try {
      const result = await approveReport(reportId, user.id);
      if (result.success) {
        alert('✅ Rapport approuvé avec succès !');
        // Recharger le rapport
        const updatedReport = await getReportById(reportId);
        setReport(updatedReport);
      } else {
        alert('❌ Erreur : ' + (result.error || 'Impossible d\'approuver le rapport'));
      }
    } catch (error: any) {
      alert('❌ Erreur : ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (reason: string) => {
    if (!user || !reportId) return;

    setActionLoading(true);
    try {
      const result = await rejectReport(reportId, user.id, reason);
      if (result.success) {
        alert('✅ Rapport rejeté. Une notification a été envoyée à l\'auteur.');
        setShowRejectDialog(false);
        // Recharger le rapport
        const updatedReport = await getReportById(reportId);
        setReport(updatedReport);
      } else {
        alert('❌ Erreur : ' + (result.error || 'Impossible de rejeter le rapport'));
      }
    } catch (error: any) {
      alert('❌ Erreur : ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user || !report) {
    return (
      <div className="min-h-screen bg-[#FAFAFA]">
        <TopNavigation />
        <div className="max-w-4xl mx-auto px-6 py-12 text-center">
          <Card className="p-8">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-4">Rapport introuvable</h1>
            <Button onClick={() => router.push('/rapports')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour aux Rapports
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  // Vérifier les permissions pour approuver/rejeter
  const canApprove =
    user.role === 'admin' ||
    (user.role === 'center_lead' &&
      (report.center_id === user.center_id ||
        (report.house_church_id && report.centerName)));

  const isAuthor = report.submitted_by === user.id;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-lg px-4 py-1">
            <CheckCircle className="w-4 h-4 mr-1" />
            Approuvé
          </Badge>
        );
      case 'submitted':
        return (
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 text-lg px-4 py-1">
            <Clock className="w-4 h-4 mr-1" />
            En attente
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100 text-lg px-4 py-1">
            <XCircle className="w-4 h-4 mr-1" />
            Rejeté
          </Badge>
        );
      case 'draft':
        return (
          <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100 text-lg px-4 py-1">
            <FileEdit className="w-4 h-4 mr-1" />
            Brouillon
          </Badge>
        );
      default:
        return null;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' XAF';
  };

  const totalRevenue = (report.statsFinancial?.tithes || 0) +
    (report.statsFinancial?.offerings_general || 0) +
    (report.statsFinancial?.offerings_events || 0) +
    (report.statsFinancial?.offerings_investment || 0);

  const totalExpenses = (report.statsFinancial?.expense_admin || 0) +
    (report.statsFinancial?.expense_rent || 0) +
    (report.statsFinancial?.expense_mission || 0) +
    (report.statsFinancial?.expense_events || 0);

  const balance = totalRevenue - totalExpenses;

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <TopNavigation />

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* En-tête */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/rapports')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux Rapports
          </Button>

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Détail du Rapport</h1>
              <p className="text-lg text-muted-foreground">
                {report.period?.name} • {report.houseChurchName || report.centerName}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Soumis par {report.submitterName} le{' '}
                {report.submitted_at
                  ? new Date(report.submitted_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })
                  : 'Non soumis'}
              </p>
            </div>
            <div className="flex flex-col gap-3">
              {getStatusBadge(report.status)}
              {canApprove && report.status === 'submitted' && (
                <div className="flex gap-2">
                  <Button
                    onClick={handleApprove}
                    disabled={actionLoading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <ThumbsUp className="w-4 h-4 mr-2" />
                    Approuver
                  </Button>
                  <Button
                    onClick={() => setShowRejectDialog(true)}
                    disabled={actionLoading}
                    variant="destructive"
                  >
                    <ThumbsDown className="w-4 h-4 mr-2" />
                    Rejeter
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pilier Finances */}
        {report.statsFinancial && (
          <Card className="p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold">Pilier Finances</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Revenus */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-green-600">Revenus</h3>
                <div className="space-y-2">
                  <div className="flex justify-between p-3 bg-green-50 rounded-lg">
                    <span className="text-sm">Dîmes</span>
                    <span className="font-semibold">
                      {formatCurrency(report.statsFinancial.tithes)}
                    </span>
                  </div>
                  <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm">Offrandes générales</span>
                    <span className="font-semibold">
                      {formatCurrency(report.statsFinancial.offerings_general)}
                    </span>
                  </div>
                  <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm">Offrandes événements</span>
                    <span className="font-semibold">
                      {formatCurrency(report.statsFinancial.offerings_events)}
                    </span>
                  </div>
                  <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm">Offrandes investissement</span>
                    <span className="font-semibold">
                      {formatCurrency(report.statsFinancial.offerings_investment)}
                    </span>
                  </div>
                  <div className="flex justify-between p-3 bg-green-100 rounded-lg border-2 border-green-200">
                    <span className="font-semibold">Total Revenus</span>
                    <span className="font-bold text-green-600">
                      {formatCurrency(totalRevenue)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Dépenses */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-red-600">Dépenses</h3>
                <div className="space-y-2">
                  <div className="flex justify-between p-3 bg-red-50 rounded-lg">
                    <span className="text-sm">Administration</span>
                    <span className="font-semibold">
                      {formatCurrency(report.statsFinancial.expense_admin)}
                    </span>
                  </div>
                  <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm">Loyer</span>
                    <span className="font-semibold">
                      {formatCurrency(report.statsFinancial.expense_rent)}
                    </span>
                  </div>
                  <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm">Mission</span>
                    <span className="font-semibold">
                      {formatCurrency(report.statsFinancial.expense_mission)}
                    </span>
                  </div>
                  <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm">Événements</span>
                    <span className="font-semibold">
                      {formatCurrency(report.statsFinancial.expense_events)}
                    </span>
                  </div>
                  <div className="flex justify-between p-3 bg-red-100 rounded-lg border-2 border-red-200">
                    <span className="font-semibold">Total Dépenses</span>
                    <span className="font-bold text-red-600">
                      {formatCurrency(totalExpenses)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Solde */}
            <div
              className={`p-4 rounded-lg border-2 ${
                balance >= 0
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Solde</span>
                <span
                  className={`text-2xl font-bold ${
                    balance >= 0 ? 'text-blue-600' : 'text-red-600'
                  }`}
                >
                  {balance >= 0 ? '+' : ''}
                  {formatCurrency(balance)}
                </span>
              </div>
            </div>

            {report.statsFinancial.notes && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-semibold mb-2">Notes</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {report.statsFinancial.notes}
                </p>
              </div>
            )}
          </Card>
        )}

        {/* Contributions de membres (si house church) */}
        {report.memberContributions && report.memberContributions.length > 0 && (
          <Card className="p-6 mb-6">
            <h3 className="text-xl font-semibold mb-4">
              Contributions détaillées ({report.memberContributions.length} membre
              {report.memberContributions.length > 1 ? 's' : ''})
            </h3>
            <div className="space-y-2">
              {report.memberContributions.map((contrib) => (
                <div
                  key={contrib.id}
                  className="flex justify-between items-center p-3 bg-green-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{contrib.memberName}</p>
                    <p className="text-xs text-muted-foreground">
                      {contrib.memberPhone}
                    </p>
                  </div>
                  <p className="font-semibold text-green-600">
                    {formatCurrency(contrib.amount)}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Pilier Personnes */}
        {report.statsPeople && (
          <Card className="p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold">Pilier Personnes</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Présence Hommes</p>
                <p className="text-3xl font-bold text-purple-600">
                  {report.statsPeople.attendance_men}
                </p>
              </div>
              <div className="p-4 bg-pink-50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Présence Femmes</p>
                <p className="text-3xl font-bold text-pink-600">
                  {report.statsPeople.attendance_women}
                </p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Présence Enfants</p>
                <p className="text-3xl font-bold text-blue-600">
                  {report.statsPeople.attendance_children}
                </p>
              </div>
              <div className="p-4 bg-indigo-50 rounded-lg border-2 border-indigo-200">
                <p className="text-sm text-muted-foreground mb-1">Total Présence</p>
                <p className="text-3xl font-bold text-indigo-600">
                  {report.statsPeople.attendance_total}
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Nouveaux Convertis</p>
                <p className="text-3xl font-bold text-green-600">
                  {report.statsPeople.new_converts}
                </p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Nouveaux Visiteurs</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {report.statsPeople.first_timers}
                </p>
              </div>
              <div className="p-4 bg-cyan-50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Baptêmes</p>
                <p className="text-3xl font-bold text-cyan-600">
                  {report.statsPeople.baptisms}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Membres Actifs</p>
                <p className="text-3xl font-bold text-gray-700">
                  {report.statsPeople.members_active_end}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Pilier Famille */}
        {report.statsFamily && (
          <Card className="p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-pink-600 flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold">Pilier Famille</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-pink-50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Mariages</p>
                <p className="text-3xl font-bold text-pink-600">
                  {report.statsFamily.marriages}
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Fiançailles</p>
                <p className="text-3xl font-bold text-purple-600">
                  {report.statsFamily.engagements}
                </p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Naissances</p>
                <p className="text-3xl font-bold text-blue-600">
                  {report.statsFamily.births}
                </p>
              </div>
              <div className="p-4 bg-indigo-50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Couples Conseillés</p>
                <p className="text-3xl font-bold text-indigo-600">
                  {report.statsFamily.couples_counseled}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Pilier Activités */}
        {report.statsActivities && (
          <Card className="p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-orange-600 flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold">Pilier Activités</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-4 bg-orange-50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Personnes Formées</p>
                <p className="text-3xl font-bold text-orange-600">
                  {report.statsActivities.people_trained}
                </p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Pasteurs Certifiés</p>
                <p className="text-3xl font-bold text-red-600">
                  {report.statsActivities.pastors_certified}
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Actions Sociales</p>
                <p className="text-3xl font-bold text-green-600">
                  {report.statsActivities.social_actions_count}
                </p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Repas Distribués</p>
                <p className="text-3xl font-bold text-blue-600">
                  {report.statsActivities.meals_distributed}
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Jeunes Mentorés</p>
                <p className="text-3xl font-bold text-purple-600">
                  {report.statsActivities.youth_mentored}
                </p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Visites à Domicile</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {report.statsActivities.home_visits}
                </p>
              </div>
              <div className="p-4 bg-cyan-50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Campagnes d'Évangélisation</p>
                <p className="text-3xl font-bold text-cyan-600">
                  {report.statsActivities.evangelism_outreach_count}
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Dialog de rejet */}
      <RejectDialog
        open={showRejectDialog}
        onClose={() => setShowRejectDialog(false)}
        onReject={handleReject}
        loading={actionLoading}
      />
    </div>
  );
}
