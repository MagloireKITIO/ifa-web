'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { PeriodSelector } from '@/components/rapports/PeriodSelector';
import { createReport } from '@/lib/api/reports';
import { checkReportExists } from '@/lib/api/periods';
import { addReportMarriage, addReportBirth } from '@/lib/api/report-events';

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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [selectedPeriodName, setSelectedPeriodName] = useState('');
  const [reportExistsForPeriod, setReportExistsForPeriod] = useState(false);

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

  const handlePeriodChange = useCallback(async (periodId: string, periodName: string) => {
    setFormData((prev) => ({ ...prev, periodId }));
    setSelectedPeriodName(periodName);

    // Vérifier si un rapport existe pour cette période
    if (user) {
      const exists = await checkReportExists(
        periodId,
        user.role === 'center_lead' ? user.center_id || undefined : undefined,
        user.role === 'house_lead' ? user.house_church_id || undefined : undefined
      );
      setReportExistsForPeriod(exists);
    }
  }, [user]);

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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 text-center">
          <Card className="p-6 sm:p-8">
            <h1 className="text-xl sm:text-2xl font-bold mb-4">Accès Non Autorisé</h1>
            <p className="text-sm sm:text-base text-muted-foreground mb-6">
              Seuls les responsables de centres et de cellules peuvent soumettre des rapports.
            </p>
            <Button onClick={() => router.push('/rapports')} className="min-h-[44px]">
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
    if (!user) return;

    setSubmitting(true);

    try {
      const result = await createReport({
        periodId: formData.periodId,
        userId: user.id,
        centerId: user.role === 'center_lead' ? user.center_id || undefined : undefined,
        houseChurchId: user.role === 'house_lead' ? user.house_church_id || undefined : undefined,
        financial: {
          tithes: formData.financial.tithes,
          offeringsGeneral: formData.financial.offeringsGeneral,
          offeringsEvents: formData.financial.offeringsEvents,
          offeringsInvestment: formData.financial.offeringsInvestment,
          expenseAdmin: formData.financial.expenseAdmin,
          expenseRent: formData.financial.expenseRent,
          expenseMission: formData.financial.expenseMission,
          expenseEvents: formData.financial.expenseEvents,
          notes: formData.financial.notes,
        },
        people: {
          attendanceMen: formData.people.attendanceMen,
          attendanceWomen: formData.people.attendanceWomen,
          attendanceChildren: formData.people.attendanceChildren,
          newConverts: formData.people.newConverts,
          firstTimers: formData.people.firstTimers,
          baptisms: formData.people.baptisms,
          membersActiveStart: formData.people.membersActiveStart,
          membersGained: formData.people.membersGained,
          membersLost: formData.people.membersLost,
        },
        family: {
          marriages: formData.family.marriages,
          engagements: formData.family.engagements,
          births: formData.family.births,
          couplesCounseled: formData.family.couplesCounseled,
        },
        activities: {
          peopleTrained: formData.activities.peopleTrained,
          pastorsCertified: formData.activities.pastorsCertified,
          socialActionsCount: formData.activities.socialActionsCount,
          mealsDistributed: formData.activities.mealsDistributed,
          youthMentored: formData.activities.youthMentored,
          homeVisits: formData.activities.homeVisits,
          evangelismOutreachCount: formData.activities.evangelismOutreachCount,
        },
        memberContributions: formData.financial.memberContributions,
      });

      if (result.success && result.reportId) {
        // Phase 2: Enregistrer les mariages détaillés
        if (formData.family.marriageDetails && formData.family.marriageDetails.length > 0) {
          for (const marriage of formData.family.marriageDetails) {
            if (marriage.spouse1_id && marriage.spouse2_id && marriage.marriage_date) {
              await addReportMarriage({
                report_id: result.reportId,
                spouse1_id: marriage.spouse1_id,
                spouse2_id: marriage.spouse2_id,
                marriage_date: marriage.marriage_date,
                notes: marriage.notes || undefined,
              });
            }
          }
        }

        // Phase 2: Enregistrer les naissances détaillées
        if (formData.family.birthDetails && formData.family.birthDetails.length > 0) {
          for (const birth of formData.family.birthDetails) {
            if (birth.child_first_name && birth.child_gender && birth.birth_date) {
              await addReportBirth({
                report_id: result.reportId,
                child_first_name: birth.child_first_name,
                child_gender: birth.child_gender,
                birth_date: birth.birth_date,
                father_id: birth.father_id || undefined,
                mother_id: birth.mother_id || undefined,
                notes: birth.notes || undefined,
              });
            }
          }
        }

        alert('✅ Rapport soumis avec succès !');
        router.push('/rapports');
      } else {
        alert('❌ Erreur : ' + (result.error || 'Impossible de soumettre le rapport'));
      }
    } catch (error: any) {
      console.error('Error submitting report:', error);
      alert('❌ Erreur : ' + (error.message || 'Erreur inconnue'));
    } finally {
      setSubmitting(false);
    }
  };

  const progressPercent = (currentStep / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <TopNavigation />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* En-tête avec progression */}
        <div className="mb-6 sm:mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/rapports')}
            className="mb-4 min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Retour aux Rapports</span>
            <span className="sm:hidden">Retour</span>
          </Button>

          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2">
            Nouveau Rapport Mensuel
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
            Étape {currentStep} sur {STEPS.length} : {STEPS[currentStep - 1].title}
          </p>

          <div className="space-y-2 sm:space-y-3">
            <Progress value={progressPercent} className="h-2 sm:h-3" />
            <div className="flex justify-between text-xs sm:text-sm text-muted-foreground">
              {STEPS.map((step) => (
                <span
                  key={step.id}
                  className={`text-center ${
                    step.id === currentStep
                      ? 'font-semibold text-primary'
                      : step.id < currentStep
                      ? 'text-green-600'
                      : ''
                  }`}
                >
                  <span className="hidden sm:inline">{step.name}</span>
                  <span className="sm:hidden">{step.id}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Contenu de l'étape */}
        <Card className="p-4 sm:p-6 lg:p-8 mb-6">
          {currentStep === 1 && (
            <div className="space-y-4 sm:space-y-6">
              <PeriodSelector
                selectedPeriodId={formData.periodId}
                onPeriodChange={handlePeriodChange}
                centerId={user.role === 'center_lead' ? user.center_id || undefined : undefined}
                houseChurchId={user.role === 'house_lead' ? user.house_church_id || undefined : undefined}
              />

              {user.role === 'house_lead' && user.house_church_id && (
                <div className="p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs sm:text-sm">
                    💡 <strong>Cellule :</strong> Vous soumettez un rapport pour votre assemblée de maison
                  </p>
                </div>
              )}

              {user.role === 'center_lead' && user.center_id && (
                <div className="p-3 sm:p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-xs sm:text-sm">
                    💡 <strong>Centre :</strong> Vous soumettez un rapport pour votre centre
                  </p>
                </div>
              )}
            </div>
          )}

          {currentStep === 2 && (
            <Step2Financial
              data={formData.financial}
              onChange={(data) => setFormData({ ...formData, financial: data })}
              errors={errors}
              userRole={user.role as 'house_lead' | 'center_lead'}
              houseChurchId={user.house_church_id}
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
        <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1 || submitting}
            className="w-full sm:w-auto order-2 sm:order-1 min-h-[48px]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Précédent
          </Button>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 order-1 sm:order-2">
            <Button
              variant="outline"
              onClick={() => alert('Sauvegarde en brouillon...')}
              disabled={submitting}
              className="w-full sm:w-auto min-h-[48px]"
            >
              <Save className="w-4 h-4 mr-2" />
              Sauvegarder
            </Button>

            <Button
              onClick={handleNext}
              disabled={submitting || (currentStep === 1 && reportExistsForPeriod)}
              className="w-full sm:w-auto min-h-[48px]"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Soumission...
                </>
              ) : currentStep < STEPS.length ? (
                <>
                  Suivant
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Soumettre le Rapport</span>
                  <span className="sm:hidden">Soumettre</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
