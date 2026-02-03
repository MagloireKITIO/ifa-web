'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { TopNavigation } from '@/components/layout/TopNavigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { loadDatabase } from '@/lib/api/db';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  User,
  Mail,
  Home,
  Activity,
} from 'lucide-react';
import type { Center, HouseChurch, User as UserType } from '@/types';

export default function CenterDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading } = useAuth();
  const [center, setCenter] = useState<Center | null>(null);
  const [houseChurches, setHouseChurches] = useState<HouseChurch[]>([]);
  const [centerLeader, setCenterLeader] = useState<UserType | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  const centerId = params.id as string;

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    async function loadCenterData() {
      try {
        setDataLoading(true);
        const db = await loadDatabase();

        // Trouver le centre
        const foundCenter = db.centers.find((c) => c.id === centerId);
        setCenter(foundCenter || null);

        if (foundCenter) {
          // Trouver les house churches du centre
          const centerHouses = db.houseChurches.filter(
            (h) => h.centerId === foundCenter.id
          );
          setHouseChurches(centerHouses);

          // Trouver le leader du centre
          const leader = db.users.find(
            (u) => u.role === 'center_lead' && u.centerId === foundCenter.id
          );
          setCenterLeader(leader || null);
        }
      } catch (error) {
        console.error('Erreur chargement centre:', error);
      } finally {
        setDataLoading(false);
      }
    }

    if (user && centerId) {
      loadCenterData();
    }
  }, [user, centerId]);

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
        <div className="max-w-4xl mx-auto px-6 py-12 text-center">
          <Card className="p-8">
            <h1 className="text-2xl font-bold mb-4">Centre Non Trouvé</h1>
            <p className="text-muted-foreground mb-6">
              Le centre que vous recherchez n'existe pas.
            </p>
            <Button onClick={() => router.push('/structure')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour à la Structure
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const activeHouses = houseChurches.filter((h) => h.status === 'active').length;

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <TopNavigation />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Bouton Retour */}
        <Button
          variant="ghost"
          onClick={() => router.push('/structure')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour à la Structure
        </Button>

        {/* En-tête du Centre */}
        <Card className="p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{center.name}</h1>
              <p className="text-muted-foreground flex items-center gap-2 mb-4">
                <MapPin className="w-4 h-4" />
                {center.address}
              </p>
              <div className="flex items-center gap-4">
                <Badge
                  className={
                    center.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }
                >
                  {center.status === 'active' ? 'Actif' : 'Inactif'}
                </Badge>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Fondé le {new Date(center.foundedDate).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                  <Home className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{houseChurches.length}</p>
                  <p className="text-sm text-muted-foreground">
                    House Churches
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-600 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{activeHouses}</p>
                  <p className="text-sm text-muted-foreground">
                    Cellules Actives
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold">
                    {center.latitude?.toFixed(4)}, {center.longitude?.toFixed(4)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Coordonnées GPS
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Responsable du Centre */}
          {centerLeader && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <User className="w-4 h-4" />
                Responsable du Centre
              </h3>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  {centerLeader.fullName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)}
                </div>
                <div>
                  <p className="font-medium">{centerLeader.fullName}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {centerLeader.email}
                  </p>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Liste des House Churches */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Home className="w-5 h-5" />
            House Churches ({houseChurches.length})
          </h2>

          {houseChurches.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Home className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Aucune house church enregistrée pour ce centre</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {houseChurches.map((house) => (
                <Card
                  key={house.id}
                  className="p-4 hover:shadow-lg transition-shadow border-2"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold">{house.name}</h3>
                    <Badge
                      className={
                        house.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }
                    >
                      {house.status === 'active' ? 'Actif' : 'Inactif'}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm">
                    <p className="text-muted-foreground flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {house.zoneArea}
                    </p>
                    <p className="text-muted-foreground flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {house.hostName}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
