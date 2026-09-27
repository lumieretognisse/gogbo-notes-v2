-- ====================================================================
-- GOGBO NOTES V2 - MIGRATION D'ARCHITECTURE PLURIANNUELLE
-- Date : 2026-09-24
-- Établissement : CEG GOGBO (Commune d'Adjohoun, Arrondissement de Gangban)
-- Objectif : Pérenniser la plateforme pour fonctionner année après année
-- (2026–2027, 2027–2028, 2028–2029...) sans suppression ni réinitialisation.
-- ====================================================================

-- 1. CRÉATION DE LA TABLE DES ANNÉES SCOLAIRES
CREATE TABLE IF NOT EXISTS public.annees_scolaires (
  id TEXT PRIMARY KEY,
  libelle TEXT NOT NULL UNIQUE,
  date_debut DATE NOT NULL,
  date_fin DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  statut TEXT NOT NULL DEFAULT 'A_VENIR' CHECK (statut IN ('CLOTUREE', 'EN_COURS', 'A_VENIR')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Activation de RLS sur annees_scolaires
ALTER TABLE public.annees_scolaires ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture annees_scolaires pour tous les connectés"
  ON public.annees_scolaires FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Gestion annees_scolaires Censeur et DG"
  ON public.annees_scolaires FOR ALL
  TO authenticated
  USING (public.get_current_role() IN ('CENSEUR', 'DIRECTEUR_GENERAL'));

-- 2. INSERTION SÉCURISÉE DES ANNÉES SCOLAIRES INITIALES (Idempotent)
INSERT INTO public.annees_scolaires (id, libelle, date_debut, date_fin, is_active, statut)
VALUES 
  ('annee-2025-2026', '2025–2026', '2025-09-15', '2026-06-30', false, 'CLOTUREE'),
  ('annee-2026-2027', '2026–2027', '2026-09-15', '2027-06-30', true, 'EN_COURS'),
  ('annee-2027-2028', '2027–2028', '2027-09-15', '2028-06-30', false, 'A_VENIR')
ON CONFLICT (id) DO NOTHING;

-- 3. CRÉATION DE LA TABLE DES INSCRIPTIONS ANNUELLES DES ÉLÈVES
-- Permet à un élève de conserver son identité permanente dans public.eleves,
-- tout en historisant rigoureusement son parcours annuel (6ème A en 2026-2027, 5ème A en 2027-2028, etc.)
CREATE TABLE IF NOT EXISTS public.inscriptions_eleves (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  eleve_id UUID NOT NULL REFERENCES public.eleves(id) ON DELETE RESTRICT,
  classe_id TEXT NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
  annee_scolaire TEXT NOT NULL,
  statut statut_compte NOT NULL DEFAULT 'ACTIF',
  date_inscription DATE NOT NULL DEFAULT CURRENT_DATE,
  redoublant BOOLEAN NOT NULL DEFAULT false,
  actif BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_inscription_eleve_annee UNIQUE (eleve_id, annee_scolaire)
);

-- Activation de RLS sur inscriptions_eleves
ALTER TABLE public.inscriptions_eleves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture inscriptions pour tous les authentifiés"
  ON public.inscriptions_eleves FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Gestion inscriptions Censeur et DG"
  ON public.inscriptions_eleves FOR ALL
  TO authenticated
  USING (public.get_current_role() IN ('CENSEUR', 'DIRECTEUR_GENERAL'));

-- 4. MIGRATION NON DESTRUCTIVE DES ÉLÈVES EXISTANTS VERS LEURS INSCRIPTIONS 2026–2027
INSERT INTO public.inscriptions_eleves (eleve_id, classe_id, annee_scolaire, statut, date_inscription, actif)
SELECT id, classe_id, '2026–2027', statut, COALESCE(created_at::date, CURRENT_DATE), (statut = 'ACTIF')
FROM public.eleves
ON CONFLICT (eleve_id, annee_scolaire) DO NOTHING;

-- 5. ÉVOLUTION DE LA TABLE ATTRIBUTIONS DE CLASSE (AFFECTATIONS PÉDAGOGIQUES)
-- Ajout de la colonne annee_scolaire pour isoler strictement les attributions d'une année sur l'autre
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'affectations' AND column_name = 'annee_scolaire'
  ) THEN
    ALTER TABLE public.affectations ADD COLUMN annee_scolaire TEXT NOT NULL DEFAULT '2026–2027';
  END IF;
END $$;

-- Mise à jour de la contrainte unique pour inclure l'année scolaire
ALTER TABLE public.affectations DROP CONSTRAINT IF EXISTS unique_affectation_active;
ALTER TABLE public.affectations ADD CONSTRAINT unique_affectation_annee UNIQUE (profile_id, classe_id, matiere_id, annee_scolaire);

-- 6. ÉVOLUTION DE LA TABLE NOTES
-- Ajout direct de annee_scolaire pour requêtage optimisé et étanchéité absolue
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notes' AND column_name = 'annee_scolaire'
  ) THEN
    ALTER TABLE public.notes ADD COLUMN annee_scolaire TEXT NOT NULL DEFAULT '2026–2027';
  END IF;
END $$;

-- 7. MISE À JOUR DES POLITIQUES RLS DE SÉCURITÉ POUR LE PLURIANNUEL
-- Règle stricte : Aucune modification ou insertion de note n'est autorisée sur une année scolaire clôturée !
CREATE OR REPLACE FUNCTION public.is_annee_scolaire_active(p_annee TEXT)
RETURNS BOOLEAN AS $$
  SELECT COALESCE((SELECT is_active FROM public.annees_scolaires WHERE libelle = p_annee), true);
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Saisie et mise à jour des notes sécurisées par année et période ouverte
DROP POLICY IF EXISTS "Insertion notes réservée au titulaire d affectation" ON public.notes;
CREATE POLICY "Insertion notes réservée au titulaire d affectation"
  ON public.notes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.affectations a
      JOIN public.periodes p ON p.id = notes.periode_id
      JOIN public.annees_scolaires an ON an.libelle = p.annee_scolaire
      WHERE a.id = notes.affectation_id
        AND a.profile_id = auth.uid()
        AND a.statut = 'ACTIF'
        AND p.is_locked = false
        AND an.is_active = true
        AND an.statut = 'EN_COURS'
    )
  );

DROP POLICY IF EXISTS "Modification notes réservée au titulaire d affectation" ON public.notes;
CREATE POLICY "Modification notes réservée au titulaire d affectation"
  ON public.notes FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.affectations a
      JOIN public.periodes p ON p.id = notes.periode_id
      JOIN public.annees_scolaires an ON an.libelle = p.annee_scolaire
      WHERE a.id = notes.affectation_id
        AND a.profile_id = auth.uid()
        AND a.statut = 'ACTIF'
        AND p.is_locked = false
        AND an.is_active = true
        AND an.statut = 'EN_COURS'
    )
  );

-- 8. INDEX DE PERFORMANCE PLURIANNUELLE
CREATE INDEX IF NOT EXISTS idx_inscriptions_eleve_annee ON public.inscriptions_eleves(eleve_id, annee_scolaire);
CREATE INDEX IF NOT EXISTS idx_inscriptions_classe_annee ON public.inscriptions_eleves(classe_id, annee_scolaire);
CREATE INDEX IF NOT EXISTS idx_affectations_annee ON public.affectations(annee_scolaire);
CREATE INDEX IF NOT EXISTS idx_notes_annee ON public.notes(annee_scolaire);
CREATE INDEX IF NOT EXISTS idx_periodes_annee ON public.periodes(annee_scolaire);
