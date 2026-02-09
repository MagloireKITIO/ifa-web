'use client';

import { useRouter } from 'next/navigation';
import { TopNavigation } from '@/components/layout/TopNavigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, ExternalLink, Copy, QrCode, Power, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function SourcingPage() {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [publicFormUrl, setPublicFormUrl] = useState('');

  // États pour le toggle de sourcing
  const [isSourcingEnabled, setIsSourcingEnabled] = useState(true);
  const [isToggling, setIsToggling] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);

  // Charger la configuration du sourcing
  useEffect(() => {
    loadSourcingConfig();
  }, []);

  // Générer l'URL du formulaire public côté client uniquement
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPublicFormUrl(`${window.location.origin}/sourcing/public`);
    }
  }, []);

  const loadSourcingConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('sourcing_config')
        .select('is_enabled')
        .limit(1)
        .single();

      if (data) {
        setIsSourcingEnabled(data.is_enabled);
      }
    } catch (err) {
      console.error('Error loading sourcing config:', err);
    } finally {
      setLoadingConfig(false);
    }
  };

  const toggleSourcing = async () => {
    setIsToggling(true);
    try {
      const newStatus = !isSourcingEnabled;

      const { error } = await supabase
        .from('sourcing_config')
        .update({
          is_enabled: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', (await supabase.from('sourcing_config').select('id').single()).data?.id);

      if (error) throw error;

      setIsSourcingEnabled(newStatus);
    } catch (err) {
      console.error('Error toggling sourcing:', err);
      alert('Erreur lors de la mise à jour. Veuillez réessayer.');
    } finally {
      setIsToggling(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicFormUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <TopNavigation />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* En-tête */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                Formulaire de Sourcing
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Partagez ce formulaire pour collecter les informations des membres
                et visiteurs
              </p>
            </div>
          </div>

          {/* Toggle Activer/Désactiver */}
          <Card className={`p-4 border-2 ${isSourcingEnabled ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${isSourcingEnabled ? 'bg-green-100' : 'bg-red-100'}`}>
                  <Power className={`h-5 w-5 ${isSourcingEnabled ? 'text-green-600' : 'text-red-600'}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    Formulaire {isSourcingEnabled ? 'Activé' : 'Désactivé'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {isSourcingEnabled
                      ? 'Les membres peuvent soumettre leurs informations'
                      : 'Le formulaire public est temporairement fermé'
                    }
                  </p>
                </div>
              </div>

              {/* Switch Toggle */}
              <button
                onClick={toggleSourcing}
                disabled={isToggling || loadingConfig}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                  isSourcingEnabled ? 'bg-green-600' : 'bg-gray-300'
                } ${isToggling || loadingConfig ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isSourcingEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
                {isToggling && (
                  <Loader2 className="absolute right-1 h-3 w-3 text-white animate-spin" />
                )}
              </button>
            </div>
          </Card>
        </div>

        {/* Card avec lien du formulaire */}
        <Card className="p-4 sm:p-6 md:p-8 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <ExternalLink className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-semibold mb-2">
                Formulaire Public
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground mb-4">
                Partagez ce lien avec les membres pour qu'ils puissent soumettre
                leurs informations
              </p>

              {/* URL du formulaire */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200 mb-4">
                <code className="flex-1 text-xs sm:text-sm text-foreground break-all sm:truncate">
                  {publicFormUrl}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyLink}
                  className="flex-shrink-0 w-full sm:w-auto"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  {copied ? 'Copié !' : 'Copier'}
                </Button>
              </div>

              {/* Boutons d'action */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => window.open(publicFormUrl, '_blank')}
                  className="bg-primary w-full sm:w-auto"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Ouvrir le formulaire
                </Button>
                <Button variant="outline" disabled className="w-full sm:w-auto">
                  <QrCode className="w-4 h-4 mr-2" />
                  Générer QR Code
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Fonctionnalités à venir */}
        <Card className="p-4 sm:p-6 bg-blue-50 border-blue-200">
          <h3 className="font-semibold mb-3 text-foreground">
            Fonctionnalités à venir (Phase 2)
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>Création de campagnes de sourcing personnalisées</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>Génération de QR Code pour partage facile</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>Gestion des réponses soumises</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>Export des données en Excel/CSV</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>Statistiques et analytics des soumissions</span>
            </li>
          </ul>
        </Card>

        {/* Bouton retour */}
        <div className="mt-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard')}
            className="text-muted-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
