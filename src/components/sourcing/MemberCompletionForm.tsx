'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Check, Loader2, Lock, AlertTriangle, Shield } from 'lucide-react';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  submitMemberCompletion,
  checkPhoneExists,
  type MemberWithCompletion,
} from '@/lib/api/sourcing';
import { supabase } from '@/lib/supabase';

interface MemberCompletionFormProps {
  member: MemberWithCompletion | null; // Si null = création, sinon = complétion
  onBack: () => void;
  onSuccess: () => void;
}

interface Center {
  id: string;
  name: string;
  zone_id: string;
}

interface HouseChurch {
  id: string;
  name: string;
  center_id: string;
}

export function MemberCompletionForm({
  member,
  onBack,
  onSuccess,
}: MemberCompletionFormProps) {
  const isEditMode = !!member;

  // États du formulaire
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthYear, setBirthYear] = useState<number | ''>('');
  const [conversionYear, setConversionYear] = useState<number | ''>('');
  const [joinedIfaYear, setJoinedIfaYear] = useState<number | ''>('');
  const [isBaptized, setIsBaptized] = useState(false);
  const [baptismDate, setBaptismDate] = useState('');
  const [marriageDate, setMarriageDate] = useState('');
  const [centerId, setCenterId] = useState('');
  const [houseChurchId, setHouseChurchId] = useState('');
  const [notes, setNotes] = useState('');

  // Nouveaux champs Phase 2
  const [gender, setGender] = useState<'M' | 'F' | ''>('');
  const [maritalStatus, setMaritalStatus] = useState<'single' | 'married' | 'widowed' | 'divorced' | ''>('');
  const [childrenCount, setChildrenCount] = useState<number>(0);
  const [childrenBoys, setChildrenBoys] = useState<number>(0);
  const [childrenGirls, setChildrenGirls] = useState<number>(0);

  // Données de référence
  const [centers, setCenters] = useState<Center[]>([]);
  const [houseChurches, setHouseChurches] = useState<HouseChurch[]>([]);
  const [filteredHouseChurches, setFilteredHouseChurches] = useState<HouseChurch[]>([]);

  // États UI
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [phoneWarning, setPhoneWarning] = useState('');

  // CAPTCHA
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaError, setCaptchaError] = useState('');
  const captchaRef = useRef<HCaptcha>(null);

  // Charger les données initiales
  useEffect(() => {
    loadCenters();
    loadHouseChurches();

    if (member) {
      // Pré-remplir avec les données existantes
      setFullName(member.full_name || '');
      setPhone(member.phone || '');
      setBirthYear(member.birth_year || '');
      setConversionYear(member.conversion_year || '');
      setJoinedIfaYear(member.joined_ifa_year || '');
      setIsBaptized(member.is_baptized || false);
      setMarriageDate(member.marriage_date || '');
      setCenterId(member.center_id || '');
      setHouseChurchId(member.house_church_id || '');
      setNotes(member.notes || '');
    }
  }, [member]);

  // Filtrer les assemblées par centre
  useEffect(() => {
    if (centerId) {
      const filtered = houseChurches.filter((hc) => hc.center_id === centerId);
      setFilteredHouseChurches(filtered);
    } else {
      setFilteredHouseChurches([]);
    }
  }, [centerId, houseChurches]);

  // Synchroniser le nombre total d'enfants avec garçons + filles
  useEffect(() => {
    setChildrenCount(childrenBoys + childrenGirls);
  }, [childrenBoys, childrenGirls]);

  const loadCenters = async () => {
    const { data } = await supabase.from('centers').select('*').order('name');
    if (data) setCenters(data);
  };

  const loadHouseChurches = async () => {
    const { data } = await supabase.from('house_churches').select('*').order('name');
    if (data) setHouseChurches(data);
  };

  // Vérifier téléphone en temps réel
  useEffect(() => {
    if (phone.length >= 9 && (!member || phone !== member.phone)) {
      const timer = setTimeout(async () => {
        const { exists, member: existingMember } = await checkPhoneExists(phone);
        if (exists && existingMember) {
          setPhoneWarning(
            `Ce numéro est déjà utilisé par ${existingMember.full_name}. Est-ce vous ?`
          );
        } else {
          setPhoneWarning('');
        }
      }, 800);
      return () => clearTimeout(timer);
    } else {
      setPhoneWarning('');
    }
  }, [phone, member]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim() || fullName.trim().length < 2) {
      newErrors.fullName = 'Le nom complet est requis (min. 2 caractères)';
    }

    if (!phone.trim() || phone.trim().length < 9) {
      newErrors.phone = 'Un numéro de téléphone valide est requis';
    }

    const currentYear = new Date().getFullYear();

    if (birthYear) {
      const year = Number(birthYear);
      if (year < 1900 || year > currentYear - 5) {
        newErrors.birthYear = 'Année de naissance invalide';
      }
    }

    if (conversionYear) {
      const year = Number(conversionYear);
      if (year < 1900 || year > currentYear) {
        newErrors.conversionYear = 'Année de conversion invalide';
      }
    }

    if (joinedIfaYear) {
      const year = Number(joinedIfaYear);
      if (year < 2011) {
        newErrors.joinedIfaYear = 'L\'IFA a été fondée en 2011';
      }
      if (year > currentYear) {
        newErrors.joinedIfaYear = 'Année d\'intégration invalide';
      }
    }

    // Validations logiques
    if (birthYear && conversionYear && Number(birthYear) >= Number(conversionYear)) {
      newErrors.conversionYear = 'Doit être après l\'année de naissance';
    }

    if (conversionYear && joinedIfaYear && Number(conversionYear) > Number(joinedIfaYear)) {
      newErrors.joinedIfaYear = 'Doit être après la conversion';
    }

    if (!centerId) {
      newErrors.centerId = 'Veuillez sélectionner un centre';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // 🔒 SÉCURITÉ: Vérifier le CAPTCHA
    if (!captchaToken) {
      setCaptchaError('Veuillez compléter le CAPTCHA pour vérifier que vous êtes humain');
      return;
    }

    setLoading(true);

    try {
      const data = {
        member_id: member?.id,
        full_name: fullName.trim(),
        phone: phone.trim(),
        captcha_token: captchaToken, // Ajouter le token CAPTCHA
        birth_year: birthYear ? Number(birthYear) : undefined,
        conversion_year: conversionYear ? Number(conversionYear) : undefined,
        joined_ifa_year: joinedIfaYear ? Number(joinedIfaYear) : undefined,
        is_baptized: isBaptized,
        baptism_date: baptismDate || undefined,
        marriage_date: marriageDate || undefined,
        center_id: centerId,
        house_church_id: houseChurchId || undefined,
        notes: notes.trim() || undefined,
        // Nouveaux champs Phase 2
        gender: gender || undefined,
        marital_status: maritalStatus || undefined,
        children_count: childrenCount > 0 ? childrenCount : undefined,
        children_boys: childrenBoys > 0 ? childrenBoys : undefined,
        children_girls: childrenGirls > 0 ? childrenGirls : undefined,
      };

      const result = await submitMemberCompletion(data);

      if (result.success) {
        onSuccess();
      } else {
        setErrors({ submit: result.error || 'Erreur lors de la soumission' });
      }
    } catch (err: any) {
      setErrors({ submit: err.message || 'Erreur inconnue' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="pl-0">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
        {isEditMode && (
          <div className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-md">
            Mode Complétion
          </div>
        )}
      </div>

      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">
          {isEditMode ? 'Complétez votre profil' : 'Créez votre profil'}
        </h2>
        <p className="text-gray-600">
          {isEditMode
            ? 'Remplissez les informations manquantes pour compléter votre profil'
            : 'Remplissez tous les champs pour créer votre profil membre'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informations personnelles */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          <h3 className="font-semibold text-lg text-gray-900 flex items-center">
            Informations personnelles
            <span className="ml-2 text-red-500">*</span>
          </h3>

          <div className="space-y-4">
            {/* Nom complet */}
            <div>
              <Label htmlFor="fullName">Nom complet *</Label>
              <div className="relative">
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={isEditMode}
                  className={isEditMode ? 'bg-gray-50 cursor-not-allowed' : ''}
                  placeholder="Ex: Jean Ngono"
                />
                {isEditMode && (
                  <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                )}
              </div>
              {errors.fullName && (
                <p className="text-sm text-red-600 mt-1">{errors.fullName}</p>
              )}
            </div>

            {/* Téléphone */}
            <div>
              <Label htmlFor="phone">Téléphone *</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ex: +237 6XX XX XX XX"
              />
              {phoneWarning && (
                <div className="flex items-start space-x-2 mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-700">{phoneWarning}</p>
                </div>
              )}
              {errors.phone && (
                <p className="text-sm text-red-600 mt-1">{errors.phone}</p>
              )}
            </div>

            {/* Année de naissance */}
            <div>
              <Label htmlFor="birthYear">Année de naissance</Label>
              <Input
                id="birthYear"
                type="number"
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value ? Number(e.target.value) : '')}
                placeholder="Ex: 1990"
                min="1900"
                max={new Date().getFullYear() - 5}
              />
              {errors.birthYear && (
                <p className="text-sm text-red-600 mt-1">{errors.birthYear}</p>
              )}
            </div>
          </div>
        </div>

        {/* Situation familiale */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          <h3 className="font-semibold text-lg text-gray-900">Situation familiale</h3>

          <div className="space-y-4">
            {/* Genre */}
            <div>
              <Label htmlFor="gender">Genre</Label>
              <select
                id="gender"
                value={gender}
                onChange={(e) => setGender(e.target.value as 'M' | 'F' | '')}
                className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white"
              >
                <option value="">Sélectionnez</option>
                <option value="M">Homme</option>
                <option value="F">Femme</option>
              </select>
            </div>

            {/* Statut marital */}
            <div>
              <Label htmlFor="maritalStatus">Statut marital</Label>
              <select
                id="maritalStatus"
                value={maritalStatus}
                onChange={(e) => setMaritalStatus(e.target.value as any)}
                className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white"
              >
                <option value="">Sélectionnez</option>
                <option value="single">Célibataire</option>
                <option value="married">Marié(e)</option>
                <option value="widowed">Veuf/Veuve</option>
                <option value="divorced">Divorcé(e)</option>
              </select>
            </div>

            {/* Date de mariage */}
            <div>
              <Label htmlFor="marriageDate">Date de mariage (si applicable)</Label>
              <Input
                id="marriageDate"
                type="date"
                value={marriageDate}
                onChange={(e) => setMarriageDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* Enfants */}
            <div className="border-t pt-4 space-y-4">
              <p className="font-medium text-gray-900">Enfants</p>
              <p className="text-sm text-gray-600">
                Si vous avez des enfants, indiquez combien de garçons et de filles
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="childrenBoys">Nombre de garçons</Label>
                  <Input
                    id="childrenBoys"
                    type="number"
                    value={childrenBoys}
                    onChange={(e) => setChildrenBoys(Number(e.target.value) || 0)}
                    min="0"
                    max="20"
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="childrenGirls">Nombre de filles</Label>
                  <Input
                    id="childrenGirls"
                    type="number"
                    value={childrenGirls}
                    onChange={(e) => setChildrenGirls(Number(e.target.value) || 0)}
                    min="0"
                    max="20"
                    placeholder="0"
                  />
                </div>
              </div>

              {childrenCount > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-700">
                    <strong>Total :</strong> {childrenCount} enfant{childrenCount > 1 ? 's' : ''}
                    {childrenBoys > 0 && ` (${childrenBoys} garçon${childrenBoys > 1 ? 's' : ''})`}
                    {childrenGirls > 0 && ` (${childrenGirls} fille${childrenGirls > 1 ? 's' : ''})`}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Parcours spirituel */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          <h3 className="font-semibold text-lg text-gray-900">Parcours spirituel</h3>

          <div className="space-y-4">
            {/* Année de conversion */}
            <div>
              <Label htmlFor="conversionYear">Année de conversion</Label>
              <Input
                id="conversionYear"
                type="number"
                value={conversionYear}
                onChange={(e) =>
                  setConversionYear(e.target.value ? Number(e.target.value) : '')
                }
                placeholder="Ex: 2015"
                min="1900"
                max={new Date().getFullYear()}
              />
              {errors.conversionYear && (
                <p className="text-sm text-red-600 mt-1">{errors.conversionYear}</p>
              )}
            </div>

            {/* Année d'intégration IFA */}
            <div>
              <Label htmlFor="joinedIfaYear">Année d'intégration à l'IFA</Label>
              <Input
                id="joinedIfaYear"
                type="number"
                value={joinedIfaYear}
                onChange={(e) =>
                  setJoinedIfaYear(e.target.value ? Number(e.target.value) : '')
                }
                placeholder="Ex: 2018"
                min="2011"
                max={new Date().getFullYear()}
              />
              <p className="text-xs text-gray-500 mt-1">L'IFA a été fondée en 2011</p>
              {errors.joinedIfaYear && (
                <p className="text-sm text-red-600 mt-1">{errors.joinedIfaYear}</p>
              )}
            </div>

            {/* Baptême */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isBaptized"
                  checked={isBaptized}
                  onCheckedChange={(checked) => setIsBaptized(checked as boolean)}
                />
                <Label htmlFor="isBaptized" className="cursor-pointer">
                  Je suis baptisé(e)
                </Label>
              </div>

              {isBaptized && (
                <div>
                  <Label htmlFor="baptismDate">Date de baptême (optionnel)</Label>
                  <Input
                    id="baptismDate"
                    type="date"
                    value={baptismDate}
                    onChange={(e) => setBaptismDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Affectation */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          <h3 className="font-semibold text-lg text-gray-900 flex items-center">
            Affectation
            <span className="ml-2 text-red-500">*</span>
          </h3>

          <div className="space-y-4">
            {/* Centre */}
            <div>
              <Label htmlFor="centerId">Centre *</Label>
              <select
                id="centerId"
                value={centerId}
                onChange={(e) => {
                  setCenterId(e.target.value);
                  setHouseChurchId(''); // Reset assemblée
                }}
                disabled={isEditMode}
                className={`w-full h-10 px-3 rounded-md border border-gray-300 ${
                  isEditMode ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'
                }`}
              >
                <option value="">Sélectionnez un centre</option>
                {centers.map((center) => (
                  <option key={center.id} value={center.id}>
                    {center.name}
                  </option>
                ))}
              </select>
              {errors.centerId && (
                <p className="text-sm text-red-600 mt-1">{errors.centerId}</p>
              )}
            </div>

            {/* Assemblée */}
            <div>
              <Label htmlFor="houseChurchId">Assemblée (optionnel)</Label>
              <select
                id="houseChurchId"
                value={houseChurchId}
                onChange={(e) => setHouseChurchId(e.target.value)}
                disabled={!centerId || (isEditMode && !!member?.house_church_id)}
                className={`w-full h-10 px-3 rounded-md border border-gray-300 ${
                  !centerId || (isEditMode && !!member?.house_church_id)
                    ? 'bg-gray-50 cursor-not-allowed'
                    : 'bg-white'
                }`}
              >
                <option value="">Sélectionnez une assemblée</option>
                {filteredHouseChurches.map((hc) => (
                  <option key={hc.id} value={hc.id}>
                    {hc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <Label htmlFor="notes">Notes complémentaires (optionnel)</Label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md resize-none"
            placeholder="Informations complémentaires..."
          />
        </div>

        {/* Erreur de soumission */}
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{errors.submit}</p>
          </div>
        )}

        {/* CAPTCHA - Protection anti-robot */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Shield className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-gray-900">
              Vérification de sécurité
            </h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Pour protéger nos données, veuillez confirmer que vous êtes humain
          </p>
          <HCaptcha
            ref={captchaRef}
            sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY || ''}
            onVerify={(token) => {
              setCaptchaToken(token);
              setCaptchaError('');
            }}
            onExpire={() => {
              setCaptchaToken('');
              setCaptchaError('Le CAPTCHA a expiré. Veuillez le refaire.');
            }}
            onError={() => {
              setCaptchaToken('');
              setCaptchaError('Erreur lors de la vérification. Veuillez réessayer.');
            }}
          />
          {captchaError && (
            <p className="text-sm text-red-600 mt-2">{captchaError}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            <span className="text-red-500">*</span> Champs obligatoires
          </p>
          <Button type="submit" disabled={loading} size="lg">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Soumettre mon profil
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Information sur la validation */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-700">
          <strong>À savoir :</strong> Votre soumission sera vérifiée par un administrateur
          avant d'être validée. Vous serez contacté si des informations supplémentaires sont
          nécessaires.
        </p>
      </div>
    </div>
  );
}
