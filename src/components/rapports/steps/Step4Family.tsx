'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Heart } from 'lucide-react';

export interface FamilyData {
  marriages: number;
  engagements: number;
  births: number;
  couplesCounseled: number;
}

interface Step4FamilyProps {
  data: FamilyData;
  onChange: (data: FamilyData) => void;
  errors: Record<string, string>;
}

export function Step4Family({ data, onChange, errors }: Step4FamilyProps) {
  const handleChange = (field: keyof FamilyData, value: number) => {
    onChange({ ...data, [field]: value });
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
