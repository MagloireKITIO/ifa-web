'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertCircle, X } from 'lucide-react';

interface RejectDialogProps {
  open: boolean;
  onClose: () => void;
  onReject: (reason: string) => void;
  loading?: boolean;
}

export function RejectDialog({ open, onClose, onReject, loading = false }: RejectDialogProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!reason || reason.trim().length < 10) {
      setError('Le motif doit contenir au moins 10 caractères');
      return;
    }

    setError('');
    onReject(reason);
  };

  const handleClose = () => {
    setReason('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="w-5 h-5" />
            Rejeter le Rapport
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">
              ⚠️ En rejetant ce rapport, vous demandez à l'auteur de le corriger et le
              soumettre à nouveau. Une notification lui sera envoyée avec votre motif de rejet.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason" className="text-sm font-semibold">
              Motif du rejet <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError('');
              }}
              placeholder="Exemple : Les montants des dîmes ne correspondent pas aux contributions détaillées. Veuillez vérifier et corriger."
              rows={5}
              className={error ? 'border-red-500' : ''}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Minimum 10 caractères • Soyez précis pour faciliter la correction
            </p>
            {error && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {error}
              </p>
            )}
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 <strong>Conseil :</strong> Indiquez clairement les éléments à corriger
              (sections, champs, valeurs attendues) pour faciliter la resoumission.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            <X className="w-4 h-4 mr-2" />
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={loading || !reason}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Rejet en cours...
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 mr-2" />
                Rejeter le Rapport
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
