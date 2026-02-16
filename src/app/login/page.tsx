'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/lib/hooks/useAuth';
import { getHomePageForRole, type UserRole } from '@/lib/permissions';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const loggedInUser = await login(email, password);
      // Rediriger vers la page appropriée selon le rôle
      const homePage = getHomePageForRole(loggedInUser.role as UserRole);
      router.push(homePage);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Email ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  // Comptes de test pour faciliter les tests
  const testAccounts = [
    { email: 'admin@ifa.org', role: 'Administrateur', password: 'password123' },
    { email: 'center@ifa.cm', role: 'Centre Leader - BONAMOUSSADI', password: 'password123' },
    { email: 'house@ifa.cm', role: 'House Leader - MEKOULOU M', password: 'password123' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Effet de fond subtil */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo et titre */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <img
              src="/logo.png"
              alt="IFA Logo"
              className="w-24 h-24 object-contain"
            />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight mb-2">
            Integrity For All
          </h1>
          <p className="text-sm text-muted-foreground">
            Connectez-vous à votre espace
          </p>
        </div>

        {/* Formulaire de connexion */}
        <Card className="p-6 shadow-xl border-border/50">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Adresse email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="nom@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Mot de passe
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 pr-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 animate-in fade-in slide-in-from-top-1 duration-300">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Connexion...
                </span>
              ) : (
                'Se connecter'
              )}
            </Button>
          </form>
        </Card>

        {/* Comptes de test (seulement pour le prototype) */}
        <div className="mt-6 p-4 rounded-lg bg-muted/30 border border-border/50">
          <p className="text-xs font-medium text-muted-foreground mb-3">
            Comptes de test (prototype) :
          </p>
          <div className="space-y-2">
            {testAccounts.map((account) => (
              <button
                key={account.email}
                type="button"
                onClick={() => {
                  setEmail(account.email);
                  setPassword(account.password);
                }}
                className="w-full text-left px-3 py-2 rounded-md bg-background hover:bg-accent transition-colors duration-150 group"
              >
                <p className="text-xs font-medium group-hover:text-foreground transition-colors">
                  {account.email}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {account.role}
                </p>
              </button>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-3 text-center">
            Mot de passe : password123 (pour tous les comptes de test)
          </p>
        </div>
      </div>
    </div>
  );
}
