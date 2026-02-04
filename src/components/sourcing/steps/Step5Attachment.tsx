'use client';

import { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SourcingFormData } from '@/types/sourcing';
import { getCenters, getHouseChurches } from '@/lib/api/structure';
import type { Center, HouseChurch } from '@/types';

interface Step5AttachmentProps {
  formData: SourcingFormData;
  updateField: (field: keyof SourcingFormData, value: any) => void;
  errors: Record<string, string>;
}

export function Step5Attachment({
  formData,
  updateField,
  errors,
}: Step5AttachmentProps) {
  const [centers, setCenters] = useState<Center[]>([]);
  const [houseChurches, setHouseChurches] = useState<HouseChurch[]>([]);
  const [filteredHouseChurches, setFilteredHouseChurches] = useState<
    HouseChurch[]
  >([]);
  const [loading, setLoading] = useState(true);

  // Charger les centres et cellules depuis Supabase
  useEffect(() => {
    async function loadData() {
      try {
        const [allCenters, allHouseChurches] = await Promise.all([
          getCenters(),
          getHouseChurches(),
        ]);
        
        setCenters(allCenters.filter((c) => c.status === 'active'));
        setHouseChurches(allHouseChurches.filter((h) => h.status === 'active'));
      } catch (error) {
        console.error('Erreur chargement données:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Filtrer les House Churches selon le Centre sélectionné
  useEffect(() => {
    if (formData.centerId) {
      const filtered = houseChurches.filter(
        (hc) => hc.center_id === formData.centerId
      );
      setFilteredHouseChurches(filtered);

      // Si la house church sélectionnée ne correspond plus au centre, on la réinitialise
      if (
        formData.houseChurchId &&
        !filtered.find((hc) => hc.id === formData.houseChurchId)
      ) {
        updateField('houseChurchId', '');
      }
    } else {
      setFilteredHouseChurches([]);
      updateField('houseChurchId', '');
    }
  }, [formData.centerId, houseChurches, updateField, formData.houseChurchId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Centre */}
      <div className="space-y-2">
        <Label htmlFor="centerId" className="text-base font-medium">
          Centre <span className="text-red-500">*</span>
        </Label>
        <Select
          value={formData.centerId}
          onValueChange={(value) => updateField('centerId', value)}
        >
          <SelectTrigger
            className={`h-12 text-base ${
              errors.centerId ? 'border-red-500' : ''
            }`}
          >
            <SelectValue placeholder="Sélectionnez votre centre" />
          </SelectTrigger>
          <SelectContent>
            {centers.map((center) => (
              <SelectItem key={center.id} value={center.id} className="text-base">
                {center.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.centerId && (
          <p className="text-sm text-red-600">{errors.centerId}</p>
        )}
        <p className="text-sm text-muted-foreground">
          Le centre d'église que vous fréquentez
        </p>
      </div>

      {/* House Church - Affiché seulement si un centre est sélectionné */}
      {formData.centerId && (
        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
          <Label htmlFor="houseChurchId" className="text-base font-medium">
            Cellule / House Church <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.houseChurchId}
            onValueChange={(value) => updateField('houseChurchId', value)}
          >
            <SelectTrigger
              className={`h-12 text-base ${
                errors.houseChurchId ? 'border-red-500' : ''
              }`}
            >
              <SelectValue placeholder="Sélectionnez votre cellule" />
            </SelectTrigger>
            <SelectContent>
              {filteredHouseChurches.length > 0 ? (
                filteredHouseChurches.map((hc) => (
                  <SelectItem key={hc.id} value={hc.id} className="text-base">
                    {hc.name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="none" disabled className="text-base">
                  Aucune cellule disponible
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          {errors.houseChurchId && (
            <p className="text-sm text-red-600">{errors.houseChurchId}</p>
          )}
          <p className="text-sm text-muted-foreground">
            La cellule de maison que vous fréquentez
          </p>
        </div>
      )}
    </div>
  );
}
