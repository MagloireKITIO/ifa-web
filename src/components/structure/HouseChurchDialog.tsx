'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { HouseChurch, Center } from '@/types';

interface HouseChurchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  houseChurch?: HouseChurch | null;
  centers: Center[];
  onSubmit: (data: {
    name: string;
    center_id: string;
    zone_area: string;
    host_name: string;
    status: 'active' | 'inactive';
  }) => Promise<void>;
}

export function HouseChurchDialog({ open, onOpenChange, houseChurch, centers, onSubmit }: HouseChurchDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    center_id: '',
    zone_area: '',
    host_name: '',
    status: 'active' as 'active' | 'inactive',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (houseChurch) {
      setFormData({
        name: houseChurch.name || '',
        center_id: houseChurch.center_id || '',
        zone_area: houseChurch.zone_area || '',
        host_name: houseChurch.host_name || '',
        status: houseChurch.status || 'active',
      });
    } else {
      setFormData({
        name: '',
        center_id: centers[0]?.id || '',
        zone_area: '',
        host_name: '',
        status: 'active',
      });
    }
  }, [houseChurch, open, centers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting house church:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{houseChurch ? 'Modifier la Cellule' : 'Nouvelle Cellule'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom de la Cellule *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Cellule Akwa"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="center">Centre *</Label>
              <Select
                value={formData.center_id}
                onValueChange={(value) => setFormData({ ...formData, center_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un centre" />
                </SelectTrigger>
                <SelectContent>
                  {centers.map((center) => (
                    <SelectItem key={center.id} value={center.id}>
                      {center.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="zone_area">Zone / Quartier *</Label>
              <Input
                id="zone_area"
                value={formData.zone_area}
                onChange={(e) => setFormData({ ...formData, zone_area: e.target.value })}
                placeholder="Ex: Akwa"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="host_name">Hôte / Responsable *</Label>
              <Input
                id="host_name"
                value={formData.host_name}
                onChange={(e) => setFormData({ ...formData, host_name: e.target.value })}
                placeholder="Ex: Jean Dupont"
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
              {loading ? 'Enregistrement...' : houseChurch ? 'Mettre à jour' : 'Créer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
