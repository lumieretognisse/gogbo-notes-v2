import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storage } from '../../lib/storage';
import { Eleve, LangueOption, Sexe } from '../../types';
import { 
  Users, 
  Search, 
  Plus, 
  Filter, 
  Edit3, 
  UserCheck, 
  UserX, 
  AlertCircle,
  CheckCircle,
  X,
  Loader2,
  AlertTriangle
} from 'lucide-react';

export const GestionEleves: React.FC = () => {
  const { currentUser, isCenseur, isDirecteur } = useAuth();
  const canManage = isCenseur || isDirecteur;

  const [eleves, setEleves] = useState<Eleve[]>(storage.getEleves());
  const classes = storage.getClasses();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClasseFilter, setSelectedClasseFilter] = useState<string>('ALL');
  const [selectedSexeFilter, setSelectedSexeFilter] = useState<string>('ALL');

  // Modal d'ajout / modification
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEleve, setEditingEleve] = useState<Eleve | null>(null);

  // Modal de confirmation de désactivation (Exigence 6)
  const [confirmToggleEleve, setConfirmToggleEleve] = useState<Eleve | null>(null);

  // Form state
  const [matricule, setMatricule] = useState('');
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [sexe, setSexe] = useState<Sexe>('M');
  const [dateNaissance, setDateNaissance] = useState('');
  const [classeId, setClasseId] = useState(classes[0]?.id || '');
  const [lv2, setLv2] = useState<LangueOption>('AUCUNE');
  const [nomParent, setNomParent] = useState('');
  const [contactParent, setContactParent] = useState('');

  // États d'enregistrement (Exigence 8)
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const refreshList = () => {
    setEleves(storage.getEleves());
  };

  const openCreateModal = () => {
    setEditingEleve(null);
    const nextNum = String(eleves.length + 1).padStart(4, '0');
    setMatricule(`GOGBO-2026-${nextNum}`);
    setNom('');
    setPrenom('');
    setSexe('M');
    setDateNaissance('2012-01-01');
    setClasseId(classes[0]?.id || '');
    setLv2('AUCUNE');
    setNomParent('');
    setContactParent('');
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const openEditModal = (el: Eleve) => {
    setEditingEleve(el);
    setMatricule(el.matricule);
    setNom(el.nom);
    setPrenom(el.prenom);
    setSexe(el.sexe);
    setDateNaissance(el.date_naissance || '');
    setClasseId(el.classe_id);
    setLv2(el.langue_vivante_2 || 'AUCUNE');
    setNomParent(el.nom_parent || '');
    setContactParent(el.contact_parent || '');
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!nom.trim() || !prenom.trim() || !matricule.trim()) {
      setErrorMessage('Le nom, le prénom et le matricule sont obligatoires.');
      return;
    }

    setIsSaving(true);

    try {
      if (editingEleve) {
        // Enregistrement asynchrone réel avec sync Supabase & storage local
        await storage.updateEleveAsync(
          editingEleve.id,
          {
            matricule: matricule.trim().toUpperCase(),
            nom: nom.trim().toUpperCase(),
            prenom: prenom.trim(),
            sexe,
            date_naissance: dateNaissance,
            classe_id: classeId,
            langue_vivante_2: lv2,
            nom_parent: nomParent.trim(),
            contact_parent: contactParent.trim(),
          },
          currentUser
        );
        setSuccessMessage(`✓ Modifications enregistrées avec succès pour l'élève ${nom.toUpperCase()} ${prenom}.`);
      } else {
        storage.createEleve(
          {
            matricule: matricule.trim().toUpperCase(),
            nom: nom.trim().toUpperCase(),
            prenom: prenom.trim(),
            sexe,
            date_naissance: dateNaissance,
            classe_id: classeId,
            langue_vivante_2: lv2,
            nom_parent: nomParent.trim(),
            contact_parent: contactParent.trim(),
            statut: 'ACTIF',
          },
          currentUser
        );
        setSuccessMessage(`✓ Élève inscrit et enregistré avec succès : ${nom.toUpperCase()} ${prenom} (${matricule}).`);
      }

      refreshList();
      setIsModalOpen(false);
    } catch (err: unknown) {
      console.error("Erreur lors de l'enregistrement de l'élève:", err);
      setErrorMessage("⚠ Impossible d'enregistrer les modifications. Veuillez réessayer.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmToggleStatus = async () => {
    if (!currentUser || !confirmToggleEleve) return;
    setIsSaving(true);
    setErrorMessage(null);
    try {
      storage.toggleEleveStatus(confirmToggleEleve.id, currentUser);
      refreshList();
      setSuccessMessage(
        `✓ Statut de l'élève ${confirmToggleEleve.nom} mis à jour (${
          confirmToggleEleve.statut === 'ACTIF' ? 'Désactivé' : 'Réactivé'
        }).`
      );
      setConfirmToggleEleve(null);
    } catch (err: unknown) {
      console.error("Erreur lors du changement de statut de l'élève:", err);
      setErrorMessage("⚠ Impossible d'enregistrer les modifications. Veuillez réessayer.");
    } finally {
      setIsSaving(false);
    }
  };

  // Filtrage
  const filteredEleves = eleves.filter((e) => {
    const matchSearch =
      e.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.matricule.toLowerCase().includes(searchTerm.toLowerCase());

    const matchClasse = selectedClasseFilter === 'ALL' || e.classe_id === selectedClasseFilter;
    const matchSexe = selectedSexeFilter === 'ALL' || e.sexe === selectedSexeFilter;

    return matchSearch && matchClasse && matchSexe;
  });

  return (
    <div className="space-y-5">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center space-x-2">
            <Users className="w-6 h-6 text-emerald-700" />
            <span>Gestion des Élèves</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Registre officiel des inscriptions, fiches individuelles et effectifs (Plafond : 100 élèves/classe)
          </p>
        </div>

        {canManage && (
          <button
            id="btn-ajouter-eleve"
            onClick={openCreateModal}
            className="flex items-center space-x-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-lg shadow-xs transition-colors w-full sm:w-auto justify-center"
          >
            <Plus className="w-4 h-4" />
            <span>Inscrire un nouvel élève</span>
          </button>
        )}
      </div>

      {/* Messages de statut conformes aux exigences */}
      {successMessage && (
        <div className="p-3.5 bg-emerald-50 text-emerald-900 border border-emerald-300 rounded-xl text-xs sm:text-sm flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2.5">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold">{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-700 hover:text-emerald-900 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 bg-red-50 text-red-900 border border-red-300 rounded-xl text-xs sm:text-sm flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-red-700 hover:text-red-900 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Barre de filtres et recherche */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="input-search-eleves"
              type="text"
              placeholder="Rechercher par nom, prénom ou matricule..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
            />
          </div>

          <div>
            <select
              id="select-filter-classe"
              value={selectedClasseFilter}
              onChange={(e) => setSelectedClasseFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
            >
              <option value="ALL">Toutes les classes ({classes.length})</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom} ({c.niveau})
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              id="select-filter-sexe"
              value={selectedSexeFilter}
              onChange={(e) => setSelectedSexeFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
            >
              <option value="ALL">Tous les sexes (Garçons & Filles)</option>
              <option value="M">Masculin (M)</option>
              <option value="F">Féminin (F)</option>
            </select>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
          <span>{filteredEleves.length} élève(s) correspondant(s)</span>
          <span className="font-medium text-emerald-800">Total inscrits : {eleves.length}</span>
        </div>
      </div>

      {/* Tableau des élèves */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-3 sm:px-4 py-3">Matricule</th>
                <th className="px-3 sm:px-4 py-3">Nom & Prénoms</th>
                <th className="px-3 sm:px-4 py-3">Sexe</th>
                <th className="px-3 sm:px-4 py-3">Classe</th>
                <th className="px-3 sm:px-4 py-3">Option LV2</th>
                <th className="px-3 sm:px-4 py-3">Parent / Contact</th>
                <th className="px-3 sm:px-4 py-3">Statut</th>
                <th className="px-3 sm:px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredEleves.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500 text-xs">
                    Aucun élève trouvé avec ces critères de recherche.
                  </td>
                </tr>
              ) : (
                filteredEleves.map((el) => {
                  const cls = classes.find((c) => c.id === el.classe_id);

                  return (
                    <tr key={el.id} id={`row-eleve-${el.id}`} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-3 sm:px-4 py-3 font-mono font-bold text-slate-800 whitespace-nowrap">
                        {el.matricule}
                      </td>

                      <td className="px-3 sm:px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                        {el.nom} {el.prenom}
                      </td>

                      <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            el.sexe === 'F' ? 'bg-pink-100 text-pink-800' : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {el.sexe}
                        </span>
                      </td>

                      <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                        <span className="font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px]">
                          {cls?.nom || 'Inconnue'}
                        </span>
                      </td>

                      <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                        {el.langue_vivante_2 && el.langue_vivante_2 !== 'AUCUNE' ? (
                          <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            {el.langue_vivante_2}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>

                      <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-slate-600">
                        {el.nom_parent ? (
                          <div>
                            <div className="text-[11px] font-medium text-slate-800">{el.nom_parent}</div>
                            <div className="text-[10px] text-slate-400">{el.contact_parent || 'Pas de tel'}</div>
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>

                      <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                            el.statut === 'ACTIF'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {el.statut}
                        </span>
                      </td>

                      <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-right space-x-1">
                        {canManage ? (
                          <>
                            <button
                              id={`btn-edit-eleve-${el.id}`}
                              onClick={() => openEditModal(el)}
                              className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Modifier la fiche élève"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              id={`btn-toggle-eleve-${el.id}`}
                              onClick={() => setConfirmToggleEleve(el)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                el.statut === 'ACTIF'
                                  ? 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                                  : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                              }`}
                              title={el.statut === 'ACTIF' ? 'Désactiver cet élève' : 'Réactiver cet élève'}
                            >
                              {el.statut === 'ACTIF' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                            </button>
                          </>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Consultation</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal création / modification élève */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="px-5 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-2xl">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {editingEleve ? `Fiche Élève : ${editingEleve.nom} ${editingEleve.prenom}` : 'Nouvelle inscription élève'}
                </h3>
                <p className="text-xs text-slate-500">
                  {editingEleve ? 'Modifiez les informations autorisées ci-dessous.' : 'Renseignez l’état-civil et la classe de l’élève.'}
                </p>
              </div>
              <button 
                onClick={() => !isSaving && setIsModalOpen(false)} 
                disabled={isSaving}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Matricule */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Matricule officiel *</label>
                  <input
                    id="modal-input-matricule"
                    type="text"
                    required
                    placeholder="Ex: GOGBO-2026-0001"
                    value={matricule}
                    onChange={(e) => setMatricule(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono uppercase focus:ring-2 focus:ring-emerald-500 text-xs sm:text-sm bg-white"
                  />
                </div>

                {/* Sexe */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Sexe *</label>
                  <select
                    id="modal-select-sexe"
                    value={sexe}
                    onChange={(e) => setSexe(e.target.value as Sexe)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-xs sm:text-sm bg-white"
                  >
                    <option value="M">Masculin (M)</option>
                    <option value="F">Féminin (F)</option>
                  </select>
                </div>

                {/* Nom */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Nom de famille *</label>
                  <input
                    id="modal-input-nom"
                    type="text"
                    required
                    placeholder="Ex: AGOSSOU"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg uppercase focus:ring-2 focus:ring-emerald-500 text-xs sm:text-sm bg-white"
                  />
                </div>

                {/* Prénom */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Prénom(s) *</label>
                  <input
                    id="modal-input-prenom"
                    type="text"
                    required
                    placeholder="Ex: Darius Mahugnon"
                    value={prenom}
                    onChange={(e) => setPrenom(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-xs sm:text-sm bg-white"
                  />
                </div>

                {/* Date de naissance */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Date de naissance</label>
                  <input
                    id="modal-input-datenaiss"
                    type="date"
                    value={dateNaissance}
                    onChange={(e) => setDateNaissance(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-xs sm:text-sm bg-white"
                  />
                </div>

                {/* Classe */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Classe d'affectation *</label>
                  <select
                    id="modal-select-classe"
                    value={classeId}
                    onChange={(e) => setClasseId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-xs sm:text-sm bg-white"
                  >
                    {classes.map((c) => {
                      const count = eleves.filter((e) => e.classe_id === c.id && e.statut === 'ACTIF').length;
                      return (
                        <option key={c.id} value={c.id} disabled={count >= 100 && c.id !== editingEleve?.classe_id}>
                          {c.nom} ({count}/100 élèves)
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* Option LV2 (Section 7) */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <label className="block text-slate-700 font-semibold mb-1">
                  Langue Vivante 2 (Optionnelle)
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  Règle officielle : Ne pas imposer simultanément Allemand et Espagnol à un même élève.
                </p>
                <div className="flex space-x-4">
                  {(['AUCUNE', 'ESPAGNOL', 'ALLEMAND'] as LangueOption[]).map((opt) => (
                    <label key={opt} className="flex items-center space-x-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="lv2-option"
                        value={opt}
                        checked={lv2 === opt}
                        onChange={(e) => setLv2(e.target.value as LangueOption)}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-xs font-medium text-slate-700">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Parents / Tuteur */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Nom Parent / Tuteur</label>
                  <input
                    id="modal-input-parent"
                    type="text"
                    placeholder="Ex: AGOSSOU Félicien"
                    value={nomParent}
                    onChange={(e) => setNomParent(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Téléphone Parent</label>
                  <input
                    id="modal-input-contact-parent"
                    type="tel"
                    placeholder="Ex: +229 97 00 00 00"
                    value={contactParent}
                    onChange={(e) => setContactParent(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm bg-white"
                  />
                </div>
              </div>

              {/* Boutons d'action avec état Enregistrement en cours... (Exigence 5 & 8) */}
              <div className="pt-4 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  id="btn-valider-form-eleve"
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors flex items-center space-x-2 disabled:opacity-75"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Enregistrement en cours...</span>
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

      {/* Modal de confirmation avant désactivation (Exigence 6) */}
      {confirmToggleEleve && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-5 sm:p-6">
            <div className="flex items-start space-x-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Confirmation d'action sur l'élève
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Êtes-vous sûr de vouloir {confirmToggleEleve.statut === 'ACTIF' ? 'désactiver' : 'réactiver'} l'élève{' '}
                  <strong>{confirmToggleEleve.nom} {confirmToggleEleve.prenom}</strong> (Matricule : {confirmToggleEleve.matricule}) ?
                </p>
                {confirmToggleEleve.statut === 'ACTIF' && (
                  <p className="text-[11px] text-red-600 bg-red-50 p-2 rounded-lg mt-2 border border-red-200">
                    L'élève apparaîtra comme inactif et ne figurera plus dans les effectifs comptabilisés pour les devoirs.
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmToggleEleve(null)}
                disabled={isSaving}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold"
              >
                Annuler
              </button>
              <button
                id="btn-confirm-toggle-eleve"
                type="button"
                onClick={handleConfirmToggleStatus}
                disabled={isSaving}
                className={`px-4 py-2 rounded-lg text-white text-xs font-bold shadow-xs transition-colors flex items-center space-x-2 ${
                  confirmToggleEleve.statut === 'ACTIF'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Enregistrement en cours...</span>
                  </>
                ) : (
                  <span>Confirmer la {confirmToggleEleve.statut === 'ACTIF' ? 'désactivation' : 'réactivation'}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
