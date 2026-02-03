'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { TopNavigation } from '@/components/layout/TopNavigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, CheckCircle, Save } from 'lucide-react';
import { Step2Financial, type FinancialData } from '@/components/rapports/steps/Step2Financial';
import { Step3People, type PeopleData } from '@/components/rapports/steps/Step3People';
import { Step4Family, type FamilyData } from '@/components/rapports/steps/Step4Family';
import { Step5Activities, type ActivitiesData } from '@/components/rapports/steps/Step5Activities';
import { getOpenPeriods } from '@/lib/api/reports';

type FormData = {
  periodId: string;
  financial: FinancialData;
  people: PeopleData;
  family: FamilyData;
  activities: ActivitiesData;
};

const STEPS = [
  { id: 1, name: 'Sélection', title: 'Période de Reporting' },
  { id: 2, name: 'Finances', title: 'Pilier Finances' },
  { id: 3, name: 'Personnes', title: 'Pilier Personnes' },
  { id: 4, name: 'Famille', title: 'Pilier Famille' },
  { id: 5, name: 'Activités', title: 'Pilier Activités' },
];

export default function NouveauRapportPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [periods, setPeriods] = useState<any[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<FormData>({
    periodId: '',
    financial: {
      tithes: 0,
      offeringsGeneral: 0,
      offeringsEvents: 0,
      offeringsInvestment: 0,
      expenseAdmin: 0,
      expenseRent: 0,
      expenseMission: 0,
      expenseEvents: 0,
      notes: '',
      memberContributions: [],
    },
    people: {
      attendanceMen: 0,
      attendanceWomen: 0,
      attendanceChildren: 0,
      newConverts: 0,
      firstTimers: 0,
      baptisms: 0,
      membersActiveStart: 0,
      membersGained: 0,
      membersLost: 0,
    },
    family: {
      marriages: 0,
      engagements: 0,
      births: 0,
      couplesCounseled: 0,
    },
    activities: {
      peopleTrained: 0,
      pastorsCertified: 0,
      socialActionsCount: 0,
      mealsDistributed: 0,
      youthMentored: 0,
      homeVisits: 0,
      evangelismOutreachCount: 0,
    },
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    async function loadPeriods() {
      const openPeriods = await getOpenPeriods();
      setPeriods(openPeriods);
      if (openPeriods.length > 0 && !formData.periodId) {
        setFormData((prev) => ({ ...prev, periodId: openPeriods[0].id }));
      }
    }
    loadPeriods();
  }, []);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const canSubmit = user.role === 'house_lead' || user.role === 'center_lead';

  if (!canSubmit) {
    return (
      <div className="min-h-screen bg-[#FAFAFA]">
        <TopNavigation />
        <div className="max-w-4xl mx-auto px-6 py-12 text-center">
          <Card className="p-8">
            <h1 className="text-2xl font-bold mb-4">Accès Non Autorisé</h1>
            <p className="text-muted-foreground mb-6">
              Seuls les responsables de centres et de cellules peuvent soumettre des rapports.
            </p>
            <Button onClick={() => router.push('/rapports')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour aux Rapports
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 2) {
      if (formData.financial.tithes < 0) {
        newErrors.tithes = 'Le montant des dîmes ne peut pas être négatif';
      }
    } else if (currentStep === 3) {
      if (!formData.people.attendanceMen && formData.people.attendanceMen !== 0) {
        newErrors.attendanceMen = 'Ce champ est requis';
      }
      if (!formData.people.attendanceWomen && formData.people.attendanceWomen !== 0) {
        newErrors.attendanceWomen = 'Ce champ est requis';
      }
      if (!formData.people.attendanceChildren && formData.people.attendanceChildren !== 0) {
        newErrors.attendanceChildren = 'Ce champ est requis';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      if (currentStep < STEPS.length) {
        setCurrentStep(currentStep + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        handleSubmit();
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async () => {
    // TODO: Implémenter la soumission du rapport
    alert('Fonctionnalité de soumission en cours de développement.\n\nLes données du formulaire :\n' + JSON.stringify(formData, null, 2));
    router.push('/rapports');
  };

  const progressPercent = (currentStep / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <TopNavigation />

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* En-tête avec progression */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/rapports')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux Rapports
          </Button>

          <h1 className="text-3xl font-bold mb-2">Nouveau Rapport Mensuel</h1>
          <p className="text-muted-foreground mb-6">
            Étape {currentStep} sur {STEPS.length} : {STEPS[currentStep - 1].title}
          </p>

          <div className="space-y-2">
            <Progress value={progressPercent} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              {STEPS.map((step) => (
                <span
                  key={step.id}
                  className={
                    step.id === currentStep
                      ? 'font-semibold text-primary'
                      : step.id < currentStep
                      ? 'text-green-600'
                      : ''
                  }
                >
                  {step.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Contenu de l'étape */}
        <Card className="p-8 mb-6">
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-2">Sélection de la Période</h2>
              <p className="text-muted-foreground mb-4">
                Choisissez la période pour laquelle vous souhaitez soumettre un rapport
              </p>

              <div className="space-y-4">
                <label className="block">
                  <span className="text-sm font-medium mb-2 block">
                    Période de reporting
                  </span>
                  <select
                    value={formData.periodId}
                    onChange={(e) =>
                      setFormData({ ...formData, periodId: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {periods.map((period) => (
                      <option key={period.id} value={period.id}>
                        {period.name}
                      </option>
                    ))}
                  </select>
                </label>

                {user.role === 'house_lead' && user.houseChurchId && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm">
                      <strong>Cellule :</strong> Vous soumettez un rapport pour votre house church
                    </p>
                  </div>
                )}

                {user.role === 'center_lead' && user.centerId && (
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm">
                      <strong>Centre :</strong> Vous soumettez un rapport pour votre centre
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <Step2Financial
              data={formData.financial}
              onChange={(data) => setFormData({ ...formData, financial: data })}
              errors={errors}
              userRole={user.role as 'house_lead' | 'center_lead'}
              houseChurchId={user.houseChurchId}
            />
          )}

          {currentStep === 3 && (
            <Step3People
              data={formData.people}
              onChange={(data) => setFormData({ ...formData, people: data })}
              errors={errors}
            />
          )}

          {currentStep === 4 && (
            <Step4Family
              data={formData.family}
              onChange={(data) => setFormData({ ...formData, family: data })}
              errors={errors}
            />
          )}

          {currentStep === 5 && (
            <Step5Activities
              data={formData.activities}
              onChange={(data) => setFormData({ ...formData, activities: data })}
              errors={errors}
            />
          )}
        </Card>

        {/* Boutons de navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Précédent
          </Button>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => alert('Sauvegarde en brouillon...')}>
              <Save className="w-4 h-4 mr-2" />
              Sauvegarder
            </Button>

            <Button onClick={handleNext}>
              {currentStep < STEPS.length ? (
                <>
                  Suivant
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Soumettre le Rapport
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
