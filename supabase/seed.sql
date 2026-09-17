-- ====================================================================
-- GOGBO NOTES V2 - DONNÉES INITIALES (SEED SQL)
-- CEG GOGBO (2026–2027)
-- ====================================================================

-- 1. PARAMÈTRES ÉTABLISSEMENT
INSERT INTO public.parametres_ecole (id, nom_etablissement, ministere, titre_plateforme, presentation, commune, arrondissement, annee_academique, directeur_nom, censeur_nom, devise, contact_email, contact_tel)
VALUES (
  1,
  'CEG GOGBO',
  'MINISTÈRE DES ENSEIGNEMENTS SECONDAIRE, TECHNIQUE ET DE LA FORMATION PROFESSIONNELLE',
  'GOGBO NOTES — Système Numérique Officiel de Gestion Scolaire',
  'Plateforme académique sécurisée réservée aux personnels autorisés du CEG de GOGBO.',
  'ADJOHOUN',
  'GANGBAN',
  '2026–2027',
  'M. KOUDERIN Mathias',
  'M. DOSSOU-YOVO Clément',
  'Discipline — Travail — Succès',
  'direction@ceggogbo.bj',
  '+229 97 00 00 00'
)
ON CONFLICT (id) DO NOTHING;

-- 2. CLASSES OFFICIELLES (28 classes)
INSERT INTO public.classes (id, nom, niveau, serie, effectif_max) VALUES
  ('cls-6a', '6ème A', '6ème', 'Générale', 100),
  ('cls-6b', '6ème B', '6ème', 'Générale', 100),
  ('cls-6c', '6ème C', '6ème', 'Générale', 100),
  ('cls-6d', '6ème D', '6ème', 'Générale', 100),
  ('cls-5a', '5ème A', '5ème', 'Générale', 100),
  ('cls-5b', '5ème B', '5ème', 'Générale', 100),
  ('cls-5c', '5ème C', '5ème', 'Générale', 100),
  ('cls-5d', '5ème D', '5ème', 'Générale', 100),
  ('cls-4a', '4ème A', '4ème', 'Générale', 100),
  ('cls-4b', '4ème B', '4ème', 'Générale', 100),
  ('cls-4c', '4ème C', '4ème', 'Générale', 100),
  ('cls-4d', '4ème D', '4ème', 'Générale', 100),
  ('cls-3a', '3ème A', '3ème', 'Générale', 100),
  ('cls-3b', '3ème B', '3ème', 'Générale', 100),
  ('cls-3c', '3ème C', '3ème', 'Générale', 100),
  ('cls-3d', '3ème D', '3ème', 'Générale', 100),
  ('cls-2a', 'Seconde A', 'Seconde', 'A', 100),
  ('cls-2ab', 'Seconde AB', 'Seconde', 'AB', 100),
  ('cls-2c', 'Seconde C', 'Seconde', 'C', 100),
  ('cls-2d', 'Seconde D', 'Seconde', 'D', 100),
  ('cls-1a', 'Première A', 'Première', 'A', 100),
  ('cls-1ab', 'Première AB', 'Première', 'AB', 100),
  ('cls-1c', 'Première C', 'Première', 'C', 100),
  ('cls-1d', 'Première D', 'Première', 'D', 100),
  ('cls-ta', 'Terminale A', 'Terminale', 'A', 100),
  ('cls-tab', 'Terminale AB', 'Terminale', 'AB', 100),
  ('cls-tc', 'Terminale C', 'Terminale', 'C', 100),
  ('cls-td', 'Terminale D', 'Terminale', 'D', 100)
ON CONFLICT (id) DO NOTHING;

-- 3. MATIÈRES OFFICIELLES (minimum 11 matières)
INSERT INTO public.matieres (id, code, nom, coefficient, statut, is_langue_option, categorie) VALUES
  ('mat-comm', 'COMM_ECR', 'Communication écrite', 2, 'ACTIF', false, 'LITTERAIRE'),
  ('mat-lect', 'LECTURE', 'Lecture', 2, 'ACTIF', false, 'LITTERAIRE'),
  ('mat-math', 'MATHS', 'Mathématiques', 3, 'ACTIF', false, 'SCIENTIFIQUE'),
  ('mat-svt', 'SVT', 'SVT (Sciences de la Vie et de la Terre)', 2, 'ACTIF', false, 'SCIENTIFIQUE'),
  ('mat-pct', 'PCT', 'PCT (Physique, Chimie & Technologie)', 2, 'ACTIF', false, 'SCIENTIFIQUE'),
  ('mat-hist', 'HIST_GEO', 'Histoire-Géographie', 2, 'ACTIF', false, 'LITTERAIRE'),
  ('mat-ang', 'ANGLAIS', 'Anglais', 2, 'ACTIF', false, 'LITTERAIRE'),
  ('mat-all', 'ALLEMAND', 'Allemand (Option LV2)', 2, 'ACTIF', true, 'LITTERAIRE'),
  ('mat-esp', 'ESPAGNOL', 'Espagnol (Option LV2)', 2, 'ACTIF', true, 'LITTERAIRE'),
  ('mat-eps', 'ESP', 'ESP (Éducation Sportive & Pédagogique)', 1, 'ACTIF', false, 'GENERALE'),
  ('mat-cond', 'CONDUITE', 'Conduite', 1, 'ACTIF', false, 'CONDUITE')
ON CONFLICT (id) DO NOTHING;

-- 4. PÉRIODES SCOLAIRES 2026-2027
INSERT INTO public.periodes (id, annee_scolaire, code, nom, is_active, is_locked, date_debut, date_fin) VALUES
  ('per-t1', '2026–2027', 'T1', '1er trimestre', true, false, '2026-09-15', '2026-12-20'),
  ('per-t2', '2026–2027', 'T2', '2ème trimestre', false, true, '2027-01-05', '2027-03-27'),
  ('per-t3', '2026–2027', 'T3', '3ème trimestre', false, true, '2027-04-12', '2027-06-30')
ON CONFLICT (id) DO NOTHING;
