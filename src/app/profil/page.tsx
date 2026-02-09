'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useToast } from '@/components/ui/toast';
import { TopNavigation } from '@/components/layout/TopNavigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  User as UserIcon,
  Mail,
  Shield,
  Building,
  Home,
  Camera,
  Lock,
  BarChart3,
  CheckCircle,
  Users,
  Loader2,
} from 'lucide-react';
import {
  updateProfile,
  uploadAvatar,
  changePassword,
  getUserStats,
  type UserStats,
} from '@/lib/api/profile';

export default function ProfilPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stats, setStats] = useState<UserStats>({
    reportsCount: 0,
    reportsSubmittedOnTime: 0,
    membersCount: 0,
    activeMembersCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Formulaire de changement de mot de passe
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const userStats = await getUserStats(user);
      setStats(userStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingAvatar(true);
    try {
      const result = await uploadAvatar(user.id, file);
      if (result.success) {
        showToast('success', 'Photo de profil mise à jour !');
        // Recharger la page pour afficher la nouvelle photo
        window.location.reload();
      } else {
        showToast('error', result.error || 'Erreur lors de la mise à jour');
      }
    } catch (error: any) {
      showToast('error', error.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || newPassword.length < 6) {
      showToast('error', 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('error', 'Les mots de passe ne correspondent pas');
      return;
    }

    setChangingPassword(true);
    try {
      const result = await changePassword({
        currentPassword,
        newPassword,
      });

      if (result.success) {
        showToast('success', 'Mot de passe modifié avec succès !');
        setShowPasswordForm(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        showToast('error', result.error || 'Erreur lors du changement de mot de passe');
      }
    } catch (error: any) {
      showToast('error', error.message);
    } finally {
      setChangingPassword(false);
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: 'Administrateur',
      center_lead: 'Responsable de Centre',
      house_lead: "Responsable d'Assemblée",
      viewer: 'Observateur',
    };
    return labels[role] || role;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <TopNavigation />

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Mon Profil</h1>
          <p className="text-sm text-muted-foreground">
            Gérez vos informations personnelles et votre mot de passe
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne gauche - Informations principales */}
          <div className="lg:col-span-2 space-y-6">
            {/* Carte profil */}
            <Card className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Avatar */}
                <div className="flex flex-col items-center">
                  <div className="relative group">
                    <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.full_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <UserIcon className="w-16 h-16 text-primary" />
                      )}
                    </div>
                    <button
                      onClick={handleAvatarClick}
                      disabled={uploadingAvatar}
                      className="absolute bottom-0 right-0 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {uploadingAvatar ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Camera className="w-5 h-5" />
                      )}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Max. 2 Mo</p>
                </div>

                {/* Informations */}
                <div className="flex-1 space-y-4">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <UserIcon className="w-3.5 h-3.5" />
                      Nom complet
                    </label>
                    <p className="text-lg font-semibold">{user.full_name}</p>
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5" />
                      Email
                    </label>
                    <p className="text-sm">{user.email}</p>
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5" />
                      Rôle
                    </label>
                    <Badge className="mt-1">{getRoleLabel(user.role)}</Badge>
                  </div>

                  {user.center_id && (
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        <Building className="w-3.5 h-3.5" />
                        Centre d'assemblée
                      </label>
                      <p className="text-sm">Centre assigné</p>
                    </div>
                  )}

                  {user.house_church_id && (
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        <Home className="w-3.5 h-3.5" />
                        Assemblée de maison
                      </label>
                      <p className="text-sm">Assemblée assignée</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Changement de mot de passe */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-muted-foreground" />
                  <h3 className="font-semibold">Sécurité</h3>
                </div>
                {!showPasswordForm && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPasswordForm(true)}
                  >
                    Changer le mot de passe
                  </Button>
                )}
              </div>

              {showPasswordForm ? (
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Mot de passe actuel
                    </label>
                    <Input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      disabled={changingPassword}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Nouveau mot de passe
                    </label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                      disabled={changingPassword}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Minimum 6 caractères
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Confirmer le mot de passe
                    </label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      disabled={changingPassword}
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button type="submit" disabled={changingPassword} className="flex-1">
                      {changingPassword ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Modification...
                        </>
                      ) : (
                        'Modifier le mot de passe'
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowPasswordForm(false);
                        setCurrentPassword('');
                        setNewPassword('');
                        setConfirmPassword('');
                      }}
                      disabled={changingPassword}
                    >
                      Annuler
                    </Button>
                  </div>
                </form>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Dernière modification : {new Date(user.updated_at).toLocaleDateString('fr-FR')}
                </p>
              )}
            </Card>
          </div>

          {/* Colonne droite - Statistiques */}
          <div className="space-y-6">
            {(user.role === 'center_lead' || user.role === 'house_lead') && (
              <>
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="w-5 h-5 text-muted-foreground" />
                    <h3 className="font-semibold">Mes Statistiques</h3>
                  </div>

                  <div className="space-y-4">
                    {/* Rapports */}
                    <div className="border-b pb-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Rapports soumis</span>
                        <Badge variant="outline">{stats.reportsCount}</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-green-600">
                        <CheckCircle className="w-3.5 h-3.5" />
                        {stats.reportsSubmittedOnTime} à temps
                      </div>
                    </div>

                    {/* Membres */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          Membres
                        </span>
                        <Badge variant="outline">{stats.membersCount}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {stats.activeMembersCount} avec profil complété
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 bg-blue-50 border-blue-200">
                  <p className="text-sm text-blue-900">
                    <strong>Astuce :</strong> Utilisez le système de sourcing pour compléter les
                    profils de vos membres et améliorer vos statistiques.
                  </p>
                </Card>
              </>
            )}

            {user.role === 'admin' && (
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">Accès Administrateur</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Vous avez un accès complet à toutes les fonctionnalités de l'application.
                </p>
              </Card>
            )}

            {user.role === 'viewer' && (
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <UserIcon className="w-5 h-5 text-muted-foreground" />
                  <h3 className="font-semibold">Accès Observateur</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Vous avez un accès en lecture seule aux données.
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
