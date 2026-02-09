'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, X } from 'lucide-react';
import type { User, UserRole } from '@/types';
import { supabase } from '@/lib/supabase';

interface UserFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  user?: User | null;
  mode: 'create' | 'edit';
}

interface Center {
  id: string;
  name: string;
}

interface HouseChurch {
  id: string;
  name: string;
  center_id: string;
}

export function UserFormDialog({ open, onClose, onSubmit, user, mode }: UserFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [centers, setCenters] = useState<Center[]>([]);
  const [houseChurches, setHouseChurches] = useState<HouseChurch[]>([]);
  const [filteredHouseChurches, setFilteredHouseChurches] = useState<HouseChurch[]>([]);

  // Form data
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('viewer');
  const [centerId, setCenterId] = useState<string>('');
  const [houseChurchId, setHouseChurchId] = useState<string>('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (open) {
      loadData();
      if (user && mode === 'edit') {
        setEmail(user.email);
        setFullName(user.full_name);
        setRole(user.role);
        setCenterId(user.center_id || '');
        setHouseChurchId(user.house_church_id || '');
      } else {
        resetForm();
      }
    }
  }, [open, user, mode]);

  useEffect(() => {
    // Filtrer les assemblées par centre sélectionné
    if (centerId) {
      setFilteredHouseChurches(houseChurches.filter((hc) => hc.center_id === centerId));
    } else {
      setFilteredHouseChurches([]);
    }

    // Reset house church si le centre change
    if (houseChurchId) {
      const selectedHouseChurch = houseChurches.find((hc) => hc.id === houseChurchId);
      if (selectedHouseChurch && selectedHouseChurch.center_id !== centerId) {
        setHouseChurchId('');
      }
    }
  }, [centerId, houseChurches]);

  useEffect(() => {
    // Gérer les contraintes selon le rôle
    if (role === 'admin' || role === 'viewer') {
      setCenterId('');
      setHouseChurchId('');
    } else if (role === 'center_lead') {
      setHouseChurchId('');
    }
  }, [role]);

  const loadData = async () => {
    try {
      const [centersData, houseChurchesData] = await Promise.all([
        supabase.from('centers').select('id, name').order('name'),
        supabase.from('house_churches').select('id, name, center_id').order('name'),
      ]);

      if (centersData.data) setCenters(centersData.data);
      if (houseChurchesData.data) setHouseChurches(houseChurchesData.data);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const resetForm = () => {
    setEmail('');
    setFullName('');
    setRole('viewer');
    setCenterId('');
    setHouseChurchId('');
    setPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    try {
      const data: any = {
        email,
        full_name: fullName,
        role,
        center_id: centerId || null,
        house_church_id: houseChurchId || null,
      };

      await onSubmit(data);
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">
            {mode === 'create' ? 'Ajouter un utilisateur' : 'Modifier un utilisateur'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Email */}
          <div>
            <label className="text-sm font-medium mb-1 block">
              Email <span className="text-red-500">*</span>
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              placeholder="email@exemple.com"
            />
          </div>

          {/* Nom complet */}
          <div>
            <label className="text-sm font-medium mb-1 block">
              Nom complet <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              disabled={loading}
              placeholder="Jean Dupont"
            />
          </div>

          {/* Rôle */}
          <div>
            <label className="text-sm font-medium mb-1 block">
              Rôle <span className="text-red-500">*</span>
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              required
              disabled={loading}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="viewer">Observateur</option>
              <option value="house_lead">Responsable d'Assemblée</option>
              <option value="center_lead">Responsable de Centre</option>
              <option value="admin">Administrateur</option>
            </select>
          </div>

          {/* Centre (si center_lead ou house_lead) */}
          {(role === 'center_lead' || role === 'house_lead') && (
            <div>
              <label className="text-sm font-medium mb-1 block">
                Centre d'assemblée <span className="text-red-500">*</span>
              </label>
              <select
                value={centerId}
                onChange={(e) => setCenterId(e.target.value)}
                required
                disabled={loading}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">-- Sélectionner un centre --</option>
                {centers.map((center) => (
                  <option key={center.id} value={center.id}>
                    {center.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Assemblée de maison (si house_lead) */}
          {role === 'house_lead' && (
            <div>
              <label className="text-sm font-medium mb-1 block">
                Assemblée de maison <span className="text-red-500">*</span>
              </label>
              <select
                value={houseChurchId}
                onChange={(e) => setHouseChurchId(e.target.value)}
                required
                disabled={loading || !centerId}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
              >
                <option value="">-- Sélectionner une assemblée --</option>
                {filteredHouseChurches.map((houseChurch) => (
                  <option key={houseChurch.id} value={houseChurch.id}>
                    {houseChurch.name}
                  </option>
                ))}
              </select>
              {!centerId && (
                <p className="text-xs text-muted-foreground mt-1">
                  Sélectionnez d'abord un centre
                </p>
              )}
            </div>
          )}

          {/* Message d'invitation (uniquement en mode création) */}
          {mode === 'create' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <strong>📧 Email d'invitation</strong><br />
                Un email sera envoyé à l'utilisateur avec un lien pour définir son mot de passe et activer son compte.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {mode === 'create' ? 'Création...' : 'Modification...'}
                </>
              ) : mode === 'create' ? (
                'Créer l\'utilisateur'
              ) : (
                'Modifier l\'utilisateur'
              )}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Annuler
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
