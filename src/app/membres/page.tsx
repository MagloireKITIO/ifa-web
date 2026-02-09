'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useToast } from '@/components/ui/toast';
import { TopNavigation } from '@/components/layout/TopNavigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Users,
  Clock,
  Search,
  Phone,
  Calendar,
  MapPin,
  CheckCircle,
  XCircle,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  Filter,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Member } from '@/lib/api/members';
import {
  getPendingSourcing,
  approveSourcing,
  rejectSourcing,
  type SourcingResponse,
} from '@/lib/api/sourcing';
import { RejectDialog } from '@/components/rapports/RejectDialog';

type FilterView = 'all' | 'pending';

export default function MembresPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [members, setMembers] = useState<Member[]>([]);
  const [pendingSubmissions, setPendingSubmissions] = useState<SourcingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterView, setFilterView] = useState<FilterView>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<SourcingResponse | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const isAdmin = user?.role === 'admin' || user?.role === 'center_lead';

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Charger tous les membres
      const { data: membersData, error: membersError } = await supabase
        .from('members')
        .select(`
          *,
          centers(id, name),
          house_churches(id, name)
        `)
        .order('full_name');

      if (membersError) throw membersError;
      setMembers(membersData || []);

      // Charger les soumissions en attente (si admin)
      if (isAdmin) {
        const pending = await getPendingSourcing();
        setPendingSubmissions(pending);
      }
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

  // Filtrer les membres selon la recherche
  const filteredMembers = members.filter((member) => {
    const matchSearch = member.full_name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchSearch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedMembers = filteredMembers.slice(startIndex, endIndex);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Approuver une soumission
  const handleApprove = async (responseId: string) => {
    setActionLoading(responseId);
    try {
      const result = await approveSourcing(responseId);
      if (result.success) {
        showToast('success', 'Profil approuvé et fusionné !');
        loadData();
      } else {
        showToast('error', result.error || 'Erreur');
      }
    } catch (error: any) {
      showToast('error', error.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Rejeter une soumission
  const handleRejectClick = (submission: SourcingResponse) => {
    setSelectedSubmission(submission);
    setShowRejectDialog(true);
  };

  const handleReject = async (reason: string) => {
    if (!selectedSubmission) return;

    setActionLoading(selectedSubmission.id);
    try {
      const result = await rejectSourcing(selectedSubmission.id, reason);
      if (result.success) {
        showToast('success', 'Soumission rejetée');
        setShowRejectDialog(false);
        setSelectedSubmission(null);
        loadData();
      } else {
        showToast('error', result.error || 'Erreur');
      }
    } catch (error: any) {
      showToast('error', error.message);
    } finally {
      setActionLoading(null);
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

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <TopNavigation />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Gestion des Membres</h1>
          <p className="text-sm text-muted-foreground">
            {members.length} membres • {pendingSubmissions.length} en attente de validation
          </p>
        </div>

        {/* Layout: Sidebar + Main */}
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar - Filtres */}
          <div className="col-span-12 md:col-span-3">
            <Card className="p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filtres
              </h3>

              <div className="space-y-1">
                {/* Tous */}
                <button
                  onClick={() => setFilterView('all')}
                  className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition-colors ${
                    filterView === 'all'
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <span className="text-sm">Tous les membres</span>
                  <Badge variant="outline" className="text-xs">
                    {members.length}
                  </Badge>
                </button>

                {/* En attente de validation */}
                {isAdmin && (
                  <button
                    onClick={() => setFilterView('pending')}
                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition-colors ${
                      filterView === 'pending'
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-sm flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      En attente
                    </span>
                    {pendingSubmissions.length > 0 && (
                      <Badge className="bg-orange-500 text-white text-xs">
                        {pendingSubmissions.length}
                      </Badge>
                    )}
                  </button>
                )}
              </div>
            </Card>
          </div>

          {/* Main - Contenu */}
          <div className="col-span-12 md:col-span-9">
            {/* Vue: Tous les membres */}
            {filterView === 'all' && (
              <Card className="p-6">
                {/* Recherche */}
                <div className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      type="text"
                      placeholder="Rechercher par nom..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* En-tête tableau */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Membres
                    <Badge>{filteredMembers.length}</Badge>
                  </h3>

                  {/* Items per page */}
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Afficher:</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="border rounded-md px-2 py-1"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                    <span className="text-muted-foreground">par page</span>
                  </div>
                </div>

                {/* Tableau responsive */}
                {filteredMembers.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Aucun membre trouvé</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      {paginatedMembers.map((member) => (
                      <div
                        key={member.id}
                        className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          {/* Info membre */}
                          <div className="flex items-start gap-3 flex-1">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary flex-shrink-0">
                              {member.full_name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-lg">{member.full_name}</p>

                              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
                                {member.phone && (
                                  <span className="flex items-center gap-1">
                                    <Phone className="w-3.5 h-3.5" />
                                    {member.phone}
                                  </span>
                                )}
                                {member.birth_year && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5" />
                                    Né(e) en {member.birth_year}
                                  </span>
                                )}
                                {(member as any).centers && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5" />
                                    {(member as any).centers.name}
                                  </span>
                                )}
                              </div>

                              <div className="flex flex-wrap gap-2 mt-2">
                                {member.is_baptized && (
                                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                    Baptisé
                                  </Badge>
                                )}
                                {member.conversion_year && (
                                  <Badge variant="outline" className="text-xs">
                                    Converti en {member.conversion_year}
                                  </Badge>
                                )}
                                {member.joined_ifa_year && (
                                  <Badge variant="outline" className="text-xs">
                                    IFA depuis {member.joined_ifa_year}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-6 border-t">
                        <div className="text-sm text-muted-foreground">
                          Affichage de {startIndex + 1} à {Math.min(endIndex, filteredMembers.length)} sur {filteredMembers.length} membres
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                          >
                            Précédent
                          </Button>

                          <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                              let pageNum;
                              if (totalPages <= 5) {
                                pageNum = i + 1;
                              } else if (currentPage <= 3) {
                                pageNum = i + 1;
                              } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                              } else {
                                pageNum = currentPage - 2 + i;
                              }

                              return (
                                <Button
                                  key={pageNum}
                                  variant={currentPage === pageNum ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => setCurrentPage(pageNum)}
                                  className="w-10"
                                >
                                  {pageNum}
                                </Button>
                              );
                            })}
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                          >
                            Suivant
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </Card>
            )}

            {/* Vue: En attente de validation */}
            {filterView === 'pending' && isAdmin && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Profils en attente de validation
                    <Badge className="bg-orange-500 text-white">
                      {pendingSubmissions.length}
                    </Badge>
                  </h3>
                </div>

                {pendingSubmissions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-400" />
                    <p>Aucune soumission en attente</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingSubmissions.map((submission) => (
                      <div
                        key={submission.id}
                        className="border-2 border-orange-200 rounded-lg p-5 bg-orange-50/50"
                      >
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="font-semibold text-lg">
                              {submission.data.full_name}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              Soumis le{' '}
                              {new Date(submission.submitted_at).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              })}
                            </p>
                          </div>
                          <Badge className="bg-orange-500 text-white">
                            <Clock className="w-3 h-3 mr-1" />
                            En attente
                          </Badge>
                        </div>

                        {/* Détails */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 p-4 bg-white rounded-lg border">
                          {submission.data.phone && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="w-4 h-4 text-gray-500" />
                              <span>{submission.data.phone}</span>
                            </div>
                          )}
                          {submission.data.birth_year && (
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="w-4 h-4 text-gray-500" />
                              <span>Né(e) en {submission.data.birth_year}</span>
                            </div>
                          )}
                          {submission.data.conversion_year && (
                            <div className="text-sm">
                              <span className="text-gray-500">Converti en:</span>{' '}
                              {submission.data.conversion_year}
                            </div>
                          )}
                          {submission.data.joined_ifa_year && (
                            <div className="text-sm">
                              <span className="text-gray-500">IFA depuis:</span>{' '}
                              {submission.data.joined_ifa_year}
                            </div>
                          )}
                          {submission.data.is_baptized !== undefined && (
                            <div className="text-sm">
                              <span className="text-gray-500">Baptême:</span>{' '}
                              {submission.data.is_baptized ? (
                                <span className="text-green-600 font-medium">Oui</span>
                              ) : (
                                <span className="text-gray-600">Non</span>
                              )}
                            </div>
                          )}
                          {submission.data.marriage_date && (
                            <div className="text-sm">
                              <span className="text-gray-500">Marié(e) le:</span>{' '}
                              {submission.data.marriage_date}
                            </div>
                          )}
                          {submission.data.notes && (
                            <div className="md:col-span-2 text-sm">
                              <span className="text-gray-500">Notes:</span>{' '}
                              {submission.data.notes}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                          <Button
                            onClick={() => handleApprove(submission.id)}
                            disabled={actionLoading === submission.id}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                          >
                            {actionLoading === submission.id ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Traitement...
                              </>
                            ) : (
                              <>
                                <ThumbsUp className="w-4 h-4 mr-2" />
                                Approuver
                              </>
                            )}
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => handleRejectClick(submission)}
                            disabled={actionLoading === submission.id}
                            className="flex-1"
                          >
                            <ThumbsDown className="w-4 h-4 mr-2" />
                            Rejeter
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Dialog de rejet */}
      <RejectDialog
        open={showRejectDialog}
        onClose={() => setShowRejectDialog(false)}
        onReject={handleReject}
      />
    </div>
  );
}
