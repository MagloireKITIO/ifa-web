'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Target, BookOpen, Handshake } from 'lucide-react';

export interface ActivitiesData {
  peopleTrained: number;
  pastorsCertified: number;
  socialActionsCount: number;
  mealsDistributed: number;
  youthMentored: number;
  homeVisits: number;
  evangelismOutreachCount: number;
}

interface Step5ActivitiesProps {
  data: ActivitiesData;
  onChange: (data: ActivitiesData) => void;
  errors: Record<string, string>;
}

export function Step5Activities({ data, onChange, errors }: Step5ActivitiesProps) {
  const handleChange = (field: keyof ActivitiesData, value: number) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">Pilier Activités</h2>
        <p className="text-muted-foreground">
          Formation, actions sociales et évangélisation
        </p>
      </div>

      {/* Formation */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-semibold">Formation</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="peopleTrained">Personnes formées</Label>
            <Input
              id="peopleTrained"
              type="number"
              value={data.peopleTrained || ''}
              onChange={(e) =>
                handleChange('peopleTrained', parseInt(e.target.value) || 0)
              }
              min="0"
              placeholder="Nombre de personnes ayant suivi une formation"
            />
          </div>

          <div>
            <Label htmlFor="pastorsCertified">Pasteurs certifiés</Label>
            <Input
              id="pastorsCertified"
              type="number"
              value={data.pastorsCertified || ''}
              onChange={(e) =>
                handleChange('pastorsCertified', parseInt(e.target.value) || 0)
              }
              min="0"
              placeholder="Nombre de pasteurs ayant obtenu une certification"
            />
          </div>
        </div>
      </Card>

      {/* Actions Sociales */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-orange-600 flex items-center justify-center">
            <Handshake className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-semibold">Actions Sociales</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="socialActionsCount">Nombre d'actions</Label>
            <Input
              id="socialActionsCount"
              type="number"
              value={data.socialActionsCount || ''}
              onChange={(e) =>
                handleChange('socialActionsCount', parseInt(e.target.value) || 0)
              }
              min="0"
              placeholder="Ex: distribution de vivres, visites hôpitaux..."
            />
          </div>

          <div>
            <Label htmlFor="mealsDistributed">Repas distribués</Label>
            <Input
              id="mealsDistributed"
              type="number"
              value={data.mealsDistributed || ''}
              onChange={(e) =>
                handleChange('mealsDistributed', parseInt(e.target.value) || 0)
              }
              min="0"
              placeholder="Nombre de repas offerts"
            />
          </div>

          <div>
            <Label htmlFor="youthMentored">Jeunes mentorés</Label>
            <Input
              id="youthMentored"
              type="number"
              value={data.youthMentored || ''}
              onChange={(e) =>
                handleChange('youthMentored', parseInt(e.target.value) || 0)
              }
              min="0"
              placeholder="Jeunes bénéficiant d'un mentorat"
            />
          </div>
        </div>
      </Card>

      {/* Évangélisation */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center">
            <Target className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-semibold">Évangélisation</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="homeVisits">Visites à domicile</Label>
            <Input
              id="homeVisits"
              type="number"
              value={data.homeVisits || ''}
              onChange={(e) =>
                handleChange('homeVisits', parseInt(e.target.value) || 0)
              }
              min="0"
              placeholder="Nombre de visites à domicile"
            />
          </div>

          <div>
            <Label htmlFor="evangelismOutreachCount">Campagnes d'évangélisation</Label>
            <Input
              id="evangelismOutreachCount"
              type="number"
              value={data.evangelismOutreachCount || ''}
              onChange={(e) =>
                handleChange(
                  'evangelismOutreachCount',
                  parseInt(e.target.value) || 0
                )
              }
              min="0"
              placeholder="Nombre de sorties évangéliques"
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
