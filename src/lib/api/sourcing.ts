import { supabase } from '../supabase';
import type { Member } from './members';

// Interface pour une campagne de sourcing
export interface SourcingCampaign {
  id: string;
  title: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  status: 'active' | 'paused' | 'completed';
  type: string;
  center_ids: string[] | null;
  unique_link: string | null;
  qr_code: string | null;
  fields: string[] | null;
  responses_count: number;
  created_at: string;
  created_by: string;
}

// Interface pour une réponse de sourcing
export interface SourcingResponse {
  id: string;
  campaign_id: string | null;
  submitted_at: string;
  status: 'pending' | 'approved' | 'rejected';
  data: {
    member_id?: string; // Si membre existant trouvé
    full_name: string;
    phone?: string;
    birth_year?: number;
    conversion_year?: number;
    joined_ifa_year?: number;
    is_baptized?: boolean;
    baptism_date?: string;
    marriage_date?: string;
    center_id?: string;
    house_church_id?: string;
    notes?: string;
    // Nouveaux champs Phase 2
    gender?: 'M' | 'F';
    marital_status?: 'single' | 'married' | 'widowed' | 'divorced';
    children_count?: number;
    children_boys?: number;
    children_girls?: number;
    children_details?: Array<{
      first_name: string;
      gender: 'M' | 'F';
      birth_year: number;
    }>;
  };
  rejection_reason?: string;
}

// Interface pour un membre avec taux de complétion
export interface MemberWithCompletion extends Member {
  completion_rate: number;
  missing_fields: string[];
}

/**
 * Recherche intelligente de membres par nom (fuzzy search)
 * Filtre uniquement les profils incomplets pour protéger la vie privée
 *
 * 🔒 SÉCURITÉ: Utilise une fonction RPC (search_members_for_sourcing) qui:
 * - Contourne RLS de manière contrôlée (SECURITY DEFINER)
 * - Filtre automatiquement les profils incomplets (<100%)
 * - Limite à 10 résultats maximum
 */
export async function searchMemberByName(query: string): Promise<MemberWithCompletion[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  // Utiliser la fonction RPC sécurisée au lieu de la requête directe
  const { data, error } = await supabase
    .rpc('search_members_for_sourcing', {
      search_query: query.trim()
    });

  if (error) {
    console.error('Error searching members via RPC:', error);
    return [];
  }

  if (!data) return [];

  // Transformer les données pour correspondre à l'interface MemberWithCompletion
  const membersWithCompletion: MemberWithCompletion[] = data.map((result: any) => {
    // Calculer les champs manquants à partir du completion_rate
    const requiredFields = [
      { key: 'full_name', label: 'Nom complet' },
      { key: 'phone', label: 'Téléphone' },
      { key: 'birth_year', label: 'Année de naissance' },
      { key: 'conversion_year', label: 'Année de conversion' },
      { key: 'joined_ifa_year', label: 'Année d\'intégration IFA' },
      { key: 'is_baptized', label: 'Statut baptême' },
      { key: 'center_id', label: 'Centre' },
      { key: 'house_church_id', label: 'Assemblée' },
    ];

    const missing_fields: string[] = [];
    requiredFields.forEach(({ key, label }) => {
      const value = result[key];
      if (value === null || value === undefined || value === '') {
        missing_fields.push(label);
      }
    });

    return {
      id: result.id,
      full_name: result.full_name,
      phone: result.phone,
      birth_year: result.birth_year,
      conversion_year: result.conversion_year,
      joined_ifa_year: result.joined_ifa_year,
      is_baptized: result.is_baptized,
      marriage_date: result.marriage_date,
      center_id: result.center_id,
      house_church_id: result.house_church_id,
      status: 'active', // RPC filtre déjà les actifs
      notes: null,
      created_at: '',
      centers: result.center_name ? { name: result.center_name } : undefined,
      house_churches: result.house_church_name ? { name: result.house_church_name } : undefined,
      completion_rate: result.completion_rate,
      missing_fields: missing_fields,
    } as MemberWithCompletion;
  });

  return membersWithCompletion;
}

/**
 * Calcule le taux de complétion d'un profil membre
 */
export function calculateCompletionRate(member: Member): {
  completion_rate: number;
  missing_fields: string[];
} {
  const requiredFields = [
    { key: 'full_name', label: 'Nom complet' },
    { key: 'phone', label: 'Téléphone' },
    { key: 'birth_year', label: 'Année de naissance' },
    { key: 'conversion_year', label: 'Année de conversion' },
    { key: 'joined_ifa_year', label: 'Année d\'intégration IFA' },
    { key: 'is_baptized', label: 'Statut baptême' },
    { key: 'center_id', label: 'Centre' },
    { key: 'house_church_id', label: 'Assemblée' },
  ];

  let filledCount = 0;
  const missing_fields: string[] = [];

  requiredFields.forEach(({ key, label }) => {
    const value = (member as any)[key];
    if (value !== null && value !== undefined && value !== '') {
      filledCount++;
    } else {
      missing_fields.push(label);
    }
  });

  const completion_rate = Math.round((filledCount / requiredFields.length) * 100);

  return { completion_rate, missing_fields };
}

/**
 * Récupère ou crée la campagne permanente de complétion de profil
 */
export async function getProfileCompletionCampaign(): Promise<SourcingCampaign | null> {
  // Chercher d'abord si la campagne existe
  const { data: existing, error: searchError } = await supabase
    .from('sourcing_campaigns')
    .select('*')
    .eq('type', 'profile_completion')
    .eq('status', 'active')
    .single();

  if (existing) {
    return existing;
  }

  // Si n'existe pas, la créer
  const { data: newCampaign, error: createError } = await supabase
    .from('sourcing_campaigns')
    .insert({
      title: 'Complétion de Profil Membre',
      description: 'Campagne permanente pour permettre aux membres de compléter leurs informations personnelles',
      status: 'active',
      type: 'profile_completion',
      start_date: new Date().toISOString(),
      end_date: null, // Pas de date de fin
      fields: [
        'full_name',
        'phone',
        'birth_year',
        'conversion_year',
        'joined_ifa_year',
        'is_baptized',
        'baptism_date',
        'marriage_date',
      ],
      responses_count: 0,
    })
    .select()
    .single();

  if (createError) {
    console.error('Error creating profile completion campaign:', createError);
    return null;
  }

  return newCampaign;
}

/**
 * Soumet une complétion de profil membre
 */
export async function submitMemberCompletion(
  data: SourcingResponse['data'] & { captcha_token?: string }
): Promise<{ success: boolean; error?: string; responseId?: string }> {
  try {
    // 🔒 SÉCURITÉ: Vérifier le CAPTCHA d'abord
    if (data.captcha_token) {
      const captchaResponse = await fetch('/api/verify-captcha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: data.captcha_token }),
      });

      const captchaResult = await captchaResponse.json();

      if (!captchaResult.success) {
        return {
          success: false,
          error: 'CAPTCHA invalide. Veuillez réessayer.',
        };
      }
    }

    // Récupérer la campagne active
    const campaign = await getProfileCompletionCampaign();
    if (!campaign) {
      return { success: false, error: 'Campagne de sourcing non disponible' };
    }

    // Valider les données
    const validation = validateMemberData(data);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Retirer le captcha_token des données avant insertion
    const { captcha_token, ...cleanData } = data;

    // Créer la réponse
    const { data: response, error } = await supabase
      .from('sourcing_responses')
      .insert({
        campaign_id: campaign.id,
        submitted_at: new Date().toISOString(),
        status: 'pending',
        data: cleanData,
      })
      .select()
      .single();

    if (error) {
      console.error('Error submitting member completion:', error);
      return { success: false, error: error.message };
    }

    // Incrémenter le compteur de réponses
    await supabase
      .from('sourcing_campaigns')
      .update({ responses_count: campaign.responses_count + 1 })
      .eq('id', campaign.id);

    return { success: true, responseId: response.id };
  } catch (err: any) {
    console.error('Error in submitMemberCompletion:', err);
    return { success: false, error: err.message || 'Erreur inconnue' };
  }
}

/**
 * Valide les données d'un membre
 */
function validateMemberData(data: SourcingResponse['data']): {
  valid: boolean;
  error?: string;
} {
  // Nom requis
  if (!data.full_name || data.full_name.trim().length < 2) {
    return { valid: false, error: 'Le nom complet est requis' };
  }

  // Téléphone requis (format basique)
  if (!data.phone || data.phone.trim().length < 9) {
    return { valid: false, error: 'Un numéro de téléphone valide est requis' };
  }

  // Validation des années si fournies
  const currentYear = new Date().getFullYear();

  if (data.birth_year) {
    if (data.birth_year < 1900 || data.birth_year > currentYear - 5) {
      return { valid: false, error: 'Année de naissance invalide' };
    }
  }

  if (data.conversion_year) {
    if (data.conversion_year < 1900 || data.conversion_year > currentYear) {
      return { valid: false, error: 'Année de conversion invalide' };
    }
  }

  if (data.joined_ifa_year) {
    if (data.joined_ifa_year < 2011 || data.joined_ifa_year > currentYear) {
      return { valid: false, error: 'Année d\'intégration IFA invalide (IFA fondé en 2011)' };
    }
  }

  // Validation logique des années
  if (data.birth_year && data.conversion_year && data.birth_year >= data.conversion_year) {
    return { valid: false, error: 'L\'année de conversion doit être après l\'année de naissance' };
  }

  if (data.conversion_year && data.joined_ifa_year && data.conversion_year > data.joined_ifa_year) {
    return { valid: false, error: 'L\'année d\'intégration IFA doit être après la conversion' };
  }

  return { valid: true };
}

/**
 * Récupère toutes les soumissions en attente de validation
 */
export async function getPendingSourcing(): Promise<SourcingResponse[]> {
  const { data, error } = await supabase
    .from('sourcing_responses')
    .select('*')
    .eq('status', 'pending')
    .order('submitted_at', { ascending: false });

  if (error) {
    console.error('Error fetching pending sourcing:', error);
    return [];
  }

  return data || [];
}

/**
 * Récupère toutes les soumissions (pour admin)
 */
export async function getAllSourcing(
  status?: 'pending' | 'approved' | 'rejected'
): Promise<SourcingResponse[]> {
  let query = supabase
    .from('sourcing_responses')
    .select('*')
    .order('submitted_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching sourcing responses:', error);
    return [];
  }

  return data || [];
}

/**
 * Approuve une soumission et fusionne les données dans le profil membre
 */
export async function approveSourcing(
  responseId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Récupérer la réponse
    const { data: response, error: fetchError } = await supabase
      .from('sourcing_responses')
      .select('*')
      .eq('id', responseId)
      .single();

    if (fetchError || !response) {
      return { success: false, error: 'Soumission introuvable' };
    }

    if (response.status !== 'pending') {
      return { success: false, error: 'Cette soumission a déjà été traitée' };
    }

    const memberData = response.data as SourcingResponse['data'];

    // Cas 1 : Mise à jour d'un membre existant
    if (memberData.member_id) {
      const { error: updateError } = await supabase
        .from('members')
        .update({
          phone: memberData.phone,
          birth_year: memberData.birth_year,
          conversion_year: memberData.conversion_year,
          joined_ifa_year: memberData.joined_ifa_year,
          is_baptized: memberData.is_baptized,
          marriage_date: memberData.marriage_date,
          notes: memberData.notes,
          gender: memberData.gender,
          marital_status: memberData.marital_status,
        })
        .eq('id', memberData.member_id);

      if (updateError) {
        console.error('Error updating member:', updateError);
        return { success: false, error: updateError.message };
      }
    }
    // Cas 2 : Création d'un nouveau membre
    else {
      const { data: newMember, error: insertError } = await supabase
        .from('members')
        .insert({
          full_name: memberData.full_name,
          phone: memberData.phone,
          birth_year: memberData.birth_year,
          conversion_year: memberData.conversion_year,
          joined_ifa_year: memberData.joined_ifa_year,
          is_baptized: memberData.is_baptized || false,
          marriage_date: memberData.marriage_date,
          center_id: memberData.center_id,
          house_church_id: memberData.house_church_id,
          status: 'active',
          notes: memberData.notes,
          gender: memberData.gender,
          marital_status: memberData.marital_status,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating member:', insertError);
        return { success: false, error: insertError.message };
      }

      // Si des enfants sont déclarés, les créer
      if (memberData.children_details && memberData.children_details.length > 0 && newMember) {
        const childrenToInsert = memberData.children_details.map((child) => ({
          first_name: child.first_name,
          gender: child.gender,
          birth_date: `${child.birth_year}-01-01`, // Date approximative
          father_id: memberData.gender === 'M' ? newMember.id : null,
          mother_id: memberData.gender === 'F' ? newMember.id : null,
          center_id: memberData.center_id,
          house_church_id: memberData.house_church_id,
          status: 'active',
        }));

        const { error: childrenError } = await supabase
          .from('children')
          .insert(childrenToInsert);

        if (childrenError) {
          console.error('Error creating children:', childrenError);
          // On continue même si la création des enfants échoue
        }
      }
    }

    // Marquer la soumission comme approuvée
    const { error: statusError } = await supabase
      .from('sourcing_responses')
      .update({ status: 'approved' })
      .eq('id', responseId);

    if (statusError) {
      console.error('Error updating response status:', statusError);
      return { success: false, error: statusError.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Error in approveSourcing:', err);
    return { success: false, error: err.message || 'Erreur inconnue' };
  }
}

/**
 * Rejette une soumission
 */
export async function rejectSourcing(
  responseId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('sourcing_responses')
    .update({
      status: 'rejected',
      data: supabase.rpc('jsonb_set', {
        target: 'data',
        path: '{rejection_reason}',
        new_value: JSON.stringify(reason),
      }) as any,
    })
    .eq('id', responseId);

  if (error) {
    console.error('Error rejecting sourcing:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Vérifie si un téléphone existe déjà
 */
export async function checkPhoneExists(phone: string): Promise<{
  exists: boolean;
  member?: Member;
}> {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('phone', phone)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error checking phone:', error);
  }

  return {
    exists: !!data,
    member: data || undefined,
  };
}
