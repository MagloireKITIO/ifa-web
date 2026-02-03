// Types pour le formulaire de sourcing public

export type Gender = 'Homme' | 'Femme';

export type MaritalStatus =
  | 'Célibataire'
  | 'Marié(e)'
  | 'Fiancé(e)'
  | 'Veuf(ve)'
  | 'Divorcé(e)';

export type SpiritualStatus = 'Membre' | 'Visiteur' | 'Nouveau Converti';

export interface SourcingFormData {
  // Étape 1 : Informations Personnelles
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: Gender | '';

  // Étape 2 : Adresse
  address: string;

  // Étape 3 : Informations Familiales
  maritalStatus: MaritalStatus | '';
  hasChildren: boolean;
  numberOfChildren: number;

  // Étape 4 : Informations Spirituelles
  spiritualStatus: SpiritualStatus | '';
  isBaptized: boolean;
  baptismDate: string;

  // Étape 5 : Attachement
  centerId: string;
  houseChurchId: string;
}

export const initialFormData: SourcingFormData = {
  fullName: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  gender: '',
  address: '',
  maritalStatus: '',
  hasChildren: false,
  numberOfChildren: 0,
  spiritualStatus: '',
  isBaptized: false,
  baptismDate: '',
  centerId: '',
  houseChurchId: '',
};

export interface FormStep {
  number: number;
  title: string;
  description: string;
}

export const formSteps: FormStep[] = [
  {
    number: 1,
    title: 'Informations Personnelles',
    description: 'Parlez-nous un peu de vous',
  },
  {
    number: 2,
    title: 'Adresse',
    description: 'Où habitez-vous ?',
  },
  {
    number: 3,
    title: 'Informations Familiales',
    description: 'Votre situation familiale',
  },
  {
    number: 4,
    title: 'Informations Spirituelles',
    description: 'Votre parcours spirituel',
  },
  {
    number: 5,
    title: 'Attachement à l\'Église',
    description: 'Votre centre et cellule',
  },
];
