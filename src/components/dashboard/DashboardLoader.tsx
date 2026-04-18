'use client';

import { LayoutDashboard } from 'lucide-react';

interface DashboardLoaderProps {
  loadingStates?: boolean[];
}

export function DashboardLoader({ loadingStates = [true] }: DashboardLoaderProps) {
  // Calculer la progression réelle basée sur les requêtes terminées
  const totalRequests = loadingStates.length;
  const completedRequests = loadingStates.filter(state => !state).length;
  const progress = Math.round((completedRequests / totalRequests) * 100);

  // Calculer le dasharray pour l'animation du cercle
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        {/* Cercle de progression avec icône */}
        <div className="relative inline-flex items-center justify-center mb-6">
          {/* SVG cercle de progression */}
          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
            {/* Cercle de fond */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-gray-200"
            />
            {/* Cercle de progression */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              className="text-primary transition-all duration-300 ease-out"
              style={{
                strokeDasharray: circumference,
                strokeDashoffset: strokeDashoffset,
              }}
            />
          </svg>

          {/* Icône au centre */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="relative"
              style={{
                opacity: Math.min(progress / 100 + 0.3, 1),
                transform: `scale(${Math.min(progress / 100 + 0.5, 1)})`,
                transition: 'all 0.3s ease-out',
              }}
            >
              <LayoutDashboard
                className="w-12 h-12 text-primary"
                style={{
                  filter: `drop-shadow(0 0 ${progress / 10}px rgba(var(--primary), 0.5))`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Pourcentage */}
        <div className="mb-4">
          <div className="text-4xl font-bold text-primary mb-2">
            {progress}%
          </div>
          <div className="text-sm text-muted-foreground font-medium">
            Chargement du tableau de bord
          </div>
        </div>

        {/* Barre de progression linéaire */}
        <div className="w-64 mx-auto">
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-300 ease-out rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Message de chargement avec animation */}
        <div className="mt-6 text-xs text-muted-foreground flex items-center justify-center gap-1">
          <span>Préparation des données</span>
          <span className="inline-flex gap-0.5">
            <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
            <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
            <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
          </span>
        </div>
      </div>
    </div>
  );
}
