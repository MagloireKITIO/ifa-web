'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, Plus, Trash2, Baby, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Interfaces
export interface MarriageDetail {
  id: string; // Temporary ID for UI
  spouse1_id: string;
  spouse2_id: string;
  marriage_date: string;
  notes: string;
}

export interface BirthDetail {
  id: string; // Temporary ID for UI
  child_first_name: string;
  child_gender: 'M' | 'F';
  birth_date: string;
  father_id: string;
  mother_id: string;
  notes: string;
}

export interface FamilyData {
  marriages: number;
  engagements: number;
  births: number;
  couplesCounseled: number;
  // Phase 2: Détails événements
  marriageDetails?: MarriageDetail[];
  birthDetails?: BirthDetail[];
}

interface Member {
  id: string;
  full_name: string;
}

interface Step4FamilyProps {
  data: FamilyData;
  onChange: (data: FamilyData) => void;
  errors: Record<string, string>;
}

export function Step4Family({ data, onChange, errors }: Step4FamilyProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  // Charger les membres actifs
  useEffect(() => {
    loadMembers();
  }, []);

  // Synchroniser le compteur avec les détails
  useEffect(() => {
    if (data.marriageDetails) {
      onChange({ ...data, marriages: data.marriageDetails.length });
    }
  }, [data.marriageDetails]);

  useEffect(() => {
    if (data.birthDetails) {
      onChange({ ...data, births: data.birthDetails.length });
    }
  }, [data.birthDetails]);

  const loadMembers = async () => {
    const { data: membersData, error } = await supabase
      .from('members')
      .select('id, full_name')
      .eq('status', 'active')
      .order('full_name');

    if (!error && membersData) {
      setMembers(membersData);
    }
    setLoadingMembers(false);
  };

  const handleChange = (field: keyof FamilyData, value: number) => {
    onChange({ ...data, [field]: value });
  };

  // === MARIAGES ===
  const addMarriage = () => {
    const newMarriage: MarriageDetail = {
      id: `temp-${Date.now()}`,
      spouse1_id: '',
      spouse2_id: '',
      marriage_date: '',
      notes: '',
    };
    onChange({
      ...data,
      marriageDetails: [...(data.marriageDetails || []), newMarriage],
    });
  };

  const updateMarriage = (id: string, field: keyof MarriageDetail, value: any) => {
    const updated = (data.marriageDetails || []).map((m) =>
      m.id === id ? { ...m, [field]: value } : m
    );
    onChange({ ...data, marriageDetails: updated });
  };

  const removeMarriage = (id: string) => {
    const updated = (data.marriageDetails || []).filter((m) => m.id !== id);
    onChange({ ...data, marriageDetails: updated });
  };

  // === NAISSANCES ===
  const addBirth = () => {
    const newBirth: BirthDetail = {
      id: `temp-${Date.now()}`,
      child_first_name: '',
      child_gender: 'M',
      birth_date: '',
      father_id: '',
      mother_id: '',
      notes: '',
    };
    onChange({
      ...data,
      birthDetails: [...(data.birthDetails || []), newBirth],
    });
  };

  const updateBirth = (id: string, field: keyof BirthDetail, value: any) => {
    const updated = (data.birthDetails || []).map((b) =>
      b.id === id ? { ...b, [field]: value } : b
    );
    onChange({ ...data, birthDetails: updated });
  };

  const removeBirth = (id: string) => {
    const updated = (data.birthDetails || []).filter((b) => b.id !== id);
    onChange({ ...data, birthDetails: updated });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">Pilier Famille & Communauté</h2>
        <p className="text-muted-foreground">
          Statistiques sur la vie familiale et le counseling
        </p>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-pink-600 flex items-center justify-center">
            <Heart className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-semibold">Événements Familiaux</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="marriages">Mariages</Label>
            <Input
              id="marriages"
              type="number"
              value={data.marriages || ''}
              onChange={(e) =>
                handleChange('marriages', parseInt(e.target.value) || 0)
              }
              min="0"
              placeholder="Nombre de mariages célébrés"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Mariages célébrés ou bénis ce mois
            </p>
          </div>

          <div>
            <Label htmlFor="engagements">Fiançailles</Label>
            <Input
              id="engagements"
              type="number"
              value={data.engagements || ''}
              onChange={(e) =>
                handleChange('engagements', parseInt(e.target.value) || 0)
              }
              min="0"
              placeholder="Nombre de fiançailles"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Couples fiancés ce mois
            </p>
          </div>

          <div>
            <Label htmlFor="births">Naissances</Label>
            <Input
              id="births"
              type="number"
              value={data.births || ''}
              onChange={(e) =>
                handleChange('births', parseInt(e.target.value) || 0)
              }
              min="0"
              placeholder="Nombre de naissances"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Naissances dans les familles membres
            </p>
          </div>

          <div>
            <Label htmlFor="couplesCounseled">Couples conseillés</Label>
            <Input
              id="couplesCounseled"
              type="number"
              value={data.couplesCounseled || ''}
              onChange={(e) =>
                handleChange('couplesCounseled', parseInt(e.target.value) || 0)
              }
              min="0"
              placeholder="Sessions de counseling de couple"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Nombre de couples ayant reçu un counseling
            </p>
          </div>
        </div>
      </Card>

      {/* === DÉTAILS DES MARIAGES === */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center">
              <Heart className="w-6 h-6 text-pink-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold">Détails des Mariages</h3>
              <p className="text-sm text-muted-foreground">
                Renseignez les membres qui se sont mariés ce mois
              </p>
            </div>
          </div>
          <Button onClick={addMarriage} size="sm" variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un mariage
          </Button>
        </div>

        {data.marriageDetails && data.marriageDetails.length > 0 ? (
          <div className="space-y-4">
            {data.marriageDetails.map((marriage, index) => (
              <Card key={marriage.id} className="p-4 border-2">
                <div className="flex items-start justify-between mb-4">
                  <h4 className="font-medium">Mariage #{index + 1}</h4>
                  <Button
                    onClick={() => removeMarriage(marriage.id)}
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Époux 1 *</Label>
                    <select
                      value={marriage.spouse1_id}
                      onChange={(e) => updateMarriage(marriage.id, 'spouse1_id', e.target.value)}
                      className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white"
                      disabled={loadingMembers}
                    >
                      <option value="">Sélectionner un membre</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.full_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label>Époux 2 *</Label>
                    <select
                      value={marriage.spouse2_id}
                      onChange={(e) => updateMarriage(marriage.id, 'spouse2_id', e.target.value)}
                      className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white"
                      disabled={loadingMembers}
                    >
                      <option value="">Sélectionner un membre</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.full_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label>Date du mariage *</Label>
                    <Input
                      type="date"
                      value={marriage.marriage_date}
                      onChange={(e) => updateMarriage(marriage.id, 'marriage_date', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label>Notes (optionnel)</Label>
                    <Input
                      value={marriage.notes}
                      onChange={(e) => updateMarriage(marriage.id, 'notes', e.target.value)}
                      placeholder="Ex: Cérémonie au centre Akwa"
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Heart className="w-12 h-12 mx-auto mb-2 opacity-20" />
            <p>Aucun mariage enregistré</p>
            <p className="text-xs mt-1">Cliquez sur "Ajouter un mariage" pour commencer</p>
          </div>
        )}
      </Card>

      {/* === DÉTAILS DES NAISSANCES === */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <Baby className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold">Détails des Naissances</h3>
              <p className="text-sm text-muted-foreground">
                Renseignez les bébés nés ce mois avec leurs parents
              </p>
            </div>
          </div>
          <Button onClick={addBirth} size="sm" variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Ajouter une naissance
          </Button>
        </div>

        {data.birthDetails && data.birthDetails.length > 0 ? (
          <div className="space-y-4">
            {data.birthDetails.map((birth, index) => (
              <Card key={birth.id} className="p-4 border-2">
                <div className="flex items-start justify-between mb-4">
                  <h4 className="font-medium">Naissance #{index + 1}</h4>
                  <Button
                    onClick={() => removeBirth(birth.id)}
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Prénom de l'enfant *</Label>
                    <Input
                      value={birth.child_first_name}
                      onChange={(e) => updateBirth(birth.id, 'child_first_name', e.target.value)}
                      placeholder="Ex: Léa"
                    />
                  </div>

                  <div>
                    <Label>Genre *</Label>
                    <select
                      value={birth.child_gender}
                      onChange={(e) => updateBirth(birth.id, 'child_gender', e.target.value as 'M' | 'F')}
                      className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white"
                    >
                      <option value="M">Garçon</option>
                      <option value="F">Fille</option>
                    </select>
                  </div>

                  <div>
                    <Label>Date de naissance *</Label>
                    <Input
                      type="date"
                      value={birth.birth_date}
                      onChange={(e) => updateBirth(birth.id, 'birth_date', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label>Père (optionnel)</Label>
                    <select
                      value={birth.father_id}
                      onChange={(e) => updateBirth(birth.id, 'father_id', e.target.value)}
                      className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white"
                      disabled={loadingMembers}
                    >
                      <option value="">Sélectionner un membre</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.full_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label>Mère (optionnel)</Label>
                    <select
                      value={birth.mother_id}
                      onChange={(e) => updateBirth(birth.id, 'mother_id', e.target.value)}
                      className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white"
                      disabled={loadingMembers}
                    >
                      <option value="">Sélectionner un membre</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.full_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label>Notes (optionnel)</Label>
                    <Input
                      value={birth.notes}
                      onChange={(e) => updateBirth(birth.id, 'notes', e.target.value)}
                      placeholder="Ex: Naissance à l'hôpital Laquintinie"
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Baby className="w-12 h-12 mx-auto mb-2 opacity-20" />
            <p>Aucune naissance enregistrée</p>
            <p className="text-xs mt-1">Cliquez sur "Ajouter une naissance" pour commencer</p>
          </div>
        )}
      </Card>

      {/* Info supplémentaire */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <p className="text-sm text-muted-foreground">
          <strong>Note :</strong> Ces statistiques aident à suivre la santé des familles
          dans l'église et à identifier les besoins en accompagnement pastoral.
        </p>
      </Card>
    </div>
  );
}
