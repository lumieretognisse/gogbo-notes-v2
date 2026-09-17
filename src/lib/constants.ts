import { Classe, Matiere, ParametresEcole, Periode, AnneeScolaire } from '../types';

export const OFFICIAL_IDENTITY: ParametresEcole = {
  ministere: "MINISTÈRE DES ENSEIGNEMENTS SECONDAIRE, TECHNIQUE ET DE LA FORMATION PROFESSIONNELLE",
  nom_etablissement: "CEG GOGBO",
  titre_plateforme: "GOGBO NOTES — Système Numérique Officiel de Gestion Scolaire",
  presentation: "Plateforme académique sécurisée réservée aux personnels autorisés du CEG de GOGBO.",
  commune: "ADJOHOUN",
  arrondissement: "GANGBAN",
  annee_academique: "2026–2027",
  directeur_nom: "M. KOUDERIN Mathias",
  censeur_nom: "M. DOSSOU-YOVO Clément",
  devise: "Discipline — Travail — Succès",
  contact_email: "direction@ceggogbo.bj",
  contact_tel: "+229 97 00 00 00",
};

export const OFFICIAL_CLASSES: Classe[] = [
  // 6ème
  { id: 'cls-6a', nom: '6ème A', niveau: '6ème', serie: 'Générale', effectif_max: 100 },
  { id: 'cls-6b', nom: '6ème B', niveau: '6ème', serie: 'Générale', effectif_max: 100 },
  { id: 'cls-6c', nom: '6ème C', niveau: '6ème', serie: 'Générale', effectif_max: 100 },
  { id: 'cls-6d', nom: '6ème D', niveau: '6ème', serie: 'Générale', effectif_max: 100 },

  // 5ème
  { id: 'cls-5a', nom: '5ème A', niveau: '5ème', serie: 'Générale', effectif_max: 100 },
  { id: 'cls-5b', nom: '5ème B', niveau: '5ème', serie: 'Générale', effectif_max: 100 },
  { id: 'cls-5c', nom: '5ème C', niveau: '5ème', serie: 'Générale', effectif_max: 100 },
  { id: 'cls-5d', nom: '5ème D', niveau: '5ème', serie: 'Générale', effectif_max: 100 },

  // 4ème
  { id: 'cls-4a', nom: '4ème A', niveau: '4ème', serie: 'Générale', effectif_max: 100 },
  { id: 'cls-4b', nom: '4ème B', niveau: '4ème', serie: 'Générale', effectif_max: 100 },
  { id: 'cls-4c', nom: '4ème C', niveau: '4ème', serie: 'Générale', effectif_max: 100 },
  { id: 'cls-4d', nom: '4ème D', niveau: '4ème', serie: 'Générale', effectif_max: 100 },

  // 3ème
  { id: 'cls-3a', nom: '3ème A', niveau: '3ème', serie: 'Générale', effectif_max: 100 },
  { id: 'cls-3b', nom: '3ème B', niveau: '3ème', serie: 'Générale', effectif_max: 100 },
  { id: 'cls-3c', nom: '3ème C', niveau: '3ème', serie: 'Générale', effectif_max: 100 },
  { id: 'cls-3d', nom: '3ème D', niveau: '3ème', serie: 'Générale', effectif_max: 100 },

  // Seconde
  { id: 'cls-2a', nom: 'Seconde A', niveau: 'Seconde', serie: 'A', effectif_max: 100 },
  { id: 'cls-2ab', nom: 'Seconde AB', niveau: 'Seconde', serie: 'AB', effectif_max: 100 },
  { id: 'cls-2c', nom: 'Seconde C', niveau: 'Seconde', serie: 'C', effectif_max: 100 },
  { id: 'cls-2d', nom: 'Seconde D', niveau: 'Seconde', serie: 'D', effectif_max: 100 },

  // Première
  { id: 'cls-1a', nom: 'Première A', niveau: 'Première', serie: 'A', effectif_max: 100 },
  { id: 'cls-1ab', nom: 'Première AB', niveau: 'Première', serie: 'AB', effectif_max: 100 },
  { id: 'cls-1c', nom: 'Première C', niveau: 'Première', serie: 'C', effectif_max: 100 },
  { id: 'cls-1d', nom: 'Première D', niveau: 'Première', serie: 'D', effectif_max: 100 },

  // Terminale
  { id: 'cls-ta', nom: 'Terminale A', niveau: 'Terminale', serie: 'A', effectif_max: 100 },
  { id: 'cls-tab', nom: 'Terminale AB', niveau: 'Terminale', serie: 'AB', effectif_max: 100 },
  { id: 'cls-tc', nom: 'Terminale C', niveau: 'Terminale', serie: 'C', effectif_max: 100 },
  { id: 'cls-td', nom: 'Terminale D', niveau: 'Terminale', serie: 'D', effectif_max: 100 },
];

export const OFFICIAL_MATIERES: Matiere[] = [
  { id: 'mat-comm', code: 'COMM_ECR', nom: 'Communication écrite', coefficient: 2, statut: 'ACTIF', is_langue_option: false, categorie: 'LITTERAIRE' },
  { id: 'mat-lect', code: 'LECTURE', nom: 'Lecture', coefficient: 2, statut: 'ACTIF', is_langue_option: false, categorie: 'LITTERAIRE' },
  { id: 'mat-math', code: 'MATHS', nom: 'Mathématiques', coefficient: 3, statut: 'ACTIF', is_langue_option: false, categorie: 'SCIENTIFIQUE' },
  { id: 'mat-svt', code: 'SVT', nom: 'SVT (Sciences de la Vie et de la Terre)', coefficient: 2, statut: 'ACTIF', is_langue_option: false, categorie: 'SCIENTIFIQUE' },
  { id: 'mat-pct', code: 'PCT', nom: 'PCT (Physique, Chimie & Technologie)', coefficient: 2, statut: 'ACTIF', is_langue_option: false, categorie: 'SCIENTIFIQUE' },
  { id: 'mat-hist', code: 'HIST_GEO', nom: 'Histoire-Géographie', coefficient: 2, statut: 'ACTIF', is_langue_option: false, categorie: 'LITTERAIRE' },
  { id: 'mat-ang', code: 'ANGLAIS', nom: 'Anglais', coefficient: 2, statut: 'ACTIF', is_langue_option: false, categorie: 'LITTERAIRE' },
  { id: 'mat-all', code: 'ALLEMAND', nom: 'Allemand (Option LV2)', coefficient: 2, statut: 'ACTIF', is_langue_option: true, categorie: 'LITTERAIRE' },
  { id: 'mat-esp', code: 'ESPAGNOL', nom: 'Espagnol (Option LV2)', coefficient: 2, statut: 'ACTIF', is_langue_option: true, categorie: 'LITTERAIRE' },
  { id: 'mat-eps', code: 'ESP', nom: 'ESP (Éducation Sportive & Pédagogique)', coefficient: 1, statut: 'ACTIF', is_langue_option: false, categorie: 'GENERALE' },
  { id: 'mat-cond', code: 'CONDUITE', nom: 'Conduite', coefficient: 1, statut: 'ACTIF', is_langue_option: false, categorie: 'CONDUITE' },
];

export const OFFICIAL_PERIODES: Periode[] = [
  {
    id: 'per-s1',
    annee_scolaire: '2026–2027',
    code: 'S1',
    nom: '1er semestre',
    is_active: true,
    is_locked: false,
    date_debut: '2026-09-15',
    date_fin: '2027-01-31',
  },
  {
    id: 'per-s2',
    annee_scolaire: '2026–2027',
    code: 'S2',
    nom: '2ème semestre',
    is_active: false,
    is_locked: false,
    date_debut: '2027-02-01',
    date_fin: '2027-06-30',
  },
  {
    id: 'per-t1',
    annee_scolaire: '2026–2027',
    code: 'T1',
    nom: '1er trimestre',
    is_active: false,
    is_locked: false,
    date_debut: '2026-09-15',
    date_fin: '2026-12-20',
  },
  {
    id: 'per-t2',
    annee_scolaire: '2026–2027',
    code: 'T2',
    nom: '2ème trimestre',
    is_active: false,
    is_locked: true,
    date_debut: '2027-01-05',
    date_fin: '2027-03-27',
  },
  {
    id: 'per-t3',
    annee_scolaire: '2026–2027',
    code: 'T3',
    nom: '3ème trimestre',
    is_active: false,
    is_locked: true,
    date_debut: '2027-04-12',
    date_fin: '2027-06-30',
  },
];

export const OFFICIAL_ANNEES_SCOLAIRES: AnneeScolaire[] = [
  {
    id: 'annee-2025-2026',
    libelle: '2025–2026',
    date_debut: '2025-09-15',
    date_fin: '2026-06-30',
    is_active: false,
    statut: 'CLOTUREE',
    created_at: '2025-08-01T08:00:00Z',
  },
  {
    id: 'annee-2026-2027',
    libelle: '2026–2027',
    date_debut: '2026-09-15',
    date_fin: '2027-06-30',
    is_active: true,
    statut: 'EN_COURS',
    created_at: '2026-08-01T08:00:00Z',
  },
  {
    id: 'annee-2027-2028',
    libelle: '2027–2028',
    date_debut: '2027-09-15',
    date_fin: '2028-06-30',
    is_active: false,
    statut: 'A_VENIR',
    created_at: '2026-09-01T08:00:00Z',
  },
];

