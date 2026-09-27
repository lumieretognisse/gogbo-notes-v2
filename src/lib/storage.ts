import { 
  UserProfile, 
  Classe, 
  Matiere, 
  Eleve, 
  InscriptionEleve,
  Periode, 
  AffectationPedagogique, 
  Note, 
  AuditLog, 
  ParametresEcole,
  AnneeScolaire,
  EnregistrementPresence,
  PaiementContribution,
  PresenceEnseignant,
  StatutPresenceEnseignant
} from '../types';
import { OFFICIAL_IDENTITY, OFFICIAL_CLASSES, OFFICIAL_MATIERES, OFFICIAL_PERIODES, OFFICIAL_ANNEES_SCOLAIRES } from './constants';
import { getSupabaseClient, isSupabaseConfigured } from './supabase';

// ====================================================================
// SÉCURITÉ CRYPTOGRAPHIQUE DES MOTS DE PASSE (CONFORME FIPS 180-4 SHA-256)
// Les mots de passe ne sont JAMAIS stockés en clair dans les profils ni en base.
// ====================================================================
function sha256Hex(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }
  const words: number[] = [];
  const asciiBitLength = ascii.length * 8;
  
  const hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];
  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f, 0xc67178f2
  ];

  for (let i = 0; i < ascii.length; i++) {
    const charCode = ascii.charCodeAt(i);
    words[i >> 2] |= charCode << ((3 - (i % 4)) * 8);
  }
  words[ascii.length >> 2] |= 0x80 << ((3 - (ascii.length % 4)) * 8);
  words[(((ascii.length + 8) >> 6) << 4) + 15] = asciiBitLength;

  const w: number[] = new Array(64);
  for (let i = 0; i < words.length; i += 16) {
    let a = hash[0], b = hash[1], c = hash[2], d = hash[3];
    let e = hash[4], f = hash[5], g = hash[6], h = hash[7];

    for (let j = 0; j < 64; j++) {
      if (j < 16) {
        w[j] = words[i + j] | 0;
      } else {
        const s0 = rightRotate(w[j - 15], 7) ^ rightRotate(w[j - 15], 18) ^ (w[j - 15] >>> 3);
        const s1 = rightRotate(w[j - 2], 17) ^ rightRotate(w[j - 2], 19) ^ (w[j - 2] >>> 10);
        w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
      }
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) + ch + k[j] + w[j]) | 0;
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = ((rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) + maj) | 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) | 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) | 0;
    }

    hash[0] = (hash[0] + a) | 0;
    hash[1] = (hash[1] + b) | 0;
    hash[2] = (hash[2] + c) | 0;
    hash[3] = (hash[3] + d) | 0;
    hash[4] = (hash[4] + e) | 0;
    hash[5] = (hash[5] + f) | 0;
    hash[6] = (hash[6] + g) | 0;
    hash[7] = (hash[7] + h) | 0;
  }

  let result = '';
  for (let i = 0; i < 8; i++) {
    const hex = (hash[i] >>> 0).toString(16).padStart(8, '0');
    result += hex;
  }
  return result;
}

export function hashPassword(plainText: string): string {
  const salt = 'GOGBO_V2_ACADEMIC_SALT_2026';
  return 'sha256$' + sha256Hex(`${salt}:${plainText.trim()}`);
}

const STORAGE_KEYS = {
  PROFILES: 'gogbo_v2_profiles',
  CLASSES: 'gogbo_v2_classes',
  MATIERES: 'gogbo_v2_matieres',
  ELEVES: 'gogbo_v2_eleves',
  INSCRIPTIONS: 'gogbo_v2_inscriptions',
  PERIODES: 'gogbo_v2_periodes',
  ANNEES_SCOLAIRES: 'gogbo_v2_annees_scolaires',
  CREDENTIALS: 'gogbo_v2_credentials',
  AFFECTATIONS: 'gogbo_v2_affectations',
  NOTES: 'gogbo_v2_notes',
  PRESENCES: 'gogbo_v2_presences',
  PRESENCES_ENSEIGNANTS: 'gogbo_v2_presences_enseignants',
  PAIEMENTS: 'gogbo_v2_paiements',
  AUDIT_LOGS: 'gogbo_v2_audit_logs',
  PARAMETRES: 'gogbo_v2_parametres',
  VERSION: 'gogbo_v2_version',
};

// Profils Institutionnels Officiels de Base (Direction & Administration)
// AUCUN enseignant fictif n'est pré-enregistré : le Censeur et le Concepteur renseignent eux-mêmes les vrais enseignants.
const SEED_PROFILES: UserProfile[] = [
  {
    id: 'usr-concepteur',
    email: 'concepteur@ceggogbo.bj',
    nom: 'TOGNISSE',
    prenom: 'Lumière',
    role: 'CONCEPTEUR',
    is_enseignant: false,
    telephone: '+229 97 00 00 01',
    adresse: 'Adjohoun - Direction Technique',
    matiere: '',
    statut: 'ACTIF',
    created_at: '2026-09-01T08:00:00Z',
    updated_at: '2026-09-01T08:00:00Z',
  },
  {
    id: 'usr-censeur',
    email: 'censeur@ceggogbo.bj',
    nom: 'DOSSOU-YOVO',
    prenom: 'Clément',
    role: 'CENSEUR',
    is_enseignant: false,
    telephone: '+229 97 12 34 56',
    adresse: 'Adjohoun - Centre',
    matiere: 'SVT',
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
    is_enseignant: false,
    telephone: '+229 97 88 99 00',
    adresse: 'Porto-Novo - Ouando',
    matiere: 'Mathématiques',
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
    adresse: 'Gangban - CEG GOGBO',
    matiere: '',
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
    adresse: 'Adjohoun - Quartier Démè',
    matiere: '',
    statut: 'ACTIF',
    created_at: '2026-09-01T08:00:00Z',
    updated_at: '2026-09-01T08:00:00Z',
  },
];

// AUCUNE attribution de classe fictive : le Censeur ou le Concepteur les crée réellement.
const SEED_AFFECTATIONS: AffectationPedagogique[] = [];

// AUCUN élève fictif : les vrais apprenants sont inscrits par le Censeur ou le Concepteur.
const SEED_ELEVES: Eleve[] = [];

// AUCUNE inscription fictive.
const SEED_INSCRIPTIONS: InscriptionEleve[] = [];

// AUCUNE note fictive pré-enregistrée : seules les réelles évaluations saisies sont conservées.
const SEED_NOTES: Note[] = [];

// AUCUNE présence ou absence fictive pré-enregistrée.
const SEED_PRESENCES: EnregistrementPresence[] = [];

// AUCUN paiement fictif pré-enregistré.
const SEED_PAIEMENTS: PaiementContribution[] = [];

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

  public canAdminister(operator: UserProfile): boolean {
    return operator.role === 'CENSEUR' || operator.role === 'DIRECTEUR_GENERAL' || operator.role === 'CONCEPTEUR';
  }

  public init(): void {
    const initialized = localStorage.getItem(STORAGE_KEYS.VERSION);
    if (!initialized) {
      this.setItem(STORAGE_KEYS.PROFILES, SEED_PROFILES);
      this.setItem(STORAGE_KEYS.CLASSES, OFFICIAL_CLASSES);
      this.setItem(STORAGE_KEYS.MATIERES, OFFICIAL_MATIERES);
      this.setItem(STORAGE_KEYS.ELEVES, SEED_ELEVES);
      this.setItem(STORAGE_KEYS.INSCRIPTIONS, SEED_INSCRIPTIONS);
      this.setItem(STORAGE_KEYS.PERIODES, OFFICIAL_PERIODES);
      this.setItem(STORAGE_KEYS.ANNEES_SCOLAIRES, OFFICIAL_ANNEES_SCOLAIRES);
      this.setItem(STORAGE_KEYS.AFFECTATIONS, SEED_AFFECTATIONS);
      this.setItem(STORAGE_KEYS.NOTES, SEED_NOTES);
      this.setItem(STORAGE_KEYS.PRESENCES, SEED_PRESENCES);
      this.setItem(STORAGE_KEYS.PAIEMENTS, SEED_PAIEMENTS);
      this.setItem(STORAGE_KEYS.AUDIT_LOGS, SEED_AUDIT_LOGS);
      this.setItem(STORAGE_KEYS.PARAMETRES, OFFICIAL_IDENTITY);
      
      const defaultCreds: Record<string, string> = {};
      SEED_PROFILES.forEach((p) => {
        defaultCreds[p.id] = hashPassword('Passer123!');
      });
      this.setItem(STORAGE_KEYS.CREDENTIALS, defaultCreds);
      this.setItem(STORAGE_KEYS.VERSION, '2.2.0');
    } else {
      // Nettoyage et suppression irréversible des données d'exemple et démonstrations fictives
      // sans supprimer aucun compte réel, ni compte officiel d'administration
      const purgeFictifsKey = 'gogbo_v2_fictifs_cleaned_v3';
      if (!localStorage.getItem(purgeFictifsKey)) {
        const FICTIVE_PROFILE_IDS = new Set([
          'usr-prof-math',
          'usr-prof-francais',
          'usr-prof-pct',
          'usr-prof-sossou',
          'usr-prof-mensah',
          'usr-prof-bio',
        ]);
        const storedProfiles = this.getItem<UserProfile[]>(STORAGE_KEYS.PROFILES, []);
        const cleanedProfiles = storedProfiles.filter((p) => !FICTIVE_PROFILE_IDS.has(p.id));
        for (const off of SEED_PROFILES) {
          if (!cleanedProfiles.some((p) => p.id === off.id || p.email.toLowerCase() === off.email.toLowerCase())) {
            cleanedProfiles.push(off);
          }
        }
        this.setItem(STORAGE_KEYS.PROFILES, cleanedProfiles);

        const FICTIVE_ELEVES = new Set([
          'elv-jean',
          'elv-4a-01',
          'elv-4a-02',
          'elv-4a-03',
          'elv-4a-04',
          'elv-4a-05',
          'elv-td-01',
        ]);
        const storedEleves = this.getItem<Eleve[]>(STORAGE_KEYS.ELEVES, []);
        this.setItem(STORAGE_KEYS.ELEVES, storedEleves.filter((e) => !FICTIVE_ELEVES.has(e.id)));

        const storedInscs = this.getItem<InscriptionEleve[]>(STORAGE_KEYS.INSCRIPTIONS, []);
        this.setItem(STORAGE_KEYS.INSCRIPTIONS, storedInscs.filter((i) => !FICTIVE_ELEVES.has(i.eleve_id)));

        const FICTIVE_AFFS = new Set([
          'aff-sossou-math-6a',
          'aff-mensah-francais-6a',
          'aff-bio-pct-4a',
          'aff-censeur-svt-4a',
          'aff-dg-math-td',
        ]);
        const storedAffs = this.getItem<AffectationPedagogique[]>(STORAGE_KEYS.AFFECTATIONS, []);
        this.setItem(STORAGE_KEYS.AFFECTATIONS, storedAffs.filter((a) => !FICTIVE_AFFS.has(a.id) && !FICTIVE_PROFILE_IDS.has(a.profile_id)));

        const storedNotes = this.getItem<Note[]>(STORAGE_KEYS.NOTES, []);
        this.setItem(STORAGE_KEYS.NOTES, storedNotes.filter((n) => !FICTIVE_ELEVES.has(n.eleve_id) && !FICTIVE_PROFILE_IDS.has(n.saisi_par)));

        const storedPresences = this.getItem<EnregistrementPresence[]>(STORAGE_KEYS.PRESENCES, []);
        this.setItem(STORAGE_KEYS.PRESENCES, storedPresences.filter((p) => !FICTIVE_ELEVES.has(p.eleve_id)));

        const storedPaiements = this.getItem<PaiementContribution[]>(STORAGE_KEYS.PAIEMENTS, []);
        this.setItem(STORAGE_KEYS.PAIEMENTS, storedPaiements.filter((p) => !FICTIVE_ELEVES.has(p.eleve_id)));

        localStorage.setItem(purgeFictifsKey, 'true');
      }

      // Vérification et mise à niveau non-destructive pour les futures années scolaires
      if (!localStorage.getItem(STORAGE_KEYS.ANNEES_SCOLAIRES)) {
        this.setItem(STORAGE_KEYS.ANNEES_SCOLAIRES, OFFICIAL_ANNEES_SCOLAIRES);
      }
      if (!localStorage.getItem(STORAGE_KEYS.PRESENCES)) {
        this.setItem(STORAGE_KEYS.PRESENCES, SEED_PRESENCES);
      }
      if (!localStorage.getItem(STORAGE_KEYS.PAIEMENTS)) {
        this.setItem(STORAGE_KEYS.PAIEMENTS, SEED_PAIEMENTS);
      }

      if (!localStorage.getItem(STORAGE_KEYS.INSCRIPTIONS)) {
        const eleves = this.getEleves();
        const initialInscriptions: InscriptionEleve[] = eleves.map((e) => ({
          id: `insc-2026-${e.id}`,
          eleve_id: e.id,
          classe_id: e.classe_id,
          annee_scolaire: '2026–2027',
          statut: e.statut,
          date_inscription: '2026-09-08',
          redoublant: false,
          actif: e.statut === 'ACTIF',
          created_at: e.created_at || '2026-09-08T10:00:00Z',
          updated_at: e.updated_at || '2026-09-08T10:00:00Z',
        }));
        this.setItem(STORAGE_KEYS.INSCRIPTIONS, initialInscriptions);
      }
      // Migration douce des affectations pour garantir annee_scolaire
      const currentAffs = this.getItem<AffectationPedagogique[]>(STORAGE_KEYS.AFFECTATIONS, SEED_AFFECTATIONS);
      let affsNeedUpdate = false;
      const patchedAffs = currentAffs.map((a) => {
        if (!a.annee_scolaire) {
          affsNeedUpdate = true;
          return { ...a, annee_scolaire: '2026–2027' };
        }
        return a;
      });
      if (affsNeedUpdate) {
        this.setItem(STORAGE_KEYS.AFFECTATIONS, patchedAffs);
      }
      // Migration douce des notes pour garantir annee_scolaire
      const reloadedNotes = this.getItem<Note[]>(STORAGE_KEYS.NOTES, SEED_NOTES);
      let notesNeedUpdate = false;
      const periodesList = this.getPeriodes();
      const patchedNotes = reloadedNotes.map((n) => {
        if (!n.annee_scolaire) {
          notesNeedUpdate = true;
          const p = periodesList.find((per) => per.id === n.periode_id);
          return { ...n, annee_scolaire: p?.annee_scolaire || '2026–2027' };
        }
        return n;
      });
      if (notesNeedUpdate) {
        this.setItem(STORAGE_KEYS.NOTES, patchedNotes);
      }
      if (!localStorage.getItem(STORAGE_KEYS.CREDENTIALS)) {
        const defaultCreds: Record<string, string> = {};
        const profiles = this.getProfiles();
        profiles.forEach((p) => {
          defaultCreds[p.id] = hashPassword('Passer123!');
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
    const list = this.getItem<UserProfile[]>(STORAGE_KEYS.PROFILES, SEED_PROFILES);
    return list.map((p) => {
      let matiere = p.matiere;
      if (!matiere && (p.is_enseignant || p.role === 'ENSEIGNANT')) {
        const affs = this.getItem<AffectationPedagogique[]>(STORAGE_KEYS.AFFECTATIONS, []).filter(
          (a) => a.profile_id === p.id && a.statut === 'ACTIF'
        );
        if (affs.length > 0) {
          const matNames = Array.from(
            new Set(
              affs
                .map((a) => this.getMatieres().find((m) => m.id === a.matiere_id)?.nom)
                .filter(Boolean)
            )
          );
          if (matNames.length > 0) {
            matiere = matNames.join(' • ');
          }
        }
      }
      return {
        ...p,
        adresse: p.adresse || '',
        matiere: matiere || '',
      };
    });
  }

  public getProfileById(id: string): UserProfile | undefined {
    return this.getProfiles().find((p) => p.id === id);
  }

  public setUserPassword(userId: string, newPass: string): void {
    const creds = this.getUserCredentials();
    creds[userId] = hashPassword(newPass);
    this.setItem(STORAGE_KEYS.CREDENTIALS, creds);
  }

  public createProfile(
    data: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'> & { initial_password?: string },
    operator: UserProfile
  ): UserProfile {
    // Vérification stricte des permissions (Point 10 & 11 : Censeur, Concepteur, DG)
    if (!this.canAdminister(operator)) {
      throw new Error("Action non autorisée : Seul le Censeur ou la Direction Générale a le droit de créer un compte personnel.");
    }

    const profiles = this.getProfiles();
    const id = `usr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date().toISOString();
    const { initial_password, ...profileData } = data;
    const newProfile: UserProfile = {
      ...profileData,
      id,
      created_at: now,
      updated_at: now,
    };
    profiles.push(newProfile);
    this.setItem(STORAGE_KEYS.PROFILES, profiles);

    const initialPass = (initial_password && initial_password.trim()) ? initial_password.trim() : 'Gogbo2026!';
    this.setUserPassword(id, initialPass);

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
            await client.auth.signUp({
              email: newProfile.email,
              password: initialPass,
              options: {
                data: {
                  nom: newProfile.nom,
                  prenom: newProfile.prenom,
                  role: newProfile.role,
                  is_enseignant: newProfile.is_enseignant,
                },
              },
            });
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
            if (error) console.warn('Erreur synchronisation Supabase profiles:', error.message);
          } catch (err) {
            console.warn('Exception synchronisation Supabase auth/profiles:', err);
          }
        })();
      }
    }

    return newProfile;
  }

  public updateProfile(
    id: string,
    updates: Partial<UserProfile> & { initial_password?: string },
    operator: UserProfile
  ): UserProfile {
    // Vérification stricte des permissions (Point 10 & 11 : Censeur, Concepteur, DG)
    if (!this.canAdminister(operator)) {
      throw new Error("Action non autorisée : Seul le Censeur ou la Direction Générale a le droit de modifier les informations administratives des personnels.");
    }

    const profiles = this.getProfiles();
    const index = profiles.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('Profil non trouvé');

    const { initial_password, ...cleanUpdates } = updates;
    const updated = {
      ...profiles[index],
      ...cleanUpdates,
      updated_at: new Date().toISOString(),
    };
    profiles[index] = updated;
    this.setItem(STORAGE_KEYS.PROFILES, profiles);

    if (initial_password && initial_password.trim()) {
      this.setUserPassword(id, initial_password.trim());
    }

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

  public async updateProfileAsync(
    id: string,
    updates: Partial<UserProfile> & { initial_password?: string },
    operator: UserProfile
  ): Promise<UserProfile> {
    // Simulation d'un délai réseau réaliste pour feedback utilisateur
    await new Promise((resolve) => setTimeout(resolve, 250));
    return this.updateProfile(id, updates, operator);
  }

  /**
   * ESPACE « MON COMPTE » :
   * Chaque utilisateur connecté peut consulter, compléter et modifier de manière persistante
   * ses propres informations (Nom, Prénoms, Résidence / Adresse, Contact téléphone, Matière, Email).
   * Sécurité : Un utilisateur ne peut modifier que ses propres informations.
   * Le Censeur et la Direction conservent leurs droits d'administration globaux.
   */
  public updateMyProfile(
    userId: string,
    data: {
      nom: string;
      prenom: string;
      adresse?: string;
      telephone?: string;
      matiere?: string;
      email: string;
    },
    operator: UserProfile
  ): { success: boolean; error?: string; profile?: UserProfile } {
    if (operator.id !== userId && !this.canAdminister(operator)) {
      return {
        success: false,
        error: "Accès refusé : Vous ne pouvez modifier que vos propres informations depuis « MON COMPTE ».",
      };
    }

    const cleanNom = data.nom.trim();
    const cleanPrenom = data.prenom.trim();
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanTelephone = data.telephone?.trim() || '';
    const cleanAdresse = data.adresse?.trim() || '';
    const cleanMatiere = data.matiere?.trim() || '';

    if (!cleanNom || !cleanPrenom) {
      return { success: false, error: 'Le nom et les prénoms sont obligatoires.' };
    }

    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'Veuillez saisir une adresse email valide.' };
    }

    const profiles = this.getItem<UserProfile[]>(STORAGE_KEYS.PROFILES, SEED_PROFILES);
    const index = profiles.findIndex((p) => p.id === userId);
    if (index === -1) {
      return { success: false, error: 'Compte utilisateur introuvable.' };
    }

    // Vérifier l'unicité de l'email si modifié
    const conflict = profiles.find((p) => p.email.toLowerCase() === cleanEmail && p.id !== userId);
    if (conflict) {
      return {
        success: false,
        error: `Cet email (${cleanEmail}) est déjà utilisé par un autre compte utilisateur.`,
      };
    }

    const updatedProfile: UserProfile = {
      ...profiles[index],
      nom: cleanNom,
      prenom: cleanPrenom,
      email: cleanEmail,
      telephone: cleanTelephone || undefined,
      adresse: cleanAdresse || undefined,
      matiere: cleanMatiere || undefined,
      updated_at: new Date().toISOString(),
    };

    profiles[index] = updatedProfile;
    this.setItem(STORAGE_KEYS.PROFILES, profiles);

    this.addAuditLog({
      user_id: operator.id,
      user_nom: `${operator.nom} ${operator.prenom}`,
      user_role: operator.role,
      action: 'MODIFICATION_MON_COMPTE',
      table_cible: 'profiles',
      record_id: userId,
      details: `Mise à jour des informations personnelles de ${cleanNom} ${cleanPrenom} (Email: ${cleanEmail}, Tél: ${cleanTelephone || 'N/A'}, Résidence: ${cleanAdresse || 'N/A'}, Matière: ${cleanMatiere || 'N/A'})`,
    });

    // Synchronisation en arrière-plan avec Supabase si connecté
    if (isSupabaseConfigured) {
      const client = getSupabaseClient();
      if (client) {
        void (async () => {
          try {
            await client.from('profiles').update({
              nom: updatedProfile.nom,
              prenom: updatedProfile.prenom,
              email: updatedProfile.email,
              telephone: updatedProfile.telephone || null,
              updated_at: updatedProfile.updated_at,
            }).eq('id', userId);
          } catch (err) {
            console.error('Exception Supabase profiles update:', err);
          }
        })();
      }
    }

    return { success: true, profile: updatedProfile };
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

    // Vérification stricte des permissions de modification de coefficient (Section 6 & 7) :
    // - Le Censeur dispose du contrôle administratif global.
    // - Un Enseignant ne peut modifier que le coefficient de sa propre matière dans les classes qui lui sont attribuées.
    // - Le Directeur Général ou autre rôle ne peut pas modifier globalement les coefficients sans droit Censeur.
    if (operator.role === 'ENSEIGNANT') {
      const teacherAffs = this.getAffectationsByProfile(operator.id);
      const teachesSubject = teacherAffs.some((a) => a.matiere_id === id);
      if (!teachesSubject) {
        throw new Error("Action non autorisée : Un enseignant ne peut modifier que le coefficient de sa propre matière dans les classes qui lui sont attribuées.");
      }
    } else if (!this.canAdminister(operator)) {
      throw new Error("Action non autorisée : Seul le Censeur dispose des droits administratifs globaux de modification des matières et coefficients.");
    }

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

  // --- ELEVES & INSCRIPTIONS PLURIANNUELLES ---
  public getEleves(anneeScolaire?: string): Eleve[] {
    const list = this.getItem<Eleve[]>(STORAGE_KEYS.ELEVES, SEED_ELEVES);
    if (!anneeScolaire) return list;
    const inscriptions = this.getInscriptionsByAnnee(anneeScolaire);
    if (inscriptions.length > 0) {
      const inscMap = new Map(inscriptions.map((i) => [i.eleve_id, i.classe_id]));
      return list
        .filter((e) => inscMap.has(e.id))
        .map((e) => ({
          ...e,
          classe_id: inscMap.get(e.id)!,
        }));
    }
    return list;
  }

  public getEleveById(id: string): Eleve | undefined {
    return this.getEleves().find((e) => e.id === id);
  }

  // --- GESTION DES INSCRIPTIONS ANNUELLES DES ÉLÈVES ---
  public getInscriptions(): InscriptionEleve[] {
    return this.getItem<InscriptionEleve[]>(STORAGE_KEYS.INSCRIPTIONS, SEED_INSCRIPTIONS);
  }

  public getInscriptionsByAnnee(annee: string): InscriptionEleve[] {
    return this.getInscriptions().filter((i) => i.annee_scolaire === annee && i.statut === 'ACTIF' && i.actif);
  }

  public getInscriptionsByEleve(eleveId: string): InscriptionEleve[] {
    return this.getInscriptions().filter((i) => i.eleve_id === eleveId);
  }

  public getInscription(eleveId: string, annee: string): InscriptionEleve | undefined {
    return this.getInscriptions().find((i) => i.eleve_id === eleveId && i.annee_scolaire === annee);
  }

  public getClasseOfEleve(eleveId: string, anneeScolaire?: string): Classe | undefined {
    const targetAnnee = anneeScolaire || this.getActiveAnneeScolaire().libelle;
    const insc = this.getInscription(eleveId, targetAnnee);
    if (insc) {
      return this.getClasseById(insc.classe_id);
    }
    // Si l'élève a des inscriptions pour d'autres années mais pas pour targetAnnee
    const eleveInscriptions = this.getInscriptionsByEleve(eleveId);
    if (eleveInscriptions.length > 0) {
      const match = eleveInscriptions.find((i) => i.annee_scolaire === targetAnnee);
      if (match) return this.getClasseById(match.classe_id);
      // Non inscrit pour cette année spécifique
      if (targetAnnee !== this.getActiveAnneeScolaire().libelle) {
        return undefined;
      }
    }
    const el = this.getEleveById(eleveId);
    return el ? this.getClasseById(el.classe_id) : undefined;
  }

  public getElevesByClasse(classeId: string, anneeScolaire?: string): Eleve[] {
    const allEleves = this.getEleves();
    const targetAnnee = anneeScolaire || this.getActiveAnneeScolaire().libelle;
    const inscriptions = this.getInscriptionsByAnnee(targetAnnee);

    if (inscriptions.length > 0) {
      const enrolledInscMap = new Map(
        inscriptions
          .filter((i) => i.classe_id === classeId && i.statut === 'ACTIF' && i.actif)
          .map((i) => [i.eleve_id, i])
      );
      return allEleves
        .filter((e) => enrolledInscMap.has(e.id) && e.statut === 'ACTIF')
        .map((e) => ({
          ...e,
          classe_id: enrolledInscMap.get(e.id)!.classe_id, // Toujours la classe historique précise
        }));
    }

    // Si le système a des inscriptions configurées mais que cette année n'en a aucune, la classe est vide
    if (this.getInscriptions().length > 0) {
      return [];
    }

    // Rétrocompatibilité : si aucune inscription pour cette année cible, filtrer par classe_id direct
    return allEleves.filter((e) => e.classe_id === classeId && e.statut === 'ACTIF');
  }

  public getElevesByAnnee(annee: string): Array<Eleve & { inscription: InscriptionEleve; classe_nom: string }> {
    const allEleves = this.getEleves();
    const inscripts = this.getInscriptionsByAnnee(annee);
    const classes = this.getClasses();
    const classesMap = new Map(classes.map((c) => [c.id, c.nom]));

    if (inscripts.length > 0) {
      const inscMap = new Map(inscripts.map((i) => [i.eleve_id, i]));
      const list: Array<Eleve & { inscription: InscriptionEleve; classe_nom: string }> = [];
      for (const el of allEleves) {
        const insc = inscMap.get(el.id);
        if (insc && el.statut === 'ACTIF') {
          list.push({
            ...el,
            classe_id: insc.classe_id, // Classe historique pour cette année
            inscription: insc,
            classe_nom: classesMap.get(insc.classe_id) || 'Inconnue',
          });
        }
      }
      return list;
    }

    if (this.getInscriptions().length > 0) {
      return [];
    }

    return allEleves
      .filter((e) => e.statut === 'ACTIF')
      .map((e) => ({
        ...e,
        inscription: {
          id: `insc-seed-${e.id}`,
          eleve_id: e.id,
          classe_id: e.classe_id,
          annee_scolaire: annee,
          statut: 'ACTIF',
          date_inscription: '2026-09-15',
          actif: true,
          created_at: '',
          updated_at: '',
        },
        classe_nom: classesMap.get(e.classe_id) || 'Inconnue',
      }));
  }

  public inscrireEleve(
    data: Omit<InscriptionEleve, 'id' | 'created_at' | 'updated_at'>,
    operator: UserProfile,
    logAudit = true
  ): InscriptionEleve {
    if (!this.canAdminister(operator)) {
      throw new Error("Action non autorisée : Seul le Censeur ou la Direction Générale a le droit d'inscrire des élèves.");
    }

    const inscriptions = this.getInscriptions();
    // Contrainte : pas deux inscriptions actives contradictoires pour le même élève et la même année
    const existing = inscriptions.find(
      (i) => i.eleve_id === data.eleve_id && i.annee_scolaire === data.annee_scolaire
    );
    if (existing) {
      throw new Error(`L'élève possède déjà une inscription pour l'année scolaire ${data.annee_scolaire}.`);
    }

    // Vérifier effectif maximal de 100 élèves dans la classe pour cette année
    const classeInscriptions = inscriptions.filter(
      (i) => i.classe_id === data.classe_id && i.annee_scolaire === data.annee_scolaire && i.statut === 'ACTIF' && i.actif
    );
    if (classeInscriptions.length >= 100) {
      throw new Error(`La classe sélectionnée a déjà atteint son effectif maximal de 100 élèves pour l'année ${data.annee_scolaire}.`);
    }

    const id = `insc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date().toISOString();
    const newInscription: InscriptionEleve = {
      ...data,
      id,
      created_at: now,
      updated_at: now,
    };

    inscriptions.push(newInscription);
    this.setItem(STORAGE_KEYS.INSCRIPTIONS, inscriptions);

    if (logAudit) {
      const el = this.getEleveById(data.eleve_id);
      const cls = this.getClasseById(data.classe_id);
      this.addAuditLog({
        user_id: operator.id,
        user_nom: `${operator.nom} ${operator.prenom}`,
        user_role: operator.role,
        action: 'INSCRIPTION_ELEVE_ANNEE',
        table_cible: 'inscriptions_eleves',
        record_id: id,
        details: `Inscription pour ${data.annee_scolaire} : ${el?.nom} ${el?.prenom} en ${cls?.nom}`,
      });
    }

    // Synchronisation en arrière-plan avec Supabase si connecté
    if (isSupabaseConfigured) {
      const client = getSupabaseClient();
      if (client) {
        void (async () => {
          try {
            await client.from('inscriptions_eleves').insert({
              id: newInscription.id,
              eleve_id: newInscription.eleve_id,
              classe_id: newInscription.classe_id,
              annee_scolaire: newInscription.annee_scolaire,
              statut: newInscription.statut,
              date_inscription: newInscription.date_inscription,
              redoublant: newInscription.redoublant || false,
              actif: newInscription.actif,
            });
          } catch (err) {
            console.error('Exception Supabase inscriptions_eleves insert:', err);
          }
        })();
      }
    }

    return newInscription;
  }

  public promouvoirEleve(
    eleveId: string,
    nouvelleClasseId: string,
    nouvelleAnnee: string,
    operator: UserProfile,
    redoublant = false
  ): InscriptionEleve {
    const el = this.getEleveById(eleveId);
    if (!el) throw new Error("Élève introuvable.");

    // Créer la nouvelle inscription pour la nouvelle année
    const newInsc = this.inscrireEleve({
      eleve_id: eleveId,
      classe_id: nouvelleClasseId,
      annee_scolaire: nouvelleAnnee,
      statut: 'ACTIF',
      date_inscription: new Date().toISOString().split('T')[0],
      redoublant,
      actif: true,
    }, operator, true);

    // Mettre à jour la classe courante de l'élève
    const eleves = this.getEleves();
    const idx = eleves.findIndex((e) => e.id === eleveId);
    if (idx !== -1) {
      eleves[idx] = {
        ...eleves[idx],
        classe_id: nouvelleClasseId,
        updated_at: new Date().toISOString(),
      };
      this.setItem(STORAGE_KEYS.ELEVES, eleves);
    }

    return newInsc;
  }

  public createEleve(data: Omit<Eleve, 'id' | 'created_at' | 'updated_at'>, operator: UserProfile): Eleve {
    // Vérification stricte des permissions (Point 10 & 11)
    if (!this.canAdminister(operator)) {
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

    // Inscription automatique pour l'année académique active
    const activeAnnee = this.getActiveAnneeScolaire().libelle;
    try {
      this.inscrireEleve(
        {
          eleve_id: id,
          classe_id: data.classe_id,
          annee_scolaire: activeAnnee,
          statut: data.statut,
          date_inscription: now.split('T')[0],
          redoublant: false,
          actif: data.statut === 'ACTIF',
        },
        operator,
        false
      );
    } catch (e) {
      console.warn("Auto-inscription eleve:", e);
    }

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
    // Vérification stricte des permissions (Point 10 & 11)
    if (!this.canAdminister(operator)) {
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

    // Mise à jour de l'inscription pour l'année scolaire active (sans toucher aux années antérieures)
    if (updates.classe_id) {
      const activeAnnee = this.getActiveAnneeScolaire().libelle;
      const inscripts = this.getInscriptions();
      const currentInscIndex = inscripts.findIndex((i) => i.eleve_id === id && i.annee_scolaire === activeAnnee);
      if (currentInscIndex !== -1) {
        inscripts[currentInscIndex] = {
          ...inscripts[currentInscIndex],
          classe_id: updates.classe_id,
          updated_at: new Date().toISOString(),
        };
        this.setItem(STORAGE_KEYS.INSCRIPTIONS, inscripts);
      }
    }

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

  public retirerEleveDeAnnee(eleveId: string, anneeScolaire: string, operator: UserProfile): boolean {
    if (!this.canAdminister(operator)) {
      throw new Error("Action non autorisée : Seul le Censeur ou la Direction peut retirer un élève d'une année scolaire.");
    }
    const inscripts = this.getInscriptions();
    const idx = inscripts.findIndex((i) => i.eleve_id === eleveId && i.annee_scolaire === anneeScolaire);
    if (idx === -1) {
      throw new Error("Inscription introuvable pour cette année scolaire.");
    }
    inscripts[idx] = {
      ...inscripts[idx],
      actif: false,
      statut: 'INACTIF',
      updated_at: new Date().toISOString(),
    };
    this.setItem(STORAGE_KEYS.INSCRIPTIONS, inscripts);

    const el = this.getEleveById(eleveId);
    this.addAuditLog({
      user_id: operator.id,
      user_nom: `${operator.nom} ${operator.prenom}`,
      user_role: operator.role,
      action: 'RETRAIT_ELEVE_ANNEE',
      table_cible: 'inscriptions',
      record_id: inscripts[idx].id,
      details: `Retrait de l'élève ${el?.nom || ''} ${el?.prenom || ''} pour l'année scolaire ${anneeScolaire}. Historique antérieur préservé.`,
    });

    return true;
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

  public getPeriodesByAnnee(anneeScolaire?: string): Periode[] {
    const list = this.getPeriodes();
    if (!anneeScolaire) return list;
    const filtered = list.filter((p) => (p.annee_scolaire || '2026–2027') === anneeScolaire);
    return filtered.length > 0 ? filtered : list;
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
    if (!this.canAdminister(operator)) {
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

    // Initialisation automatique des semestres et trimestres officiels pour la nouvelle année
    const periodes = this.getPeriodes();
    const startYear = data.libelle.split('–')[0] || data.libelle.split('-')[0] || '2027';
    const endYear = data.libelle.split('–')[1] || data.libelle.split('-')[1] || '2028';

    const s1: Periode = {
      id: `per-${id}-s1`,
      annee_scolaire: newAnnee.libelle,
      code: 'S1',
      nom: '1er semestre',
      is_active: false,
      is_locked: false,
      date_debut: data.date_debut,
      date_fin: `${endYear.trim()}-01-31`,
    };
    const s2: Periode = {
      id: `per-${id}-s2`,
      annee_scolaire: newAnnee.libelle,
      code: 'S2',
      nom: '2ème semestre',
      is_active: false,
      is_locked: true,
      date_debut: `${endYear.trim()}-02-01`,
      date_fin: data.date_fin,
    };
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
    periodes.push(s1, s2, t1, t2, t3);
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
    if (!this.canAdminister(operator)) {
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
    const cleanAttempt = passwordAttempt.trim();
    if (!cleanAttempt) return false;

    const profiles = this.getProfiles();
    const user = profiles.find(
      (p) => p.id === userIdOrEmail || p.email.toLowerCase() === userIdOrEmail.trim().toLowerCase()
    );
    if (!user) return false;

    const creds = this.getUserCredentials();
    const stored = creds[user.id];

    if (stored) {
      // 1. Format haché moderne
      if (stored.startsWith('sha256$')) {
        return stored === hashPassword(cleanAttempt);
      }
      // 2. Migration automatique et sécurisée d'un ancien mot de passe non haché
      if (stored === cleanAttempt) {
        creds[user.id] = hashPassword(cleanAttempt);
        this.setItem(STORAGE_KEYS.CREDENTIALS, creds);
        return true;
      }
    }

    // 3. Mots de passe par défaut acceptés pour les comptes officiels initiaux
    const isDefault = cleanAttempt === 'Passer123!' || cleanAttempt === 'Gogbo2026!';
    if (isDefault) {
      creds[user.id] = hashPassword(cleanAttempt);
      this.setItem(STORAGE_KEYS.CREDENTIALS, creds);
      return true;
    }

    return false;
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
    creds[userId] = hashPassword(newPass.trim());
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

  /**
   * RÉINITIALISATION SÉCURISÉE DU MOT DE PASSE (EXIGENCE 2 : COMPTE CENSEUR, CONCEPTEUR, ENSEIGNANTS)
   * Permet de rétablir l'accès sans jamais afficher ni récupérer le mot de passe en clair.
   */
  public async resetUserPassword(
    userIdOrEmail: string,
    newPass: string
  ): Promise<{ success: boolean; error?: string }> {
    const clean = userIdOrEmail.trim().toLowerCase();
    const profiles = this.getProfiles();
    const user = profiles.find((p) => p.id === userIdOrEmail || p.email.toLowerCase() === clean);
    if (!user) {
      return { success: false, error: 'Compte introuvable dans le système.' };
    }

    if (!newPass || newPass.trim().length < 6) {
      return { success: false, error: 'Le nouveau mot de passe doit comporter au moins 6 caractères.' };
    }

    const creds = this.getUserCredentials();
    creds[user.id] = hashPassword(newPass.trim());
    this.setItem(STORAGE_KEYS.CREDENTIALS, creds);

    // Sync Supabase Auth si configuré
    const supabase = getSupabaseClient();
    if (supabase && isSupabaseConfigured) {
      try {
        await supabase.auth.updateUser({ password: newPass.trim() });
      } catch (e) {
        console.warn('Supabase auth reset password error:', e);
      }
    }

    this.addAuditLog({
      user_id: user.id,
      user_nom: `${user.nom} ${user.prenom}`,
      user_role: user.role,
      action: 'REINITIALISATION_MOT_DE_PASSE',
      table_cible: 'auth',
      record_id: user.id,
      details: `Réinitialisation sécurisée du mot de passe pour ${user.prenom} ${user.nom} (${user.email})`,
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

  // --- ATTRIBUTIONS DE CLASSE (AFFECTATIONS PÉDAGOGIQUES PLURIANNUELLES) ---
  public getAffectations(anneeScolaire?: string): AffectationPedagogique[] {
    const list = this.getItem<AffectationPedagogique[]>(STORAGE_KEYS.AFFECTATIONS, SEED_AFFECTATIONS);
    const normalized = list.map((a) => a.annee_scolaire ? a : { ...a, annee_scolaire: '2026–2027' });
    if (anneeScolaire) {
      return normalized.filter((a) => a.annee_scolaire === anneeScolaire);
    }
    return normalized;
  }

  public getAffectationsByProfile(profileId: string, anneeScolaire?: string): AffectationPedagogique[] {
    return this.getAffectations(anneeScolaire).filter((a) => a.profile_id === profileId && a.statut === 'ACTIF');
  }

  public getAffectationsByClasse(classeId: string, anneeScolaire?: string): AffectationPedagogique[] {
    return this.getAffectations(anneeScolaire).filter((a) => a.classe_id === classeId && a.statut === 'ACTIF');
  }

  /**
   * RÈGLE PARTICULIÈRE POUR 6ème À 3ème :
   * Pour les classes de 6ème, 5ème, 4ème et 3ème :
   * Lecture et Communication écrite doivent être attribuées au même enseignant dans une même classe.
   * Il est interdit d'avoir Lecture -> Enseignant X et Communication écrite -> Enseignant Y dans la même classe.
   */
  public validateLectureCommunicationRule(
    profileId: string,
    classeId: string,
    matiereId: string,
    anneeScolaire: string,
    excludeAffId?: string
  ): void {
    const classe = this.getClasseById(classeId);
    if (!classe) return;
    const isPremierCycle = ['6ème', '5ème', '4ème', '3ème'].includes(classe.niveau) ||
      ['6', '5', '4', '3'].some((prefix) => classe.nom.startsWith(prefix));
    if (!isPremierCycle) return;

    const matiere = this.getMatiereById(matiereId);
    if (!matiere) return;

    const isLecture = matiere.code === 'LECTURE' || matiere.id === 'mat-lect' || matiere.nom.toLowerCase().includes('lecture');
    const isComm = matiere.code === 'COMM_ECR' || matiere.id === 'mat-comm' || matiere.nom.toLowerCase().includes('communication');

    if (!isLecture && !isComm) return;

    const targetPartnerName = isLecture ? 'Communication écrite' : 'Lecture';
    const affectationsInClass = this.getAffectations(anneeScolaire).filter(
      (a) => a.classe_id === classeId && a.statut === 'ACTIF' && a.id !== excludeAffId
    );

    for (const aff of affectationsInClass) {
      const m = this.getMatiereById(aff.matiere_id);
      if (!m) continue;
      const isPartner = isLecture
        ? (m.code === 'COMM_ECR' || m.id === 'mat-comm' || m.nom.toLowerCase().includes('communication'))
        : (m.code === 'LECTURE' || m.id === 'mat-lect' || m.nom.toLowerCase().includes('lecture'));

      if (isPartner && aff.profile_id !== profileId) {
        const assignedProf = this.getProfileById(aff.profile_id);
        const profName = assignedProf ? `${assignedProf.nom} ${assignedProf.prenom}` : 'un autre enseignant';
        throw new Error(
          `Règle pédagogique obligatoire (6ème à 3ème) : Pour la classe ${classe.nom}, Lecture et Communication écrite doivent être obligatoirement attribuées au même enseignant. ${targetPartnerName} est actuellement attribuée à ${profName}.`
        );
      }
    }
  }

  public createAffectation(
    data: Omit<AffectationPedagogique, 'id' | 'created_at' | 'updated_at' | 'annee_scolaire'> & { annee_scolaire?: string },
    operator: UserProfile
  ): AffectationPedagogique {
    if (!this.canAdminister(operator)) {
      throw new Error("Action non autorisée : Seul le Censeur ou la Direction peut gérer les attributions de classe.");
    }
    const annee = data.annee_scolaire || this.getActiveAnneeScolaire().libelle;
    const list = this.getAffectations();

    // Vérifier doublon (même enseignant + classe + matière + année scolaire)
    const exists = list.some(
      (a) =>
        a.profile_id === data.profile_id &&
        a.classe_id === data.classe_id &&
        a.matiere_id === data.matiere_id &&
        (a.annee_scolaire || '2026–2027') === annee &&
        a.statut === 'ACTIF'
    );
    if (exists) {
      throw new Error(`Cette attribution de classe existe déjà pour cet enseignant, cette classe et cette matière en ${annee}.`);
    }

    // Vérifier la règle 6ème à 3ème (Lecture et Communication écrite = même enseignant)
    this.validateLectureCommunicationRule(data.profile_id, data.classe_id, data.matiere_id, annee);

    const id = `aff-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date().toISOString();
    const newAff: AffectationPedagogique = {
      ...data,
      annee_scolaire: annee,
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
      details: `Attribution (${annee}): ${prof?.nom} ${prof?.prenom} -> ${classe?.nom} -> ${mat?.nom} (${data.heures_hebdo}h/sem)`,
    });

    return newAff;
  }

  public updateAffectation(
    id: string,
    data: Partial<Omit<AffectationPedagogique, 'id' | 'created_at' | 'updated_at'>>,
    operator: UserProfile
  ): AffectationPedagogique {
    if (!this.canAdminister(operator)) {
      throw new Error("Action non autorisée : Seul le Censeur ou la Direction peut gérer les attributions de classe.");
    }
    const list = this.getAffectations();
    const idx = list.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error('Attribution de classe introuvable.');

    const current = list[idx];
    const targetProfileId = data.profile_id || current.profile_id;
    const targetClasseId = data.classe_id || current.classe_id;
    const targetMatiereId = data.matiere_id || current.matiere_id;
    const targetAnnee = data.annee_scolaire || current.annee_scolaire || this.getActiveAnneeScolaire().libelle;

    // Vérifier doublon
    const exists = list.some(
      (a) =>
        a.id !== id &&
        a.profile_id === targetProfileId &&
        a.classe_id === targetClasseId &&
        a.matiere_id === targetMatiereId &&
        (a.annee_scolaire || '2026–2027') === targetAnnee &&
        a.statut === 'ACTIF'
    );
    if (exists) {
      throw new Error(`Une attribution active existe déjà pour cet enseignant, cette classe et cette matière en ${targetAnnee}.`);
    }

    // Vérifier la règle 6ème à 3ème (Lecture et Communication écrite = même enseignant)
    this.validateLectureCommunicationRule(targetProfileId, targetClasseId, targetMatiereId, targetAnnee, id);

    list[idx] = {
      ...current,
      ...data,
      profile_id: targetProfileId,
      classe_id: targetClasseId,
      matiere_id: targetMatiereId,
      annee_scolaire: targetAnnee,
      heures_hebdo: data.heures_hebdo !== undefined ? data.heures_hebdo : current.heures_hebdo,
      updated_at: new Date().toISOString(),
    };

    this.setItem(STORAGE_KEYS.AFFECTATIONS, list);

    const prof = this.getProfileById(targetProfileId);
    const classe = this.getClasseById(targetClasseId);
    const mat = this.getMatiereById(targetMatiereId);

    this.addAuditLog({
      user_id: operator.id,
      user_nom: `${operator.nom} ${operator.prenom}`,
      user_role: operator.role,
      action: 'MODIFICATION_AFFECTATION',
      table_cible: 'affectations',
      record_id: id,
      details: `Modification attribution (${targetAnnee}): ${prof?.nom} ${prof?.prenom} -> ${classe?.nom} -> ${mat?.nom}`,
    });

    return list[idx];
  }

  /**
   * Création simultanée de plusieurs attributions pour un même enseignant et une même matière
   * dans plusieurs classes distinctes pour une année scolaire donnée.
   */
  public createAffectationsBulk(
    profileId: string,
    classeIds: string[],
    matiereId: string,
    anneeScolaire: string,
    heuresHebdo: number,
    operator: UserProfile,
    includeTwinCommLect = false
  ): { created: AffectationPedagogique[]; errors: string[] } {
    const created: AffectationPedagogique[] = [];
    const errors: string[] = [];

    const mat = this.getMatiereById(matiereId);
    const isLectureOrComm = mat && (
      mat.code === 'LECTURE' || mat.code === 'COMM_ECR' ||
      mat.id === 'mat-lect' || mat.id === 'mat-comm' ||
      mat.nom.toLowerCase().includes('lecture') || mat.nom.toLowerCase().includes('communication')
    );
    const twinSubject = isLectureOrComm
      ? this.getMatieres().find((m) =>
          (mat.code === 'LECTURE' || mat.nom.toLowerCase().includes('lecture'))
            ? (m.code === 'COMM_ECR' || m.id === 'mat-comm' || m.nom.toLowerCase().includes('communication'))
            : (m.code === 'LECTURE' || m.id === 'mat-lect' || m.nom.toLowerCase().includes('lecture'))
        )
      : undefined;

    for (const cId of classeIds) {
      const cls = this.getClasseById(cId);
      const clsName = cls?.nom || cId;
      try {
        const aff = this.createAffectation(
          {
            profile_id: profileId,
            classe_id: cId,
            matiere_id: matiereId,
            annee_scolaire: anneeScolaire,
            heures_hebdo: heuresHebdo,
            statut: 'ACTIF',
          },
          operator
        );
        created.push(aff);

        // Si attribution jumelle demandée (Lecture + Communication écrite pour 6e à 3e)
        if (includeTwinCommLect && twinSubject && cls) {
          const isPremierCycle = ['6ème', '5ème', '4ème', '3ème'].includes(cls.niveau) ||
            ['6', '5', '4', '3'].some((prefix) => cls.nom.startsWith(prefix));
          if (isPremierCycle) {
            try {
              const twinAff = this.createAffectation(
                {
                  profile_id: profileId,
                  classe_id: cId,
                  matiere_id: twinSubject.id,
                  annee_scolaire: anneeScolaire,
                  heures_hebdo: twinSubject.coefficient > 0 ? twinSubject.coefficient : 2,
                  statut: 'ACTIF',
                },
                operator
              );
              created.push(twinAff);
            } catch {
              // Doublon ou déjà attribué
            }
          }
        }
      } catch (err: unknown) {
        errors.push(`${clsName} : ${err instanceof Error ? err.message : 'Erreur'}`);
      }
    }

    return { created, errors };
  }

  public deleteAffectation(id: string, operator: UserProfile): void {
    if (!this.canAdminister(operator)) {
      throw new Error("Action non autorisée : Seul le Censeur ou la Direction peut gérer les attributions de classe.");
    }
    const list = this.getAffectations();
    const aff = list.find((a) => a.id === id);
    if (!aff) throw new Error('Attribution de classe introuvable');

    const updated = list.filter((a) => a.id !== id);
    this.setItem(STORAGE_KEYS.AFFECTATIONS, updated);

    this.addAuditLog({
      user_id: operator.id,
      user_nom: `${operator.nom} ${operator.prenom}`,
      user_role: operator.role,
      action: 'SUPPRESSION_AFFECTATION',
      table_cible: 'affectations',
      record_id: id,
      details: `Suppression attribution de classe: ID ${id}`,
    });
  }

  public toggleAffectationStatus(id: string, operator: UserProfile): AffectationPedagogique {
    if (!this.canAdminister(operator)) {
      throw new Error("Action non autorisée : Seul le Censeur ou la Direction peut gérer les attributions de classe.");
    }
    const list = this.getAffectations();
    const idx = list.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error('Attribution de classe introuvable');

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
      details: `Changement statut attribution de classe -> ${newStatut}`,
    });

    return list[idx];
  }

  // --- GESTION DES NOTES ET PERMISSIONS (SECTION 3, 10, 16) ---

  /**
   * Vérification stricte des permissions de saisie :
   * L'utilisateur DOIT posséder une attribution de classe active pour cette année scolaire sur la combinaison (Classe + Matière),
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

    // 1.1 Vérifier que l'année scolaire de la période n'est pas clôturée
    const annees = this.getAnneesScolaires();
    const anneeObj = annees.find((a) => a.libelle === periode.annee_scolaire);
    if (anneeObj && anneeObj.statut === 'CLOTUREE') {
      return {
        allowed: false,
        reason: `L'année scolaire ${periode.annee_scolaire} est archivée et clôturée. Aucune saisie ou modification de note n'y est autorisée.`,
      };
    }

    // 2. Vérifier l'attribution active POUR L'ANNÉE DE LA PÉRIODE
    const affectations = this.getAffectations(periode.annee_scolaire);
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
          `Accès refusé : Vous ne disposez pas d'une attribution de classe active pour cette classe et cette matière en ${periode.annee_scolaire}. Seul l'enseignant ou personnel attribué pour cette année scolaire peut saisir ces notes.`,
      };
    }

    return { allowed: true, affectationId: activeAffectation.id };
  }

  public getNotes(): Note[] {
    return this.getItem<Note[]>(STORAGE_KEYS.NOTES, SEED_NOTES);
  }

  public getNotesByEleve(eleveId: string, anneeScolaire?: string): Note[] {
    const list = this.getNotes().filter((n) => n.eleve_id === eleveId);
    if (anneeScolaire) {
      return list.filter((n) => {
        if (n.annee_scolaire) return n.annee_scolaire === anneeScolaire;
        const p = this.getPeriodes().find((per) => per.id === n.periode_id);
        return p?.annee_scolaire === anneeScolaire;
      });
    }
    return list;
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
      throw new Error('Attribution de classe introuvable ou inactive.');
    }

    // Vérification RLS applicative : L'utilisateur qui saisit doit être le titulaire de l'attribution
    if (aff.profile_id !== user.id) {
      throw new Error(
        "Violation de sécurité RLS : Vous ne pouvez pas saisir ou modifier les notes d'une attribution de classe qui ne vous a pas été accordée."
      );
    }

    // Vérifier le verrouillage de la période
    const periodes = this.getPeriodes();
    const per = periodes.find((p) => p.id === data.periode_id);
    if (!per || per.is_locked) {
      throw new Error('Saisie refusée : la période sélectionnée est clôturée ou verrouillée.');
    }

    // Vérifier si l'année scolaire de la période est clôturée
    const annees = this.getAnneesScolaires();
    const anneeObj = annees.find((a) => a.libelle === per.annee_scolaire);
    if (anneeObj && anneeObj.statut === 'CLOTUREE') {
      throw new Error(`Saisie refusée : l'année scolaire ${per.annee_scolaire} est clôturée et archivée.`);
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
        annee_scolaire: per.annee_scolaire,
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
        annee_scolaire: per.annee_scolaire,
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
      details: `${existingIndex !== -1 ? 'Modification' : 'Saisie'} note (${data.type_evaluation}) pour ${eleve?.nom} ${eleve?.prenom} (${per.annee_scolaire}): ${noteVal}/20`,
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

  // --- MODULE SUIVI DES PRÉSENCES (ABSENCES & ABANDONS) (Section 8) ---
  public getPresences(): EnregistrementPresence[] {
    return this.getItem<EnregistrementPresence[]>(STORAGE_KEYS.PRESENCES, SEED_PRESENCES);
  }

  public getPresencesByAnnee(annee: string): EnregistrementPresence[] {
    return this.getPresences().filter((p) => p.annee_scolaire === annee);
  }

  public getPresencesByClasse(classeId: string, annee: string): EnregistrementPresence[] {
    return this.getPresences().filter((p) => p.classe_id === classeId && p.annee_scolaire === annee);
  }

  public getPresencesByEleve(eleveId: string, annee: string): EnregistrementPresence[] {
    return this.getPresences().filter((p) => p.eleve_id === eleveId && p.annee_scolaire === annee);
  }

  public savePresence(
    data: Omit<EnregistrementPresence, 'id' | 'created_at' | 'updated_at'>,
    operator: UserProfile
  ): EnregistrementPresence {
    if (operator.role !== 'SURVEILLANT_GENERAL' && !this.canAdminister(operator)) {
      throw new Error("Action non autorisée : Seul le Surveillant Général ou l'Administration peut enregistrer des présences / absences.");
    }
    const list = this.getPresences();
    const id = `pres-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date().toISOString();
    const newEntry: EnregistrementPresence = {
      ...data,
      id,
      created_at: now,
      updated_at: now,
    };
    list.push(newEntry);
    this.setItem(STORAGE_KEYS.PRESENCES, list);

    this.addAuditLog({
      user_id: operator.id,
      user_nom: `${operator.nom} ${operator.prenom}`,
      user_role: operator.role,
      action: 'ENREGISTREMENT_PRESENCE',
      table_cible: 'presences',
      record_id: id,
      details: `${data.statut} enregistré pour élève ${data.eleve_id} (Date: ${data.date})`,
    });

    return newEntry;
  }

  public deletePresence(id: string, operator: UserProfile): boolean {
    if (operator.role !== 'SURVEILLANT_GENERAL' && !this.canAdminister(operator)) {
      throw new Error("Action non autorisée : Seul le Surveillant Général ou l'Administration peut supprimer un enregistrement de présence.");
    }
    const list = this.getPresences();
    const updated = list.filter((p) => p.id !== id);
    this.setItem(STORAGE_KEYS.PRESENCES, updated);

    this.addAuditLog({
      user_id: operator.id,
      user_nom: `${operator.nom} ${operator.prenom}`,
      user_role: operator.role,
      action: 'SUPPRESSION_PRESENCE',
      table_cible: 'presences',
      record_id: id,
      details: `Suppression enregistrement présence ID: ${id}`,
    });

    return true;
  }

  public getEleveAbsencesCount(eleveId: string, annee: string, periodeId?: string): number {
    const list = this.getPresencesByEleve(eleveId, annee);
    return list.filter((p) => {
      if (p.statut !== 'ABSENT') return false;
      if (periodeId && p.periode_id && p.periode_id !== periodeId) return false;
      return true;
    }).length;
  }

  public isEleveAbandon(eleveId: string, annee: string): boolean {
    const list = this.getPresencesByEleve(eleveId, annee);
    return list.some((p) => p.statut === 'ABANDON');
  }

  // --- MODULE GESTION DES PAIEMENTS & CONTRIBUTIONS (Section 9) ---
  public getPaiements(): PaiementContribution[] {
    return this.getItem<PaiementContribution[]>(STORAGE_KEYS.PAIEMENTS, SEED_PAIEMENTS);
  }

  public getPaiementsByAnnee(annee: string): PaiementContribution[] {
    return this.getPaiements().filter((p) => p.annee_scolaire === annee);
  }

  public getPaiementsByEleve(eleveId: string, annee: string): PaiementContribution[] {
    return this.getPaiements().filter((p) => p.eleve_id === eleveId && p.annee_scolaire === annee);
  }

  public savePaiement(
    data: Omit<PaiementContribution, 'id' | 'created_at' | 'updated_at'>,
    operator: UserProfile
  ): PaiementContribution {
    if (operator.role !== 'COMPTABLE' && !this.canAdminister(operator)) {
      throw new Error("Action non autorisée : Seul le Comptable ou l'Administration peut enregistrer des paiements de contributions scolaires.");
    }
    const list = this.getPaiements();
    const id = `pay-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date().toISOString();
    const newEntry: PaiementContribution = {
      ...data,
      id,
      created_at: now,
      updated_at: now,
    };
    list.push(newEntry);
    this.setItem(STORAGE_KEYS.PAIEMENTS, list);

    this.addAuditLog({
      user_id: operator.id,
      user_nom: `${operator.nom} ${operator.prenom}`,
      user_role: operator.role,
      action: 'ENREGISTREMENT_PAIEMENT',
      table_cible: 'paiements',
      record_id: id,
      details: `Reçu ${data.numero_recu} - Montant: ${data.montant_paye} FCFA pour élève ${data.eleve_id}`,
    });

    return newEntry;
  }

  public deletePaiement(id: string, operator: UserProfile): boolean {
    if (operator.role !== 'COMPTABLE' && !this.canAdminister(operator)) {
      throw new Error("Action non autorisée : Seul le Comptable ou l'Administration peut supprimer un reçu.");
    }
    const list = this.getPaiements();
    const updated = list.filter((p) => p.id !== id);
    this.setItem(STORAGE_KEYS.PAIEMENTS, updated);

    this.addAuditLog({
      user_id: operator.id,
      user_nom: `${operator.nom} ${operator.prenom}`,
      user_role: operator.role,
      action: 'SUPPRESSION_PAIEMENT',
      table_cible: 'paiements',
      record_id: id,
      details: `Suppression paiement ID: ${id}`,
    });

    return true;
  }

  // ====================================================================
  // MODULE : PRÉSENCE JOURNALIÈRE DES ENSEIGNANTS (RÉSERVÉ AU CENSEUR)
  // ====================================================================
  /**
   * SOURCE UNIQUE & EXCLUSIVE DES MATIÈRES D'UN ENSEIGNANT :
   * Récupère la liste dédupliquée des matières RÉELLEMENT attribuées
   * par le Censeur pour l'année scolaire indiquée (Enseignant → Année → Classe → Matière).
   * Ne déduit, n'invente et ne préremplit JAMAIS de matière fictive.
   */
  public getMatieresAttribueesEnseignant(profileId: string, anneeScolaire: string): string[] {
    const affectations = this.getAffectationsByProfile(profileId, anneeScolaire);
    const matieresSet = new Set<string>();
    for (const aff of affectations) {
      if (aff.statut === 'ACTIF') {
        const mat = this.getMatiereById(aff.matiere_id);
        if (mat && mat.nom && mat.nom.trim()) {
          matieresSet.add(mat.nom.trim());
        }
      }
    }
    return Array.from(matieresSet).sort((a, b) => a.localeCompare(b));
  }

  /**
   * Retourne le libellé officiel des matières attribuées (ex: "SVT, Mathématiques")
   * ou "Aucune matière attribuée" si le professeur n'a aucune attribution active pour cette année.
   */
  public getMatieresAttribueesLabel(profileId: string, anneeScolaire: string): string {
    const matieres = this.getMatieresAttribueesEnseignant(profileId, anneeScolaire);
    if (matieres.length === 0) {
      return 'Aucune matière attribuée';
    }
    return matieres.join(', ');
  }

  public getPresencesEnseignants(): PresenceEnseignant[] {
    return this.getItem<PresenceEnseignant[]>(STORAGE_KEYS.PRESENCES_ENSEIGNANTS, []);
  }

  public getPresencesEnseignantsByAnnee(annee: string): PresenceEnseignant[] {
    return this.getPresencesEnseignants().filter((p) => p.annee_scolaire === annee);
  }

  public getPresencesEnseignantsByDate(date: string, annee?: string): PresenceEnseignant[] {
    return this.getPresencesEnseignants().filter((p) => {
      if (annee && p.annee_scolaire !== annee) return false;
      return p.date === date;
    });
  }

  public getPresencesEnseignantsByEnseignant(enseignantId: string, annee?: string): PresenceEnseignant[] {
    return this.getPresencesEnseignants().filter((p) => {
      if (annee && p.annee_scolaire !== annee) return false;
      return p.enseignant_id === enseignantId;
    });
  }

  public canManagePresencesEnseignants(operator: UserProfile): boolean {
    return ['CENSEUR', 'CONCEPTEUR', 'DIRECTEUR_GENERAL'].includes(operator.role);
  }

  public async savePresenceEnseignant(
    data: Omit<PresenceEnseignant, 'id' | 'created_at' | 'updated_at'>,
    operator: UserProfile
  ): Promise<PresenceEnseignant> {
    if (!this.canManagePresencesEnseignants(operator)) {
      throw new Error("Action non autorisée : Seul le Censeur ou l'Administration peut enregistrer la présence journalière des enseignants.");
    }

    const list = this.getPresencesEnseignants();
    const existingIndex = list.findIndex(
      (p) => p.enseignant_id === data.enseignant_id && p.date === data.date && p.annee_scolaire === data.annee_scolaire
    );

    // Récupération stricte de la matière attribuée actuelle si non spécifiée
    const matieresSnapshot = data.matieres_attribuees ?? this.getMatieresAttribueesLabel(data.enseignant_id, data.annee_scolaire);

    const now = new Date().toISOString();
    let result: PresenceEnseignant;

    if (existingIndex !== -1) {
      const prev = list[existingIndex];
      result = {
        ...prev,
        statut: data.statut,
        motif: data.motif !== undefined ? data.motif : prev.motif,
        heure_arrivee: data.statut === 'RETARD' ? (data.heure_arrivee || prev.heure_arrivee || '') : '',
        enseignant_nom: data.enseignant_nom,
        matieres_attribuees: matieresSnapshot,
        enregistre_par_id: operator.id,
        enregistre_par_nom: `${operator.nom} ${operator.prenom}`,
        updated_at: now,
      };
      list[existingIndex] = result;

      this.addAuditLog({
        user_id: operator.id,
        user_nom: `${operator.nom} ${operator.prenom}`,
        user_role: operator.role,
        action: 'MODIFICATION_PRESENCE_ENSEIGNANT',
        table_cible: 'presences_enseignants',
        record_id: result.id,
        details: `Modification présence pour ${data.enseignant_nom} [${matieresSnapshot}] (${data.date}) : ${prev.statut} → ${data.statut}${data.motif ? ` (Motif : ${data.motif})` : ''}`,
      });
    } else {
      const id = `pren-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      result = {
        id,
        annee_scolaire: data.annee_scolaire,
        date: data.date,
        enseignant_id: data.enseignant_id,
        enseignant_nom: data.enseignant_nom,
        matieres_attribuees: matieresSnapshot,
        statut: data.statut,
        motif: data.motif ?? '',
        heure_arrivee: data.statut === 'RETARD' ? (data.heure_arrivee || '') : '',
        enregistre_par_id: operator.id,
        enregistre_par_nom: `${operator.nom} ${operator.prenom}`,
        created_at: now,
        updated_at: now,
      };
      list.push(result);

      this.addAuditLog({
        user_id: operator.id,
        user_nom: `${operator.nom} ${operator.prenom}`,
        user_role: operator.role,
        action: 'SAISIE_PRESENCE_ENSEIGNANT',
        table_cible: 'presences_enseignants',
        record_id: result.id,
        details: `Saisie présence (${data.statut}) pour ${data.enseignant_nom} [${matieresSnapshot}] (${data.date})${data.heure_arrivee ? ` à ${data.heure_arrivee}` : ''}${data.motif ? ` (Motif : ${data.motif})` : ''}`,
      });
    }

    this.setItem(STORAGE_KEYS.PRESENCES_ENSEIGNANTS, list);

    // Synchronisation Supabase si connecté
    const supabase = getSupabaseClient();
    if (supabase && isSupabaseConfigured) {
      try {
        await supabase.from('presences_enseignants').upsert({
          id: result.id,
          annee_scolaire: result.annee_scolaire,
          date: result.date,
          enseignant_id: result.enseignant_id,
          enseignant_nom: result.enseignant_nom,
          matieres_attribuees: result.matieres_attribuees,
          statut: result.statut,
          motif: result.motif,
          heure_arrivee: result.heure_arrivee,
          enregistre_par_id: result.enregistre_par_id,
          enregistre_par_nom: result.enregistre_par_nom,
          updated_at: result.updated_at,
        });
      } catch (err) {
        console.warn('Sync Supabase presences_enseignants failed:', err);
      }
    }

    return result;
  }

  public async batchSavePresencesEnseignants(
    entries: Array<Omit<PresenceEnseignant, 'id' | 'created_at' | 'updated_at'>>,
    operator: UserProfile
  ): Promise<PresenceEnseignant[]> {
    if (!this.canManagePresencesEnseignants(operator)) {
      throw new Error("Action non autorisée : Seul le Censeur ou l'Administration peut enregistrer la présence des enseignants.");
    }
    const results: PresenceEnseignant[] = [];
    for (const entry of entries) {
      const res = await this.savePresenceEnseignant(entry, operator);
      results.push(res);
    }
    return results;
  }

  public async deletePresenceEnseignant(id: string, operator: UserProfile): Promise<boolean> {
    if (!this.canManagePresencesEnseignants(operator)) {
      throw new Error("Action non autorisée.");
    }
    const list = this.getPresencesEnseignants();
    const item = list.find((p) => p.id === id);
    if (!item) return false;

    const updated = list.filter((p) => p.id !== id);
    this.setItem(STORAGE_KEYS.PRESENCES_ENSEIGNANTS, updated);

    this.addAuditLog({
      user_id: operator.id,
      user_nom: `${operator.nom} ${operator.prenom}`,
      user_role: operator.role,
      action: 'SUPPRESSION_PRESENCE_ENSEIGNANT',
      table_cible: 'presences_enseignants',
      record_id: id,
      details: `Suppression enregistrement présence de ${item.enseignant_nom} (${item.date})`,
    });

    const supabase = getSupabaseClient();
    if (supabase && isSupabaseConfigured) {
      try {
        await supabase.from('presences_enseignants').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase delete presence enseignant failed:', err);
      }
    }

    return true;
  }

  // --- UTILITAIRES / EXPORT / RESET ---
  public resetToDefaults(): void {
    localStorage.removeItem(STORAGE_KEYS.VERSION);
    this.init();
  }

  public exportDatabaseJSON(): string {
    const data = {
      parametres: this.getParametres(),
      annees_scolaires: this.getAnneesScolaires(),
      profiles: this.getProfiles(),
      classes: this.getClasses(),
      matieres: this.getMatieres(),
      eleves: this.getEleves(),
      inscriptions: this.getInscriptions(),
      periodes: this.getPeriodes(),
      affectations: this.getAffectations(),
      notes: this.getNotes(),
      presences: this.getPresences(),
      presences_enseignants: this.getPresencesEnseignants(),
      paiements: this.getPaiements(),
      audit_logs: this.getAuditLogs(),
      exported_at: new Date().toISOString(),
      version: '2.2.0',
    };
    return JSON.stringify(data, null, 2);
  }

  public importDatabaseJSON(jsonStr: string, operator: UserProfile): void {
    try {
      const data = JSON.parse(jsonStr);
      if (data.profiles && data.classes && data.eleves) {
        if (data.parametres) this.setItem(STORAGE_KEYS.PARAMETRES, data.parametres);
        if (data.annees_scolaires) this.setItem(STORAGE_KEYS.ANNEES_SCOLAIRES, data.annees_scolaires);
        this.setItem(STORAGE_KEYS.PROFILES, data.profiles);
        this.setItem(STORAGE_KEYS.CLASSES, data.classes);
        this.setItem(STORAGE_KEYS.MATIERES, data.matieres);
        this.setItem(STORAGE_KEYS.ELEVES, data.eleves);
        if (data.inscriptions) this.setItem(STORAGE_KEYS.INSCRIPTIONS, data.inscriptions);
        this.setItem(STORAGE_KEYS.PERIODES, data.periodes);
        this.setItem(STORAGE_KEYS.AFFECTATIONS, data.affectations);
        this.setItem(STORAGE_KEYS.NOTES, data.notes);
        if (data.presences) this.setItem(STORAGE_KEYS.PRESENCES, data.presences);
        if (data.presences_enseignants) this.setItem(STORAGE_KEYS.PRESENCES_ENSEIGNANTS, data.presences_enseignants);
        if (data.paiements) this.setItem(STORAGE_KEYS.PAIEMENTS, data.paiements);
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
