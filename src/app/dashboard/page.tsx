'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { getPermissions, getHomePageForRole, type UserRole } from '@/lib/permissions';
import { TopNavigation } from '@/components/layout/TopNavigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  Users,
  DollarSign,
  Heart,
  Home,
  TrendingUp,
  Filter,
  Menu,
  X,
} from 'lucide-react';

// Import sections
import { OverviewSection } from '@/components/dashboard/sections/OverviewSection';
import { MembersSection } from '@/components/dashboard/sections/MembersSection';
import { FinancialSection } from '@/components/dashboard/sections/FinancialSection';
import { MinistrySection } from '@/components/dashboard/sections/MinistrySection';
import { FamilySection } from '@/components/dashboard/sections/FamilySection';
import { ExpansionSection } from '@/components/dashboard/sections/ExpansionSection';

type DashboardView =
  | 'overview'
  | 'members'
  | 'financial'
  | 'ministry'
  | 'family'
  | 'expansion';

interface NavItem {
  id: DashboardView;
  label: string;
  icon: any;
  description: string;
}

const navigationItems: NavItem[] = [
  {
    id: 'overview',
    label: "Vue d'ensemble",
    icon: LayoutDashboard,
    description: 'Indicateurs clés',
  },
  {
    id: 'members',
    label: 'Membres',
    icon: Users,
    description: 'Démographie & répartition',
  },
  {
    id: 'financial',
    label: 'Finances',
    icon: DollarSign,
    description: 'Revenus & dépenses',
  },
  {
    id: 'ministry',
    label: 'Ministère',
    icon: Heart,
    description: 'Activités spirituelles',
  },
  {
    id: 'family',
    label: 'Famille',
    icon: Home,
    description: 'Communauté & counseling',
  },
  {
    id: 'expansion',
    label: 'Expansion',
    icon: TrendingUp,
    description: 'Croissance géographique',
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [currentView, setCurrentView] = useState<DashboardView>('overview');
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    // Vérifier si l'utilisateur a accès au dashboard
    if (user) {
      const permissions = getPermissions(user.role as UserRole);

      if (!permissions.canAccessDashboard) {
        // Rediriger vers la page d'accueil appropriée pour ce rôle
        const homePage = getHomePageForRole(user.role as UserRole);
        router.push(homePage);
      }
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) return null;

  const renderSection = () => {
    switch (currentView) {
      case 'overview':
        return <OverviewSection />;
      case 'members':
        return <MembersSection />;
      case 'financial':
        return <FinancialSection />;
      case 'ministry':
        return <MinistrySection />;
      case 'family':
        return <FamilySection />;
      case 'expansion':
        return <ExpansionSection />;
      default:
        return <OverviewSection />;
    }
  };

  const currentNav = navigationItems.find((item) => item.id === currentView);

  const handleSectionChange = (section: DashboardView) => {
    setCurrentView(section);
    setShowMobileMenu(false);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <TopNavigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Tableau de Bord IFA</h1>
          <p className="text-sm text-muted-foreground">
            {currentNav?.description || 'Statistiques et analyses'}
          </p>
        </div>

        {/* Layout: Sidebar + Main */}
        <div className="grid grid-cols-12 gap-4 sm:gap-6">
          {/* Sidebar Desktop - Navigation des sections */}
          <div className="hidden md:block col-span-12 md:col-span-3">
            <Card className="p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Sections
              </h3>

              <div className="space-y-1">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => setCurrentView(item.id)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm font-medium">
                          {item.label}
                        </span>
                      </div>
                      {!isActive && (
                        <p className="text-xs text-muted-foreground mt-1 ml-6">
                          {item.description}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Info complémentaire */}
              <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-xs text-blue-700">
                  💡 <strong>Astuce :</strong> Les données se complètent
                  automatiquement au fur et à mesure des rapports soumis.
                </p>
              </div>
            </Card>
          </div>

          {/* Main - Contenu de la section */}
          <div className="col-span-12 md:col-span-9">{renderSection()}</div>
        </div>
      </div>

      {/* FAB Mobile - Floating Action Button */}
      <div className="md:hidden fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
          aria-label="Menu des sections"
        >
          {showMobileMenu ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Mobile Menu - Bottom Sheet */}
      {showMobileMenu && (
        <>
          {/* Backdrop */}
          <div
            className="md:hidden fixed inset-0 bg-black/50 z-40 transition-opacity"
            onClick={() => setShowMobileMenu(false)}
          />

          {/* Bottom Sheet */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-40 max-h-[80vh] overflow-y-auto animate-slide-up">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Sections
                </h3>
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Items */}
              <div className="space-y-2">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSectionChange(item.id)}
                      className={`w-full text-left p-4 rounded-xl transition-all ${
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-md'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            isActive
                              ? 'bg-white/20'
                              : 'bg-white'
                          }`}
                        >
                          <Icon className={`w-5 h-5 ${isActive ? '' : 'text-primary'}`} />
                        </div>
                        <div className="flex-1">
                          <p className={`font-medium ${isActive ? '' : 'text-gray-900'}`}>
                            {item.label}
                          </p>
                          <p className={`text-xs ${isActive ? 'text-white/80' : 'text-muted-foreground'}`}>
                            {item.description}
                          </p>
                        </div>
                        {isActive && (
                          <div className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
