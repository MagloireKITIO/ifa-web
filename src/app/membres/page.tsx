'use client';

import { useRouter } from 'next/navigation';
import { TopNavigation } from '@/components/layout/TopNavigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Rocket } from 'lucide-react';

export default function MembresPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <TopNavigation />
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-56px)] px-4">
        <div className="max-w-md w-full text-center">
          <div className="flex justify-center mb-6">
            <div className="w-32 h-32 rounded-full bg-blue-50 flex items-center justify-center">
              <Rocket className="w-16 h-16 text-blue-600" />
            </div>
          </div>
          <h1 className="text-2xl font-semibold text-foreground mb-3">
            Cette fonctionnalité arrive bientôt
          </h1>
          <p className="text-muted-foreground mb-8">
            Nous travaillons activement sur la <strong>Gestion des Membres</strong>. Cette
            fonctionnalité sera disponible dans la Phase 2.
          </p>
          <Button
            onClick={() => router.push('/dashboard')}
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au Dashboard
          </Button>
          <p className="text-sm text-muted-foreground mt-6">
            Besoin urgent ?{' '}
            <a href="mailto:admin@ifa.org" className="text-primary hover:underline">
              Contactez l'équipe
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
