'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { MapPin, Navigation, Loader2 } from 'lucide-react';

interface LocationResult {
  display_name: string;
  lat: string;
  lon: string;
}

interface LocationPickerProps {
  value?: { latitude?: number; longitude?: number; address?: string };
  onChange: (location: { latitude: number; longitude: number; address: string }) => void;
  label?: string;
  placeholder?: string;
}

export function LocationPicker({ value, onChange, label = "Localisation", placeholder = "Commencer à taper une adresse..." }: LocationPickerProps) {
  const [searchTerm, setSearchTerm] = useState(value?.address || '');
  const [results, setResults] = useState<LocationResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Vérifier si la géolocalisation est disponible et sécurisée
  const isGeolocationAvailable = typeof window !== 'undefined' &&
    'geolocation' in navigator &&
    (window.location.protocol === 'https:' || window.location.hostname === 'localhost');

  // Fermer les résultats si on clique en dehors
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Recherche avec debounce
  useEffect(() => {
    if (searchTerm.length < 3) {
      setResults([]);
      setErrorMessage('');
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setLoading(true);
      setErrorMessage('');
      try {
        // Utilisation de l'API Nominatim (OpenStreetMap) - gratuite
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            searchTerm
          )}&countrycodes=cm&limit=5&addressdetails=1`,
          {
            headers: {
              'Accept-Language': 'fr',
            },
          }
        );
        const data = await response.json();

        if (data.length === 0) {
          setErrorMessage('Aucun résultat trouvé. Essayez une autre recherche.');
        }

        setResults(data);
        setShowResults(true);
      } catch (error) {
        console.error('Erreur recherche localisation:', error);
        setErrorMessage('Erreur de connexion. Vérifiez votre internet.');
      } finally {
        setLoading(false);
      }
    }, 500);
  }, [searchTerm]);

  const handleSelectLocation = (result: LocationResult) => {
    setSearchTerm(result.display_name);
    setShowResults(false);
    onChange({
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      address: result.display_name,
    });
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('La géolocalisation n\'est pas supportée par votre navigateur');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // Reverse geocoding pour obtenir l'adresse
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            {
              headers: {
                'Accept-Language': 'fr',
              },
            }
          );
          const data = await response.json();
          const address = data.display_name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

          setSearchTerm(address);
          onChange({ latitude, longitude, address });
        } catch (error) {
          console.error('Erreur reverse geocoding:', error);
          const address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          setSearchTerm(address);
          onChange({ latitude, longitude, address });
        } finally {
          setGettingLocation(false);
        }
      },
      (error) => {
        setGettingLocation(false);

        let errorMessage = 'Impossible d\'obtenir votre position. ';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Permission refusée. Autorisez la géolocalisation dans les paramètres de votre navigateur.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Position non disponible. Vérifiez votre connexion GPS/Wi-Fi.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Délai d\'attente dépassé. Réessayez.';
            break;
          default:
            errorMessage += 'Une erreur est survenue. Utilisez la recherche d\'adresse.';
        }

        alert(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  return (
    <div className="space-y-2" ref={wrapperRef}>
      <Label>{label}</Label>
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={placeholder}
              className="pl-9"
            />
            {loading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleGetCurrentLocation}
            disabled={gettingLocation || !isGeolocationAvailable}
            title={
              !isGeolocationAvailable
                ? 'Géolocalisation non disponible (nécessite HTTPS)'
                : 'Utiliser ma position actuelle'
            }
          >
            {gettingLocation ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Navigation className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Résultats de recherche */}
        {showResults && results.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-[300px] overflow-y-auto">
            {results.map((result, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSelectLocation(result)}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b last:border-b-0 flex items-start gap-3"
              >
                <MapPin className="w-4 h-4 mt-1 text-primary flex-shrink-0" />
                <span className="text-sm">{result.display_name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Message d'erreur de recherche */}
        {errorMessage && (
          <p className="text-xs text-red-600 mt-1.5">⚠️ {errorMessage}</p>
        )}

        {/* Message d'aide */}
        {searchTerm.length === 0 && !errorMessage && (
          <p className="text-xs text-muted-foreground mt-1.5 italic">
            💡 Tapez une adresse {isGeolocationAvailable && (
              <>ou cliquez sur <Navigation className="w-3 h-3 inline" /> pour votre position</>
            )}
          </p>
        )}

        {/* Aide pour tapez plus de 3 caractères */}
        {searchTerm.length > 0 && searchTerm.length < 3 && (
          <p className="text-xs text-muted-foreground mt-1.5">
            ✍️ Continuez à taper (min. 3 caractères)
          </p>
        )}

        {/* Afficher les coordonnées actuelles (optionnel, pour debug) */}
        {value?.latitude && value?.longitude && (
          <p className="text-xs text-muted-foreground mt-1">
            📍 Position enregistrée : {value.latitude.toFixed(4)}, {value.longitude.toFixed(4)}
          </p>
        )}
      </div>
    </div>
  );
}
