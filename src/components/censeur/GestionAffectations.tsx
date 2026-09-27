import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAnnee } from '../../context/AnneeContext';
import { storage } from '../../lib/storage';
import { AffectationPedagogique, Classe } from '../../types';
import { 
  Network, 
  Plus, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  School, 
  GraduationCap, 
  BookOpen, 
  X,
  Power,
  Loader2,
  AlertTriangle,
  Calendar,
  Search,
  Filter,
  Edit3,
  CheckSquare,
  Square,
  Clock,
  Info,
  Check
} from 'lucide-react';

export const GestionAffectations: React.FC = () => {
  const { currentUser, isCenseur } = useAuth();
  const { selectedAnnee, annees } = useAnnee();

  // Année cible filtrée (par défaut l'année en cours ou sélectionnée dans la barre globale)
  const [targetAnnee, setTargetAnnee] = useState<string>(selectedAnnee.libelle);
  const [affectations, setAffectations] = useState<AffectationPedagogique[]>(
    storage.getAffectations(selectedAnnee.libelle)
  );

  const profiles = storage.getProfiles();
  const classes = storage.getClasses();
  const matieres = storage.getMatieres();

  // Enseignants et personnels autorisés à enseigner
  const eligibleTeachers = profiles.filter((p) => p.is_enseignant && p.statut === 'ACTIF');

  // Filtres de recherche
  const [searchTeacher, setSearchTeacher] = useState<string>('');
  const [filterTeacherId, setFilterTeacherId] = useState<string>('ALL');
  const [filterClasseId, setFilterClasseId] = useState<string>('ALL');
  const [filterMatiereId, setFilterMatiereId] = useState<string>('ALL');

  // État Modal de Création (Attributions simples ou multiples)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formProfileId, setFormProfileId] = useState(eligibleTeachers[0]?.id || '');
  const [formAnnee, setFormAnnee] = useState<string>(selectedAnnee.libelle);
  const [formMatiereId, setFormMatiereId] = useState(matieres[0]?.id || '');
  const [selectedClasseIds, setSelectedClasseIds] = useState<string[]>([]);
  const [formHeuresHebdo, setFormHeuresHebdo] = useState<number>(4);
  const [formIncludeTwinCommLect, setFormIncludeTwinCommLect] = useState<boolean>(true);

  // État Modal d'Édition / Modification
  const [editingAffectation, setEditingAffectation] = useState<AffectationPedagogique | null>(null);
  const [editProfileId, setEditProfileId] = useState('');
  const [editClasseId, setEditClasseId] = useState('');
  const [editMatiereId, setEditMatiereId] = useState('');
  const [editAnnee, setEditAnnee] = useState('');
  const [editHeuresHebdo, setEditHeuresHebdo] = useState<number>(4);

  // État Modal de Suppression
  const [confirmDeleteAffId, setConfirmDeleteAffId] = useState<string | null>(null);

  // État de chargement et retours
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const refreshList = (annee?: string) => {
    const yr = annee !== undefined ? annee : targetAnnee;
    if (yr === 'ALL') {
      setAffectations(storage.getAffectations());
    } else {
      setAffectations(storage.getAffectations(yr));
    }
  };

  const handleAnneeFilterChange = (anneeLibelle: string) => {
    setTargetAnnee(anneeLibelle);
    refreshList(anneeLibelle);
  };

  // Liste filtrée selon les critères
  const filteredAffectations = useMemo(() => {
    return affectations.filter((aff) => {
      // 1. Filtre Enseignant par ID
      if (filterTeacherId !== 'ALL' && aff.profile_id !== filterTeacherId) {
        return false;
      }

      // 2. Filtre Classe
      if (filterClasseId !== 'ALL' && aff.classe_id !== filterClasseId) {
        return false;
      }

      // 3. Filtre Matière
      if (filterMatiereId !== 'ALL' && aff.matiere_id !== filterMatiereId) {
        return false;
      }

      // 4. Recherche textuelle enseignant
      if (searchTeacher.trim() !== '') {
        const query = searchTeacher.trim().toLowerCase();
        const prof = profiles.find((p) => p.id === aff.profile_id);
        const fullName = `${prof?.nom || ''} ${prof?.prenom || ''}`.toLowerCase();
        const email = (prof?.email || '').toLowerCase();
        if (!fullName.includes(query) && !email.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [affectations, filterTeacherId, filterClasseId, filterMatiereId, searchTeacher, profiles]);

  // Détection si la matière sélectionnée dans le formulaire est Lecture ou Communication écrite
  const currentFormMatiere = matieres.find((m) => m.id === formMatiereId);
  const isLectureOrCommSelected = useMemo(() => {
    if (!currentFormMatiere) return false;
    const code = currentFormMatiere.code.toUpperCase();
    const name = currentFormMatiere.nom.toLowerCase();
    return code === 'LECTURE' || code === 'COMM_ECR' || name.includes('lecture') || name.includes('communication');
  }, [currentFormMatiere]);

  // Classes groupées par cycle et niveau pour sélection multiple
  const classesByLevel: Record<string, Classe[]> = useMemo(() => {
    const groups: Record<string, Classe[]> = {
      '6ème': [],
      '5ème': [],
      '4ème': [],
      '3ème': [],
      'Seconde': [],
      'Première': [],
      'Terminale': [],
    };
    classes.forEach((c) => {
      if (groups[c.niveau]) {
        groups[c.niveau].push(c);
      } else {
        groups[c.niveau] = [c];
      }
    });
    return groups;
  }, [classes]);

  // Ouverture du modal de création
  const handleOpenCreateModal = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setFormAnnee(targetAnnee === 'ALL' ? selectedAnnee.libelle : targetAnnee);
    setSelectedClasseIds([]);
    setIsCreateModalOpen(true);
  };

  // Toggle sélection d'une classe
  const toggleClasseSelection = (cId: string) => {
    setSelectedClasseIds((prev) => 
      prev.includes(cId) ? prev.filter((id) => id !== cId) : [...prev, cId]
    );
  };

  // Sélectionner tout un niveau
  const toggleLevelSelection = (levelClasses: Classe[]) => {
    const levelIds = levelClasses.map((c) => c.id);
    const allSelected = levelIds.every((id) => selectedClasseIds.includes(id));
    if (allSelected) {
      setSelectedClasseIds((prev) => prev.filter((id) => !levelIds.includes(id)));
    } else {
      setSelectedClasseIds((prev) => Array.from(new Set([...prev, ...levelIds])));
    }
  };

  // Sélectionner tout le 1er cycle (6e à 3e)
  const selectPremierCycle = () => {
    const premierCycleIds = classes
      .filter((c) => ['6ème', '5ème', '4ème', '3ème'].includes(c.niveau))
      .map((c) => c.id);
    setSelectedClasseIds(Array.from(new Set([...selectedClasseIds, ...premierCycleIds])));
  };

  // Sélectionner toutes les classes (28)
  const selectAllClasses = () => {
    setSelectedClasseIds(classes.map((c) => c.id));
  };

  // Vider la sélection
  const clearClassSelection = () => {
    setSelectedClasseIds([]);
  };

  // Soumission de la création (prise en charge de classes multiples simultanées)
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setErrorMessage(null);
    setSuccessMessage(null);

    if (selectedClasseIds.length === 0) {
      setErrorMessage('Veuillez sélectionner au moins une classe pour cette attribution.');
      return;
    }

    if (formHeuresHebdo <= 0 || formHeuresHebdo > 30) {
      setErrorMessage('Le volume horaire hebdomadaire doit être compris entre 1 et 30 heures.');
      return;
    }

    setIsSaving(true);
    try {
      const prof = profiles.find((p) => p.id === formProfileId);
      const mat = matieres.find((m) => m.id === formMatiereId);

      // Attribution multiple via createAffectationsBulk
      const result = storage.createAffectationsBulk(
        formProfileId,
        selectedClasseIds,
        formMatiereId,
        formAnnee,
        Number(formHeuresHebdo),
        currentUser,
        formIncludeTwinCommLect
      );

      if (result.errors.length > 0 && result.created.length === 0) {
        throw new Error(result.errors.join(' • '));
      }

      const assignedClassNames = selectedClasseIds
        .map((cId) => classes.find((c) => c.id === cId)?.nom)
        .filter(Boolean)
        .join(', ');

      let msg = `✓ ${result.created.length} attribution(s) enregistrée(s) avec succès pour ${formAnnee} : ${prof?.nom} ${prof?.prenom} — ${mat?.nom} (${formHeuresHebdo}h/sem) dans : ${assignedClassNames}.`;
      if (result.errors.length > 0) {
        msg += ` (Note : ${result.errors.length} classe(s) non ajoutées car déjà attribuées ou en conflit : ${result.errors.join(', ')})`;
      }

      setSuccessMessage(msg);

      if (targetAnnee !== 'ALL' && formAnnee !== targetAnnee) {
        setTargetAnnee(formAnnee);
        refreshList(formAnnee);
      } else {
        refreshList();
      }

      setIsCreateModalOpen(false);
      setSelectedClasseIds([]);
    } catch (err: unknown) {
      console.error("Erreur lors de l'enregistrement de l'attribution:", err);
      setErrorMessage(err instanceof Error ? err.message : "⚠ Impossible d'enregistrer l'attribution de classe.");
    } finally {
      setIsSaving(false);
    }
  };

  // Ouverture du modal de modification
  const handleOpenEditModal = (aff: AffectationPedagogique) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setEditingAffectation(aff);
    setEditProfileId(aff.profile_id);
    setEditClasseId(aff.classe_id);
    setEditMatiereId(aff.matiere_id);
    setEditAnnee(aff.annee_scolaire || selectedAnnee.libelle);
    setEditHeuresHebdo(aff.heures_hebdo);
  };

  // Soumission de la modification
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !editingAffectation) return;
    setErrorMessage(null);
    setSuccessMessage(null);

    if (editHeuresHebdo <= 0 || editHeuresHebdo > 30) {
      setErrorMessage('Le volume horaire hebdomadaire doit être compris entre 1 et 30 heures.');
      return;
    }

    setIsSaving(true);
    try {
      storage.updateAffectation(
        editingAffectation.id,
        {
          profile_id: editProfileId,
          classe_id: editClasseId,
          matiere_id: editMatiereId,
          annee_scolaire: editAnnee,
          heures_hebdo: Number(editHeuresHebdo),
        },
        currentUser
      );

      const prof = profiles.find((p) => p.id === editProfileId);
      const cls = classes.find((c) => c.id === editClasseId);
      const mat = matieres.find((m) => m.id === editMatiereId);

      setSuccessMessage(
        `✓ Modification enregistrée avec succès pour ${editAnnee} : ${prof?.nom} ${prof?.prenom} → ${cls?.nom} → ${mat?.nom} (${editHeuresHebdo}h/semaine).`
      );

      refreshList();
      setEditingAffectation(null);
    } catch (err: unknown) {
      console.error("Erreur lors de la modification de l'attribution:", err);
      setErrorMessage(err instanceof Error ? err.message : "⚠ Impossible d'enregistrer la modification.");
    } finally {
      setIsSaving(false);
    }
  };

  // Suppression
  const handleConfirmDelete = () => {
    if (!currentUser || !confirmDeleteAffId) return;
    setIsSaving(true);
    setErrorMessage(null);
    try {
      storage.deleteAffectation(confirmDeleteAffId, currentUser);
      refreshList();
      setSuccessMessage('✓ Attribution de classe supprimée définitivement avec succès.');
      setConfirmDeleteAffId(null);
    } catch (err: unknown) {
      console.error("Erreur lors de la suppression:", err);
      setErrorMessage(err instanceof Error ? err.message : "⚠ Erreur lors de la suppression de l'attribution.");
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle statut ACTIF / INACTIF
  const handleToggleStatus = (affId: string) => {
    if (!currentUser) return;
    setIsSaving(true);
    setErrorMessage(null);
    try {
      const updated = storage.toggleAffectationStatus(affId, currentUser);
      refreshList();
      setSuccessMessage(
        `✓ Attribution passée au statut ${updated.statut}.`
      );
    } catch (err: unknown) {
      console.error("Erreur changement de statut:", err);
      setErrorMessage("⚠ Impossible d'enregistrer les modifications.");
    } finally {
      setIsSaving(false);
    }
  };

  // Synthèses statistiques pour l'année consultée
  const heuresParEnseignant = useMemo(() => {
    return eligibleTeachers.map((t) => {
      const userAffs = affectations.filter((a) => a.profile_id === t.id && a.statut === 'ACTIF');
      const totalH = userAffs.reduce((acc, curr) => acc + curr.heures_hebdo, 0);
      const classCount = new Set(userAffs.map((a) => a.classe_id)).size;
      return {
        enseignant: t,
        affectations: userAffs,
        totalHeures: totalH,
        classCount,
      };
    }).filter((item) => item.affectations.length > 0);
  }, [eligibleTeachers, affectations]);

  const totalClassesCouvertes = useMemo(() => {
    return new Set(affectations.filter((a) => a.statut === 'ACTIF').map((a) => a.classe_id)).size;
  }, [affectations]);

  const totalHeuresHebdoGlobal = useMemo(() => {
    return affectations
      .filter((a) => a.statut === 'ACTIF')
      .reduce((sum, a) => sum + a.heures_hebdo, 0);
  }, [affectations]);

  return (
    <div className="space-y-6">
      {/* En-tête Principal « ATTRIBUTION DE CLASSE » */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-emerald-100 text-emerald-900 text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-wider">
              Espace Censeur
            </span>
            <span className="text-slate-400 text-xs">• Direction des Études</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center space-x-2 mt-1">
            <Network className="w-6 h-6 text-emerald-700" />
            <span>ATTRIBUTION DE CLASSE</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 max-w-3xl">
            Attribution des classes et matières aux enseignants par année scolaire. Un enseignant peut avoir plusieurs classes sans aucune restriction.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Sélecteur d'année scolaire */}
          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs shadow-2xs">
            <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="text-slate-600 font-semibold">Année :</span>
            <select
              id="select-filter-annee-aff"
              aria-label="Filtrer par année scolaire"
              value={targetAnnee}
              onChange={(e) => handleAnneeFilterChange(e.target.value)}
              className="bg-transparent font-black text-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Toutes les années (Historique complet)</option>
              {annees.map((a) => (
                <option key={a.id} value={a.libelle}>
                  {a.libelle} {a.is_active ? '(Active)' : a.statut === 'CLOTUREE' ? '(Archivée)' : '(À venir)'}
                </option>
              ))}
            </select>
          </div>

          {isCenseur && (
            <button
              id="btn-nouvelle-attribution-modal"
              onClick={handleOpenCreateModal}
              className="flex items-center space-x-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nouvelle attribution</span>
            </button>
          )}
        </div>
      </div>

      {/* Messages de retour */}
      {successMessage && (
        <div className="p-3.5 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl text-xs sm:text-sm flex items-start space-x-2.5 shadow-2xs">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed font-medium">{successMessage}</div>
        </div>
      )}
      {errorMessage && (
        <div className="p-3.5 bg-red-50 text-red-900 border border-red-200 rounded-xl text-xs sm:text-sm flex items-start space-x-2.5 shadow-2xs">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed font-medium">{errorMessage}</div>
        </div>
      )}

      {/* Bannière Règle Fondamentale & Règle 6ème à 3ème */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Règle Principale : Multi-classes par enseignant */}
        <div className="bg-slate-900 text-slate-100 p-4 rounded-xl border border-slate-800 text-xs shadow-xs">
          <div className="font-bold text-amber-300 flex items-center space-x-2 mb-1.5">
            <School className="w-4 h-4" />
            <span className="uppercase tracking-wider">Règle GOGBO NOTES — Multi-classes</span>
          </div>
          <p className="leading-relaxed text-slate-300">
            Un même enseignant peut enseigner sa discipline dans <strong>autant de classes que le Censeur lui en attribue</strong> (ex: M. X en SVT pour 6ème A, 6ème B, 5ème A, 5ème C, 4ème B, 3ème A). Il n'existe <em>aucune limitation à une seule classe</em>.
          </p>
        </div>

        {/* Règle Particulière 6ème à 3ème : Lecture + Communication écrite */}
        <div className="bg-emerald-950 text-emerald-100 p-4 rounded-xl border border-emerald-800 text-xs shadow-xs">
          <div className="font-bold text-amber-300 flex items-center space-x-2 mb-1.5">
            <BookOpen className="w-4 h-4" />
            <span className="uppercase tracking-wider">Règle Officielle 6ème à 3ème (Français)</span>
          </div>
          <p className="leading-relaxed text-emerald-200">
            Pour les classes de <strong>6ème, 5ème, 4ème et 3ème</strong>, <em>Lecture</em> et <em>Communication écrite</em> doivent <strong>obligatoirement être attribuées au même enseignant</strong> dans une même classe. La séparation entre deux professeurs différents est strictement interdite.
          </p>
        </div>
      </div>

      {/* Cartes métriques rapides */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Attributions</div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
            {affectations.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Combinaisons Enseignant + Classe + Matière
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Professeurs Enseignants</div>
          <div className="text-2xl sm:text-3xl font-black text-blue-700 mt-1">
            {heuresParEnseignant.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Sur {eligibleTeachers.length} personnels éligibles
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Classes Couvertes</div>
          <div className="text-2xl sm:text-3xl font-black text-purple-700 mt-1">
            {totalClassesCouvertes} / {classes.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Classes avec au moins 1 cours attribué
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Volume Horaire Global</div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 mt-1">
            {totalHeuresHebdoGlobal} h
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Heures de cours hebdomadaires actives
          </div>
        </div>
      </div>

      {/* Barre de Recherche et Filtres multi-critères */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
            <Filter className="w-4 h-4 text-emerald-700" />
            <span>Filtres de recherche des attributions</span>
          </div>

          {(searchTeacher || filterTeacherId !== 'ALL' || filterClasseId !== 'ALL' || filterMatiereId !== 'ALL') && (
            <button
              onClick={() => {
                setSearchTeacher('');
                setFilterTeacherId('ALL');
                setFilterClasseId('ALL');
                setFilterMatiereId('ALL');
              }}
              className="text-xs text-red-600 hover:text-red-800 font-semibold cursor-pointer"
            >
              Réinitialiser tous les filtres
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Recherche Enseignant */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Rechercher un enseignant..."
              value={searchTeacher}
              onChange={(e) => setSearchTeacher(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 text-xs bg-white"
            />
          </div>

          {/* Filtre par Enseignant */}
          <div>
            <select
              aria-label="Filtrer par enseignant"
              value={filterTeacherId}
              onChange={(e) => setFilterTeacherId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 text-xs bg-white"
            >
              <option value="ALL">Tous les enseignants ({eligibleTeachers.length})</option>
              {eligibleTeachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nom} {t.prenom} ({t.role})
                </option>
              ))}
            </select>
          </div>

          {/* Filtre par Classe */}
          <div>
            <select
              aria-label="Filtrer par classe"
              value={filterClasseId}
              onChange={(e) => setFilterClasseId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 text-xs bg-white"
            >
              <option value="ALL">Toutes les classes ({classes.length})</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom} ({c.niveau})
                </option>
              ))}
            </select>
          </div>

          {/* Filtre par Matière */}
          <div>
            <select
              aria-label="Filtrer par matière"
              value={filterMatiereId}
              onChange={(e) => setFilterMatiereId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 text-xs bg-white"
            >
              <option value="ALL">Toutes les matières ({matieres.length})</option>
              {matieres.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nom} ({m.code})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Synthèse par enseignant : Vue cartes avec liste de toutes ses classes */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-5">
        <h3 className="font-bold text-slate-800 text-sm mb-3 flex items-center justify-between">
          <span className="flex items-center space-x-2">
            <GraduationCap className="w-4 h-4 text-blue-700" />
            <span>Synthèse des classes attribuées par Enseignant</span>
          </span>
          <span className="text-xs text-slate-500 font-normal">
            {heuresParEnseignant.length} enseignant(s) avec attributions
          </span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {heuresParEnseignant.map((item) => (
            <div
              key={item.enseignant.id}
              className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-emerald-300 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <span className="font-black text-slate-900 text-xs sm:text-sm">
                      {item.enseignant.nom} {item.enseignant.prenom}
                    </span>
                    <span className="ml-1.5 text-[10px] bg-slate-200 text-slate-700 font-semibold px-1.5 py-0.5 rounded">
                      {item.enseignant.role}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-900 font-black text-[11px] shrink-0">
                    {item.totalHeures} h/sem
                  </span>
                </div>

                <div className="mt-2.5">
                  <div className="text-[11px] font-semibold text-slate-500 mb-1">
                    Mes classes ({item.affectations.length} cours) :
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {item.affectations.map((a) => {
                      const c = classes.find((cls) => cls.id === a.classe_id);
                      const m = matieres.find((mat) => mat.id === a.matiere_id);
                      return (
                        <span
                          key={a.id}
                          className="inline-flex items-center px-2 py-0.5 rounded-md bg-white border border-slate-300 text-slate-800 text-[11px] font-semibold shadow-2xs"
                        >
                          <strong className="text-emerald-800 mr-1">{c?.nom}</strong>
                          <span className="text-slate-500">({m?.code})</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-200/80 flex justify-between items-center text-[10px] text-slate-500">
                <span>{item.classCount} classe(s) distincte(s)</span>
                <button
                  onClick={() => {
                    setFilterTeacherId(item.enseignant.id);
                  }}
                  className="text-emerald-700 hover:text-emerald-900 font-bold cursor-pointer"
                >
                  Voir dans le tableau →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tableau détaillé de toutes les attributions */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
          <div>
            <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2">
              <span>Tableau des attributions de classe</span>
              <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.2 rounded-full font-bold">
                {filteredAffectations.length} résultat(s)
              </span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Chaque ligne représente une attribution distincte : Enseignant + Classe + Matière + Année scolaire
            </p>
          </div>

          {isCenseur && (
            <button
              onClick={handleOpenCreateModal}
              className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold px-3 py-1.5 rounded-lg border border-emerald-300 flex items-center space-x-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Attribuer des classes</span>
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-3 sm:px-4 py-3">Enseignant / Utilisateur</th>
                <th className="px-3 sm:px-4 py-3">Année</th>
                <th className="px-3 sm:px-4 py-3">Classe</th>
                <th className="px-3 sm:px-4 py-3">Matière</th>
                <th className="px-3 sm:px-4 py-3 text-center">Volume Hebdo</th>
                <th className="px-3 sm:px-4 py-3 text-center">Statut</th>
                {isCenseur && <th className="px-3 sm:px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredAffectations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    <AlertCircle className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                    Aucune attribution ne correspond aux filtres sélectionnés.
                  </td>
                </tr>
              ) : (
                filteredAffectations.map((aff) => {
                  const prof = profiles.find((p) => p.id === aff.profile_id);
                  const cls = classes.find((c) => c.id === aff.classe_id);
                  const mat = matieres.find((m) => m.id === aff.matiere_id);

                  return (
                    <tr key={aff.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                        <div className="font-bold text-slate-900">
                          {prof ? `${prof.nom} ${prof.prenom}` : 'Inconnu'}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {prof?.role} • {prof?.email}
                        </div>
                      </td>

                      <td className="px-3 sm:px-4 py-3 whitespace-nowrap font-semibold text-amber-700">
                        {aff.annee_scolaire || '2026–2027'}
                      </td>

                      <td className="px-3 sm:px-4 py-3 font-black text-slate-900 whitespace-nowrap">
                        <span className="inline-block px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded border border-emerald-200">
                          {cls?.nom}
                        </span>
                      </td>

                      <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-slate-800">
                        <div className="font-semibold">{mat?.nom}</div>
                        <div className="text-[10px] text-slate-400">
                          Code : {mat?.code} • Coef : {mat?.coefficient}
                        </div>
                      </td>

                      <td className="px-3 sm:px-4 py-3 text-center font-black text-slate-900 whitespace-nowrap">
                        <span className="inline-block px-2.5 py-1 rounded bg-slate-100 border border-slate-200">
                          {aff.heures_hebdo} h/sem
                        </span>
                      </td>

                      <td className="px-3 sm:px-4 py-3 text-center whitespace-nowrap">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          aff.statut === 'ACTIF' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {aff.statut}
                        </span>
                      </td>

                      {isCenseur && (
                        <td className="px-3 sm:px-4 py-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end space-x-1">
                            {/* Modifier */}
                            <button
                              id={`btn-edit-aff-${aff.id}`}
                              onClick={() => handleOpenEditModal(aff)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                              title="Modifier cette attribution"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            {/* Activer / Désactiver */}
                            <button
                              id={`btn-toggle-aff-${aff.id}`}
                              onClick={() => handleToggleStatus(aff.id)}
                              className={`p-1.5 rounded transition-colors cursor-pointer ${
                                aff.statut === 'ACTIF'
                                  ? 'text-amber-600 hover:bg-amber-50'
                                  : 'text-emerald-600 hover:bg-emerald-50'
                              }`}
                              title={aff.statut === 'ACTIF' ? 'Désactiver' : 'Activer'}
                            >
                              <Power className="w-4 h-4" />
                            </button>

                            {/* Supprimer */}
                            <button
                              id={`btn-delete-aff-${aff.id}`}
                              onClick={() => setConfirmDeleteAffId(aff.id)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors cursor-pointer"
                              title="Supprimer cette attribution"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE CRÉATION : Prise en charge d'attributions simultanées / groupées */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full my-6 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-black text-slate-900 text-base sm:text-lg flex items-center space-x-2">
                  <Network className="w-5 h-5 text-emerald-700" />
                  <span>ATTRIBUTION DE CLASSE — Nouvelle attribution</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sélectionnez un enseignant, une matière et une ou plusieurs classes à attribuer simultanément.
                </p>
              </div>
              <button 
                onClick={() => setIsCreateModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-5 space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* 1. Enseignant */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    1. Enseignant ou Personnel attribué *
                  </label>
                  <select
                    id="modal-select-aff-prof"
                    value={formProfileId}
                    onChange={(e) => setFormProfileId(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-xs bg-white font-medium"
                  >
                    {eligibleTeachers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nom} {p.prenom} — ({p.role})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Année scolaire */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    2. Année Scolaire *
                  </label>
                  <select
                    id="modal-select-aff-annee"
                    value={formAnnee}
                    onChange={(e) => setFormAnnee(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-xs bg-white font-black text-amber-700"
                  >
                    {annees.map((a) => (
                      <option key={a.id} value={a.libelle}>
                        {a.libelle} {a.is_active ? '(Active)' : a.statut === 'CLOTUREE' ? '(Clôturée)' : '(À venir)'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* 3. Matière */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    3. Matière / Discipline *
                  </label>
                  <select
                    id="modal-select-aff-matiere"
                    value={formMatiereId}
                    onChange={(e) => setFormMatiereId(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-xs bg-white font-semibold"
                  >
                    {matieres.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nom} ({m.code} - Coef {m.coefficient})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 4. Volume horaire */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    4. Volume horaire hebdomadaire (h/semaine) *
                  </label>
                  <div className="relative">
                    <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      id="modal-input-aff-heures"
                      type="number"
                      min="1"
                      max="30"
                      required
                      value={formHeuresHebdo}
                      onChange={(e) => setFormHeuresHebdo(Number(e.target.value))}
                      className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-xs font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Règle spécifique 6ème à 3ème pour Lecture & Communication écrite */}
              {isLectureOrCommSelected && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl space-y-2">
                  <div className="flex items-start space-x-2 text-amber-900">
                    <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-xs leading-relaxed">
                      <strong>Règle ministérielle obligatoire (6ème à 3ème) :</strong> Lecture et Communication écrite doivent être attribuées au même enseignant pour chaque classe de collège.
                    </div>
                  </div>
                  <label className="flex items-center space-x-2 text-xs font-bold text-slate-800 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={formIncludeTwinCommLect}
                      onChange={(e) => setFormIncludeTwinCommLect(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span>
                      Attribuer simultanément les deux matières jumelles (Lecture et Communication écrite) à cet enseignant
                    </span>
                  </label>
                </div>
              )}

              {/* 5. Sélection de la / des classes */}
              <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1.5 mb-2">
                  <label className="block text-slate-800 font-bold">
                    5. Classe(s) à attribuer *{' '}
                    <span className="text-emerald-700 font-black">
                      ({selectedClasseIds.length} sélectionnée{selectedClasseIds.length > 1 ? 's' : ''})
                    </span>
                  </label>

                  {/* Boutons d'actions rapides de sélection */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    <button
                      type="button"
                      onClick={selectPremierCycle}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium cursor-pointer"
                    >
                      1er Cycle (6e–3e)
                    </button>
                    <button
                      type="button"
                      onClick={selectAllClasses}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium cursor-pointer"
                    >
                      Toutes (28)
                    </button>
                    {selectedClasseIds.length > 0 && (
                      <button
                        type="button"
                        onClick={clearClassSelection}
                        className="px-2 py-0.5 rounded bg-red-50 hover:bg-red-100 text-red-700 font-medium cursor-pointer"
                      >
                        Effacer
                      </button>
                    )}
                  </div>
                </div>

                <div className="border border-slate-300 rounded-xl p-3 bg-slate-50/50 max-h-56 overflow-y-auto space-y-3">
                  {(Object.entries(classesByLevel) as [string, Classe[]][]).map(([level, levelClasses]) => {
                    const levelIds = levelClasses.map((c) => c.id);
                    const allSelected = levelIds.every((id) => selectedClasseIds.includes(id));
                    const someSelected = levelIds.some((id) => selectedClasseIds.includes(id));

                    return (
                      <div key={level} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => toggleLevelSelection(levelClasses)}
                            className="font-black text-slate-700 text-xs flex items-center space-x-1.5 hover:text-emerald-700 cursor-pointer"
                          >
                            {allSelected ? (
                              <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                            ) : someSelected ? (
                              <div className="w-3.5 h-3.5 rounded bg-emerald-600 flex items-center justify-center text-white text-[9px] font-bold">
                                -
                              </div>
                            ) : (
                              <Square className="w-3.5 h-3.5 text-slate-400" />
                            )}
                            <span>Niveau {level} ({levelClasses.length} divisions)</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pl-4">
                          {levelClasses.map((cls) => {
                            const isChecked = selectedClasseIds.includes(cls.id);
                            return (
                              <button
                                key={cls.id}
                                type="button"
                                onClick={() => toggleClasseSelection(cls.id)}
                                className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                                  isChecked
                                    ? 'bg-emerald-700 text-white border-emerald-800 shadow-2xs ring-1 ring-emerald-500'
                                    : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                <span>{cls.nom}</span>
                                {isChecked && <Check className="w-3.5 h-3.5" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  id="btn-valider-nouvelle-attribution"
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black shadow-sm flex items-center space-x-2 disabled:opacity-75 cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Enregistrement en cours...</span>
                    </>
                  ) : (
                    <span>
                      Enregistrer {selectedClasseIds.length > 1 ? `les ${selectedClasseIds.length} attributions` : "l'attribution"}
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE MODIFICATION D'UNE ATTRIBUTION */}
      {editingAffectation && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-5 overflow-hidden">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 mb-4">
              <h3 className="font-black text-slate-900 text-base flex items-center space-x-2">
                <Edit3 className="w-5 h-5 text-blue-600" />
                <span>Modifier l'attribution de classe</span>
              </h3>
              <button 
                onClick={() => setEditingAffectation(null)} 
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Année Scolaire *</label>
                <select
                  value={editAnnee}
                  onChange={(e) => setEditAnnee(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-black text-amber-700"
                >
                  {annees.map((a) => (
                    <option key={a.id} value={a.libelle}>
                      {a.libelle}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Enseignant attribué *</label>
                <select
                  value={editProfileId}
                  onChange={(e) => setEditProfileId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-medium"
                >
                  {eligibleTeachers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nom} {p.prenom} ({p.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Classe *</label>
                <select
                  value={editClasseId}
                  onChange={(e) => setEditClasseId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-bold"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nom} ({c.niveau})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Matière / Discipline *</label>
                <select
                  value={editMatiereId}
                  onChange={(e) => setEditMatiereId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-semibold"
                >
                  {matieres.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nom} ({m.code} - Coef {m.coefficient})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Volume horaire hebdomadaire (h/semaine) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  required
                  value={editHeuresHebdo}
                  onChange={(e) => setEditHeuresHebdo(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingAffectation(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  id="btn-valider-modif-attribution"
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-75"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Enregistrement...</span>
                    </>
                  ) : (
                    <span>Enregistrer les modifications</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMATION DE SUPPRESSION */}
      {confirmDeleteAffId && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 z-50">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-5">
            <div className="flex items-start space-x-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Confirmation de suppression
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Êtes-vous certain de vouloir supprimer cette attribution de classe ?
                </p>
                <p className="text-[11px] text-red-700 bg-red-50 p-2 rounded-lg mt-2 border border-red-200">
                  L'enseignant perdra l'accès à la saisie des notes pour cette classe et matière pour cette année scolaire.
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmDeleteAffId(null)}
                disabled={isSaving}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
              >
                Annuler
              </button>
              <button
                id="btn-confirm-delete-aff"
                type="button"
                onClick={handleConfirmDelete}
                disabled={isSaving}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center space-x-2 cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Suppression...</span>
                  </>
                ) : (
                  <span>Confirmer la suppression</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
