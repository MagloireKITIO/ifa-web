'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useToast } from '@/components/ui/toast';
import { TopNavigation } from '@/components/layout/TopNavigation';
import { HouseChurchDialog } from '@/components/structure/HouseChurchDialog';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  getCenterById,
  getHouseChurchesByCenter,
  updateHouseChurch,
  deleteHouseChurch,
  createHouseChurch,
} from '@/lib/api/structure';
import {
  getMembersByCenter,
  getMembersByHouseChurch,
  getUnassignedMembers,
  assignMemberToHouseChurch,
  removeMemberFromHouseChurch,
} from '@/lib/api/members';
import {
  ArrowLeft,
  Home,
  Plus,
  Edit2,
  Trash2,
  Users,
  UserPlus,
  ArrowRight,
  X,
} from 'lucide-react';
import type { Center, HouseChurch } from '@/types';
import type { Member } from '@/lib/api/members';

export default function CenterDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading } = useAuth();
  const { showToast } = useToast();

  const [center, setCenter] = useState<Center | null>(null);
  const [houseChurches, setHouseChurches] = useState<HouseChurch[]>([]);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [selectedHouseChurch, setSelectedHouseChurch] = useState<string | null>(null);
  const [displayedMembers, setDisplayedMembers] = useState<Member[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const [houseDialog, setHouseDialog] = useState<{ open: boolean; house?: HouseChurch | null }>({
    open: false,
    house: null,
  });

  const centerId = params.id as string;
  const canEdit = user?.role === 'admin' || user?.role === 'center_lead';

  const loadData = async () => {
    try {
      setDataLoading(true);
      const [foundCenter, houses, members] = await Promise.all([
        getCenterById(centerId),
        getHouseChurchesByCenter(centerId),
        getMembersByCenter(centerId),
      ]);

      setCenter(foundCenter);
      setHouseChurches(houses);
      setAllMembers(members);

      // Par défaut, afficher les membres non affectés
      const unassigned = members.filter((m) => !m.house_church_id);
      setDisplayedMembers(unassigned);
      setSelectedHouseChurch('unassigned');
    } catch (error) {
      console.error('Erreur chargement:', error);
      showToast('error', 'Erreur lors du chargement');
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && centerId) {
      loadData();
    }
  }, [user, centerId]);

  // Changement de house church sélectionnée
  const handleSelectHouseChurch = (houseChurchId: string) => {
    setSelectedHouseChurch(houseChurchId);
    if (houseChurchId === 'unassigned') {
      const unassigned = allMembers.filter((m) => !m.house_church_id);
      setDisplayedMembers(unassigned);
    } else {
      const members = allMembers.filter((m) => m.house_church_id === houseChurchId);
      setDisplayedMembers(members);
    }
  };

  // CRUD House Churches
  const handleCreateHouseChurch = async (data: any) => {
    const result = await createHouseChurch({ ...data, center_id: centerId });
    if (result) {
      showToast('success', 'Cellule créée avec succès');
      loadData();
    } else {
      showToast('error', 'Erreur lors de la création');
    }
  };

  const handleUpdateHouseChurch = async (data: any) => {
    if (!houseDialog.house) return;
    const result = await updateHouseChurch(houseDialog.house.id, data);
    if (result) {
      showToast('success', 'Cellule mise à jour');
      loadData();
    } else {
      showToast('error', 'Erreur lors de la mise à jour');
    }
  };

  const handleDeleteHouseChurch = async (houseId: string) => {
    if (!confirm('Supprimer cette cellule ? Les membres seront non affectés.')) return;
    const result = await deleteHouseChurch(houseId);
    if (result.success) {
      showToast('success', 'Cellule supprimée');
      loadData();
      if (selectedHouseChurch === houseId) {
        setSelectedHouseChurch('unassigned');
      }
    } else {
      showToast('error', result.error || 'Erreur');
    }
  };

  // Affecter un membre
  const handleAssignMember = async (memberId: string, houseChurchId: string) => {
    const result = await assignMemberToHouseChurch(memberId, houseChurchId);
    if (result.success) {
      showToast('success', 'Membre affecté');
      loadData();
    } else {
      showToast('error', result.error || 'Erreur');
    }
  };

  // Retirer un membre
  const handleRemoveMember = async (memberId: string) => {
    const result = await removeMemberFromHouseChurch(memberId);
    if (result.success) {
      showToast('success', 'Membre retiré');
      loadData();
    } else {
      showToast('error', result.error || 'Erreur');
    }
  };

  if (loading || !user || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!center) {
    return (
      <div className="min-h-screen bg-[#FAFAFA]">
        <TopNavigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 text-center">
          <Card className="p-6 sm:p-8">
            <h1 className="text-xl sm:text-2xl font-bold mb-4">Centre Non Trouvé</h1>
            <Button onClick={() => router.push('/structure')} className="min-h-[44px]">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const selectedHouse = houseChurches.find((h) => h.id === selectedHouseChurch);

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <TopNavigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Left: Back button + Title */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => router.push('/structure')}
                size="sm"
                className="flex-shrink-0 min-h-[44px] px-3"
              >
                <ArrowLeft className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Retour</span>
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-bold truncate">{center.name}</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {allMembers.length} membre{allMembers.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Right: New button */}
            {canEdit && (
              <Button
                onClick={() => setHouseDialog({ open: true, house: null })}
                size="sm"
                className="w-full sm:w-auto min-h-[44px]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle Cellule
              </Button>
            )}
          </div>
        </div>

        {/* Sélecteur de cellule - Mobile only */}
        <div className="mb-4 lg:hidden">
          <Card className="p-4">
            <label className="text-sm font-medium mb-2 flex items-center gap-2">
              <Home className="w-4 h-4" />
              Filtrer par cellule
            </label>
            <Select value={selectedHouseChurch || ''} onValueChange={handleSelectHouseChurch}>
              <SelectTrigger className="w-full h-12 mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">
                  <div className="flex items-center justify-between w-full">
                    <span>Membres non affectés</span>
                    <Badge variant="outline" className="ml-2">
                      {allMembers.filter((m) => !m.house_church_id).length}
                    </Badge>
                  </div>
                </SelectItem>
                {houseChurches.map((house) => {
                  const memberCount = allMembers.filter((m) => m.house_church_id === house.id).length;
                  return (
                    <SelectItem key={house.id} value={house.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{house.name}</span>
                        <Badge variant="outline" className="ml-2">
                          {memberCount}
                        </Badge>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            {/* Actions pour la cellule sélectionnée */}
            {canEdit && selectedHouseChurch && selectedHouseChurch !== 'unassigned' && (
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setHouseDialog({ open: true, house: selectedHouse })}
                  className="flex-1 min-h-[44px]"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Modifier
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => selectedHouseChurch && handleDeleteHouseChurch(selectedHouseChurch)}
                  className="flex-1 min-h-[44px] text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* Layout: Sidebar + Main */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
          {/* Sidebar - Cellules (Desktop only) */}
          <div className="hidden lg:block lg:col-span-3">
            <Card className="p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Home className="w-4 h-4" />
                Cellules
              </h3>

              <div className="space-y-1">
                {/* Non affectés */}
                <button
                  onClick={() => handleSelectHouseChurch('unassigned')}
                  className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition-colors ${
                    selectedHouseChurch === 'unassigned'
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <span className="text-sm">Non affectés</span>
                  <Badge variant="outline" className="text-xs">
                    {allMembers.filter((m) => !m.house_church_id).length}
                  </Badge>
                </button>

                {/* Liste des house churches */}
                {houseChurches.map((house) => {
                  const memberCount = allMembers.filter((m) => m.house_church_id === house.id).length;
                  return (
                    <div
                      key={house.id}
                      className={`rounded-lg ${
                        selectedHouseChurch === house.id ? 'bg-primary/10' : ''
                      }`}
                    >
                      <button
                        onClick={() => handleSelectHouseChurch(house.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition-colors ${
                          selectedHouseChurch === house.id
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        <span className="text-sm truncate">{house.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {memberCount}
                        </Badge>
                      </button>

                      {canEdit && selectedHouseChurch === house.id && (
                        <div className="flex gap-1 px-2 pb-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setHouseDialog({ open: true, house })}
                            className="h-7 px-2"
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteHouseChurch(house.id)}
                            className="h-7 px-2 text-red-600"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Main - Membres */}
          <div className="lg:col-span-9">
            <Card className="p-4 sm:p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h3 className="font-semibold flex items-center gap-2 text-base sm:text-lg">
                  <Users className="w-5 h-5 flex-shrink-0" />
                  <span className="hidden sm:inline">
                    {selectedHouseChurch === 'unassigned'
                      ? 'Membres non affectés'
                      : selectedHouse?.name || 'Membres'}
                  </span>
                  <Badge className="text-xs">{displayedMembers.length}</Badge>
                </h3>
              </div>

              {displayedMembers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-sm sm:text-base">Aucun membre dans cette section</p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-2">
                  {displayedMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-3 border rounded-lg hover:bg-gray-50 gap-3 sm:gap-2"
                    >
                      {/* Membre info */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary flex-shrink-0 text-base sm:text-lg">
                          {member.full_name.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-base truncate">{member.full_name}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {member.phone || 'Pas de téléphone'}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      {canEdit && (
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          {/* Si non affecté, dropdown pour affecter */}
                          {!member.house_church_id && (
                            <Select
                              onValueChange={(value) => handleAssignMember(member.id, value)}
                            >
                              <SelectTrigger className="w-full sm:w-[180px] h-11">
                                <SelectValue placeholder="Affecter à..." />
                              </SelectTrigger>
                              <SelectContent>
                                {houseChurches.map((house) => (
                                  <SelectItem key={house.id} value={house.id}>
                                    {house.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}

                          {/* Si affecté, dropdown pour transférer ou retirer */}
                          {member.house_church_id && (
                            <Select
                              onValueChange={(value) => {
                                if (value === 'remove') {
                                  handleRemoveMember(member.id);
                                } else {
                                  handleAssignMember(member.id, value);
                                }
                              }}
                            >
                              <SelectTrigger className="w-full sm:w-[180px] h-11">
                                <SelectValue placeholder="Transférer..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="remove" className="text-red-600">
                                  <div className="flex items-center gap-2">
                                    <X className="w-4 h-4" />
                                    Retirer
                                  </div>
                                </SelectItem>
                                {houseChurches
                                  .filter((h) => h.id !== member.house_church_id)
                                  .map((house) => (
                                    <SelectItem key={house.id} value={house.id}>
                                      <div className="flex items-center gap-2">
                                        <ArrowRight className="w-4 h-4" />
                                        {house.name}
                                      </div>
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* Dialog House Church */}
      <HouseChurchDialog
        open={houseDialog.open}
        onOpenChange={(open) => setHouseDialog({ open, house: null })}
        houseChurch={houseDialog.house}
        centers={center ? [center] : []}
        onSubmit={houseDialog.house ? handleUpdateHouseChurch : handleCreateHouseChurch}
      />
    </div>
  );
}
