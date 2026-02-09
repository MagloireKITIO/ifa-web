-- ============================================================================
-- Migration: FIX RLS Policies for Members Table
-- Date: 2026-02-08
-- Description: Corrige les politiques RLS sur la table members pour
--              restreindre correctement l'accès selon les rôles
-- ============================================================================

-- -----------------------------------------------------------------------------
-- 1. CRÉER FONCTION HELPER MANQUANTE
-- -----------------------------------------------------------------------------

-- Récupère la house_church_id de l'utilisateur actuel
CREATE OR REPLACE FUNCTION public.get_my_house_church_id()
RETURNS uuid AS $$
  SELECT house_church_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.get_my_house_church_id() IS
'Retourne la house_church_id de l''utilisateur connecté. Utilisé dans les politiques RLS.';

-- -----------------------------------------------------------------------------
-- 2. SUPPRIMER LES POLITIQUES EXISTANTES INCORRECTES
-- -----------------------------------------------------------------------------

-- Supprimer toutes les politiques existantes sur members
DROP POLICY IF EXISTS "Admins manage all members" ON public.members;
DROP POLICY IF EXISTS "Center Leads manage center members" ON public.members;
DROP POLICY IF EXISTS "House Leads view house members" ON public.members;

-- -----------------------------------------------------------------------------
-- 3. CRÉER LES NOUVELLES POLITIQUES SÉCURISÉES
-- -----------------------------------------------------------------------------

-- 🔐 ADMIN: Accès complet à tous les membres
CREATE POLICY "Admins have full access to members"
ON public.members
FOR ALL
TO authenticated
USING (public.is_admin());

COMMENT ON POLICY "Admins have full access to members" ON public.members IS
'Les administrateurs ont un accès complet (SELECT, INSERT, UPDATE, DELETE) à tous les membres.';

-- 🔐 CENTER LEAD: Gestion complète des membres de leur centre
CREATE POLICY "Center Leads manage their center members"
ON public.members
FOR ALL
TO authenticated
USING (
  public.get_my_role() = 'center_lead'::user_role
  AND center_id = public.get_my_center_id()
)
WITH CHECK (
  public.get_my_role() = 'center_lead'::user_role
  AND center_id = public.get_my_center_id()
);

COMMENT ON POLICY "Center Leads manage their center members" ON public.members IS
'Les responsables de centre peuvent gérer (SELECT, INSERT, UPDATE, DELETE) uniquement les membres de leur centre.';

-- 🔐 HOUSE LEAD: Gestion des membres de LEUR assemblée uniquement
CREATE POLICY "House Leads manage their house church members"
ON public.members
FOR ALL
TO authenticated
USING (
  public.get_my_role() = 'house_lead'::user_role
  AND (
    -- Membres de leur house church
    house_church_id = public.get_my_house_church_id()
    OR
    -- OU membres du même centre mais pas encore assignés à une house church
    (
      house_church_id IS NULL
      AND center_id IN (
        SELECT center_id FROM public.house_churches
        WHERE id = public.get_my_house_church_id()
      )
    )
  )
)
WITH CHECK (
  public.get_my_role() = 'house_lead'::user_role
  AND (
    -- Peut assigner seulement à SA house church
    house_church_id = public.get_my_house_church_id()
    OR
    -- OU laisser sans house church (mais dans le bon centre)
    (
      house_church_id IS NULL
      AND center_id IN (
        SELECT center_id FROM public.house_churches
        WHERE id = public.get_my_house_church_id()
      )
    )
  )
);

COMMENT ON POLICY "House Leads manage their house church members" ON public.members IS
'Les responsables d''assemblée peuvent gérer uniquement les membres de LEUR assemblée spécifique,
plus les membres non-assignés de leur centre (pour permettre l''assignation).';

-- 🔐 VIEWER: Lecture seule des membres de leur centre
CREATE POLICY "Viewers can view their center members"
ON public.members
FOR SELECT
TO authenticated
USING (
  public.get_my_role() = 'viewer'::user_role
  AND center_id = public.get_my_center_id()
);

COMMENT ON POLICY "Viewers can view their center members" ON public.members IS
'Les utilisateurs avec rôle viewer peuvent uniquement voir (SELECT) les membres de leur centre.';

-- NOTE: Le système de sourcing public (/sourcing/public) fonctionne de manière anonyme
-- et utilise une fonction RPC spéciale qui contourne RLS de manière contrôlée.
-- Nous ne créons PAS de politique générale qui permettrait à tous de voir tous les membres.

-- -----------------------------------------------------------------------------
-- 4. VÉRIFICATION DE LA MIGRATION
-- -----------------------------------------------------------------------------

-- Afficher toutes les politiques sur members après migration
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  RAISE NOTICE '=== POLITIQUES RLS SUR TABLE MEMBERS (APRÈS MIGRATION) ===';

  FOR policy_record IN
    SELECT policyname, cmd, qual
    FROM pg_policies
    WHERE tablename = 'members'
    ORDER BY policyname
  LOOP
    RAISE NOTICE 'Politique: % | Commande: % | Condition: %',
      policy_record.policyname,
      policy_record.cmd,
      left(policy_record.qual::text, 100);
  END LOOP;

  RAISE NOTICE '=== FIN VÉRIFICATION ===';
END $$;

-- Vérifier que RLS est bien activé
DO $$
BEGIN
  IF NOT (SELECT rowsecurity FROM pg_tables WHERE tablename = 'members' AND schemaname = 'public') THEN
    RAISE EXCEPTION 'ERREUR: RLS n''est pas activé sur la table members!';
  END IF;

  RAISE NOTICE '✓ RLS est activé sur table members';
END $$;

-- ============================================================================
-- FIN DE LA MIGRATION
-- ============================================================================
