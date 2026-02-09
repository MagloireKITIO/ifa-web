'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, Home, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MemberSearchForm } from '@/components/sourcing/MemberSearchForm';
import { MemberCompletionForm } from '@/components/sourcing/MemberCompletionForm';
import type { MemberWithCompletion } from '@/lib/api/sourcing';
import { supabase } from '@/lib/supabase';

type Step = 'search' | 'form' | 'success';

export default function PublicSourcingPage() {
  const [currentStep, setCurrentStep] = useState<Step>('search');
  const [selectedMember, setSelectedMember] = useState<MemberWithCompletion | null>(null);

  // Vérification si le sourcing est activé
  const [isSourcingEnabled, setIsSourcingEnabled] = useState(true);
  const [disabledMessage, setDisabledMessage] = useState('');
  const [loadingConfig, setLoadingConfig] = useState(true);

  // Charger la configuration au montage
  useEffect(() => {
    checkSourcingStatus();
  }, []);

  const checkSourcingStatus = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_sourcing_config');

      if (data && data.length > 0) {
        setIsSourcingEnabled(data[0].is_enabled);
        setDisabledMessage(data[0].disabled_message || 'Le formulaire est temporairement désactivé.');
      }
    } catch (err) {
      console.error('Error checking sourcing status:', err);
    } finally {
      setLoadingConfig(false);
    }
  };

  const handleMemberSelect = (member: MemberWithCompletion | null) => {
    setSelectedMember(member);
    setCurrentStep('form');
  };

  const handleCreateNew = () => {
    setSelectedMember(null);
    setCurrentStep('form');
  };

  const handleBack = () => {
    setSelectedMember(null);
    setCurrentStep('search');
  };

  const handleSuccess = () => {
    setCurrentStep('success');
  };

  const handleReset = () => {
    setSelectedMember(null);
    setCurrentStep('search');
  };

  // Loading state
  if (loadingConfig) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  // Sourcing désactivé
  if (!isSourcingEnabled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50">
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">IFA - Complétion de Profil</h1>
                <p className="text-sm text-gray-600 mt-1">Integrity For All</p>
              </div>
              <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center">
                <Home className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center space-y-6 py-8">
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="h-10 w-10 text-orange-600" />
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-3xl font-bold text-gray-900">
                  Formulaire Temporairement Fermé
                </h2>
                <p className="text-lg text-gray-600">
                  {disabledMessage}
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-left">
                <h3 className="font-semibold text-blue-900 mb-3">Que faire?</h3>
                <ul className="space-y-2 text-blue-700">
                  <li className="flex items-start">
                    <span className="font-semibold mr-2">•</span>
                    <span>Réessayez plus tard</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-semibold mr-2">•</span>
                    <span>Contactez votre responsable d'assemblée</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-semibold mr-2">•</span>
                    <span>Appelez le secrétariat de l'église</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Formulaire actif
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">IFA - Complétion de Profil</h1>
              <p className="text-sm text-gray-600 mt-1">
                Integrity For All
              </p>
            </div>
            <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center">
              <Home className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Étape 1 : Recherche */}
          {currentStep === 'search' && (
            <MemberSearchForm
              onMemberSelect={handleMemberSelect}
              onCreateNew={handleCreateNew}
            />
          )}

          {/* Étape 2 : Formulaire */}
          {currentStep === 'form' && (
            <MemberCompletionForm
              member={selectedMember}
              onBack={handleBack}
              onSuccess={handleSuccess}
            />
          )}

          {/* Étape 3 : Succès */}
          {currentStep === 'success' && (
            <div className="text-center space-y-6 py-8">
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-3xl font-bold text-gray-900">
                  Merci pour votre soumission !
                </h2>
                <p className="text-lg text-gray-600">
                  Votre profil a été envoyé avec succès
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-left">
                <h3 className="font-semibold text-blue-900 mb-3">Prochaines étapes</h3>
                <ul className="space-y-2 text-blue-700">
                  <li className="flex items-start">
                    <span className="font-semibold mr-2">1.</span>
                    <span>
                      Votre soumission sera examinée par un administrateur de l'église
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-semibold mr-2">2.</span>
                    <span>
                      Une fois validée, vos informations seront mises à jour dans notre système
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-semibold mr-2">3.</span>
                    <span>
                      Vous serez contacté par téléphone si des clarifications sont nécessaires
                    </span>
                  </li>
                </ul>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 text-sm">
                  <strong>Important :</strong> Si vous avez fourni un numéro de téléphone,
                  assurez-vous qu'il est correct pour que nous puissions vous contacter.
                </p>
              </div>

              <div className="pt-4">
                <Button onClick={handleReset} size="lg" className="px-8">
                  <Home className="mr-2 h-5 w-5" />
                  Retour à l'accueil
                </Button>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Vous avez une question ? Contactez votre responsable d'assemblée ou le
                  secrétariat de l'église.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>© 2026 Integrity For All</p>
          <p className="mt-1">
            Cette page est sécurisée et vos données sont protégées
          </p>
        </div>
      </main>
    </div>
  );
}
