'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useToast } from '@/components/ui/toast';
import { TopNavigation } from '@/components/layout/TopNavigation';
import { MapView } from '@/components/structure/MapView';
import { ZoneDialog } from '@/components/structure/ZoneDialog';
import { CenterDialog } from '@/components/structure/CenterDialog';
import { HouseChurchDialog } from '@/components/structure/HouseChurchDialog';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  getCenters,
  getZones,
  getHouseChurches,
  createZone,
  createCenter,
  createHouseChurch,
  updateZone,
  updateCenter,
  updateHouseChurch,
  deleteZone,
  deleteCenter,
  deleteHouseChurch,
} from '@/lib/api/structure';
import {
  Map as MapIcon,
  List,
  MapPin,
  Building2,
  Home,
  Plus,
  Edit2,
  Trash2,
  Search,
} from 'lucide-react';
import type { Center, HouseChurch, Zone } from '@/types';

export default function StructurePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { showToast } = useToast();

  const [view, setView] = useState<'map' | 'list'>('map');
  const [centers, setCenters] = useState<Center[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [houseChurches, setHouseChurches] = useState<HouseChurch[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedZone, setSelectedZone] = useState<string>('all');

  // Dialog states
  const [zoneDialog, setZoneDialog] = useState<{ open: boolean; zone?: Zone | null }>({
    open: false,
    zone: null,
  });
  const [centerDialog, setCenterDialog] = useState<{ open: boolean; center?: Center | null }>({
    open: false,
    center: null,
  });
  const [houseDialog, setHouseDialog] = useState<{ open: boolean; house?: HouseChurch | null }>({
    open: false,
    house: null,
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const loadStructureData = async () => {
    try {
      setDataLoading(true);
      const [allCenters, allZones, allHouseChurches] = await Promise.all([
        getCenters(),
        getZones(),
        getHouseChurches(),
      ]);
      setCenters(allCenters);
      setZones(allZones);
      setHouseChurches(allHouseChurches);
    } catch (error) {
      console.error('Erreur chargement structure:', error);
      showToast('error', 'Erreur lors du chargement des données');
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadStructureData();
    }
  }, [user]);

  // CRUD Handlers
  const handleCreateZone = async (data: { name: string; region: string }) => {
    const result = await createZone(data);
    if (result) {
      showToast('success', 'Zone créée avec succès');
      loadStructureData();
    } else {
      showToast('error', 'Erreur lors de la création de la zone');
    }
  };

  const handleUpdateZone = async (data: { name: string; region: string }) => {
    if (!zoneDialog.zone) return;
    const result = await updateZone(zoneDialog.zone.id, data);
    if (result) {
      showToast('success', 'Zone mise à jour avec succès');
      loadStructureData();
    } else {
      showToast('error', 'Erreur lors de la mise à jour');
    }
  };

  const handleDeleteZone = async (zoneId: string) => {
    if (isDeleting) return;

    try {
      setIsDeleting(true);

      // Première vérification : vérifier s'il y a des dépendances
      const checkResult = await deleteZone(zoneId, false);

      const centersCount = checkResult.centersCount || 0;

      // Construire le message de confirmation
      let message = '';
      if (centersCount > 0) {
        message = `⚠️ ATTENTION : Cette zone contient :\n\n` +
          `• ${centersCount} centre(s)\n\n` +
          `La suppression de la zone entraînera :\n` +
          `- Suppression de tous les centres\n` +
          `- Suppression de toutes les cellules\n` +
          `- Dissociation de tous les membres\n\n` +
          `Voulez-vous vraiment continuer ?`;
      } else {
        message = 'Êtes-vous sûr de vouloir supprimer cette zone ?';
      }

      if (!confirm(message)) {
        setIsDeleting(false);
        return;
      }

      // Afficher un toast de progression
      showToast('info', 'Suppression en cours...');

      // Suppression en cascade
      const cascadeResult = await deleteZone(zoneId, true);
      if (cascadeResult.success) {
        showToast('success', centersCount > 0 ? 'Zone, centres et cellules supprimés avec succès' : 'Zone supprimée avec succès');
        await loadStructureData();
      } else {
        showToast('error', cascadeResult.error || 'Erreur lors de la suppression');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateCenter = async (data: any) => {
    const result = await createCenter(data);
    if (result) {
      showToast('success', 'Centre créé avec succès');
      loadStructureData();
    } else {
      showToast('error', 'Erreur lors de la création du centre');
    }
  };

  const handleUpdateCenter = async (data: any) => {
    if (!centerDialog.center) return;
    const result = await updateCenter(centerDialog.center.id, data);
    if (result) {
      showToast('success', 'Centre mis à jour avec succès');
      loadStructureData();
    } else {
      showToast('error', 'Erreur lors de la mise à jour');
    }
  };

  const handleDeleteCenter = async (centerId: string) => {
    if (isDeleting) return;

    try {
      setIsDeleting(true);

      // Première vérification : vérifier s'il y a des dépendances
      const checkResult = await deleteCenter(centerId, false);

      const housesCount = checkResult.housesCount || 0;
      const membersCount = checkResult.membersCount || 0;
      const profilesCount = checkResult.profilesCount || 0;
      const childrenCount = checkResult.childrenCount || 0;
      const reportsCount = checkResult.reportsCount || 0;

      const totalCount = housesCount + membersCount + profilesCount + childrenCount + reportsCount;

      // Construire le message de confirmation
      let message = '';
      if (totalCount > 0) {
        const details = [];
        if (housesCount > 0) details.push(`${housesCount} cellule(s)`);
        if (membersCount > 0) details.push(`${membersCount} membre(s)`);
        if (profilesCount > 0) details.push(`${profilesCount} profil(s)`);
        if (childrenCount > 0) details.push(`${childrenCount} enfant(s)`);
        if (reportsCount > 0) details.push(`${reportsCount} rapport(s)`);

        message = `⚠️ ATTENTION : Ce centre contient :\n\n` +
          `• ${details.join('\n• ')}\n\n` +
          `La suppression du centre entraînera :\n` +
          `- Suppression de toutes les cellules\n` +
          `- Dissociation de tous les éléments liés\n\n` +
          `Voulez-vous vraiment continuer ?`;
      } else {
        message = 'Êtes-vous sûr de vouloir supprimer ce centre ?';
      }

      if (!confirm(message)) {
        setIsDeleting(false);
        return;
      }

      // Afficher un toast de progression
      showToast('info', 'Suppression en cours...');

      // Suppression en cascade
      const cascadeResult = await deleteCenter(centerId, true);
      if (cascadeResult.success) {
        showToast('success', totalCount > 0 ? 'Centre et dépendances supprimés avec succès' : 'Centre supprimé avec succès');
        await loadStructureData();
      } else {
        showToast('error', cascadeResult.error || 'Erreur lors de la suppression');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateHouseChurch = async (data: any) => {
    const result = await createHouseChurch(data);
    if (result) {
      showToast('success', 'Cellule créée avec succès');
      loadStructureData();
    } else {
      showToast('error', 'Erreur lors de la création de la cellule');
    }
  };

  const handleUpdateHouseChurch = async (data: any) => {
    if (!houseDialog.house) return;
    const result = await updateHouseChurch(houseDialog.house.id, data);
    if (result) {
      showToast('success', 'Cellule mise à jour avec succès');
      loadStructureData();
    } else {
      showToast('error', 'Erreur lors de la mise à jour');
    }
  };

  const handleDeleteHouseChurch = async (houseId: string) => {
    if (isDeleting) return;

    try {
      setIsDeleting(true);

      // Première vérification : vérifier s'il y a des dépendances
      const checkResult = await deleteHouseChurch(houseId, false);

      const membersCount = checkResult.membersCount || 0;
      const profilesCount = checkResult.profilesCount || 0;
      const childrenCount = checkResult.childrenCount || 0;
      const reportsCount = checkResult.reportsCount || 0;
      const contributionsCount = checkResult.contributionsCount || 0;

      const totalCount = membersCount + profilesCount + childrenCount + reportsCount + contributionsCount;

      // Construire le message de confirmation
      let message = '';
      if (totalCount > 0) {
        const details = [];
        if (membersCount > 0) details.push(`${membersCount} membre(s)`);
        if (profilesCount > 0) details.push(`${profilesCount} profil(s)`);
        if (childrenCount > 0) details.push(`${childrenCount} enfant(s)`);
        if (reportsCount > 0) details.push(`${reportsCount} rapport(s)`);
        if (contributionsCount > 0) details.push(`${contributionsCount} contribution(s)`);

        message = `⚠️ ATTENTION : Cette cellule contient :\n\n` +
          `• ${details.join('\n• ')}\n\n` +
          `La suppression de la cellule entraînera :\n` +
          `- Dissociation de tous les éléments liés\n\n` +
          `Voulez-vous vraiment continuer ?`;
      } else {
        message = 'Êtes-vous sûr de vouloir supprimer cette cellule ?';
      }

      if (!confirm(message)) {
        setIsDeleting(false);
        return;
      }

      // Afficher un toast de progression
      showToast('info', 'Suppression en cours...');

      // Suppression avec mise à NULL
      const cascadeResult = await deleteHouseChurch(houseId, true);
      if (cascadeResult.success) {
        showToast('success', 'Cellule supprimée avec succès');
        await loadStructureData();
      } else {
        showToast('error', cascadeResult.error || 'Erreur lors de la suppression');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCenterClick = (centerId: string) => {
    router.push(`/structure/centres/${centerId}`);
  };

  // Filtering
  const filteredZones = zones.filter((zone) =>
    zone.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCenters =
    selectedZone === 'all'
      ? centers.filter((c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
      : centers.filter(
          (c) => c.zone_id === selectedZone && c.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

  const activeCenters = centers.filter((c) => c.status === 'active').length;
  const activeHouseChurches = houseChurches.filter((h) => h.status === 'active').length;

  const canEdit = user?.role === 'admin' || user?.role === 'center_lead';

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <TopNavigation />

      {/* Overlay de suppression en cours */}
      {isDeleting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
            <p className="text-lg font-medium">Suppression en cours...</p>
            <p className="text-sm text-muted-foreground">Veuillez patienter</p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* En-tête avec boutons d'action */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mb-2">
                Structure de l'Église IFA
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Carte géographique des centres et cellules
              </p>
            </div>

            {canEdit && (
              <div className="flex flex-wrap gap-2 sm:flex-shrink-0">
                <Button
                  onClick={() => setZoneDialog({ open: true, zone: null })}
                  size="sm"
                  className="flex-1 sm:flex-initial min-h-[44px]"
                >
                  <Plus className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Nouvelle Zone</span>
                  <span className="sm:hidden">Zone</span>
                </Button>
                <Button
                  onClick={() => setCenterDialog({ open: true, center: null })}
                  size="sm"
                  className="flex-1 sm:flex-initial min-h-[44px]"
                >
                  <Plus className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Nouveau Centre</span>
                  <span className="sm:hidden">Centre</span>
                </Button>
                <Button
                  onClick={() => setHouseDialog({ open: true, house: null })}
                  size="sm"
                  className="flex-1 sm:flex-initial min-h-[44px]"
                >
                  <Plus className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Nouvelle Cellule</span>
                  <span className="sm:hidden">Cellule</span>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Statistiques Globales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Card className="p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold">{zones.length}</p>
                <p className="text-xs text-muted-foreground">Zones</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold">{activeCenters}</p>
                <p className="text-xs text-muted-foreground">Centres Actifs</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                <Home className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold">{activeHouseChurches}</p>
                <p className="text-xs text-muted-foreground">Cellules Actives</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                <MapIcon className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold">{centers.length}</p>
                <p className="text-xs text-muted-foreground">Total Centres</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Barre d'actions : Vue + Recherche + Filtre */}
        <div className="space-y-4 mb-6">
          {/* Ligne 1 : Boutons Vue Carte/Liste */}
          <div className="flex gap-2">
            <Button
              variant={view === 'map' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('map')}
              className="flex-1 sm:flex-initial min-h-[44px]"
            >
              <MapIcon className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Vue Carte</span>
            </Button>
            <Button
              variant={view === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('list')}
              className="flex-1 sm:flex-initial min-h-[44px]"
            >
              <List className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Vue Liste</span>
            </Button>
          </div>

          {/* Ligne 2 : Recherche + Filtre + Légende */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-11 w-full"
              />
            </div>

            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="px-4 py-2.5 border rounded-md text-sm h-11 flex-1 sm:flex-initial sm:min-w-[180px]"
            >
              <option value="all">Toutes les zones</option>
              {zones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.name}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <Badge className="bg-green-100 text-green-700 hover:bg-green-100 px-3 py-1.5">
                ● Actif
              </Badge>
              <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100 px-3 py-1.5">
                ● Inactif
              </Badge>
            </div>
          </div>
        </div>

        {/* Vue Carte */}
        {view === 'map' && (
          <div>
            {dataLoading ? (
              <Card className="p-8 flex items-center justify-center h-[600px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </Card>
            ) : (
              <MapView centers={filteredCenters} onCenterClick={handleCenterClick} />
            )}
          </div>
        )}

        {/* Vue Liste */}
        {view === 'list' && (
          <div className="space-y-4 sm:space-y-6">
            {filteredZones.map((zone) => {
              const zoneCenters = filteredCenters.filter((c) => c.zone_id === zone.id);
              return (
                <Card key={zone.id} className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
                      <h2 className="text-lg sm:text-xl font-semibold">{zone.name}</h2>
                      <Badge variant="outline" className="text-xs">
                        {zoneCenters.length} centres
                      </Badge>
                      <span className="text-xs sm:text-sm text-muted-foreground">
                        ({zone.region})
                      </span>
                    </div>

                    {canEdit && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setZoneDialog({ open: true, zone })}
                          className="min-h-[44px] px-3"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteZone(zone.id)}
                          className="min-h-[44px] px-3"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {zoneCenters.map((center) => {
                      const centerHouses = houseChurches.filter((h) => h.center_id === center.id);
                      return (
                        <Card
                          key={center.id}
                          className="p-4 sm:p-5 hover:shadow-lg transition-shadow border-2"
                        >
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <h3
                              className="font-semibold cursor-pointer hover:text-primary text-base flex-1 min-w-0"
                              onClick={() => handleCenterClick(center.id)}
                            >
                              {center.name}
                            </h3>
                            <Badge
                              className={`flex-shrink-0 text-xs ${
                                center.status === 'active'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {center.status === 'active' ? 'Actif' : 'Inactif'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                            {center.address}
                          </p>
                          <div className="flex items-center justify-between text-sm pt-3 border-t">
                            <span className="flex items-center gap-1.5">
                              <Home className="w-4 h-4 flex-shrink-0" />
                              <span>{centerHouses.length} cellules</span>
                            </span>
                            {canEdit && (
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setCenterDialog({ open: true, center })}
                                  className="h-9 w-9 p-0"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteCenter(center.id)}
                                  className="h-9 w-9 p-0"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <ZoneDialog
        open={zoneDialog.open}
        onOpenChange={(open) => setZoneDialog({ open, zone: null })}
        zone={zoneDialog.zone}
        onSubmit={zoneDialog.zone ? handleUpdateZone : handleCreateZone}
      />

      <CenterDialog
        open={centerDialog.open}
        onOpenChange={(open) => setCenterDialog({ open, center: null })}
        center={centerDialog.center}
        zones={zones}
        onSubmit={centerDialog.center ? handleUpdateCenter : handleCreateCenter}
      />

      <HouseChurchDialog
        open={houseDialog.open}
        onOpenChange={(open) => setHouseDialog({ open, house: null })}
        houseChurch={houseDialog.house}
        centers={centers}
        onSubmit={houseDialog.house ? handleUpdateHouseChurch : handleCreateHouseChurch}
      />
    </div>
  );
}
