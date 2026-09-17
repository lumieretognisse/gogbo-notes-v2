export type RoleAdmin = 
  | 'DIRECTEUR_GENERAL'
  | 'CENSEUR'
  | 'SURVEILLANT_GENERAL'
  | 'COMPTABLE'
  | 'ENSEIGNANT';

export type Sexe = 'M' | 'F';

export type StatutCompte = 'ACTIF' | 'INACTIF';

export type CodePeriode = 'T1' | 'T2' | 'T3' | 'S1' | 'S2';

export type LangueOption = 'AUCUNE' | 'ALLEMAND' | 'ESPAGNOL';

export interface UserProfile {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: RoleAdmin;
  is_enseignant: boolean; // Directeur, Censeur, SG ou Comptable peuvent aussi enseigner
  telephone?: string;
  statut: StatutCompte;
  created_at: string;
  updated_at: string;
}

export interface EnseignantProfile {
  id: string;
  profile_id: string;
  matricule_prof: string;
  specialite: string;
  diplome?: string;
  created_at: string;
}

export interface Classe {
  id: string;
  nom: string; // e.g. "6ème A", "3ème B", "Terminale D"
  niveau: '6ème' | '5ème' | '4ème' | '3ème' | 'Seconde' | 'Première' | 'Terminale';
  serie?: 'A' | 'AB' | 'C' | 'D' | 'Scientifique' | 'Littéraire' | 'Générale';
  effectif_max: number; // Always 100 max
  salle?: string;
}

export interface Matiere {
  id: string;
  code: string;
  nom: string;
  coefficient: number;
  statut: StatutCompte;
  is_langue_option: boolean; // Allemand / Espagnol
  categorie: 'LITTERAIRE' | 'SCIENTIFIQUE' | 'GENERALE' | 'CONDUITE';
}

export interface Eleve {
  id: string;
  matricule: string; // Unique
  nom: string;
  prenom: string;
  sexe: Sexe;
  date_naissance: string; // YYYY-MM-DD
  lieu_naissance?: string;
  classe_id: string;
  langue_vivante_2: LangueOption;
  nom_parent?: string;
  contact_parent?: string;
  statut: StatutCompte;
  created_at: string;
  updated_at: string;
}

export interface AnneeScolaire {
  id: string;
  libelle: string; // Ex: "2026–2027", "2027–2028", "2028–2029"
  date_debut: string;
  date_fin: string;
  is_active: boolean;
  statut: 'CLOTUREE' | 'EN_COURS' | 'A_VENIR';
  created_at: string;
}

export interface Periode {
  id: string;
  annee_scolaire: string; // "2026–2027"
  code: CodePeriode;
  nom: string; // "1er trimestre", "2ème trimestre", "3ème trimestre"
  is_active: boolean;
  is_locked: boolean; // Verrouillage par le Censeur
  date_debut: string;
  date_fin: string;
}

export type PeriodeScolaire = Periode;

export interface AffectationPedagogique {
  id: string;
  profile_id: string; // L'utilisateur enseignant (ou Censeur/DG qui enseigne)
  classe_id: string;
  matiere_id: string;
  heures_hebdo: number;
  statut: StatutCompte;
  created_at: string;
  updated_at: string;
}

// Alias officiel conformément aux directives V2 : « Attribution de classe »
export type AttributionClasse = AffectationPedagogique;

export type TypeEvaluation = 
  | 'INTERROGATION_1' 
  | 'INTERROGATION_2' 
  | 'INTERROGATION_3' 
  | 'DEVOIR_1' 
  | 'DEVOIR_2' 
  | 'INTERROGATION';

export interface Note {
  id: string;
  eleve_id: string;
  affectation_id: string;
  periode_id: string;
  valeur: number; // 0 à 20
  type_evaluation: TypeEvaluation;
  saisi_par: string; // User ID
  observation?: string;
  created_at: string;
  updated_at: string;
}

export interface NoteSyntheseMatiere {
  matiere_id: string;
  matiere_nom: string;
  matiere_code: string;
  coefficient: number;
  notes: Note[];
  interro_1: number | null;
  interro_2: number | null;
  interro_3: number | null;
  moyenne_interros: number | null;
  devoir_1: number | null;
  devoir_2: number | null;
  moyenne: number | null;
  points: number | null;
  appreciation: string;
}

export interface BulletinEleve {
  eleve: Eleve;
  classe: Classe;
  periode: Periode;
  matieres_notes: NoteSyntheseMatiere[];
  total_points: number;
  total_coefficients: number;
  moyenne_generale: number | null;
  appreciation_generale: string;
  rang?: number;
  rang_label?: string; // "1er", "2ème", etc.
  effectif_classe: number;
  observation_directeur?: string;
}

export interface ResultatClassementEleve {
  rang: number;
  rang_label: string;
  eleve_id: string;
  matricule: string;
  nom: string;
  prenom: string;
  sexe: Sexe;
  classe_id: string;
  classe_nom: string;
  total_points: number;
  total_coefficients: number;
  moyenne_generale: number | null;
  appreciation: string;
  ex_aequo: boolean;
}

export interface BulletinAnnuelEleve {
  eleve: Eleve;
  classe: Classe;
  annee_scolaire: string;
  mg_semestre_1: number | null;
  mg_semestre_2: number | null;
  moyenne_annuelle: number | null;
  rang_annuel?: number;
  rang_annuel_label?: string;
  appreciation_annuelle: string;
  statut_annuel?: string;
  effectif_classe: number;
  observation_directeur?: string;
}

export interface ResultatClassementAnnuel {
  rang: number;
  rang_label: string;
  eleve_id: string;
  matricule: string;
  nom: string;
  prenom: string;
  sexe: Sexe;
  classe_id: string;
  classe_nom: string;
  mg_semestre_1: number | null;
  mg_semestre_2: number | null;
  moyenne_annuelle: number | null;
  appreciation_annuelle: string;
  ex_aequo: boolean;
}

export interface ParametresEcole {
  nom_etablissement: string;
  ministere: string;
  titre_plateforme: string;
  presentation: string;
  commune: string;
  arrondissement: string;
  annee_academique: string;
  directeur_nom: string;
  censeur_nom: string;
  devise: string;
  contact_email: string;
  contact_tel: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  user_nom: string;
  user_role: RoleAdmin;
  action: string;
  table_cible: string;
  record_id?: string;
  details?: string;
  created_at: string;
}
