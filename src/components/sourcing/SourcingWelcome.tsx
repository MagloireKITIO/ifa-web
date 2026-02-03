import { Button } from '@/components/ui/button';
import { ArrowRight, Lock, Users } from 'lucide-react';

interface SourcingWelcomeProps {
  onStart: () => void;
}

export function SourcingWelcome({ onStart }: SourcingWelcomeProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full text-center">
        {/* Logo IFA */}
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-primary text-primary-foreground shadow-xl flex items-center justify-center">
            <svg
              className="w-10 h-10"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>

        {/* Titre */}
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
          Bienvenue dans la Famille IFA
        </h1>

        {/* Description */}
        <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
          Aidez-nous à mieux vous connaître en répondant à quelques questions.
          Cela ne prendra que <strong>2 minutes</strong>.
        </p>

        {/* Illustration (placeholder SVG) */}
        <div className="mb-10 flex justify-center">
          <div className="w-64 h-64 bg-blue-100 rounded-2xl flex items-center justify-center">
            <Users className="w-32 h-32 text-blue-600" />
          </div>
        </div>

        {/* Bouton Commencer */}
        <Button
          onClick={onStart}
          size="lg"
          className="w-full sm:w-auto px-12 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
        >
          Commencer
          <ArrowRight className="ml-2 w-5 h-5" />
        </Button>

        {/* Footer sécurité */}
        <div className="mt-12 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Lock className="w-4 h-4" />
          <span>Vos données sont sécurisées et confidentielles</span>
        </div>
      </div>
    </div>
  );
}
