'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, User, MapPin, AlertCircle, CheckCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { searchMemberByName, type MemberWithCompletion } from '@/lib/api/sourcing';

interface MemberSearchFormProps {
  onMemberSelect: (member: MemberWithCompletion | null) => void;
  onCreateNew: () => void;
}

export function MemberSearchForm({ onMemberSelect, onCreateNew }: MemberSearchFormProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<MemberWithCompletion[]>([]);
  const [showResults, setShowResults] = useState(false);

  // Debounced search
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      const members = await searchMemberByName(searchQuery);
      setResults(members);
      setShowResults(true);
      setSearching(false);
    }, 500); // Attendre 500ms après la dernière frappe

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleMemberSelect = useCallback(
    (member: MemberWithCompletion) => {
      onMemberSelect(member);
      setShowResults(false);
    },
    [onMemberSelect]
  );

  const handleCreateNew = useCallback(() => {
    onCreateNew();
    setSearchQuery('');
    setResults([]);
    setShowResults(false);
  }, [onCreateNew]);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">
          Recherchez votre profil
        </h2>
        <p className="text-gray-600">
          Entrez votre nom pour voir si vous êtes déjà enregistré dans notre système
        </p>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <Label htmlFor="search" className="text-base font-medium">
            Votre nom complet
          </Label>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              id="search"
              type="text"
              placeholder="Ex: Jean Ngono"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 h-12 text-lg"
              autoComplete="off"
            />
          </div>
          {searching && (
            <p className="text-sm text-gray-500 mt-2">Recherche en cours...</p>
          )}
        </div>

        {/* Résultats de recherche */}
        {showResults && results.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="p-3 bg-gray-50 border-b border-gray-200">
              <p className="text-sm font-medium text-gray-700">
                {results.length} résultat{results.length > 1 ? 's' : ''} trouvé{results.length > 1 ? 's' : ''}
              </p>
            </div>
            <div className="divide-y divide-gray-200">
              {results.map((member) => (
                <button
                  key={member.id}
                  onClick={() => handleMemberSelect(member)}
                  className="w-full p-4 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900">
                          {member.full_name}
                        </p>
                        {member.phone && (
                          <p className="text-sm text-gray-600 mt-0.5">
                            📞 {member.phone}
                          </p>
                        )}
                        <div className="flex items-center mt-1 text-sm text-gray-500">
                          <MapPin className="h-3.5 w-3.5 mr-1" />
                          <span>
                            {(member as any).centers?.name || 'Centre non défini'}
                            {(member as any).house_churches?.name &&
                              ` • ${(member as any).house_churches.name}`}
                          </span>
                        </div>

                        {/* Taux de complétion */}
                        <div className="mt-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-gray-600">
                              Profil complété
                            </span>
                            <span className="text-xs font-semibold text-gray-900">
                              {member.completion_rate}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                member.completion_rate >= 80
                                  ? 'bg-green-500'
                                  : member.completion_rate >= 50
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                              }`}
                              style={{ width: `${member.completion_rate}%` }}
                            />
                          </div>
                          {member.missing_fields.length > 0 && (
                            <p className="text-xs text-gray-500 mt-1">
                              Manquant: {member.missing_fields.slice(0, 3).join(', ')}
                              {member.missing_fields.length > 3 && '...'}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <div className="px-3 py-1.5 bg-indigo-100 text-indigo-700 text-sm font-medium rounded-md">
                        C'est moi
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Aucun résultat */}
        {showResults && results.length === 0 && !searching && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-yellow-900">Aucun résultat trouvé</p>
                <p className="text-sm text-yellow-700 mt-1">
                  Nous n'avons pas trouvé de profil correspondant à "{searchQuery}".
                  Vous pouvez créer un nouveau profil.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Bouton créer nouveau profil */}
        <div className="pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={handleCreateNew}
            className="w-full h-auto min-h-[48px] text-base py-3 px-4"
          >
            <User className="mr-2 h-5 w-5 flex-shrink-0" />
            <span className="text-center leading-snug">
              Je ne suis pas dans la liste - Créer mon profil
            </span>
          </Button>
        </div>
      </div>

      {/* Informations complémentaires */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-blue-900">Pourquoi compléter mon profil ?</p>
            <ul className="text-sm text-blue-700 mt-2 space-y-1">
              <li>• Faciliter la communication avec votre assemblée</li>
              <li>• Recevoir des informations personnalisées</li>
              <li>• Participer activement à la vie de l'église</li>
              <li>• Permettre un meilleur suivi pastoral</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
