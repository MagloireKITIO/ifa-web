'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { SourcingWelcome } from '@/components/sourcing/SourcingWelcome';
import { SourcingProgress } from '@/components/sourcing/SourcingProgress';
import { SourcingSuccess } from '@/components/sourcing/SourcingSuccess';
import { Step1PersonalInfo } from '@/components/sourcing/steps/Step1PersonalInfo';
import { Step2Address } from '@/components/sourcing/steps/Step2Address';
import { Step3Family } from '@/components/sourcing/steps/Step3Family';
import { Step4Spiritual } from '@/components/sourcing/steps/Step4Spiritual';
import { Step5Attachment } from '@/components/sourcing/steps/Step5Attachment';
import { useLocalStorage } from '@/lib/hooks/useLocalStorage';
import {
  SourcingFormData,
  initialFormData,
  formSteps,
} from '@/types/sourcing';

type FormScreen = 'welcome' | 'form' | 'success';

export default function SourcingPublicPage() {
  const [screen, setScreen] = useState<FormScreen>('welcome');
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData, clearFormData, isLoaded] = useLocalStorage<SourcingFormData>(
    'ifa_sourcing_form_data',
    initialFormData
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fonction pour mettre à jour un champ
  const updateField = (field: keyof SourcingFormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Effacer l'erreur du champ si elle existe
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Validation par étape
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1: // Informations Personnelles
        if (!formData.fullName.trim()) {
          newErrors.fullName = 'Le nom complet est requis';
        }
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          newErrors.email = 'Email invalide';
        }
        if (!formData.phone.trim()) {
          newErrors.phone = 'Le numéro de téléphone est requis';
        }
        if (!formData.dateOfBirth) {
          newErrors.dateOfBirth = 'La date de naissance est requise';
        } else {
          const birthDate = new Date(formData.dateOfBirth);
          if (birthDate > new Date()) {
            newErrors.dateOfBirth = 'La date ne peut pas être dans le futur';
          }
        }
        if (!formData.gender) {
          newErrors.gender = 'Le genre est requis';
        }
        break;

      case 2: // Adresse
        if (!formData.address.trim()) {
          newErrors.address = 'L\'adresse est requise';
        }
        break;

      case 3: // Informations Familiales
        if (!formData.maritalStatus) {
          newErrors.maritalStatus = 'La situation familiale est requise';
        }
        if (formData.hasChildren && formData.numberOfChildren < 1) {
          newErrors.numberOfChildren = 'Le nombre d\'enfants doit être au moins 1';
        }
        break;

      case 4: // Informations Spirituelles
        if (!formData.spiritualStatus) {
          newErrors.spiritualStatus = 'Le statut spirituel est requis';
        }
        if (formData.isBaptized && !formData.baptismDate) {
          newErrors.baptismDate = 'La date de baptême est requise';
        }
        break;

      case 5: // Attachement
        if (!formData.centerId) {
          newErrors.centerId = 'Le centre est requis';
        }
        if (!formData.houseChurchId) {
          newErrors.houseChurchId = 'La cellule est requise';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Navigation
  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 5) {
        setCurrentStep((prev) => prev + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        // Soumission finale
        handleSubmit();
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Soumission du formulaire
  const handleSubmit = async () => {
    try {
      // Ici on enverrait les données au backend
      // Pour le prototype, on simule juste un délai
      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log('Données soumises:', formData);

      // Passer à l'écran de succès
      setScreen('success');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Erreur soumission:', error);
      alert('Erreur lors de la soumission. Veuillez réessayer.');
    }
  };

  // Soumettre une autre réponse
  const handleSubmitAnother = () => {
    clearFormData();
    setCurrentStep(1);
    setScreen('welcome');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Gestion du clavier (Enter pour suivant)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && screen === 'form') {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [screen, currentStep, formData]);

  // Écran de bienvenue
  if (screen === 'welcome') {
    return <SourcingWelcome onStart={() => setScreen('form')} />;
  }

  // Écran de succès
  if (screen === 'success') {
    const firstName = formData.fullName.split(' ')[0];
    return (
      <SourcingSuccess
        firstName={firstName}
        onSubmitAnother={handleSubmitAnother}
      />
    );
  }

  // Écran du formulaire
  const stepData = formSteps[currentStep - 1];

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Barre de progression */}
      <SourcingProgress currentStep={currentStep} totalSteps={5} />

      {/* Contenu du formulaire */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* En-tête de l'étape */}
        <div className="mb-6 sm:mb-8">
          <p className="text-sm text-muted-foreground mb-2">
            Étape {stepData.number} sur 5
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            {stepData.title}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">{stepData.description}</p>
        </div>

        {/* Composant de l'étape actuelle */}
        <div className="bg-white rounded-xl p-4 sm:p-6 md:p-8 shadow-md mb-6 sm:mb-8">
          {currentStep === 1 && (
            <Step1PersonalInfo
              formData={formData}
              updateField={updateField}
              errors={errors}
            />
          )}
          {currentStep === 2 && (
            <Step2Address
              formData={formData}
              updateField={updateField}
              errors={errors}
            />
          )}
          {currentStep === 3 && (
            <Step3Family
              formData={formData}
              updateField={updateField}
              errors={errors}
            />
          )}
          {currentStep === 4 && (
            <Step4Spiritual
              formData={formData}
              updateField={updateField}
              errors={errors}
            />
          )}
          {currentStep === 5 && (
            <Step5Attachment
              formData={formData}
              updateField={updateField}
              errors={errors}
            />
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Précédent
          </Button>

          <Button onClick={handleNext} size="lg" className="px-8">
            {currentStep === 5 ? 'Soumettre' : 'Suivant'}
            {currentStep < 5 && <ArrowRight className="w-4 h-4 ml-2" />}
          </Button>
        </div>

        {/* Indicateur auto-save */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Vos réponses sont sauvegardées automatiquement
        </p>
      </div>
    </div>
  );
}
