'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Users, UserPlus, Activity } from 'lucide-react';

export interface PeopleData {
  attendanceMen: number;
  attendanceWomen: number;
  attendanceChildren: number;
  newConverts: number;
  firstTimers: number;
  baptisms: number;
  membersActiveStart: number;
  membersGained: number;
  membersLost: number;
}

interface Step3PeopleProps {
  data: PeopleData;
  onChange: (data: PeopleData) => void;
  errors: Record<string, string>;
}

export function Step3People({ data, onChange, errors }: Step3PeopleProps) {
  const handleChange = (field: keyof PeopleData, value: number) => {
    onChange({ ...data, [field]: value });
  };

  const attendanceTotal =
    data.attendanceMen + data.attendanceWomen + data.attendanceChildren;
  const membersActiveEnd =
    data.membersActiveStart + data.membersGained - data.membersLost;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">Pilier Personnes</h2>
        <p className="text-muted-foreground">
          Statistiques sur la présence et la croissance
        </p>
      </div>

      {/* Présence Moyenne */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-semibold">Présence Moyenne</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="attendanceMen">
              Hommes <span className="text-red-500">*</span>
            </Label>
            <Input
              id="attendanceMen"
              type="number"
              value={data.attendanceMen || ''}
              onChange={(e) =>
                handleChange('attendanceMen', parseInt(e.target.value) || 0)
              }
              min="0"
              className={errors.attendanceMen ? 'border-red-500' : ''}
            />
          </div>

          <div>
            <Label htmlFor="attendanceWomen">
              Femmes <span className="text-red-500">*</span>
            </Label>
            <Input
              id="attendanceWomen"
              type="number"
              value={data.attendanceWomen || ''}
              onChange={(e) =>
                handleChange('attendanceWomen', parseInt(e.target.value) || 0)
              }
              min="0"
              className={errors.attendanceWomen ? 'border-red-500' : ''}
            />
          </div>

          <div>
            <Label htmlFor="attendanceChildren">
              Enfants <span className="text-red-500">*</span>
            </Label>
            <Input
              id="attendanceChildren"
              type="number"
              value={data.attendanceChildren || ''}
              onChange={(e) =>
                handleChange('attendanceChildren', parseInt(e.target.value) || 0)
              }
              min="0"
              className={errors.attendanceChildren ? 'border-red-500' : ''}
            />
          </div>

          <div className="flex items-end">
            <div className="w-full p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
              <p className="text-sm text-muted-foreground mb-1">Total (auto)</p>
              <p className="text-2xl font-bold text-blue-600">{attendanceTotal}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Croissance */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-green-600 flex items-center justify-center">
            <UserPlus className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-semibold">Croissance</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="newConverts">Nouveaux convertis</Label>
            <Input
              id="newConverts"
              type="number"
              value={data.newConverts || ''}
              onChange={(e) =>
                handleChange('newConverts', parseInt(e.target.value) || 0)
              }
              min="0"
            />
          </div>

          <div>
            <Label htmlFor="firstTimers">Premières visites</Label>
            <Input
              id="firstTimers"
              type="number"
              value={data.firstTimers || ''}
              onChange={(e) =>
                handleChange('firstTimers', parseInt(e.target.value) || 0)
              }
              min="0"
            />
          </div>

          <div>
            <Label htmlFor="baptisms">Baptêmes</Label>
            <Input
              id="baptisms"
              type="number"
              value={data.baptisms || ''}
              onChange={(e) =>
                handleChange('baptisms', parseInt(e.target.value) || 0)
              }
              min="0"
            />
          </div>
        </div>
      </Card>

      {/* Membres Actifs */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-semibold">Membres Actifs</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="membersActiveStart">Début du mois</Label>
            <Input
              id="membersActiveStart"
              type="number"
              value={data.membersActiveStart || ''}
              onChange={(e) =>
                handleChange('membersActiveStart', parseInt(e.target.value) || 0)
              }
              min="0"
            />
          </div>

          <div>
            <Label htmlFor="membersGained">Gagnés</Label>
            <Input
              id="membersGained"
              type="number"
              value={data.membersGained || ''}
              onChange={(e) =>
                handleChange('membersGained', parseInt(e.target.value) || 0)
              }
              min="0"
            />
          </div>

          <div>
            <Label htmlFor="membersLost">Perdus (déménagement, décès, etc.)</Label>
            <Input
              id="membersLost"
              type="number"
              value={data.membersLost || ''}
              onChange={(e) =>
                handleChange('membersLost', parseInt(e.target.value) || 0)
              }
              min="0"
            />
          </div>

          <div className="flex items-end">
            <div className="w-full p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
              <p className="text-sm text-muted-foreground mb-1">Fin du mois (auto)</p>
              <p className="text-2xl font-bold text-purple-600">{membersActiveEnd}</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
