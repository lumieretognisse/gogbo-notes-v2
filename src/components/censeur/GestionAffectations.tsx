import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storage } from '../../lib/storage';
import { AffectationPedagogique } from '../../types';
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
  AlertTriangle
} from 'lucide-react';

export const GestionAffectations: React.FC = () => {
  const { currentUser, isCenseur } = useAuth();
  const [affectations, setAffectations] = useState<AffectationPedagogique[]>(storage.getAffectations());
  const profiles = storage.getProfiles();
  const classes = storage.getClasses();
  const matieres = storage.getMatieres();

  // Enseignants et personnels éligibles à l'attribution de classe
  const eligibleTeachers = profiles.filter((p) => p.is_enseignant && p.statut === 'ACTIF');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState(eligibleTeachers[0]?.id || '');
  const [selectedClasseId, setSelectedClasseId] = useState(classes[0]?.id || '');
  const [selectedMatiereId, setSelectedMatiereId] = useState(matieres[0]?.id || '');
  const [heuresHebdo, setHeuresHebdo] = useState<number>(4);

  const [isSaving, setIsSaving] = useState(false);
  const [confirmDeleteAffId, setConfirmDeleteAffId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const refreshList = () => {
    setAffectations(storage.getAffectations());
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setErrorMessage(null);
    setSuccessMessage(null);

    if (heuresHebdo <= 0 || heuresHebdo > 30) {
      setErrorMessage('Le volume horaire hebdomadaire doit être compris entre 1 et 30 heures.');
      return;
    }

    setIsSaving(true);
    try {
      storage.createAffectation(
        {
          profile_id: selectedProfileId,
          classe_id: selectedClasseId,
          matiere_id: selectedMatiereId,
          heures_hebdo: Number(heuresHebdo),
          statut: 'ACTIF',
        },
        currentUser
      );

      const prof = profiles.find((p) => p.id === selectedProfileId);
      const cls = classes.find((c) => c.id === selectedClasseId);
      const mat = matieres.find((m) => m.id === selectedMatiereId);

      setSuccessMessage(
        `✓ Modifications enregistrées avec succès : ${prof?.nom} ${prof?.prenom} → ${cls?.nom} → ${mat?.nom} (${heuresHebdo}h/semaine).`
      );
      refreshList();
      setIsModalOpen(false);
    } catch (err: unknown) {
      console.error("Erreur lors de l'enregistrement de l'attribution de classe:", err);
      setErrorMessage("⚠ Impossible d'enregistrer les modifications. Veuillez réessayer.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = () => {
    if (!currentUser || !confirmDeleteAffId) return;
    setIsSaving(true);
    setErrorMessage(null);
    try {
      storage.deleteAffectation(confirmDeleteAffId, currentUser);
      refreshList();
      setSuccessMessage('✓ Modifications enregistrées avec succès : Attribution de classe supprimée.');
      setConfirmDeleteAffId(null);
    } catch (err: unknown) {
      console.error("Erreur lors de la suppression de l'attribution de classe:", err);
      setErrorMessage("⚠ Impossible d'enregistrer les modifications. Veuillez réessayer.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = (affId: string) => {
    if (!currentUser) return;
    setIsSaving(true);
    setErrorMessage(null);
    try {
      const updated = storage.toggleAffectationStatus(affId, currentUser);
      refreshList();
      setSuccessMessage(`✓ Modifications enregistrées avec succès : Attribution de classe passée au statut ${updated.statut}.`);
    } catch (err: unknown) {
      console.error("Erreur lors du changement de statut de l'attribution de classe:", err);
      setErrorMessage("⚠ Impossible d'enregistrer les modifications. Veuillez réessayer.");
    } finally {
      setIsSaving(false);
    }
  };

  // Calculs statistiques
  // 1. Total heures par enseignant
  const heuresParEnseignant = eligibleTeachers.map((t) => {
    const userAffs = affectations.filter((a) => a.profile_id === t.id && a.statut === 'ACTIF');
    const totalH = userAffs.reduce((acc, curr) => acc + curr.heures_hebdo, 0);
    return {
      enseignant: t,
      affectations: userAffs,
      totalHeures: totalH,
    };
  }).filter((item) => item.totalHeures > 0);

  // 2. Total heures par classe
  const heuresParClasse = classes.map((c) => {
    const classAffs = affectations.filter((a) => a.classe_id === c.id && a.statut === 'ACTIF');
    const totalH = classAffs.reduce((acc, curr) => acc + curr.heures_hebdo, 0);
    return {
      classe: c,
      affectations: classAffs,
      totalHeures: totalH,
    };
  }).filter((item) => item.totalHeures > 0);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center space-x-2">
            <Network className="w-6 h-6 text-emerald-700" />
            <span>Attributions de classe</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Attribution des classes, matières et volumes horaires hebdomadaires (Détermine les droits pédagogiques)
          </p>
        </div>

        {isCenseur && (
          <button
            id="btn-nouvelle-affectation"
            onClick={() => {
              setErrorMessage(null);
              setIsModalOpen(true);
            }}
            className="flex items-center space-x-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-lg shadow-xs transition-colors w-full sm:w-auto justify-center"
          >
            <Plus className="w-4 h-4" />
            <span>Attribuer une classe et une matière</span>
          </button>
        )}
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="p-3 bg-red-50 text-red-800 border border-red-200 rounded-lg text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Rappel de la règle */}
      <div className="bg-emerald-950 text-emerald-100 p-4 rounded-xl border border-emerald-800/80 text-xs shadow-xs">
        <div className="font-bold text-amber-300 flex items-center space-x-2 mb-1">
          <BookOpen className="w-4 h-4" />
          <span>Règle officielle des droits pédagogiques</span>
        </div>
        <p className="leading-relaxed">
          L'attribution de classe détermine les droits pédagogiques de l'enseignant :{' '}
          <strong className="text-white">UTILISATEUR → ATTRIBUTION DE CLASSE → CLASSE + MATIÈRE</strong>.
          Un enseignant ne peut voir et évaluer que les apprenants des classes et matières qui lui sont attribuées.
          Le Directeur Général et le Censeur peuvent également avoir des attributions de classe pour enseigner et évaluer leurs propres élèves.
        </p>
      </div>

      {/* Synthèses : Heures par enseignant & Heures par classe */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Total d'heures par enseignant */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <h3 className="font-bold text-slate-800 text-sm mb-3 flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <GraduationCap className="w-4 h-4 text-blue-700" />
              <span>Charge horaire par Enseignant</span>
            </span>
            <span className="text-xs text-slate-500 font-normal">
              {heuresParEnseignant.length} enseignant(s) avec cours
            </span>
          </h3>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {heuresParEnseignant.map((item) => (
              <div
                key={item.enseignant.id}
                className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900">
                    {item.enseignant.nom} {item.enseignant.prenom}
                    {item.enseignant.role !== 'ENSEIGNANT' && (
                      <span className="ml-1.5 text-[10px] bg-slate-200 text-slate-700 px-1 rounded">
                        {item.enseignant.role}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {item.affectations.map((a) => {
                      const c = classes.find((cls) => cls.id === a.classe_id);
                      const m = matieres.find((mat) => mat.id === a.matiere_id);
                      return `${c?.nom} (${m?.code})`;
                    }).join(' • ')}
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-block px-2.5 py-1 rounded-md bg-blue-50 text-blue-800 font-black text-xs border border-blue-200">
                    {item.totalHeures} h/sem
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Total d'heures par classe */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <h3 className="font-bold text-slate-800 text-sm mb-3 flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <School className="w-4 h-4 text-purple-700" />
              <span>Couverture horaire par Classe</span>
            </span>
            <span className="text-xs text-slate-500 font-normal">
              {heuresParClasse.length} classe(s) avec cours
            </span>
          </h3>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {heuresParClasse.map((item) => (
              <div
                key={item.classe.id}
                className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900">{item.classe.nom}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {item.affectations.length} matière(s) attribuée(s)
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-block px-2.5 py-1 rounded-md bg-purple-50 text-purple-800 font-black text-xs border border-purple-200">
                    {item.totalHeures} h/sem
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tableau détaillé des attributions de classe */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 text-sm">
            Liste des attributions de classe ({affectations.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-3 sm:px-4 py-3">Enseignant / Utilisateur</th>
                <th className="px-3 sm:px-4 py-3">Rôle</th>
                <th className="px-3 sm:px-4 py-3">Classe</th>
                <th className="px-3 sm:px-4 py-3">Matière</th>
                <th className="px-3 sm:px-4 py-3 text-center">Heures Hebdo</th>
                <th className="px-3 sm:px-4 py-3 text-center">Statut</th>
                {isCenseur && <th className="px-3 sm:px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {affectations.map((aff) => {
                const prof = profiles.find((p) => p.id === aff.profile_id);
                const cls = classes.find((c) => c.id === aff.classe_id);
                const mat = matieres.find((m) => m.id === aff.matiere_id);

                return (
                  <tr key={aff.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-3 sm:px-4 py-3 font-bold text-slate-900 whitespace-nowrap">
                      {prof ? `${prof.nom} ${prof.prenom}` : 'Inconnu'}
                    </td>
                    <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-semibold">
                        {prof?.role}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">
                      {cls?.nom}
                    </td>
                    <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-slate-700">
                      {mat?.nom} <span className="text-[10px] text-slate-400">({mat?.code})</span>
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-center font-bold text-slate-900 whitespace-nowrap">
                      {aff.heures_hebdo} h
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
                          <button
                            id={`btn-toggle-aff-${aff.id}`}
                            onClick={() => handleToggleStatus(aff.id)}
                            className={`p-1.5 rounded transition-colors ${
                              aff.statut === 'ACTIF'
                                ? 'text-amber-600 hover:bg-amber-50'
                                : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={aff.statut === 'ACTIF' ? 'Désactiver' : 'Activer'}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                          <button
                            id={`btn-delete-aff-${aff.id}`}
                            onClick={() => setConfirmDeleteAffId(aff.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                            title="Supprimer l'attribution de classe"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de création d'attribution de classe */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="px-5 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 text-base">Nouvelle attribution de classe</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-5 space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Enseignant ou Personnel attribué *
                </label>
                <select
                  id="modal-select-aff-prof"
                  value={selectedProfileId}
                  onChange={(e) => setSelectedProfileId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 text-xs bg-white"
                >
                  {eligibleTeachers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nom} {p.prenom} — ({p.role})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  Note : Les profils administratifs (Censeur, DG) ayant une casquette pédagogique apparaissent ici.
                </p>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Classe *</label>
                <select
                  id="modal-select-aff-classe"
                  value={selectedClasseId}
                  onChange={(e) => setSelectedClasseId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 text-xs bg-white"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nom} ({c.niveau})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Matière *</label>
                <select
                  id="modal-select-aff-matiere"
                  value={selectedMatiereId}
                  onChange={(e) => setSelectedMatiereId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 text-xs bg-white"
                >
                  {matieres.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nom} (Coef: {m.coefficient})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Nombre d'heures hebdomadaires *
                </label>
                <input
                  id="modal-input-aff-heures"
                  type="number"
                  min="1"
                  max="20"
                  required
                  value={heuresHebdo}
                  onChange={(e) => setHeuresHebdo(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 text-xs"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold"
                >
                  Annuler
                </button>
                <button
                  id="btn-valider-form-affectation"
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs flex items-center space-x-1.5 disabled:opacity-75"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Enregistrement en cours...</span>
                    </>
                  ) : (
                    <span>Enregistrer l'attribution de classe</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression d'attribution de classe */}
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
                <p className="text-xs text-slate-500 mt-1">
                  Êtes-vous sûr de vouloir supprimer définitivement cette attribution de classe ?
                </p>
                <p className="text-[11px] text-red-600 bg-red-50 p-2 rounded-lg mt-2 border border-red-200">
                  L'enseignant perdra l'accès à la saisie des notes pour cette classe et matière.
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmDeleteAffId(null)}
                disabled={isSaving}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold"
              >
                Annuler
              </button>
              <button
                id="btn-confirm-delete-aff"
                type="button"
                onClick={handleConfirmDelete}
                disabled={isSaving}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center space-x-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Enregistrement en cours...</span>
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
