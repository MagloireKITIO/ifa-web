'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { LocationPicker } from './LocationPicker';
import type { Center, Zone } from '@/types';

interface CenterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  center?: Center | null;
  zones: Zone[];
  onSubmit: (data: {
    name: string;
    zone_id: string;
    address: string;
    founded_date: string;
    status: 'active' | 'inactive';
    latitude?: number;
    longitude?: number;
  }) => Promise<void>;
}

export function CenterDialog({ open, onOpenChange, center, zones, onSubmit }: CenterDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    zone_id: '',
    address: '',
    founded_date: '',
    status: 'active' as 'active' | 'inactive',
  });
  const [location, setLocation] = useState<{
    latitude?: number;
    longitude?: number;
    address?: string;
  }>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (center) {
      setFormData({
        name: center.name || '',
        zone_id: center.zone_id || '',
        address: center.address || '',
        founded_date: center.founded_date ? center.founded_date.split('T')[0] : new Date().toISOString().split('T')[0],
        status: center.status || 'active',
      });
      setLocation({
        latitude: center.latitude || undefined,
        longitude: center.longitude || undefined,
        address: center.address || '',
      });
    } else {
      setFormData({
        name: '',
        zone_id: zones[0]?.id || '',
        address: '',
        founded_date: new Date().toISOString().split('T')[0],
        status: 'active',
      });
      setLocation({});
    }
  }, [center, open, zones]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const submitData = {
        name: formData.name,
        zone_id: formData.zone_id,
        address: location.address || formData.address,
        founded_date: formData.founded_date,
        status: formData.status,
        ...(location.latitude && location.longitude ? {
          latitude: location.latitude,
          longitude: location.longitude,
        } : {}),
      };
      await onSubmit(submitData);
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting center:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{center ? 'Modifier le Centre' : 'Nouveau Centre'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du Centre *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: IFA Bonapriso"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="zone">Zone *</Label>
              <Select
                value={formData.zone_id}
                onValueChange={(value) => setFormData({ ...formData, zone_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une zone" />
                </SelectTrigger>
                <SelectContent>
                  {zones.map((zone) => (
                    <SelectItem key={zone.id} value={zone.id}>
                      {zone.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <LocationPicker
              value={location}
              onChange={(loc) => {
                setLocation(loc);
                // Mettre à jour aussi l'adresse dans formData
                setFormData({ ...formData, address: loc.address });
              }}
              label="Adresse & Localisation *"
              placeholder="Ex: Bonapriso, Douala ou IFA Akwa..."
            />

            <div className="space-y-2">
              <Label htmlFor="founded_date">Date de Fondation *</Label>
              <Input
                id="founded_date"
                type="date"
                value={formData.founded_date}
                onChange={(e) => setFormData({ ...formData, founded_date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Statut *</Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'active' | 'inactive') => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="inactive">Inactif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Enregistrement...' : center ? 'Mettre à jour' : 'Créer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
