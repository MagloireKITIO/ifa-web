'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { DollarSign, TrendingDown, TrendingUp } from 'lucide-react';
import { MemberContributionList } from '../MemberContributionList';

interface MemberContribution {
  memberId: string;
  amount: number;
  hasContributed: boolean;
}

export interface FinancialData {
  tithes: number;
  offeringsGeneral: number;
  offeringsEvents: number;
  offeringsInvestment: number;
  expenseAdmin: number;
  expenseRent: number;
  expenseMission: number;
  expenseEvents: number;
  notes: string;
  memberContributions: MemberContribution[];
}

interface Step2FinancialProps {
  data: FinancialData;
  onChange: (data: FinancialData) => void;
  errors: Record<string, string>;
  userRole: 'house_lead' | 'center_lead';
  houseChurchId?: string | null;
}

export function Step2Financial({
  data,
  onChange,
  errors,
  userRole,
  houseChurchId,
}: Step2FinancialProps) {
  const handleChange = (field: keyof FinancialData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const handleMemberContributionsChange = (contributions: MemberContribution[]) => {
    // Calculer le total des dîmes depuis les contributions
    const totalTithes = contributions
      .filter((c) => c.hasContributed)
      .reduce((sum, c) => sum + c.amount, 0);

    onChange({
      ...data,
      memberContributions: contributions,
      tithes: totalTithes,
    });
  };

  // Calculs automatiques
  const totalRevenue =
    data.tithes +
    data.offeringsGeneral +
    data.offeringsEvents +
    data.offeringsInvestment;

  const totalExpenses =
    data.expenseAdmin +
    data.expenseRent +
    data.expenseMission +
    data.expenseEvents;

  const balance = totalRevenue - totalExpenses;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">Pilier Finances</h2>
        <p className="text-muted-foreground">
          Saisissez les revenus et dépenses pour cette période
        </p>
      </div>

      {/* Section 1 : Dîmes Détaillées (uniquement pour house_lead) */}
      {userRole === 'house_lead' && houseChurchId && (
        <Card className="p-6 border-2 border-blue-200 bg-blue-50/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold">Dîmes Détaillées par Membre</h3>
              <p className="text-sm text-muted-foreground">
                Cochez les membres qui ont donné et entrez le montant
              </p>
            </div>
          </div>

          <MemberContributionList
            houseChurchId={houseChurchId}
            contributions={data.memberContributions}
            onContributionsChange={handleMemberContributionsChange}
          />
        </Card>
      )}

      {/* Section 1 bis : Dîmes pour Center Lead (saisie manuelle) */}
      {userRole === 'center_lead' && (
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold">Revenus</h3>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="tithes">
                Dîmes (XAF) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="tithes"
                type="number"
                value={data.tithes || ''}
                onChange={(e) =>
                  handleChange('tithes', parseInt(e.target.value) || 0)
                }
                min="0"
                className={errors.tithes ? 'border-red-500' : ''}
              />
              {errors.tithes && (
                <p className="text-sm text-red-500 mt-1">{errors.tithes}</p>
              )}
            </div>
          </div>
        </Card>
      )}

      <Separator />

      {/* Section 2 : Autres Revenus */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-green-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-semibold">Autres Revenus</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="offeringsGeneral">Offrandes générales (XAF)</Label>
            <Input
              id="offeringsGeneral"
              type="number"
              value={data.offeringsGeneral || ''}
              onChange={(e) =>
                handleChange('offeringsGeneral', parseInt(e.target.value) || 0)
              }
              min="0"
            />
          </div>

          <div>
            <Label htmlFor="offeringsEvents">Offrandes événements (XAF)</Label>
            <Input
              id="offeringsEvents"
              type="number"
              value={data.offeringsEvents || ''}
              onChange={(e) =>
                handleChange('offeringsEvents', parseInt(e.target.value) || 0)
              }
              min="0"
            />
          </div>

          <div>
            <Label htmlFor="offeringsInvestment">
              Offrandes investissement (XAF)
            </Label>
            <Input
              id="offeringsInvestment"
              type="number"
              value={data.offeringsInvestment || ''}
              onChange={(e) =>
                handleChange('offeringsInvestment', parseInt(e.target.value) || 0)
              }
              min="0"
            />
          </div>
        </div>
      </Card>

      <Separator />

      {/* Section 3 : Dépenses */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-red-600 flex items-center justify-center">
            <TrendingDown className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-semibold">Dépenses</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="expenseAdmin">Administration (XAF)</Label>
            <Input
              id="expenseAdmin"
              type="number"
              value={data.expenseAdmin || ''}
              onChange={(e) =>
                handleChange('expenseAdmin', parseInt(e.target.value) || 0)
              }
              min="0"
            />
          </div>

          <div>
            <Label htmlFor="expenseRent">Loyer (XAF)</Label>
            <Input
              id="expenseRent"
              type="number"
              value={data.expenseRent || ''}
              onChange={(e) =>
                handleChange('expenseRent', parseInt(e.target.value) || 0)
              }
              min="0"
            />
          </div>

          <div>
            <Label htmlFor="expenseMission">Mission (XAF)</Label>
            <Input
              id="expenseMission"
              type="number"
              value={data.expenseMission || ''}
              onChange={(e) =>
                handleChange('expenseMission', parseInt(e.target.value) || 0)
              }
              min="0"
            />
          </div>

          <div>
            <Label htmlFor="expenseEvents">Événements (XAF)</Label>
            <Input
              id="expenseEvents"
              type="number"
              value={data.expenseEvents || ''}
              onChange={(e) =>
                handleChange('expenseEvents', parseInt(e.target.value) || 0)
              }
              min="0"
            />
          </div>
        </div>
      </Card>

      {/* Notes optionnelles */}
      <div>
        <Label htmlFor="notes">Notes (optionnel)</Label>
        <Textarea
          id="notes"
          value={data.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          placeholder="Ajoutez des commentaires ou précisions sur les finances..."
          rows={3}
        />
      </div>

      {/* Résumé Financier */}
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200">
        <h3 className="text-lg font-semibold mb-4">Résumé Financier</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-white rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Total Revenus</p>
            <p className="text-2xl font-bold text-green-600">
              {totalRevenue.toLocaleString()} XAF
            </p>
          </div>
          <div className="p-4 bg-white rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Total Dépenses</p>
            <p className="text-2xl font-bold text-red-600">
              {totalExpenses.toLocaleString()} XAF
            </p>
          </div>
          <div className="p-4 bg-white rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Solde</p>
            <p
              className={`text-2xl font-bold ${
                balance >= 0 ? 'text-blue-600' : 'text-red-600'
              }`}
            >
              {balance >= 0 ? '+' : ''}
              {balance.toLocaleString()} XAF
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
