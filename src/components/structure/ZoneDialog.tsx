'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Zone } from '@/types';

interface ZoneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  zone?: Zone | null;
  onSubmit: (data: { name: string; region: string }) => Promise<void>;
}

export function ZoneDialog({ open, onOpenChange, zone, onSubmit }: ZoneDialogProps) {
  const [name, setName] = useState('');
  const [region, setRegion] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (zone) {
      setName(zone.name || '');
      setRegion(zone.region || '');
    } else {
      setName('');
      setRegion('');
    }
  }, [zone, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({ name, region });
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting zone:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{zone ? 'Modifier la Zone' : 'Nouvelle Zone'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom de la Zone *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Douala Centre"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="region">Région *</Label>
              <Input
                id="region"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="Ex: Littoral"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Enregistrement...' : zone ? 'Mettre à jour' : 'Créer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
