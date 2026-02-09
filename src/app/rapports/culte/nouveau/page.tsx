'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useToast } from '@/components/ui/toast';
import { TopNavigation } from '@/components/layout/TopNavigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Church, Save, Calendar as CalendarIcon, Users, AlertCircle } from 'lucide-react';
import { createWorshipAttendance, isSunday } from '@/lib/api/worship';
import { supabase } from '@/lib/supabase';

export default function NouveauCultePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [worshipDate, setWorshipDate] = useState('');
  const [menCount, setMenCount] = useState<number>(0);
  const [womenCount, setWomenCount] = useState<number>(0);
  const [childrenCount, setChildrenCount] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Charger la date du dernier dimanche par défaut
  useEffect(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const lastSunday = new Date(today);

    if (dayOfWeek === 0) {
      // Aujourd'hui est dimanche
      lastSunday.setDate(today.getDate());
    } else {
      // Calculer le dimanche précédent
      lastSunday.setDate(today.getDate() - dayOfWeek);
    }

    setWorshipDate(lastSunday.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const canSubmit = user.role === 'house_lead' || user.role === 'center_lead';

  if (!canSubmit) {
    return (
      <div className="min-h-screen bg-[#FAFAFA]">
        <TopNavigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 text-center">
          <Card className="p-6 sm:p-8">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl sm:text-2xl font-bold mb-4">Accès Non Autorisé</h1>
            <p className="text-sm sm:text-base text-muted-foreground mb-6">
              Seuls les responsables de centres et de cellules peuvent enregistrer des cultes.
            </p>
            <Button onClick={() => router.push('/rapports')} className="min-h-[44px]">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour aux Rapports
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const totalCount = menCount + womenCount + childrenCount;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!worshipDate) {
      newErrors.worshipDate = 'La date est requise';
    } else if (!isSunday(worshipDate)) {
      newErrors.worshipDate = 'Vous devez sélectionner un dimanche';
    }

    if (menCount < 0) {
      newErrors.menCount = 'Le nombre ne peut pas être négatif';
    }

    if (womenCount < 0) {
      newErrors.womenCount = 'Le nombre ne peut pas être négatif';
    }

    if (childrenCount < 0) {
      newErrors.childrenCount = 'Le nombre ne peut pas être négatif';
    }

    if (totalCount === 0) {
      newErrors.total = 'Le total ne peut pas être zéro. Veuillez entrer au moins une personne.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      showToast('error', 'Veuillez corriger les erreurs du formulaire');
      return;
    }

    setSubmitting(true);

    try {
      const result = await createWorshipAttendance({
        worship_date: worshipDate,
        center_id: user.center_id!,
        house_church_id: user.house_church_id || undefined,
        men_count: menCount,
        women_count: womenCount,
        children_count: childrenCount,
        notes: notes.trim() || undefined,
        submitted_by: user.id,
      });

      if (result.success) {
        showToast('success', 'Culte enregistré avec succès !');
        router.push('/rapports');
      } else {
        showToast('error', result.error || 'Erreur lors de l\'enregistrement');
      }
    } catch (error: any) {
      showToast('error', error.message || 'Erreur inconnue');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <TopNavigation />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/rapports')}
            className="pl-0 mb-4 min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Retour aux Rapports</span>
            <span className="sm:hidden">Retour</span>
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold mb-2">
            Enregistrer un Culte du Dimanche
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Enregistrez la participation au culte dominical
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="p-4 sm:p-6 mb-6">
            <div className="space-y-5 sm:space-y-6">
              {/* Date du culte */}
              <div>
                <Label htmlFor="worshipDate" className="text-sm sm:text-base font-medium flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  Date du culte *
                </Label>
                <Input
                  id="worshipDate"
                  type="date"
                  value={worshipDate}
                  onChange={(e) => setWorshipDate(e.target.value)}
                  className={`mt-2 h-12 ${errors.worshipDate ? 'border-red-500' : ''}`}
                  max={new Date().toISOString().split('T')[0]}
                />
                {errors.worshipDate && (
                  <p className="text-xs sm:text-sm text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.worshipDate}
                  </p>
                )}
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Sélectionnez la date du dimanche du culte
                </p>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Participation
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Hommes */}
                  <div>
                    <Label htmlFor="menCount" className="font-medium">
                      Hommes *
                    </Label>
                    <Input
                      id="menCount"
                      type="number"
                      min="0"
                      value={menCount}
                      onChange={(e) => setMenCount(Number(e.target.value))}
                      className={`mt-2 ${errors.menCount ? 'border-red-500' : ''}`}
                      placeholder="0"
                    />
                    {errors.menCount && (
                      <p className="text-sm text-red-600 mt-1">{errors.menCount}</p>
                    )}
                  </div>

                  {/* Femmes */}
                  <div>
                    <Label htmlFor="womenCount" className="font-medium">
                      Femmes *
                    </Label>
                    <Input
                      id="womenCount"
                      type="number"
                      min="0"
                      value={womenCount}
                      onChange={(e) => setWomenCount(Number(e.target.value))}
                      className={`mt-2 ${errors.womenCount ? 'border-red-500' : ''}`}
                      placeholder="0"
                    />
                    {errors.womenCount && (
                      <p className="text-sm text-red-600 mt-1">{errors.womenCount}</p>
                    )}
                  </div>

                  {/* Enfants */}
                  <div>
                    <Label htmlFor="childrenCount" className="font-medium">
                      Enfants *
                    </Label>
                    <Input
                      id="childrenCount"
                      type="number"
                      min="0"
                      value={childrenCount}
                      onChange={(e) => setChildrenCount(Number(e.target.value))}
                      className={`mt-2 ${errors.childrenCount ? 'border-red-500' : ''}`}
                      placeholder="0"
                    />
                    {errors.childrenCount && (
                      <p className="text-sm text-red-600 mt-1">{errors.childrenCount}</p>
                    )}
                  </div>
                </div>

                {/* Total */}
                <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-lg">Total présents</span>
                    <span className="text-3xl font-bold text-purple-600">{totalCount}</span>
                  </div>
                </div>

                {errors.total && (
                  <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.total}
                  </p>
                )}
              </div>

              {/* Notes */}
              <div className="border-t pt-6">
                <Label htmlFor="notes" className="text-base font-medium">
                  Notes (optionnel)
                </Label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Ex: Culte spécial, événement particulier, visiteurs notables..."
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Ajoutez des notes si ce culte avait quelque chose de particulier
                </p>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/rapports')}
              disabled={submitting}
            >
              Annuler
            </Button>

            <Button type="submit" disabled={submitting} size="lg">
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Enregistrer le culte
                </>
              )}
            </Button>
          </div>

          {/* Info */}
          <Card className="p-4 mt-6 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-3">
              <Church className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-semibold mb-1">À savoir</p>
                <ul className="space-y-1">
                  <li>• Enregistrez la participation après chaque culte du dimanche</li>
                  <li>• Ces données permettent de suivre l'évolution de la fréquentation</li>
                  <li>• Vous pouvez ajouter des notes pour les cultes spéciaux</li>
                </ul>
              </div>
            </div>
          </Card>
        </form>
      </div>
    </div>
  );
}
