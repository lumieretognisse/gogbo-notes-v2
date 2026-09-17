import { 
  UserProfile, 
  Classe, 
  Matiere, 
  Eleve, 
  Periode, 
  AffectationPedagogique, 
  Note, 
  AuditLog, 
  ParametresEcole,
  AnneeScolaire 
} from '../types';
import { OFFICIAL_IDENTITY, OFFICIAL_CLASSES, OFFICIAL_MATIERES, OFFICIAL_PERIODES, OFFICIAL_ANNEES_SCOLAIRES } from './constants';
import { getSupabaseClient, isSupabaseConfigured } from './supabase';

const STORAGE_KEYS = {
  PROFILES: 'gogbo_v2_profiles',
  CLASSES: 'gogbo_v2_classes',
  MATIERES: 'gogbo_v2_matieres',
  ELEVES: 'gogbo_v2_eleves',
  PERIODES: 'gogbo_v2_periodes',
  ANNEES_SCOLAIRES: 'gogbo_v2_annees_scolaires',
  CREDENTIALS: 'gogbo_v2_credentials',
  AFFECTATIONS: 'gogbo_v2_affectations',
  NOTES: 'gogbo_v2_notes',
  AUDIT_LOGS: 'gogbo_v2_audit_logs',
  PARAMETRES: 'gogbo_v2_parametres',
  VERSION: 'gogbo_v2_version',
};

// Seed Profiles: Démontrant les rôles administratifs et la double casquette pédagogique
const SEED_PROFILES: UserProfile[] = [
  {
    id: 'usr-censeur',
    email: 'censeur@ceggogbo.bj',
    nom: 'DOSSOU-YOVO',
    prenom: 'Clément',
    role: 'CENSEUR',
    is_enseignant: true, // Censeur et enseignant de SVT !
    telephone: '+229 97 12 34 56',
    statut: 'ACTIF',
    created_at: '2026-09-01T08:00:00Z',
    updated_at: '2026-09-01T08:00:00Z',
  },
  {
    id: 'usr-dg',
    email: 'dg@ceggogbo.bj',
    nom: 'KOUDERIN',
    prenom: 'Mathias',
    role: 'DIRECTEUR_GENERAL',
    is_enseignant: true, // Directeur Général et enseignant de Mathématiques !
    telephone: '+229 97 88 99 00',
    statut: 'ACTIF',
    created_at: '2026-09-01T08:00:00Z',
    updated_at: '2026-09-01T08:00:00Z',
  },
  {
    id: 'usr-sg',
    email: 'sg@ceggogbo.bj',
    nom: 'HOUNSOU',
    prenom: 'Patrice',
    role: 'SURVEILLANT_GENERAL',
    is_enseignant: false,
    telephone: '+229 95 11 22 33',
    statut: 'ACTIF',
    created_at: '2026-09-01T08:00:00Z',
    updated_at: '2026-09-01T08:00:00Z',
  },
  {
    id: 'usr-comptable',
    email: 'comptable@ceggogbo.bj',
    nom: 'AGBOSSA',
    prenom: 'Jeanne',
    role: 'COMPTABLE',
    is_enseignant: false,
    telephone: '+229 96 44 55 66',
    statut: 'ACTIF',
    created_at: '2026-09-01T08:00:00Z',
    updated_at: '2026-09-01T08:00:00Z',
  },
  {
    id: 'usr-prof-math',
    email: 'prof.maths@ceggogbo.bj',
    nom: 'SOSSOU',
    prenom: 'Marc',
    role: 'ENSEIGNANT',
    is_enseignant: true,
    telephone: '+229 97 45 67 89',
    statut: 'ACTIF',
    created_at: '2026-09-01T08:00:00Z',
    updated_at: '2026-09-01T08:00:00Z',
  },
  {
    id: 'usr-prof-francais',
    email: 'prof.francais@ceggogbo.bj',
    nom: 'ADANVO',
    prenom: 'Paul',
    role: 'ENSEIGNANT',
    is_enseignant: true,
    telephone: '+229 96 33 22 11',
    statut: 'ACTIF',
    created_at: '2026-09-01T08:00:00Z',
    updated_at: '2026-09-01T08:00:00Z',
  },
  {
    id: 'usr-prof-pct',
    email: 'prof.pct@ceggogbo.bj',
    nom: 'BIO',
    prenom: 'Orou',
    role: 'ENSEIGNANT',
    is_enseignant: true,
    telephone: '+229 94 77 88 99',
    statut: 'ACTIF',
    created_at: '2026-09-01T08:00:00Z',
    updated_at: '2026-09-01T08:00:00Z',
  },
];

// Seed Affectations: Démontrant les affectations du Censeur, du DG et des enseignants titulaires
const SEED_AFFECTATIONS: AffectationPedagogique[] = [
  // Censeur (Clément DOSSOU-YOVO) enseigne les SVT en 4ème A et 3ème B (Section 3 Exemple strict)
  {
    id: 'aff-censeur-svt-4a',
    profile_id: 'usr-censeur',
    classe_id: 'cls-4a', // 4ème A
    matiere_id: 'mat-svt', // SVT
    heures_hebdo: 4,
    statut: 'ACTIF',
    created_at: '2026-09-05T09:00:00Z',
    updated_at: '2026-09-05T09:00:00Z',
  },
  {
    id: 'aff-censeur-svt-3b',
    profile_id: 'usr-censeur',
    classe_id: 'cls-3b', // 3ème B
    matiere_id: 'mat-svt', // SVT
    heures_hebdo: 4,
    statut: 'ACTIF',
    created_at: '2026-09-05T09:00:00Z',
    updated_at: '2026-09-05T09:00:00Z',
  },

  // Directeur Général (Mathias KOUDERIN) enseigne les Mathématiques en Terminale D
  {
    id: 'aff-dg-math-td',
    profile_id: 'usr-dg',
    classe_id: 'cls-td', // Terminale D
    matiere_id: 'mat-math', // Mathématiques
    heures_hebdo: 3,
    statut: 'ACTIF',
    created_at: '2026-09-05T09:00:00Z',
    updated_at: '2026-09-05T09:00:00Z',
  },

  // M. SOSSOU Marc (Mathématiques) en 6ème A et 4ème A
  {
    id: 'aff-sossou-math-6a',
    profile_id: 'usr-prof-math',
    classe_id: 'cls-6a', // 6ème A
    matiere_id: 'mat-math',
    heures_hebdo: 4,
    statut: 'ACTIF',
    created_at: '2026-09-05T09:00:00Z',
    updated_at: '2026-09-05T09:00:00Z',
  },
  {
    id: 'aff-sossou-math-4a',
    profile_id: 'usr-prof-math',
    classe_id: 'cls-4a', // 4ème A
    matiere_id: 'mat-math',
    heures_hebdo: 4,
    statut: 'ACTIF',
    created_at: '2026-09-05T09:00:00Z',
    updated_at: '2026-09-05T09:00:00Z',
  },

  // M. ADANVO Paul (Français : Communication écrite & Lecture) en 4ème A
  {
    id: 'aff-adanvo-comm-4a',
    profile_id: 'usr-prof-francais',
    classe_id: 'cls-4a', // 4ème A
    matiere_id: 'mat-comm', // Communication écrite
    heures_hebdo: 3,
    statut: 'ACTIF',
    created_at: '2026-09-05T09:00:00Z',
    updated_at: '2026-09-05T09:00:00Z',
  },
  {
    id: 'aff-adanvo-lect-4a',
    profile_id: 'usr-prof-francais',
    classe_id: 'cls-4a', // 4ème A
    matiere_id: 'mat-lect', // Lecture
    heures_hebdo: 2,
    statut: 'ACTIF',
    created_at: '2026-09-05T09:00:00Z',
    updated_at: '2026-09-05T09:00:00Z',
  },
];

// Seed Éleves : Pour 4ème A, 6ème A, 3ème B et Terminale D
const SEED_ELEVES: Eleve[] = [
  // 4ème A
  {
    id: 'elv-4a-01',
    matricule: 'GOGBO-2026-0041',
    nom: 'AGOSSOU',
    prenom: 'Darius Mahugnon',
    sexe: 'M',
    date_naissance: '2012-04-14',
    classe_id: 'cls-4a',
    langue_vivante_2: 'ESPAGNOL',
    nom_parent: 'AGOSSOU Félicien',
    contact_parent: '+229 97 10 20 30',
    statut: 'ACTIF',
    created_at: '2026-09-08T10:00:00Z',
    updated_at: '2026-09-08T10:00:00Z',
  },
  {
    id: 'elv-4a-02',
    matricule: 'GOGBO-2026-0042',
    nom: 'HOUNGBEDJI',
    prenom: 'Sènan Michelle',
    sexe: 'F',
    date_naissance: '2012-07-22',
    classe_id: 'cls-4a',
    langue_vivante_2: 'ESPAGNOL',
    nom_parent: 'HOUNGBEDJI Anselme',
    contact_parent: '+229 96 11 22 33',
    statut: 'ACTIF',
    created_at: '2026-09-08T10:00:00Z',
    updated_at: '2026-09-08T10:00:00Z',
  },
  {
    id: 'elv-4a-03',
    matricule: 'GOGBO-2026-0043',
    nom: 'TOSSOU',
    prenom: 'Gisèle Ablawa',
    sexe: 'F',
    date_naissance: '2011-11-05',
    classe_id: 'cls-4a',
    langue_vivante_2: 'ALLEMAND',
    nom_parent: 'TOSSOU Emmanuel',
    contact_parent: '+229 95 33 44 55',
    statut: 'ACTIF',
    created_at: '2026-09-08T10:00:00Z',
    updated_at: '2026-09-08T10:00:00Z',
  },
  {
    id: 'elv-4a-04',
    matricule: 'GOGBO-2026-0044',
    nom: 'KPADONOU',
    prenom: 'Éric Senou',
    sexe: 'M',
    date_naissance: '2012-01-30',
    classe_id: 'cls-4a',
    langue_vivante_2: 'ALLEMAND',
    nom_parent: 'KPADONOU Julien',
    contact_parent: '+229 97 55 66 77',
    statut: 'ACTIF',
    created_at: '2026-09-08T10:00:00Z',
    updated_at: '2026-09-08T10:00:00Z',
  },
  {
    id: 'elv-4a-05',
    matricule: 'GOGBO-2026-0045',
    nom: 'ZINSOU',
    prenom: 'Bernadette',
    sexe: 'F',
    date_naissance: '2012-09-18',
    classe_id: 'cls-4a',
    langue_vivante_2: 'ESPAGNOL',
    nom_parent: 'ZINSOU Christophe',
    contact_parent: '+229 94 88 99 00',
    statut: 'ACTIF',
    created_at: '2026-09-08T10:00:00Z',
    updated_at: '2026-09-08T10:00:00Z',
  },

  // 3ème B
  {
    id: 'elv-3b-01',
    matricule: 'GOGBO-2026-0031',
    nom: 'DOSSOU',
    prenom: 'Romuald',
    sexe: 'M',
    date_naissance: '2011-03-12',
    classe_id: 'cls-3b',
    langue_vivante_2: 'ESPAGNOL',
    statut: 'ACTIF',
    created_at: '2026-09-08T10:00:00Z',
    updated_at: '2026-09-08T10:00:00Z',
  },
  {
    id: 'elv-3b-02',
    matricule: 'GOGBO-2026-0032',
    nom: 'HOUENOU',
    prenom: 'Clarisse',
    sexe: 'F',
    date_naissance: '2011-06-25',
    classe_id: 'cls-3b',
    langue_vivante_2: 'ALLEMAND',
    statut: 'ACTIF',
    created_at: '2026-09-08T10:00:00Z',
    updated_at: '2026-09-08T10:00:00Z',
  },

  // 6ème A
  {
    id: 'elv-6a-01',
    matricule: 'GOGBO-2026-0061',
    nom: 'BOKO',
    prenom: 'Prudence',
    sexe: 'F',
    date_naissance: '2014-05-10',
    classe_id: 'cls-6a',
    langue_vivante_2: 'AUCUNE',
    statut: 'ACTIF',
    created_at: '2026-09-08T10:00:00Z',
    updated_at: '2026-09-08T10:00:00Z',
  },
  {
    id: 'elv-6a-02',
    matricule: 'GOGBO-2026-0062',
    nom: 'ALAPINI',
    prenom: 'Rodrigue',
    sexe: 'M',
    date_naissance: '2014-02-18',
    classe_id: 'cls-6a',
    langue_vivante_2: 'AUCUNE',
    statut: 'ACTIF',
    created_at: '2026-09-08T10:00:00Z',
    updated_at: '2026-09-08T10:00:00Z',
  },

  // Terminale D
  {
    id: 'elv-td-01',
    matricule: 'GOGBO-2026-0071',
    nom: 'MENSAH',
    prenom: 'Koffi Fabrice',
    sexe: 'M',
    date_naissance: '2008-08-19',
    classe_id: 'cls-td',
    langue_vivante_2: 'ESPAGNOL',
    statut: 'ACTIF',
    created_at: '2026-09-08T10:00:00Z',
    updated_at: '2026-09-08T10:00:00Z',
  },
];

// Seed Notes: Notes de SVT saisies par le Censeur pour ses élèves de 4ème A
const SEED_NOTES: Note[] = [
  // Notes SVT en 4ème A par le Censeur M. DOSSOU-YOVO Clément
  {
    id: 'not-01',
    eleve_id: 'elv-4a-01',
    affectation_id: 'aff-censeur-svt-4a',
    periode_id: 'per-t1',
    valeur: 14.5,
    type_evaluation: 'DEVOIR_1',
    saisi_par: 'usr-censeur',
    observation: 'Bonne maîtrise de la cellule végétale',
    created_at: '2026-10-15T14:30:00Z',
    updated_at: '2026-10-15T14:30:00Z',
  },
  {
    id: 'not-02',
    eleve_id: 'elv-4a-02',
    affectation_id: 'aff-censeur-svt-4a',
    periode_id: 'per-t1',
    valeur: 16.0,
    type_evaluation: 'DEVOIR_1',
    saisi_par: 'usr-censeur',
    observation: 'Très bon travail et dessin soigné',
    created_at: '2026-10-15T14:32:00Z',
    updated_at: '2026-10-15T14:32:00Z',
  },
  {
    id: 'not-03',
    eleve_id: 'elv-4a-03',
    affectation_id: 'aff-censeur-svt-4a',
    periode_id: 'per-t1',
    valeur: 9.5,
    type_evaluation: 'DEVOIR_1',
    saisi_par: 'usr-censeur',
    observation: 'Insuffisant, revoir la méthodologie du compte-rendu',
    created_at: '2026-10-15T14:35:00Z',
    updated_at: '2026-10-15T14:35:00Z',
  },
  {
    id: 'not-04',
    eleve_id: 'elv-4a-04',
    affectation_id: 'aff-censeur-svt-4a',
    periode_id: 'per-t1',
    valeur: 11.5,
    type_evaluation: 'DEVOIR_1',
    saisi_par: 'usr-censeur',
    observation: 'Acceptable',
    created_at: '2026-10-15T14:38:00Z',
    updated_at: '2026-10-15T14:38:00Z',
  },
  {
    id: 'not-05',
    eleve_id: 'elv-4a-05',
    affectation_id: 'aff-censeur-svt-4a',
    periode_id: 'per-t1',
    valeur: 18.5,
    type_evaluation: 'DEVOIR_1',
    saisi_par: 'usr-censeur',
    observation: 'Excellente prestation',
    created_at: '2026-10-15T14:40:00Z',
    updated_at: '2026-10-15T14:40:00Z',
  },

  // Notes de Mathématiques en Terminale D saisies par le Directeur Général
  {
    id: 'not-06',
    eleve_id: 'elv-td-01',
    affectation_id: 'aff-dg-math-td',
    periode_id: 'per-t1',
    valeur: 15.0,
    type_evaluation: 'DEVOIR_1',
    saisi_par: 'usr-dg',
    observation: 'Bonne rigueur analytique',
    created_at: '2026-10-16T11:00:00Z',
    updated_at: '2026-10-16T11:00:00Z',
  },
];

// Seed Audit Logs
const SEED_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-01',
    user_id: 'usr-censeur',
    user_nom: 'DOSSOU-YOVO Clément',
    user_role: 'CENSEUR',
    action: 'INITIALISATION_SYSTEME',
    table_cible: 'parametres_ecole',
    details: 'Initialisation officielle de la plateforme GOGBO NOTES V2 (Année 2026–2027)',
    created_at: '2026-09-01T08:00:00Z',
  },
  {
    id: 'log-02',
    user_id: 'usr-censeur',
    user_nom: 'DOSSOU-YOVO Clément',
    user_role: 'CENSEUR',
    action: 'CREATION_AFFECTATION',
    table_cible: 'affectations',
    record_id: 'aff-censeur-svt-4a',
    details: 'Affectation pédagogique Censeur -> 4ème A (SVT, 4h/semaine)',
    created_at: '2026-09-05T09:00:00Z',
  },
  {
    id: 'log-03',
    user_id: 'usr-censeur',
    user_nom: 'DOSSOU-YOVO Clément',
    user_role: 'CENSEUR',
    action: 'SAISIE_NOTE',
    table_cible: 'notes',
    record_id: 'not-01',
    details: 'Saisie de note SVT Devoir 1 pour élève AGOSSOU Darius (Note: 14.5/20)',
    created_at: '2026-10-15T14:30:00Z',
  },
];

class StorageEngine {
  private getItem<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      if (!data) return defaultValue;
      return JSON.parse(data) as T;
    } catch {
      return defaultValue;
    }
  }

  private setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }

  public init(): void {
    const initialized = localStorage.getItem(STORAGE_KEYS.VERSION);
    if (!initialized) {
      this.setItem(STORAGE_KEYS.PROFILES, SEED_PROFILES);
      this.setItem(STORAGE_KEYS.CLASSES, OFFICIAL_CLASSES);
      this.setItem(STORAGE_KEYS.MATIERES, OFFICIAL_MATIERES);
      this.setItem(STORAGE_KEYS.ELEVES, SEED_ELEVES);
      this.setItem(STORAGE_KEYS.PERIODES, OFFICIAL_PERIODES);
      this.setItem(STORAGE_KEYS.ANNEES_SCOLAIRES, OFFICIAL_ANNEES_SCOLAIRES);
      this.setItem(STORAGE_KEYS.AFFECTATIONS, SEED_AFFECTATIONS);
      this.setItem(STORAGE_KEYS.NOTES, SEED_NOTES);
      this.setItem(STORAGE_KEYS.AUDIT_LOGS, SEED_AUDIT_LOGS);
      this.setItem(STORAGE_KEYS.PARAMETRES, OFFICIAL_IDENTITY);
      
      const defaultCreds: Record<string, string> = {};
      SEED_PROFILES.forEach((p) => {
        defaultCreds[p.id] = 'Passer123!';
      });
      this.setItem(STORAGE_KEYS.CREDENTIALS, defaultCreds);
      this.setItem(STORAGE_KEYS.VERSION, '2.1.0');
    } else {
      // Vérification et mise à niveau non-destructive pour les futures années scolaires
      if (!localStorage.getItem(STORAGE_KEYS.ANNEES_SCOLAIRES)) {
        this.setItem(STORAGE_KEYS.ANNEES_SCOLAIRES, OFFICIAL_ANNEES_SCOLAIRES);
      }
      if (!localStorage.getItem(STORAGE_KEYS.CREDENTIALS)) {
        const defaultCreds: Record<string, string> = {};
        const profiles = this.getProfiles();
        profiles.forEach((p) => {
          defaultCreds[p.id] = 'Passer123!';
        });
        this.setItem(STORAGE_KEYS.CREDENTIALS, defaultCreds);
      }
    }
  }

  // --- PARAMETRES ---
  public getParametres(): ParametresEcole {
    return this.getItem<ParametresEcole>(STORAGE_KEYS.PARAMETRES, OFFICIAL_IDENTITY);
  }

  public updateParametres(params: Partial<ParametresEcole>, user: UserProfile): ParametresEcole {
    const current = this.getParametres();
    const updated = { ...current, ...params };
    this.setItem(STORAGE_KEYS.PARAMETRES, updated);
    this.addAuditLog({
      user_id: user.id,
      user_nom: `${user.nom} ${user.prenom}`,
      user_role: user.role,
      action: 'MODIFICATION_PARAMETRES',
      table_cible: 'parametres_ecole',
      details: 'Mise à jour des informations administratives de l’établissement',
    });
    return updated;
  }

  // --- PROFILES ---
  public getProfiles(): UserProfile[] {
    return this.getItem<UserProfile[]>(STORAGE_KEYS.PROFILES, SEED_PROFILES);
  }

  public getProfileById(id: string): UserProfile | undefined {
    return this.getProfiles().find((p) => p.id === id);
  }

  public createProfile(data: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>, operator: UserProfile): UserProfile {
    // Vérification stricte des permissions (Point 10)
    if (operator.role !== 'CENSEUR' && operator.role !== 'DIRECTEUR_GENERAL') {
      throw new Error("Action non autorisée : Seul le Censeur ou la Direction Générale a le droit de créer un compte personnel.");
    }

    const profiles = this.getProfiles();
    const id = `usr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date().toISOString();
    const newProfile: UserProfile = {
      ...data,
      id,
      created_at: now,
      updated_at: now,
    };
    profiles.push(newProfile);
    this.setItem(STORAGE_KEYS.PROFILES, profiles);

    this.addAuditLog({
      user_id: operator.id,
      user_nom: `${operator.nom} ${operator.prenom}`,
      user_role: operator.role,
      action: 'CREATION_PERSONNEL',
      table_cible: 'profiles',
      record_id: id,
      details: `Création du compte ${data.role}: ${data.nom} ${data.prenom} (${data.email})`,
    });

    // Synchronisation en arrière-plan avec Supabase si connecté
    if (isSupabaseConfigured) {
      const client = getSupabaseClient();
      if (client) {
        void (async () => {
          try {
            const { error } = await client.from('profiles').insert({
              id: newProfile.id,
              email: newProfile.email,
              nom: newProfile.nom,
              prenom: newProfile.prenom,
              role: newProfile.role,
              is_enseignant: newProfile.is_enseignant,
              telephone: newProfile.telephone || null,
              statut: newProfile.statut,
            });
            if (error) console.error('Erreur synchronisation Supabase (profiles insert):', error.message);
          } catch (err) {
            console.error('Exception Supabase profiles insert:', err);
          }
        })();
      }
    }

    return newProfile;
  }

  public updateProfile(id: string, updates: Partial<UserProfile>, operator: UserProfile): UserProfile {
    // Vérification stricte des permissions (Point 10)
    if (operator.role !== 'CENSEUR' && operator.role !== 'DIRECTEUR_GENERAL') {
      throw new Error("Action non autorisée : Seul le Censeur ou la Direction Générale a le droit de modifier les informations administratives des personnels.");
    }

    const profiles = this.getProfiles();
    const index = profiles.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('Profil non trouvé');

    const updated = {
      ...profiles[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    profiles[index] = updated;
    this.setItem(STORAGE_KEYS.PROFILES, profiles);

    this.addAuditLog({
      user_id: operator.id,
      user_nom: `${operator.nom} ${operator.prenom}`,
      user_role: operator.role,
      action: 'MODIFICATION_PERSONNEL',
      table_cible: 'profiles',
      record_id: id,
      details: `Modification du compte: ${updated.nom} ${updated.prenom} (${updated.email})`,
    });

    // Synchronisation avec Supabase si connecté
    if (isSupabaseConfigured) {
      const client = getSupabaseClient();
      if (client) {
        void (async () => {
          try {
            const { error } = await client.from('profiles').update({
              nom: updated.nom,
              prenom: updated.prenom,
              email: updated.email,
              telephone: updated.telephone || null,
              role: updated.role,
              is_enseignant: updated.is_enseignant,
              statut: updated.statut,
              updated_at: updated.updated_at,
            }).eq('id', id);
            if (error) console.error('Erreur synchronisation Supabase (profiles update):', error.message);
          } catch (err) {
            console.error('Exception Supabase profiles update:', err);
          }
        })();
      }
    }

    return updated;
  }

  public async updateProfileAsync(id: string, updates: Partial<UserProfile>, operator: UserProfile): Promise<UserProfile> {
    // Simulation d'un délai réseau réaliste pour feedback utilisateur
    await new Promise((resolve) => setTimeout(resolve, 250));
    return this.updateProfile(id, updates, operator);
  }

  public toggleProfileStatus(id: string, operator: UserProfile): UserProfile {
    const profile = this.getProfileById(id);
    if (!profile) throw new Error('Profil non trouvé');
    const newStatus = profile.statut === 'ACTIF' ? 'INACTIF' : 'ACTIF';
    return this.updateProfile(id, { statut: newStatus }, operator);
  }

  // --- CLASSES ---
  public getClasses(): Classe[] {
    return this.getItem<Classe[]>(STORAGE_KEYS.CLASSES, OFFICIAL_CLASSES);
  }

  public getClasseById(id: string): Classe | undefined {
    return this.getClasses().find((c) => c.id === id);
  }

  // --- MATIERES ---
  public getMatieres(): Matiere[] {
    return this.getItem<Matiere[]>(STORAGE_KEYS.MATIERES, OFFICIAL_MATIERES);
  }

  public getMatiereById(id: string): Matiere | undefined {
    return this.getMatieres().find((m) => m.id === id);
  }

  public updateMatiere(id: string, updates: Partial<Matiere>, operator: UserProfile): Matiere {
    const list = this.getMatieres();
    const idx = list.findIndex((m) => m.id === id);
    if (idx === -1) throw new Error('Matière non trouvée');
    list[idx] = { ...list[idx], ...updates };
    this.setItem(STORAGE_KEYS.MATIERES, list);

    this.addAuditLog({
      user_id: operator.id,
      user_nom: `${operator.nom} ${operator.prenom}`,
      user_role: operator.role,
      action: 'MODIFICATION_MATIERE',
      table_cible: 'matieres',
      record_id: id,
      details: `Modification matière: ${list[idx].nom} (Coef: ${list[idx].coefficient})`,
    });

    if (isSupabaseConfigured) {
      const client = getSupabaseClient();
      if (client) {
        void (async () => {
          try {
            const { error } = await client.from('matieres').update({
              nom: list[idx].nom,
              coefficient: list[idx].coefficient,
              statut: list[idx].statut,
            }).eq('id', id);
            if (error) console.error('Erreur synchronisation Supabase (matieres update):', error.message);
          } catch (err) {
            console.error('Exception Supabase matieres update:', err);
          }
        })();
      }
    }

    return list[idx];
  }

  public getMatiereByCode(code: string): Matiere | undefined {
    return this.getMatieres().find((m) => m.code.toUpperCase() === code.toUpperCase());
  }

  // --- ELEVES ---
  public getEleves(): Eleve[] {
    return this.getItem<Eleve[]>(STORAGE_KEYS.ELEVES, SEED_ELEVES);
  }

  public getEleveById(id: string): Eleve | undefined {
    return this.getEleves().find((e) => e.id === id);
  }

  public getElevesByClasse(classeId: string): Eleve[] {
    return this.getEleves().filter((e) => e.classe_id === classeId && e.statut === 'ACTIF');
  }

  public createEleve(data: Omit<Eleve, 'id' | 'created_at' | 'updated_at'>, operator: UserProfile): Eleve {
    // Vérification stricte des permissions (Point 10)
    if (operator.role !== 'CENSEUR' && operator.role !== 'DIRECTEUR_GENERAL') {
      throw new Error("Action non autorisée : Seul le Censeur ou la Direction Générale a le droit d'inscrire des élèves.");
    }

    const eleves = this.getEleves();

    // Règle 1: Matricule unique
    const existsMatricule = eleves.some((e) => e.matricule.trim().toUpperCase() === data.matricule.trim().toUpperCase());
    if (existsMatricule) {
      throw new Error(`Le matricule "${data.matricule}" est déjà attribué à un autre élève.`);
    }

    // Règle 2: Limite stricte de 100 élèves par classe (Section 6 & 8)
    const classeEleves = eleves.filter((e) => e.classe_id === data.classe_id && e.statut === 'ACTIF');
    if (classeEleves.length >= 100) {
      throw new Error("Effectif maximal atteint : cette classe contient déjà 100 élèves (plafond officiel).");
    }

    const id = `elv-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date().toISOString();
    const newEleve: Eleve = {
      ...data,
      matricule: data.matricule.trim().toUpperCase(),
      id,
      created_at: now,
      updated_at: now,
    };

    eleves.push(newEleve);
    this.setItem(STORAGE_KEYS.ELEVES, eleves);

    this.addAuditLog({
      user_id: operator.id,
      user_nom: `${operator.nom} ${operator.prenom}`,
      user_role: operator.role,
      action: 'CREATION_ELEVE',
      table_cible: 'eleves',
      record_id: id,
      details: `Inscription élève: ${newEleve.nom} ${newEleve.prenom} (Matricule: ${newEleve.matricule})`,
    });

    // Synchronisation en arrière-plan avec Supabase si connecté
    if (isSupabaseConfigured) {
      const client = getSupabaseClient();
      if (client) {
        void (async () => {
          try {
            const { error } = await client.from('eleves').insert({
              id: newEleve.id,
              matricule: newEleve.matricule,
              nom: newEleve.nom,
              prenom: newEleve.prenom,
              sexe: newEleve.sexe,
              date_naissance: newEleve.date_naissance || null,
              classe_id: newEleve.classe_id,
              langue_vivante_2: newEleve.langue_vivante_2,
              nom_parent: newEleve.nom_parent || null,
              contact_parent: newEleve.contact_parent || null,
              statut: newEleve.statut,
            });
            if (error) console.error('Erreur synchronisation Supabase (eleves insert):', error.message);
          } catch (err) {
            console.error('Exception Supabase eleves insert:', err);
          }
        })();
      }
    }

    return newEleve;
  }

  public updateEleve(id: string, updates: Partial<Eleve>, operator: UserProfile): Eleve {
    // Vérification stricte des permissions (Point 10)
    if (operator.role !== 'CENSEUR' && operator.role !== 'DIRECTEUR_GENERAL') {
      throw new Error("Action non autorisée : Seul le Censeur ou la Direction Générale a le droit de modifier les fiches élèves.");
    }

    const eleves = this.getEleves();
    const idx = eleves.findIndex((e) => e.id === id);
    if (idx === -1) throw new Error('Élève non trouvé');

    // Vérifier unicité du matricule si modifié
    if (updates.matricule && updates.matricule.trim().toUpperCase() !== eleves[idx].matricule) {
      const exists = eleves.some(
        (e) => e.id !== id && e.matricule.trim().toUpperCase() === updates.matricule!.trim().toUpperCase()
      );
      if (exists) {
        throw new Error(`Le matricule "${updates.matricule}" est déjà utilisé.`);
      }
    }

    // Vérifier limite de 100 si changement de classe
    if (updates.classe_id && updates.classe_id !== eleves[idx].classe_id) {
      const count = eleves.filter((e) => e.classe_id === updates.classe_id && e.id !== id && e.statut === 'ACTIF').length;
      if (count >= 100) {
        throw new Error("La classe de destination a déjà atteint son effectif maximal de 100 élèves.");
      }
    }

    const updated: Eleve = {
      ...eleves[idx],
      ...updates,
      matricule: updates.matricule ? updates.matricule.trim().toUpperCase() : eleves[idx].matricule,
      updated_at: new Date().toISOString(),
    };
    eleves[idx] = updated;
    this.setItem(STORAGE_KEYS.ELEVES, eleves);

    this.addAuditLog({
      user_id: operator.id,
      user_nom: `${operator.nom} ${operator.prenom}`,
      user_role: operator.role,
      action: 'MODIFICATION_ELEVE',
      table_cible: 'eleves',
      record_id: id,
      details: `Mise à jour élève: ${updated.nom} ${updated.prenom} (${updated.matricule})`,
    });

    // Synchronisation avec Supabase si connecté
    if (isSupabaseConfigured) {
      const client = getSupabaseClient();
      if (client) {
        void (async () => {
          try {
            const { error } = await client.from('eleves').update({
              matricule: updated.matricule,
              nom: updated.nom,
              prenom: updated.prenom,
              sexe: updated.sexe,
              date_naissance: updated.date_naissance || null,
              classe_id: updated.classe_id,
              langue_vivante_2: updated.langue_vivante_2,
              nom_parent: updated.nom_parent || null,
              contact_parent: updated.contact_parent || null,
              statut: updated.statut,
              updated_at: updated.updated_at,
            }).eq('id', id);
            if (error) console.error('Erreur synchronisation Supabase (eleves update):', error.message);
          } catch (err) {
            console.error('Exception Supabase eleves update:', err);
          }
        })();
      }
    }

    return updated;
  }

  public async updateEleveAsync(id: string, updates: Partial<Eleve>, operator: UserProfile): Promise<Eleve> {
    // Simulation d'un délai réseau réaliste pour feedback utilisateur
    await new Promise((resolve) => setTimeout(resolve, 250));
    return this.updateEleve(id, updates, operator);
  }

  public toggleEleveStatus(id: string, operator: UserProfile): Eleve {
    const eleve = this.getEleveById(id);
    if (!eleve) throw new Error('Élève non trouvé');
    const newStatus = eleve.statut === 'ACTIF' ? 'INACTIF' : 'ACTIF';
    return this.updateEleve(id, { statut: newStatus }, operator);
  }

  // --- PERIODES ---
  public getPeriodes(): Periode[] {
    const list = this.getItem<Periode[]>(STORAGE_KEYS.PERIODES, OFFICIAL_PERIODES);
    let changed = false;
    for (const officialP of OFFICIAL_PERIODES) {
      if (!list.some((p) => p.id === officialP.id)) {
        list.push(officialP);
        changed = true;
      }
    }
    if (changed) {
      this.setItem(STORAGE_KEYS.PERIODES, list);
    }
    return list;
  }

  public getActivePeriode(): Periode {
    const periodes = this.getPeriodes();
    return periodes.find((p) => p.is_active) || periodes[0];
  }

  public setActivePeriode(periodeId: string, operator: UserProfile): Periode {
    const list = this.getPeriodes();
    const updated = list.map((p) => ({
      ...p,
      is_active: p.id === periodeId,
    }));
    this.setItem(STORAGE_KEYS.PERIODES, updated);

    this.addAuditLog({
      user_id: operator.id,
      user_nom: `${operator.nom} ${operator.prenom}`,
      user_role: operator.role,
      action: 'ACTIVATION_PERIODE',
      table_cible: 'periodes',
      record_id: periodeId,
      details: `Activation de la période: ${updated.find((p) => p.id === periodeId)?.nom}`,
    });

    return updated.find((p) => p.id === periodeId)!;
  }

  public toggleLockPeriode(periodeId: string, operator: UserProfile): Periode {
    const list = this.getPeriodes();
    const idx = list.findIndex((p) => p.id === periodeId);
    if (idx === -1) throw new Error('Période non trouvée');

    list[idx] = {
      ...list[idx],
      is_locked: !list[idx].is_locked,
    };
    this.setItem(STORAGE_KEYS.PERIODES, list);

    this.addAuditLog({
      user_id: operator.id,
      user_nom: `${operator.nom} ${operator.prenom}`,
      user_role: operator.role,
      action: list[idx].is_locked ? 'VERROUILLAGE_PERIODE' : 'DEVERROUILLAGE_PERIODE',
      table_cible: 'periodes',
      record_id: periodeId,
      details: `${list[idx].is_locked ? 'Verrouillage' : 'Déverrouillage'} des saisies de notes pour ${list[idx].nom}`,
    });

    return list[idx];
  }

  // --- GESTION PÉRENNE DES ANNÉES SCOLAIRES (EXIGENCE 1, 2, 22, 23) ---
  public getAnneesScolaires(): AnneeScolaire[] {
    return this.getItem<AnneeScolaire[]>(STORAGE_KEYS.ANNEES_SCOLAIRES, OFFICIAL_ANNEES_SCOLAIRES);
  }

  public getActiveAnneeScolaire(): AnneeScolaire {
    const list = this.getAnneesScolaires();
    return list.find((a) => a.is_active) || list[0] || OFFICIAL_ANNEES_SCOLAIRES[1];
  }

  public createAnneeScolaire(
    data: { libelle: string; date_debut: string; date_fin: string },
    operator: UserProfile
  ): AnneeScolaire {
    if (operator.role !== 'CENSEUR' && operator.role !== 'DIRECTEUR_GENERAL') {
      throw new Error("Action non autorisée : Seul le Censeur ou la Direction Générale a le droit d'ouvrir une nouvelle année scolaire.");
    }
    const list = this.getAnneesScolaires();
    if (list.some((a) => a.libelle.trim() === data.libelle.trim())) {
      throw new Error(`L'année scolaire "${data.libelle}" existe déjà dans le système.`);
    }

    const id = `annee-${data.libelle.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now().toString(36)}`;
    const newAnnee: AnneeScolaire = {
      id,
      libelle: data.libelle.trim(),
      date_debut: data.date_debut,
      date_fin: data.date_fin,
      is_active: false,
      statut: 'A_VENIR',
      created_at: new Date().toISOString(),
    };

    list.push(newAnnee);
    this.setItem(STORAGE_KEYS.ANNEES_SCOLAIRES, list);

    // Initialisation automatique des 3 trimestres officiels pour la nouvelle année
    const periodes = this.getPeriodes();
    const startYear = data.libelle.split('–')[0] || data.libelle.split('-')[0] || '2027';
    const endYear = data.libelle.split('–')[1] || data.libelle.split('-')[1] || '2028';

    const t1: Periode = {
      id: `per-${id}-t1`,
      annee_scolaire: newAnnee.libelle,
      code: 'T1',
      nom: '1er trimestre',
      is_active: false,
      is_locked: false,
      date_debut: data.date_debut,
      date_fin: `${startYear.trim()}-12-20`,
    };
    const t2: Periode = {
      id: `per-${id}-t2`,
      annee_scolaire: newAnnee.libelle,
      code: 'T2',
      nom: '2ème trimestre',
      is_active: false,
      is_locked: true,
      date_debut: `${endYear.trim()}-01-05`,
      date_fin: `${endYear.trim()}-03-27`,
    };
    const t3: Periode = {
      id: `per-${id}-t3`,
      annee_scolaire: newAnnee.libelle,
      code: 'T3',
      nom: '3ème trimestre',
      is_active: false,
      is_locked: true,
      date_debut: `${endYear.trim()}-04-12`,
      date_fin: data.date_fin,
    };
    periodes.push(t1, t2, t3);
    this.setItem(STORAGE_KEYS.PERIODES, periodes);

    this.addAuditLog({
      user_id: operator.id,
      user_nom: `${operator.nom} ${operator.prenom}`,
      user_role: operator.role,
      action: 'CREATION_ANNEE_SCOLAIRE',
      table_cible: 'annees_scolaires',
      record_id: id,
      details: `Création de l'année scolaire pérenne : ${newAnnee.libelle}`,
    });

    return newAnnee;
  }

  public setActiveAnneeScolaire(anneeId: string, operator: UserProfile): AnneeScolaire {
    if (operator.role !== 'CENSEUR' && operator.role !== 'DIRECTEUR_GENERAL') {
      throw new Error("Action non autorisée : Seul le Censeur ou la Direction Générale peut basculer l'année active.");
    }
    const list = this.getAnneesScolaires();
    const target = list.find((a) => a.id === anneeId);
    if (!target) throw new Error("Année scolaire introuvable.");

    list.forEach((a) => {
      a.is_active = a.id === anneeId;
      if (a.id === anneeId) {
        a.statut = 'EN_COURS';
      } else if (new Date(a.date_fin).getTime() < Date.now()) {
        a.statut = 'CLOTUREE';
      }
    });
    this.setItem(STORAGE_KEYS.ANNEES_SCOLAIRES, list);

    // Mettre à jour les paramètres de l'école
    const params = this.getParametres();
    params.annee_academique = target.libelle;
    this.setItem(STORAGE_KEYS.PARAMETRES, params);

    // Activer la période correspondante (1er trimestre)
    const periodes = this.getPeriodes();
    let hasActivated = false;
    periodes.forEach((p) => {
      if (p.annee_scolaire === target.libelle && !hasActivated) {
        p.is_active = true;
        hasActivated = true;
      } else {
        p.is_active = false;
      }
    });
    this.setItem(STORAGE_KEYS.PERIODES, periodes);

    this.addAuditLog({
      user_id: operator.id,
      user_nom: `${operator.nom} ${operator.prenom}`,
      user_role: operator.role,
      action: 'ACTIVATION_ANNEE_SCOLAIRE',
      table_cible: 'annees_scolaires',
      record_id: anneeId,
      details: `Bascule de l'année académique active sur : ${target.libelle}`,
    });

    return target;
  }

  // --- SÉCURITÉ MOTS DE PASSE & GESTION DE SON PROPRE COMPTE (EXIGENCE 3, 6, 7) ---
  public getUserCredentials(): Record<string, string> {
    return this.getItem<Record<string, string>>(STORAGE_KEYS.CREDENTIALS, {});
  }

  public verifyUserPassword(userIdOrEmail: string, passwordAttempt: string): boolean {
    if (!passwordAttempt) return false;
    const profiles = this.getProfiles();
    const user = profiles.find(
      (p) => p.id === userIdOrEmail || p.email.toLowerCase() === userIdOrEmail.trim().toLowerCase()
    );
    if (!user) return false;

    const creds = this.getUserCredentials();
    const stored = creds[user.id];

    // Si mot de passe explicitement personnalisé
    if (stored) {
      return stored === passwordAttempt.trim();
    }
    // Mots de passe par défaut acceptés pour les comptes initiaux
    return passwordAttempt.trim() === 'Passer123!' || passwordAttempt.trim() === 'Gogbo2026!';
  }

  public async updateUserPassword(
    userId: string,
    oldPass: string,
    newPass: string
  ): Promise<{ success: boolean; error?: string }> {
    const user = this.getProfileById(userId);
    if (!user) return { success: false, error: 'Compte introuvable.' };

    if (!this.verifyUserPassword(userId, oldPass)) {
      return { success: false, error: "L'ancien mot de passe saisi est incorrect." };
    }

    if (!newPass || newPass.trim().length < 6) {
      return { success: false, error: 'Le nouveau mot de passe doit comporter au moins 6 caractères.' };
    }

    const creds = this.getUserCredentials();
    creds[userId] = newPass.trim();
    this.setItem(STORAGE_KEYS.CREDENTIALS, creds);

    // Sync Supabase Auth si configuré
    const supabase = getSupabaseClient();
    if (supabase && isSupabaseConfigured) {
      try {
        await supabase.auth.updateUser({ password: newPass.trim() });
      } catch (e) {
        console.warn('Supabase auth update password error:', e);
      }
    }

    this.addAuditLog({
      user_id: user.id,
      user_nom: `${user.nom} ${user.prenom}`,
      user_role: user.role,
      action: 'MODIFICATION_MOT_DE_PASSE',
      table_cible: 'auth',
      record_id: userId,
      details: `Mise à jour sécurisée du mot de passe personnel de ${user.prenom} ${user.nom}`,
    });

    return { success: true };
  }

  public async updateUserEmail(
    userId: string,
    newEmail: string
  ): Promise<{ success: boolean; error?: string }> {
    const cleanEmail = newEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: "Veuillez saisir une adresse email académique valide." };
    }

    const profiles = this.getProfiles();
    const userIdx = profiles.findIndex((p) => p.id === userId);
    if (userIdx === -1) return { success: false, error: 'Compte introuvable.' };

    // Unicité de l'identifiant
    const conflict = profiles.find((p) => p.email.toLowerCase() === cleanEmail && p.id !== userId);
    if (conflict) {
      return { success: false, error: `Cet identifiant (${cleanEmail}) est déjà utilisé par un autre compte.` };
    }

    const oldEmail = profiles[userIdx].email;
    profiles[userIdx].email = cleanEmail;
    profiles[userIdx].updated_at = new Date().toISOString();
    this.setItem(STORAGE_KEYS.PROFILES, profiles);

    // Sync Supabase Auth si configuré
    const supabase = getSupabaseClient();
    if (supabase && isSupabaseConfigured) {
      try {
        await supabase.auth.updateUser({ email: cleanEmail });
        await supabase.from('profiles').update({ email: cleanEmail }).eq('id', userId);
      } catch (e) {
        console.warn('Supabase update email error:', e);
      }
    }

    this.addAuditLog({
      user_id: profiles[userIdx].id,
      user_nom: `${profiles[userIdx].nom} ${profiles[userIdx].prenom}`,
      user_role: profiles[userIdx].role,
      action: 'MODIFICATION_IDENTIFIANT',
      table_cible: 'profiles',
      record_id: userId,
      details: `Changement de l'identifiant personnel : ${oldEmail} → ${cleanEmail}`,
    });

    return { success: true };
  }

  // --- GESTION DE LA SESSION ACTIVE DANS LE STOCKAGE ---
  public getActiveUser(): UserProfile | null {
    const id = localStorage.getItem('gogbo_v2_current_user_id');
    if (!id) return null;
    return this.getProfileById(id) || null;
  }

  public setActiveUser(user: UserProfile | null): void {
    if (!user) {
      localStorage.removeItem('gogbo_v2_current_user_id');
    } else {
      localStorage.setItem('gogbo_v2_current_user_id', user.id);
    }
  }

  public logout(): void {
    localStorage.removeItem('gogbo_v2_current_user_id');
  }

  public getNotesByAffectation(affectationId: string): Note[] {
    return this.getNotes().filter((n) => n.affectation_id === affectationId);
  }

  // --- SYNCHRONISATION ASYNCHRONE MATIÈRE & COEFFICIENTS ---
  public async updateMatiereAsync(id: string, updates: Partial<Matiere>, operator: UserProfile): Promise<Matiere> {
    const updated = this.updateMatiere(id, updates, operator);
    const supabase = getSupabaseClient();
    if (supabase && isSupabaseConfigured) {
      try {
        await supabase.from('matieres').update(updates).eq('id', id);
      } catch (e) {
        console.warn('Supabase updateMatiere error:', e);
      }
    }
    return updated;
  }

  // --- AFFECTATIONS PEDAGOGIQUES ---
  public getAffectations(): AffectationPedagogique[] {
    return this.getItem<AffectationPedagogique[]>(STORAGE_KEYS.AFFECTATIONS, SEED_AFFECTATIONS);
  }

  public getAffectationsByProfile(profileId: string): AffectationPedagogique[] {
    return this.getAffectations().filter((a) => a.profile_id === profileId && a.statut === 'ACTIF');
  }

  public getAffectationsByClasse(classeId: string): AffectationPedagogique[] {
    return this.getAffectations().filter((a) => a.classe_id === classeId && a.statut === 'ACTIF');
  }

  public createAffectation(
    data: Omit<AffectationPedagogique, 'id' | 'created_at' | 'updated_at'>,
    operator: UserProfile
  ): AffectationPedagogique {
    const list = this.getAffectations();

    // Vérifier doublon (même enseignant + classe + matière)
    const exists = list.some(
      (a) =>
        a.profile_id === data.profile_id &&
        a.classe_id === data.classe_id &&
        a.matiere_id === data.matiere_id &&
        a.statut === 'ACTIF'
    );
    if (exists) {
      throw new Error('Cette affectation pédagogique existe déjà pour cet enseignant, cette classe et cette matière.');
    }

    const id = `aff-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date().toISOString();
    const newAff: AffectationPedagogique = {
      ...data,
      id,
      created_at: now,
      updated_at: now,
    };
    list.push(newAff);
    this.setItem(STORAGE_KEYS.AFFECTATIONS, list);

    const prof = this.getProfileById(data.profile_id);
    const classe = this.getClasseById(data.classe_id);
    const mat = this.getMatiereById(data.matiere_id);

    this.addAuditLog({
      user_id: operator.id,
      user_nom: `${operator.nom} ${operator.prenom}`,
      user_role: operator.role,
      action: 'CREATION_AFFECTATION',
      table_cible: 'affectations',
      record_id: id,
      details: `Affectation: ${prof?.nom} ${prof?.prenom} -> ${classe?.nom} -> ${mat?.nom} (${data.heures_hebdo}h/sem)`,
    });

    return newAff;
  }

  public deleteAffectation(id: string, operator: UserProfile): void {
    const list = this.getAffectations();
    const aff = list.find((a) => a.id === id);
    if (!aff) throw new Error('Affectation introuvable');

    const updated = list.filter((a) => a.id !== id);
    this.setItem(STORAGE_KEYS.AFFECTATIONS, updated);

    this.addAuditLog({
      user_id: operator.id,
      user_nom: `${operator.nom} ${operator.prenom}`,
      user_role: operator.role,
      action: 'SUPPRESSION_AFFECTATION',
      table_cible: 'affectations',
      record_id: id,
      details: `Suppression affectation: ID ${id}`,
    });
  }

  public toggleAffectationStatus(id: string, operator: UserProfile): AffectationPedagogique {
    const list = this.getAffectations();
    const idx = list.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error('Affectation introuvable');

    const newStatut = list[idx].statut === 'ACTIF' ? 'INACTIF' : 'ACTIF';
    list[idx] = {
      ...list[idx],
      statut: newStatut,
      updated_at: new Date().toISOString(),
    };
    this.setItem(STORAGE_KEYS.AFFECTATIONS, list);

    this.addAuditLog({
      user_id: operator.id,
      user_nom: `${operator.nom} ${operator.prenom}`,
      user_role: operator.role,
      action: 'MODIFICATION_AFFECTATION',
      table_cible: 'affectations',
      record_id: id,
      details: `Changement statut affectation -> ${newStatut}`,
    });

    return list[idx];
  }

  // --- GESTION DES NOTES ET PERMISSIONS (SECTION 3, 10, 16) ---

  /**
   * Vérification stricte des permissions de saisie :
   * L'utilisateur DOIT posséder une affectation pédagogique active sur la combinaison (Classe + Matière),
   * peu importe son rôle administratif (Enseignant, Censeur ou Directeur Général).
   */
  public checkCanEnterNote(
    userId: string,
    classeId: string,
    matiereId: string,
    periodeId: string
  ): { allowed: boolean; reason?: string; affectationId?: string } {
    // 1. Vérifier la période
    const periodes = this.getPeriodes();
    const periode = periodes.find((p) => p.id === periodeId);
    if (!periode) {
      return { allowed: false, reason: 'Période invalide ou non trouvée.' };
    }
    if (periode.is_locked) {
      return { allowed: false, reason: `La saisie est verrouillée pour ${periode.nom} par le Censeur.` };
    }

    // 2. Vérifier l'affectation active (UTILISATEUR -> AFFECTATION PÉDAGOGIQUE -> CLASSE + MATIÈRE)
    const affectations = this.getAffectations();
    const activeAffectation = affectations.find(
      (a) =>
        a.profile_id === userId &&
        a.classe_id === classeId &&
        a.matiere_id === matiereId &&
        a.statut === 'ACTIF'
    );

    if (!activeAffectation) {
      return {
        allowed: false,
        reason:
          "Accès refusé : Vous ne disposez pas d'une affectation pédagogique active pour cette classe et cette matière. Seul l'enseignant ou personnel affecté peut saisir ces notes.",
      };
    }

    return { allowed: true, affectationId: activeAffectation.id };
  }

  public getNotes(): Note[] {
    return this.getItem<Note[]>(STORAGE_KEYS.NOTES, SEED_NOTES);
  }

  public getNotesByEleve(eleveId: string): Note[] {
    return this.getNotes().filter((n) => n.eleve_id === eleveId);
  }

  public getNotesByAffectationAndPeriode(affectationId: string, periodeId: string): Note[] {
    return this.getNotes().filter((n) => n.affectation_id === affectationId && n.periode_id === periodeId);
  }

  /**
   * Saisie sécurisée d'une note (Section 10 & 16)
   */
  public saveNote(
    data: {
      eleve_id: string;
      affectation_id: string;
      periode_id: string;
      valeur: number;
      type_evaluation: Note['type_evaluation'];
      observation?: string;
    },
    user: UserProfile
  ): Note {
    // Validation mathématique stricte de la note
    if (typeof data.valeur !== 'number' || isNaN(data.valeur)) {
      throw new Error('La valeur de la note doit être un nombre valide.');
    }
    if (data.valeur < 0 || data.valeur > 20) {
      throw new Error('La note doit obligatoirement être comprise entre 0 et 20.');
    }

    // Arrondi à deux décimales maximum
    const noteVal = Math.round(data.valeur * 100) / 100;

    // Vérifier l'affectation
    const affs = this.getAffectations();
    const aff = affs.find((a) => a.id === data.affectation_id && a.statut === 'ACTIF');
    if (!aff) {
      throw new Error('Affectation pédagogique introuvable ou inactive.');
    }

    // Vérification RLS applicative : L'utilisateur qui saisit doit être le titulaire de l'affectation
    if (aff.profile_id !== user.id) {
      throw new Error(
        "Violation de sécurité RLS : Vous ne pouvez pas saisir ou modifier les notes d'une affectation pédagogique qui ne vous a pas été attribuée."
      );
    }

    // Vérifier le verrouillage de la période
    const periodes = this.getPeriodes();
    const per = periodes.find((p) => p.id === data.periode_id);
    if (!per || per.is_locked) {
      throw new Error('Saisie refusée : la période sélectionnée est clôturée ou verrouillée.');
    }

    const notes = this.getNotes();
    const now = new Date().toISOString();

    // Empêcher les doublons (même élève + affectation + période + type_evaluation)
    const existingIndex = notes.findIndex(
      (n) =>
        n.eleve_id === data.eleve_id &&
        n.affectation_id === data.affectation_id &&
        n.periode_id === data.periode_id &&
        n.type_evaluation === data.type_evaluation
    );

    let savedNote: Note;

    if (existingIndex !== -1) {
      // Modification de la note existante
      savedNote = {
        ...notes[existingIndex],
        valeur: noteVal,
        observation: data.observation || '',
        saisi_par: user.id,
        updated_at: now,
      };
      notes[existingIndex] = savedNote;
    } else {
      // Nouvelle note
      savedNote = {
        id: `not-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        eleve_id: data.eleve_id,
        affectation_id: data.affectation_id,
        periode_id: data.periode_id,
        valeur: noteVal,
        type_evaluation: data.type_evaluation,
        saisi_par: user.id,
        observation: data.observation || '',
        created_at: now,
        updated_at: now,
      };
      notes.push(savedNote);
    }

    this.setItem(STORAGE_KEYS.NOTES, notes);

    const eleve = this.getEleveById(data.eleve_id);
    this.addAuditLog({
      user_id: user.id,
      user_nom: `${user.nom} ${user.prenom}`,
      user_role: user.role,
      action: existingIndex !== -1 ? 'MODIFICATION_NOTE' : 'SAISIE_NOTE',
      table_cible: 'notes',
      record_id: savedNote.id,
      details: `${existingIndex !== -1 ? 'Modification' : 'Saisie'} note (${data.type_evaluation}) pour ${eleve?.nom} ${eleve?.prenom}: ${noteVal}/20`,
    });

    return savedNote;
  }

  // --- AUDIT LOGS ---
  public getAuditLogs(): AuditLog[] {
    return this.getItem<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, SEED_AUDIT_LOGS);
  }

  public addAuditLog(log: Omit<AuditLog, 'id' | 'created_at'>): void {
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      ...log,
      id: `log-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
      created_at: new Date().toISOString(),
    };
    logs.unshift(newLog);
    // Conserver les 200 derniers logs
    if (logs.length > 200) {
      logs.length = 200;
    }
    this.setItem(STORAGE_KEYS.AUDIT_LOGS, logs);
  }

  // --- UTILITAIRES / EXPORT / RESET ---
  public resetToDefaults(): void {
    localStorage.removeItem(STORAGE_KEYS.VERSION);
    this.init();
  }

  public exportDatabaseJSON(): string {
    const data = {
      parametres: this.getParametres(),
      profiles: this.getProfiles(),
      classes: this.getClasses(),
      matieres: this.getMatieres(),
      eleves: this.getEleves(),
      periodes: this.getPeriodes(),
      affectations: this.getAffectations(),
      notes: this.getNotes(),
      audit_logs: this.getAuditLogs(),
      exported_at: new Date().toISOString(),
      version: '2.0.0',
    };
    return JSON.stringify(data, null, 2);
  }

  public importDatabaseJSON(jsonStr: string, operator: UserProfile): void {
    try {
      const data = JSON.parse(jsonStr);
      if (data.profiles && data.classes && data.eleves) {
        if (data.parametres) this.setItem(STORAGE_KEYS.PARAMETRES, data.parametres);
        this.setItem(STORAGE_KEYS.PROFILES, data.profiles);
        this.setItem(STORAGE_KEYS.CLASSES, data.classes);
        this.setItem(STORAGE_KEYS.MATIERES, data.matieres);
        this.setItem(STORAGE_KEYS.ELEVES, data.eleves);
        this.setItem(STORAGE_KEYS.PERIODES, data.periodes);
        this.setItem(STORAGE_KEYS.AFFECTATIONS, data.affectations);
        this.setItem(STORAGE_KEYS.NOTES, data.notes);
        this.setItem(STORAGE_KEYS.AUDIT_LOGS, data.audit_logs || []);

        this.addAuditLog({
          user_id: operator.id,
          user_nom: `${operator.nom} ${operator.prenom}`,
          user_role: operator.role,
          action: 'IMPORT_BASE_DONNEES',
          table_cible: 'system',
          details: 'Restauration complète de la base de données depuis une archive JSON',
        });
      }
    } catch (e) {
      throw new Error(`Erreur lors de l'import: ${e instanceof Error ? e.message : 'Fichier JSON invalide'}`);
    }
  }
}

export const storage = new StorageEngine();
storage.init();
