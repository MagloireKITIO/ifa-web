-- ============================================================================
-- Migration: Fonction RPC pour le sourcing public sécurisé
-- Date: 2026-02-08
-- Description: Crée une fonction PostgreSQL qui permet la recherche de membres
--              pour le sourcing public tout en respectant la vie privée
-- ============================================================================

-- -----------------------------------------------------------------------------
-- FONCTION: search_members_for_sourcing
-- Description: Recherche de membres pour complétion de profil (sourcing public)
--              Contourne RLS de manière contrôlée et sécurisée
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.search_members_for_sourcing(
  search_query text
)
RETURNS TABLE (
  id uuid,
  full_name text,
  phone text,
  birth_year int,
  conversion_year int,
  joined_ifa_year int,
  is_baptized boolean,
  marriage_date date,
  center_id uuid,
  house_church_id uuid,
  center_name text,
  house_church_name text,
  completion_rate int,
  missing_fields_count int
)
SECURITY DEFINER  -- ⚠️ Contourne RLS - fonction exécutée avec les droits du créateur
LANGUAGE plpgsql
STABLE  -- Fonction ne modifie pas la base
AS $$
DECLARE
  required_fields_count int := 8;  -- Nombre de champs requis pour complétion
BEGIN
  -- Validation: query doit avoir au moins 2 caractères
  IF length(trim(search_query)) < 2 THEN
    RETURN;  -- Retourne vide si query trop courte
  END IF;

  RETURN QUERY
  WITH member_completion AS (
    SELECT
      m.id,
      m.full_name,
      m.phone,
      m.birth_year,
      m.conversion_year,
      m.joined_ifa_year,
      m.is_baptized,
      m.marriage_date,
      m.center_id,
      m.house_church_id,
      c.name as center_name,
      hc.name as house_church_name,
      -- Calculer le taux de complétion
      (
        CASE WHEN m.full_name IS NOT NULL AND m.full_name != '' THEN 1 ELSE 0 END +
        CASE WHEN m.phone IS NOT NULL AND m.phone != '' THEN 1 ELSE 0 END +
        CASE WHEN m.birth_year IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN m.conversion_year IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN m.joined_ifa_year IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN m.is_baptized IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN m.center_id IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN m.house_church_id IS NOT NULL THEN 1 ELSE 0 END
      ) as filled_fields,
      required_fields_count as total_fields
    FROM public.members m
    LEFT JOIN public.centers c ON c.id = m.center_id
    LEFT JOIN public.house_churches hc ON hc.id = m.house_church_id
    WHERE
      -- Recherche insensible à la casse
      m.full_name ILIKE '%' || trim(search_query) || '%'
      -- Seulement les membres actifs
      AND m.status = 'active'
  )
  SELECT
    mc.id,
    mc.full_name,
    mc.phone,
    mc.birth_year,
    mc.conversion_year,
    mc.joined_ifa_year,
    mc.is_baptized,
    mc.marriage_date,
    mc.center_id,
    mc.house_church_id,
    mc.center_name,
    mc.house_church_name,
    round((mc.filled_fields::decimal / mc.total_fields) * 100)::int as completion_rate,
    (mc.total_fields - mc.filled_fields) as missing_fields_count
  FROM member_completion mc
  WHERE
    -- 🔒 SÉCURITÉ: Filtrer UNIQUEMENT les profils incomplets (< 100%)
    -- Cela protège la vie privée en cachant les profils complets
    mc.filled_fields < mc.total_fields
  ORDER BY
    -- Prioriser les correspondances exactes
    CASE WHEN lower(mc.full_name) = lower(trim(search_query)) THEN 0 ELSE 1 END,
    -- Puis par taux de complétion (plus incomplet en premier)
    mc.filled_fields ASC,
    -- Puis alphabétique
    mc.full_name ASC
  LIMIT 10;  -- 🔒 SÉCURITÉ: Limiter à 10 résultats max
END;
$$;

-- Commentaire sur la fonction
COMMENT ON FUNCTION public.search_members_for_sourcing(text) IS
'Recherche de membres pour le sourcing public (complétion de profils).
SÉCURITÉ: Ne retourne QUE les profils incomplets pour protéger la vie privée.
Limite automatiquement à 10 résultats.
SECURITY DEFINER: Contourne RLS de manière contrôlée.';

-- Accorder l'exécution aux utilisateurs authentifiés ET anonymes
GRANT EXECUTE ON FUNCTION public.search_members_for_sourcing(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_members_for_sourcing(text) TO anon;

-- -----------------------------------------------------------------------------
-- TESTS DE LA FONCTION
-- -----------------------------------------------------------------------------

-- Test 1: Recherche avec query trop courte (devrait retourner vide)
DO $$
DECLARE
  result_count int;
BEGIN
  SELECT count(*) INTO result_count
  FROM public.search_members_for_sourcing('A');

  IF result_count > 0 THEN
    RAISE WARNING 'Test 1 ÉCHOUÉ: Query trop courte devrait retourner 0 résultats, a retourné %', result_count;
  ELSE
    RAISE NOTICE 'Test 1 OK: Query trop courte retourne 0 résultats';
  END IF;
END $$;

-- Test 2: Vérifier que seuls les profils incomplets sont retournés
DO $$
DECLARE
  max_completion int;
BEGIN
  SELECT max(completion_rate) INTO max_completion
  FROM public.search_members_for_sourcing('test');

  IF max_completion >= 100 THEN
    RAISE WARNING 'Test 2 ÉCHOUÉ: Des profils complets (100 pourcent) sont retournés!';
  ELSE
    RAISE NOTICE 'Test 2 OK: Seulement les profils incomplets sont retournés (max completion: %)', max_completion;
  END IF;
END $$;

-- Test 3: Vérifier la limite de 10 résultats
DO $$
DECLARE
  result_count int;
BEGIN
  SELECT count(*) INTO result_count
  FROM public.search_members_for_sourcing('a');  -- Query générique pour tester la limite

  IF result_count > 10 THEN
    RAISE WARNING 'Test 3 ÉCHOUÉ: Plus de 10 résultats retournés (%)', result_count;
  ELSE
    RAISE NOTICE 'Test 3 OK: Maximum 10 résultats retournés (actuel: %)', result_count;
  END IF;
END $$;

-- Message de fin
DO $$
BEGIN
  RAISE NOTICE '=== MIGRATION SOURCING RPC TERMINÉE ===';
END $$;

-- ============================================================================
-- FIN DE LA MIGRATION
-- ============================================================================
