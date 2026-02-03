import { Button } from '@/components/ui/button';
import { CheckCircle, Home } from 'lucide-react';

interface SourcingSuccessProps {
  firstName: string;
  onSubmitAnother: () => void;
}

export function SourcingSuccess({
  firstName,
  onSubmitAnother,
}: SourcingSuccessProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full text-center">
        {/* Animation de succès */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center animate-in zoom-in duration-500">
              <CheckCircle className="w-16 h-16 text-green-600" />
            </div>
            {/* Effet de confetti (simple) */}
            <div className="absolute inset-0 animate-ping opacity-20">
              <div className="w-24 h-24 rounded-full bg-green-400" />
            </div>
          </div>
        </div>

        {/* Message de remerciement */}
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
          Merci {firstName} !
        </h1>

        <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
          Vos informations ont été enregistrées avec succès. Nous sommes
          heureux de vous compter parmi nous dans la famille IFA.
        </p>

        {/* Illustration joyeuse (placeholder) */}
        <div className="mb-10 flex justify-center">
          <div className="w-48 h-48 bg-green-100 rounded-2xl flex items-center justify-center">
            <Home className="w-24 h-24 text-green-600" />
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={onSubmitAnother}
            variant="outline"
            size="lg"
            className="px-8"
          >
            Soumettre une autre réponse
          </Button>
        </div>

        {/* Contact */}
        <div className="mt-12 p-4 rounded-xl bg-blue-50 border border-blue-200">
          <p className="text-sm text-muted-foreground">
            Des questions ?{' '}
            <a
              href="mailto:admin@ifa.org"
              className="text-primary font-medium hover:underline"
            >
              Contactez-nous
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
