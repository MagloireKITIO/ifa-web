'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { TopNavigation } from '@/components/layout/TopNavigation';
import { MapView } from '@/components/structure/MapView';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getCenters, getZones, getHouseChurches } from '@/lib/api/structure';
import { Map as MapIcon, List, MapPin, Building2, Home } from 'lucide-react';
import type { Center, HouseChurch, Zone } from '@/types';

export default function StructurePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [view, setView] = useState<'map' | 'list'>('map');
  const [centers, setCenters] = useState<Center[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [houseChurches, setHouseChurches] = useState<HouseChurch[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    async function loadStructureData() {
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
      } finally {
        setDataLoading(false);
      }
    }

    if (user) {
      loadStructureData();
    }
  }, [user]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const handleCenterClick = (centerId: string) => {
    router.push(`/structure/centres/${centerId}`);
  };

  const activeCenters = centers.filter((c) => c.status === 'active').length;
  const activeHouseChurches = houseChurches.filter((h) => h.status === 'active').length;

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <TopNavigation />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Structure de l'Église IFA
          </h1>
          <p className="text-muted-foreground">
            Carte géographique des centres et cellules
          </p>
        </div>

        {/* Statistiques Globales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{zones.length}</p>
                <p className="text-xs text-muted-foreground">Zones</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeCenters}</p>
                <p className="text-xs text-muted-foreground">Centres Actifs</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                <Home className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeHouseChurches}</p>
                <p className="text-xs text-muted-foreground">Cellules Actives</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                <MapIcon className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">Douala</p>
                <p className="text-xs text-muted-foreground">Région Principale</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Toggle Vue Carte / Vue Liste */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            <Button
              variant={view === 'map' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('map')}
            >
              <MapIcon className="w-4 h-4 mr-2" />
              Vue Carte
            </Button>
            <Button
              variant={view === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('list')}
            >
              <List className="w-4 h-4 mr-2" />
              Vue Liste
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Légende:</span>
            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
              ● Actif
            </Badge>
            <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">
              ● Inactif
            </Badge>
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
              <>
                <MapView centers={centers} onCenterClick={handleCenterClick} />

                <Card className="mt-6 p-6 bg-blue-50 border-blue-200">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    Comment utiliser la carte
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600">•</span>
                      <span>Cliquez sur un <strong>marker rouge</strong> pour voir les détails du centre</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600">•</span>
                      <span>Utilisez la molette de la souris ou les boutons +/- pour zoomer</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600">•</span>
                      <span>Cliquez sur "Voir les détails" dans le popup pour accéder aux informations complètes</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600">•</span>
                      <span>Glissez-déposez pour déplacer la carte</span>
                    </li>
                  </ul>
                </Card>
              </>
            )}
          </div>
        )}

        {/* Vue Liste */}
        {view === 'list' && (
          <div className="space-y-4">
            {zones.map((zone) => {
              const zoneCenters = centers.filter((c) => c.zone_id === zone.id);
              return (
                <Card key={zone.id} className="p-6">
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    {zone.name}
                    <Badge variant="outline" className="ml-2">
                      {zoneCenters.length} centres
                    </Badge>
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {zoneCenters.map((center) => {
                      const centerHouses = houseChurches.filter(
                        (h) => h.center_id === center.id
                      );
                      return (
                        <Card
                          key={center.id}
                          className="p-4 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary"
                          onClick={() => handleCenterClick(center.id)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold">{center.name}</h3>
                            <Badge
                              className={
                                center.status === 'active'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-700'
                              }
                            >
                              {center.status === 'active' ? 'Actif' : 'Inactif'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            {center.address}
                          </p>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="flex items-center gap-1">
                              <Home className="w-4 h-4" />
                              {centerHouses.length} cellules
                            </span>
                            <span className="text-muted-foreground">
                              Fondé {new Date(center.founded_date).getFullYear()}
                            </span>
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
    </div>
  );
}
