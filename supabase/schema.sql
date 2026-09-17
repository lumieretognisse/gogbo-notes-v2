-- ====================================================================
-- GOGBO NOTES V2 - SCHÉMA OFFICIEL POSTGRESQL / SUPABASE
-- CEG GOGBO (Commune d'Adjohoun, Arrondissement de Gangban)
-- Année académique : 2026–2027
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TYPES ENUM
DO $$ BEGIN
  CREATE TYPE role_admin AS ENUM (
    'DIRECTEUR_GENERAL',
    'CENSEUR',
    'SURVEILLANT_GENERAL',
    'COMPTABLE',
    'ENSEIGNANT'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE sexe_eleve AS ENUM ('M', 'F');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE statut_compte AS ENUM ('ACTIF', 'INACTIF');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE langue_option AS ENUM ('AUCUNE', 'ALLEMAND', 'ESPAGNOL');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE type_eval AS ENUM ('INTERROGATION', 'DEVOIR_1', 'DEVOIR_2');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. TABLE PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  role role_admin NOT NULL DEFAULT 'ENSEIGNANT',
  is_enseignant BOOLEAN NOT NULL DEFAULT true,
  telephone TEXT,
  statut statut_compte NOT NULL DEFAULT 'ACTIF',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. TABLE CLASSES (28 classes officielles, max 100 élèves)
CREATE TABLE IF NOT EXISTS public.classes (
  id TEXT PRIMARY KEY,
  nom TEXT NOT NULL UNIQUE,
  niveau TEXT NOT NULL,
  serie TEXT,
  effectif_max INT NOT NULL DEFAULT 100 CHECK (effectif_max <= 100),
  salle TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. TABLE MATIERES (minimum 11 matières obligatoires)
CREATE TABLE IF NOT EXISTS public.matieres (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  nom TEXT NOT NULL,
  coefficient INT NOT NULL DEFAULT 2 CHECK (coefficient > 0),
  statut statut_compte NOT NULL DEFAULT 'ACTIF',
  is_langue_option BOOLEAN NOT NULL DEFAULT false,
  categorie TEXT NOT NULL DEFAULT 'GENERALE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. TABLE ELEVES
CREATE TABLE IF NOT EXISTS public.eleves (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  matricule TEXT NOT NULL UNIQUE,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  sexe sexe_eleve NOT NULL,
  date_naissance DATE,
  classe_id TEXT NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
  langue_vivante_2 langue_option NOT NULL DEFAULT 'AUCUNE',
  nom_parent TEXT,
  contact_parent TEXT,
  statut statut_compte NOT NULL DEFAULT 'ACTIF',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. TABLE PERIODES (Trimestres 2026-2027)
CREATE TABLE IF NOT EXISTS public.periodes (
  id TEXT PRIMARY KEY,
  annee_scolaire TEXT NOT NULL DEFAULT '2026–2027',
  code TEXT NOT NULL,
  nom TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  date_debut DATE NOT NULL,
  date_fin DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. TABLE AFFECTATIONS PÉDAGOGIQUES (Clé de voûte de la sécurité)
CREATE TABLE IF NOT EXISTS public.affectations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  classe_id TEXT NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  matiere_id TEXT NOT NULL REFERENCES public.matieres(id) ON DELETE CASCADE,
  heures_hebdo INT NOT NULL DEFAULT 4 CHECK (heures_hebdo > 0),
  statut statut_compte NOT NULL DEFAULT 'ACTIF',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_affectation_active UNIQUE (profile_id, classe_id, matiere_id)
);

-- 9. TABLE NOTES
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  eleve_id UUID NOT NULL REFERENCES public.eleves(id) ON DELETE CASCADE,
  affectation_id UUID NOT NULL REFERENCES public.affectations(id) ON DELETE CASCADE,
  periode_id TEXT NOT NULL REFERENCES public.periodes(id) ON DELETE RESTRICT,
  valeur NUMERIC(4, 2) NOT NULL CHECK (valeur >= 0 AND valeur <= 20),
  type_evaluation type_eval NOT NULL DEFAULT 'DEVOIR_1',
  saisi_par UUID NOT NULL REFERENCES public.profiles(id),
  observation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_note_eleve_eval UNIQUE (eleve_id, affectation_id, periode_id, type_evaluation)
);

-- 10. TABLE PARAMETRES ECOLE
CREATE TABLE IF NOT EXISTS public.parametres_ecole (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  nom_etablissement TEXT NOT NULL DEFAULT 'CEG GOGBO',
  ministere TEXT NOT NULL,
  titre_plateforme TEXT NOT NULL,
  presentation TEXT NOT NULL,
  commune TEXT NOT NULL DEFAULT 'ADJOHOUN',
  arrondissement TEXT NOT NULL DEFAULT 'GANGBAN',
  annee_academique TEXT NOT NULL DEFAULT '2026–2027',
  directeur_nom TEXT,
  censeur_nom TEXT,
  devise TEXT DEFAULT 'Discipline — Travail — Succès',
  contact_email TEXT,
  contact_tel TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 11. TABLE AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  user_nom TEXT NOT NULL,
  user_role TEXT NOT NULL,
  action TEXT NOT NULL,
  table_cible TEXT NOT NULL,
  record_id TEXT,
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ====================================================================
-- RLS (ROW LEVEL SECURITY) POLICIES - SÉCURITÉ DE NIVEAU ENTREPRISE
-- ====================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matieres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eleves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.periodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affectations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parametres_ecole ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function: Récupérer le rôle de l'utilisateur connecté
CREATE OR REPLACE FUNCTION public.get_current_role()
RETURNS role_admin AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- PROFILES Policies
CREATE POLICY "Lecture profiles par utilisateurs connectés"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Censeur peut administrer les profils"
  ON public.profiles FOR ALL
  TO authenticated
  USING (public.get_current_role() = 'CENSEUR');

-- CLASSES & MATIERES & PERIODES: Lecture pour tous, modification Censeur
CREATE POLICY "Lecture classes" ON public.classes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Gestion classes Censeur" ON public.classes FOR ALL TO authenticated USING (public.get_current_role() = 'CENSEUR');

CREATE POLICY "Lecture matieres" ON public.matieres FOR SELECT TO authenticated USING (true);
CREATE POLICY "Gestion matieres Censeur" ON public.matieres FOR ALL TO authenticated USING (public.get_current_role() = 'CENSEUR');

CREATE POLICY "Lecture periodes" ON public.periodes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Gestion periodes Censeur" ON public.periodes FOR ALL TO authenticated USING (public.get_current_role() = 'CENSEUR');

-- ELEVES: Lecture pour tous les personnels connectés, écriture réservée au Censeur
CREATE POLICY "Lecture eleves" ON public.eleves FOR SELECT TO authenticated USING (true);
CREATE POLICY "Gestion eleves Censeur" ON public.eleves FOR ALL TO authenticated USING (public.get_current_role() = 'CENSEUR');

-- AFFECTATIONS: Lecture pour tous, gestion par le Censeur
CREATE POLICY "Lecture affectations" ON public.affectations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Gestion affectations Censeur" ON public.affectations FOR ALL TO authenticated USING (public.get_current_role() = 'CENSEUR');

-- ====================================================================
-- RLS DES NOTES : PRINCIPE STRICT AFFECTATION PÉDAGOGIQUE (Section 3 & 16)
-- ====================================================================

-- 1. Lecture des notes :
--    - Le Censeur et le DG peuvent consulter toutes les notes
--    - Tout enseignant (même Censeur/DG en mode enseignant) peut consulter les notes liées à ses affectations
CREATE POLICY "Lecture notes sécurisée"
  ON public.notes FOR SELECT
  TO authenticated
  USING (
    public.get_current_role() IN ('CENSEUR', 'DIRECTEUR_GENERAL', 'SURVEILLANT_GENERAL')
    OR
    EXISTS (
      SELECT 1 FROM public.affectations a
      WHERE a.id = notes.affectation_id
        AND a.profile_id = auth.uid()
        AND a.statut = 'ACTIF'
    )
  );

-- 2. Saisie et modification des notes :
--    - UNIQUEMENT par l'utilisateur titulaire de l'affectation active !
--    - La période ne doit PAS être verrouillée !
CREATE POLICY "Insertion notes réservée au titulaire d affectation"
  ON public.notes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.affectations a
      JOIN public.periodes p ON p.id = notes.periode_id
      WHERE a.id = notes.affectation_id
        AND a.profile_id = auth.uid()
        AND a.statut = 'ACTIF'
        AND p.is_locked = false
    )
  );

CREATE POLICY "Modification notes réservée au titulaire d affectation"
  ON public.notes FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.affectations a
      JOIN public.periodes p ON p.id = notes.periode_id
      WHERE a.id = notes.affectation_id
        AND a.profile_id = auth.uid()
        AND a.statut = 'ACTIF'
        AND p.is_locked = false
    )
  );

-- PARAMETRES & AUDIT LOGS
CREATE POLICY "Lecture parametres" ON public.parametres_ecole FOR SELECT TO authenticated USING (true);
CREATE POLICY "Modification parametres Censeur" ON public.parametres_ecole FOR ALL TO authenticated USING (public.get_current_role() = 'CENSEUR');

CREATE POLICY "Lecture audit logs pour Censeur et DG"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (public.get_current_role() IN ('CENSEUR', 'DIRECTEUR_GENERAL'));

CREATE POLICY "Insertion audit logs"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);
