'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, CheckCircle, XCircle, TrendingUp } from 'lucide-react';
import { getHouseChurchMembers, type Member } from '@/lib/api/members';

interface MemberContribution {
  memberId: string;
  amount: number;
  hasContributed: boolean;
}

interface MemberContributionListProps {
  houseChurchId: string;
  contributions: MemberContribution[];
  onContributionsChange: (contributions: MemberContribution[]) => void;
}

export function MemberContributionList({
  houseChurchId,
  contributions,
  onContributionsChange,
}: MemberContributionListProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'contributed' | 'not-contributed'>('all');

  useEffect(() => {
    async function loadMembers() {
      try {
        setLoading(true);
        const membersData = await getHouseChurchMembers(houseChurchId);
        setMembers(membersData);

        // Initialiser les contributions si vides
        if (contributions.length === 0) {
          const initialContributions = membersData.map((m) => ({
            memberId: m.id,
            amount: 0,
            hasContributed: false,
          }));
          onContributionsChange(initialContributions);
        }
      } catch (error) {
        console.error('Erreur chargement membres:', error);
      } finally {
        setLoading(false);
      }
    }

    if (houseChurchId) {
      loadMembers();
    }
  }, [houseChurchId]);

  const handleToggleContribution = (memberId: string) => {
    const updatedContributions = contributions.map((c) =>
      c.memberId === memberId
        ? { ...c, hasContributed: !c.hasContributed, amount: c.hasContributed ? 0 : c.amount }
        : c
    );
    onContributionsChange(updatedContributions);
  };

  const handleAmountChange = (memberId: string, amount: number) => {
    const updatedContributions = contributions.map((c) =>
      c.memberId === memberId ? { ...c, amount } : c
    );
    onContributionsChange(updatedContributions);
  };

  const getContribution = (memberId: string): MemberContribution => {
    return (
      contributions.find((c) => c.memberId === memberId) || {
        memberId,
        amount: 0,
        hasContributed: false,
      }
    );
  };

  // Calculs des statistiques
  const totalContributors = contributions.filter((c) => c.hasContributed).length;
  const totalAmount = contributions
    .filter((c) => c.hasContributed)
    .reduce((sum, c) => sum + c.amount, 0);
  const averageAmount = totalContributors > 0 ? totalAmount / totalContributors : 0;
  const participationRate = members.length > 0 ? (totalContributors / members.length) * 100 : 0;

  // Filtrage des membres
  const filteredMembers = members.filter((member) => {
    const matchesSearch = member.full_name.toLowerCase().includes(searchQuery.toLowerCase());
    const contribution = getContribution(member.id);

    if (filter === 'contributed') {
      return matchesSearch && contribution.hasContributed;
    } else if (filter === 'not-contributed') {
      return matchesSearch && !contribution.hasContributed;
    }

    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">
          Aucun membre enregistré dans cette cellule.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Les membres seront ajoutés via le formulaire de sourcing.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec recherche et filtres */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un membre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tous ({members.length})
            </button>
            <button
              onClick={() => setFilter('contributed')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'contributed'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Ont donné ({totalContributors})
            </button>
            <button
              onClick={() => setFilter('not-contributed')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'not-contributed'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              N'ont pas donné ({members.length - totalContributors})
            </button>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          {members.length} membres actifs • Cochez les membres qui ont donné et entrez le montant
        </p>
      </div>

      {/* Liste des membres */}
      <div className="space-y-2 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4">
        {filteredMembers.map((member) => {
          const contribution = getContribution(member.id);
          return (
            <div
              key={member.id}
              className={`flex items-center gap-4 p-3 rounded-lg border transition-all ${
                contribution.hasContributed
                  ? 'bg-green-50 border-green-200'
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
            >
              {/* Checkbox */}
              <button
                type="button"
                onClick={() => handleToggleContribution(member.id)}
                className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                  contribution.hasContributed
                    ? 'bg-green-600 border-green-600'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                {contribution.hasContributed && (
                  <CheckCircle className="w-4 h-4 text-white" />
                )}
              </button>

              {/* Info membre */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">
                  {member.full_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {member.phone} • {member.is_baptized ? 'Baptisé' : 'Non baptisé'}
                </p>
              </div>

              {/* Montant */}
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Montant"
                  value={contribution.hasContributed ? contribution.amount : ''}
                  onChange={(e) =>
                    handleAmountChange(member.id, parseInt(e.target.value) || 0)
                  }
                  disabled={!contribution.hasContributed}
                  className="w-32 text-right"
                  min="0"
                />
                <span className="text-sm text-muted-foreground">XAF</span>
              </div>
            </div>
          );
        })}

        {filteredMembers.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Aucun membre trouvé
          </div>
        )}
      </div>

      {/* Résumé des dîmes */}
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-green-50 border-blue-200">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          Résumé des Dîmes
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-2xl font-bold text-foreground">
              {totalContributors} / {members.length}
            </p>
            <p className="text-sm text-muted-foreground">Membres ayant donné</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">
              {participationRate.toFixed(0)}%
            </p>
            <p className="text-sm text-muted-foreground">Taux de participation</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">
              {totalAmount.toLocaleString()} XAF
            </p>
            <p className="text-sm text-muted-foreground">Total des dîmes</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-600">
              {averageAmount.toLocaleString()} XAF
            </p>
            <p className="text-sm text-muted-foreground">Moyenne par donateur</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
