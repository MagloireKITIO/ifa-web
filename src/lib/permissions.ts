/**
 * Matrice des permissions par rôle
 * Définit ce que chaque rôle peut voir et faire dans l'application
 */

export type UserRole = 'admin' | 'center_lead' | 'house_lead' | 'viewer';

export interface RolePermissions {
  // Navigation
  canAccessDashboard: boolean;
  canAccessStructure: boolean;
  canAccessMembers: boolean;
  canAccessReports: boolean;
  canAccessSourcing: boolean;
  canAccessSettings: boolean;

  // Actions - Structure
  canCreateZone: boolean;
  canEditZone: boolean;
  canDeleteZone: boolean;
  canCreateCenter: boolean;
  canEditCenter: boolean;
  canDeleteCenter: boolean;
  canCreateHouseChurch: boolean;
  canEditHouseChurch: boolean;
  canDeleteHouseChurch: boolean;

  // Actions - Membres
  canViewAllMembers: boolean; // Voir tous les membres
  canViewCenterMembers: boolean; // Voir les membres de son centre
  canViewHouseChurchMembers: boolean; // Voir les membres de son assemblée
  canAddMember: boolean;
  canEditMember: boolean;
  canDeleteMember: boolean;
  canAssignMemberToHouseChurch: boolean;
  canTransferMember: boolean;

  // Actions - Rapports
  canCreateReport: boolean;
  canViewOwnReports: boolean;
  canViewCenterReports: boolean;
  canViewAllReports: boolean;
  canApproveReport: boolean;
  canRejectReport: boolean;

  // Actions - Sourcing
  canCreateCampaign: boolean;
  canViewCampaigns: boolean;
  canViewCampaignResponses: boolean;
  canAddMemberFromResponse: boolean;
}

/**
 * Matrice complète des permissions
 */
export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  // ADMIN - Accès complet
  admin: {
    // Navigation
    canAccessDashboard: true,
    canAccessStructure: true,
    canAccessMembers: true,
    canAccessReports: true,
    canAccessSourcing: true,
    canAccessSettings: true,

    // Structure
    canCreateZone: true,
    canEditZone: true,
    canDeleteZone: true,
    canCreateCenter: true,
    canEditCenter: true,
    canDeleteCenter: true,
    canCreateHouseChurch: true,
    canEditHouseChurch: true,
    canDeleteHouseChurch: true,

    // Membres
    canViewAllMembers: true,
    canViewCenterMembers: true,
    canViewHouseChurchMembers: true,
    canAddMember: true,
    canEditMember: true,
    canDeleteMember: true,
    canAssignMemberToHouseChurch: true,
    canTransferMember: true,

    // Rapports
    canCreateReport: false, // Admin ne crée pas de rapports
    canViewOwnReports: false,
    canViewCenterReports: false,
    canViewAllReports: true,
    canApproveReport: true,
    canRejectReport: true,

    // Sourcing
    canCreateCampaign: true,
    canViewCampaigns: true,
    canViewCampaignResponses: true,
    canAddMemberFromResponse: true,
  },

  // CENTER LEADER - Gestion de son centre
  center_lead: {
    // Navigation
    canAccessDashboard: false, // ❌ Pas de dashboard
    canAccessStructure: true,
    canAccessMembers: true,
    canAccessReports: true,
    canAccessSourcing: true,
    canAccessSettings: false,

    // Structure
    canCreateZone: false,
    canEditZone: false,
    canDeleteZone: false,
    canCreateCenter: false,
    canEditCenter: true, // Peut modifier son propre centre
    canDeleteCenter: false,
    canCreateHouseChurch: true, // Peut créer des cellules dans son centre
    canEditHouseChurch: true, // Peut modifier les cellules de son centre
    canDeleteHouseChurch: true, // Peut supprimer les cellules de son centre

    // Membres
    canViewAllMembers: false,
    canViewCenterMembers: true, // Voit tous les membres de son centre
    canViewHouseChurchMembers: true,
    canAddMember: true,
    canEditMember: true,
    canDeleteMember: true,
    canAssignMemberToHouseChurch: true,
    canTransferMember: true,

    // Rapports
    canCreateReport: true, // Crée des rapports pour son centre
    canViewOwnReports: true,
    canViewCenterReports: true, // Voit les rapports de ses cellules
    canViewAllReports: false,
    canApproveReport: true, // Approuve les rapports de ses cellules
    canRejectReport: true,

    // Sourcing
    canCreateCampaign: true,
    canViewCampaigns: true,
    canViewCampaignResponses: true,
    canAddMemberFromResponse: true,
  },

  // HOUSE LEADER - Gestion de son assemblée uniquement
  house_lead: {
    // Navigation
    canAccessDashboard: false, // ❌ Pas de dashboard
    canAccessStructure: false, // ❌ Pas d'accès à Structure
    canAccessMembers: true, // ✅ Seulement ses membres
    canAccessReports: true,
    canAccessSourcing: true,
    canAccessSettings: false,

    // Structure
    canCreateZone: false,
    canEditZone: false,
    canDeleteZone: false,
    canCreateCenter: false,
    canEditCenter: false,
    canDeleteCenter: false,
    canCreateHouseChurch: false,
    canEditHouseChurch: false, // Ne peut pas modifier sa propre cellule
    canDeleteHouseChurch: false,

    // Membres
    canViewAllMembers: false,
    canViewCenterMembers: false,
    canViewHouseChurchMembers: true, // ✅ Voit uniquement les membres de son assemblée
    canAddMember: true, // Via sourcing uniquement
    canEditMember: false,
    canDeleteMember: false,
    canAssignMemberToHouseChurch: false,
    canTransferMember: false,

    // Rapports
    canCreateReport: true, // ✅ Crée des rapports pour son assemblée
    canViewOwnReports: true,
    canViewCenterReports: false,
    canViewAllReports: false,
    canApproveReport: false,
    canRejectReport: false,

    // Sourcing
    canCreateCampaign: false, // Les campagnes sont créées par admin/center_lead
    canViewCampaigns: true,
    canViewCampaignResponses: true, // Seulement les réponses de sa campagne
    canAddMemberFromResponse: true, // Peut ajouter des membres depuis le sourcing
  },

  // VIEWER - Lecture seule
  viewer: {
    // Navigation
    canAccessDashboard: true,
    canAccessStructure: true,
    canAccessMembers: true,
    canAccessReports: true,
    canAccessSourcing: false,
    canAccessSettings: false,

    // Structure
    canCreateZone: false,
    canEditZone: false,
    canDeleteZone: false,
    canCreateCenter: false,
    canEditCenter: false,
    canDeleteCenter: false,
    canCreateHouseChurch: false,
    canEditHouseChurch: false,
    canDeleteHouseChurch: false,

    // Membres
    canViewAllMembers: true,
    canViewCenterMembers: true,
    canViewHouseChurchMembers: true,
    canAddMember: false,
    canEditMember: false,
    canDeleteMember: false,
    canAssignMemberToHouseChurch: false,
    canTransferMember: false,

    // Rapports
    canCreateReport: false,
    canViewOwnReports: false,
    canViewCenterReports: false,
    canViewAllReports: true,
    canApproveReport: false,
    canRejectReport: false,

    // Sourcing
    canCreateCampaign: false,
    canViewCampaigns: false,
    canViewCampaignResponses: false,
    canAddMemberFromResponse: false,
  },
};

/**
 * Récupère les permissions pour un rôle donné
 */
export function getPermissions(role: UserRole): RolePermissions {
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.viewer;
}

/**
 * Vérifie si un utilisateur a une permission spécifique
 */
export function hasPermission(
  role: UserRole,
  permission: keyof RolePermissions
): boolean {
  const permissions = getPermissions(role);
  return permissions[permission] || false;
}

/**
 * Hook pour vérifier les permissions d'un utilisateur
 */
export function usePermissions(role: UserRole | undefined) {
  if (!role) {
    return {
      permissions: ROLE_PERMISSIONS.viewer,
      hasPermission: () => false,
    };
  }

  return {
    permissions: getPermissions(role),
    hasPermission: (permission: keyof RolePermissions) =>
      hasPermission(role, permission),
  };
}

/**
 * Retourne la page d'accueil appropriée selon le rôle de l'utilisateur
 */
export function getHomePageForRole(role: UserRole): string {
  const permissions = getPermissions(role);

  // Ordre de priorité des pages
  if (permissions.canAccessDashboard) return '/dashboard';
  if (permissions.canAccessStructure) return '/structure';
  if (permissions.canAccessMembers) return '/membres';
  if (permissions.canAccessReports) return '/rapports';
  if (permissions.canAccessSourcing) return '/sourcing';

  // Par défaut, aller au profil
  return '/profil';
}
