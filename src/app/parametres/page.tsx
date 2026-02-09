'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useToast } from '@/components/ui/toast';
import { TopNavigation } from '@/components/layout/TopNavigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Settings,
  Users,
  Shield,
  Calendar,
  Palette,
  Bell,
  Building2,
  Search,
  Plus,
  Edit,
  Trash2,
  Mail,
  Loader2,
  Lock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import type { User } from '@/types';
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  resetPassword,
  type UserFormData,
} from '@/lib/api/users';
import { UserFormDialog } from '@/components/parametres/UserFormDialog';
import { DeleteUserDialog } from '@/components/parametres/DeleteUserDialog';
import { ROLE_PERMISSIONS } from '@/lib/permissions';

type Section =
  | 'organisation'
  | 'utilisateurs'
  | 'roles'
  | 'periodes'
  | 'personnalisation'
  | 'notifications';

export default function ParametresPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [currentSection, setCurrentSection] = useState<Section>('utilisateurs');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');

  // Dialogs
  const [showUserFormDialog, setShowUserFormDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && isAdmin) {
      loadUsers();
    }
  }, [user, isAdmin]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersData = await getUsers();
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
      showToast('error', 'Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (data: UserFormData) => {
    try {
      const result = await createUser(data);
      if (result.success) {
        showToast('success', 'Utilisateur créé avec succès !');
        loadUsers();
      } else {
        showToast('error', result.error || 'Erreur lors de la création');
      }
    } catch (error: any) {
      showToast('error', error.message);
    }
  };

  const handleUpdateUser = async (data: Partial<UserFormData>) => {
    if (!selectedUser) return;

    try {
      const result = await updateUser(selectedUser.id, data);
      if (result.success) {
        showToast('success', 'Utilisateur modifié avec succès !');
        loadUsers();
      } else {
        showToast('error', result.error || 'Erreur lors de la modification');
      }
    } catch (error: any) {
      showToast('error', error.message);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      const result = await deleteUser(selectedUser.id);
      if (result.success) {
        showToast('success', 'Utilisateur supprimé avec succès !');
        loadUsers();
      } else {
        showToast('error', result.error || 'Erreur lors de la suppression');
      }
    } catch (error: any) {
      showToast('error', error.message);
    }
  };

  const handleResetPassword = async (email: string) => {
    setActionLoading(email);
    try {
      const result = await resetPassword(email);
      if (result.success) {
        showToast('success', 'Email de réinitialisation envoyé !');
      } else {
        showToast('error', result.error || 'Erreur lors de l\'envoi de l\'email');
      }
    } catch (error: any) {
      showToast('error', error.message);
    } finally {
      setActionLoading(null);
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

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-purple-100 text-purple-700 border-purple-200',
      center_lead: 'bg-blue-100 text-blue-700 border-blue-200',
      house_lead: 'bg-green-100 text-green-700 border-green-200',
      viewer: 'bg-gray-100 text-gray-700 border-gray-200',
    };
    return colors[role] || 'bg-gray-100 text-gray-700';
  };

  // Filtrer les utilisateurs
  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRole = selectedRole === 'all' || u.role === selectedRole;
    return matchSearch && matchRole;
  });

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) return null;

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#FAFAFA]">
        <TopNavigation />
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Card className="p-6 text-center">
            <Lock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold mb-2">Accès réservé aux administrateurs</h2>
            <p className="text-muted-foreground">
              Vous n'avez pas les permissions nécessaires pour accéder aux paramètres.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <TopNavigation />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Paramètres</h1>
          <p className="text-sm text-muted-foreground">
            Gérez les paramètres et la configuration de l'application
          </p>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar - Navigation */}
          <div className="col-span-12 md:col-span-3">
            <Card className="p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Sections
              </h3>

              <div className="space-y-1">
                <button
                  onClick={() => setCurrentSection('utilisateurs')}
                  className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                    currentSection === 'utilisateurs'
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span className="text-sm">Utilisateurs</span>
                </button>

                <button
                  onClick={() => setCurrentSection('roles')}
                  className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                    currentSection === 'roles'
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  <span className="text-sm">Rôles & Permissions</span>
                </button>

                <button
                  onClick={() => setCurrentSection('organisation')}
                  className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                    currentSection === 'organisation'
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span className="text-sm">Organisation</span>
                </button>

                <button
                  onClick={() => setCurrentSection('periodes')}
                  className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                    currentSection === 'periodes'
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">Périodes de reporting</span>
                </button>

                <button
                  onClick={() => setCurrentSection('personnalisation')}
                  className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                    currentSection === 'personnalisation'
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <Palette className="w-4 h-4" />
                  <span className="text-sm">Personnalisation</span>
                </button>

                <button
                  onClick={() => setCurrentSection('notifications')}
                  className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                    currentSection === 'notifications'
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <Bell className="w-4 h-4" />
                  <span className="text-sm">Notifications</span>
                </button>
              </div>
            </Card>
          </div>

          {/* Main - Contenu */}
          <div className="col-span-12 md:col-span-9">
            {/* Section Utilisateurs */}
            {currentSection === 'utilisateurs' && (
              <Card className="p-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="font-semibold flex items-center gap-2 text-lg">
                      <Users className="w-5 h-5" />
                      Gestion des utilisateurs
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {filteredUsers.length} utilisateur{filteredUsers.length > 1 ? 's' : ''}
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      setFormMode('create');
                      setSelectedUser(null);
                      setShowUserFormDialog(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter un utilisateur
                  </Button>
                </div>

                {/* Filtres */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      type="text"
                      placeholder="Rechercher par nom ou email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="all">Tous les rôles</option>
                    <option value="admin">Administrateur</option>
                    <option value="center_lead">Responsable de Centre</option>
                    <option value="house_lead">Responsable d'Assemblée</option>
                    <option value="viewer">Observateur</option>
                  </select>
                </div>

                {/* Liste des utilisateurs */}
                {filteredUsers.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Aucun utilisateur trouvé</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredUsers.map((u) => (
                      <div
                        key={u.id}
                        className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          {/* Info utilisateur */}
                          <div className="flex items-start gap-3 flex-1">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary flex-shrink-0">
                              {u.full_name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold">{u.full_name}</p>
                              <p className="text-sm text-muted-foreground">{u.email}</p>
                              <div className="flex flex-wrap gap-2 mt-2">
                                <Badge
                                  variant="outline"
                                  className={getRoleBadgeColor(u.role)}
                                >
                                  {getRoleLabel(u.role)}
                                </Badge>
                                {u.center_id && (
                                  <Badge variant="outline" className="text-xs">
                                    Centre assigné
                                  </Badge>
                                )}
                                {u.house_church_id && (
                                  <Badge variant="outline" className="text-xs">
                                    Assemblée assignée
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleResetPassword(u.email)}
                              disabled={actionLoading === u.email}
                            >
                              {actionLoading === u.email ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Mail className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setFormMode('edit');
                                setSelectedUser(u);
                                setShowUserFormDialog(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                setSelectedUser(u);
                                setShowDeleteDialog(true);
                              }}
                              disabled={u.id === user.id}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* Section Rôles & Permissions */}
            {currentSection === 'roles' && (
              <Card className="p-6">
                <h3 className="font-semibold flex items-center gap-2 text-lg mb-4">
                  <Shield className="w-5 h-5" />
                  Rôles & Permissions
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Vue d'ensemble des permissions par rôle
                </p>

                <div className="space-y-4">
                  {Object.entries(ROLE_PERMISSIONS).map(([role, permissions]) => (
                    <Card key={role} className="p-4 border-2">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold">{getRoleLabel(role)}</h4>
                        <Badge className={getRoleBadgeColor(role)}>{role}</Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          {permissions.canAccessDashboard ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-gray-300" />
                          )}
                          <span>Dashboard</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {permissions.canAccessMembers ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-gray-300" />
                          )}
                          <span>Membres</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {permissions.canAccessReports ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-gray-300" />
                          )}
                          <span>Rapports</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {permissions.canAccessSettings ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-gray-300" />
                          )}
                          <span>Paramètres</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </Card>
            )}

            {/* Section Organisation */}
            {currentSection === 'organisation' && (
              <Card className="p-6">
                <h3 className="font-semibold flex items-center gap-2 text-lg mb-4">
                  <Building2 className="w-5 h-5" />
                  Informations sur l'organisation
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Nom de l'organisation</label>
                    <Input value="Integrity For All (IFA)" disabled />
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-900">
                      Cette section sera développée dans une prochaine phase pour permettre la
                      personnalisation des informations de l'organisation.
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Section Périodes */}
            {currentSection === 'periodes' && (
              <Card className="p-6">
                <h3 className="font-semibold flex items-center gap-2 text-lg mb-4">
                  <Calendar className="w-5 h-5" />
                  Périodes de reporting
                </h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    Cette section sera développée dans une prochaine phase pour permettre la
                    gestion des périodes de reporting mensuelles.
                  </p>
                </div>
              </Card>
            )}

            {/* Section Personnalisation */}
            {currentSection === 'personnalisation' && (
              <Card className="p-6">
                <h3 className="font-semibold flex items-center gap-2 text-lg mb-4">
                  <Palette className="w-5 h-5" />
                  Personnalisation
                </h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    Cette section sera développée dans une prochaine phase pour permettre la
                    personnalisation du thème et de la langue.
                  </p>
                </div>
              </Card>
            )}

            {/* Section Notifications */}
            {currentSection === 'notifications' && (
              <Card className="p-6">
                <h3 className="font-semibold flex items-center gap-2 text-lg mb-4">
                  <Bell className="w-5 h-5" />
                  Préférences de notifications
                </h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    Cette section sera développée dans une prochaine phase pour permettre la
                    configuration des préférences de notifications.
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <UserFormDialog
        open={showUserFormDialog}
        onClose={() => setShowUserFormDialog(false)}
        onSubmit={formMode === 'create' ? handleCreateUser : handleUpdateUser}
        user={selectedUser}
        mode={formMode}
      />

      <DeleteUserDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteUser}
        user={selectedUser}
      />
    </div>
  );
}
