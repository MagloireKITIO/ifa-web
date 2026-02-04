'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import type { Center } from '@/types';

// Importer Leaflet dynamiquement pour éviter les erreurs SSR
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

interface MapViewProps {
  centers: Center[];
  onCenterClick?: (centerId: string) => void;
}

export function MapView({ centers, onCenterClick }: MapViewProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);

    // Charger la configuration Leaflet uniquement côté client
    if (typeof window !== 'undefined') {
      import('@/lib/leaflet-config');
    }
  }, []);

  // Position centrale de Douala
  const doualaCenter: [number, number] = [4.0511, 9.7679];

  // Filtrer les centres avec coordonnées valides
  const centersWithCoordinates = centers.filter(
    (center) => center.latitude && center.longitude
  );

  if (!isClient) {
    return (
      <Card className="p-8 flex items-center justify-center h-[600px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </Card>
    );
  }

  return (
    <div className="relative">
      <div className="h-[600px] rounded-xl overflow-hidden border-2 border-gray-200 shadow-lg">
        <MapContainer
          center={doualaCenter}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {centersWithCoordinates.map((center) => (
            <Marker
              key={center.id}
              position={[center.latitude!, center.longitude!]}
            >
              <Popup>
                <div className="p-3 min-w-[200px]">
                  <h3 className="font-bold text-lg mb-2">{center.name}</h3>
                  <p className="text-sm text-muted-foreground mb-1">
                    {center.address}
                  </p>
                  <p className="text-sm text-muted-foreground mb-3">
                    Fondé en {new Date(center.founded_date).getFullYear()}
                  </p>
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${
                        center.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                      }`}
                    />
                    <span className="text-xs font-medium capitalize">
                      {center.status === 'active' ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                  {onCenterClick && (
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => onCenterClick(center.id)}
                    >
                      Voir les détails →
                    </Button>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
