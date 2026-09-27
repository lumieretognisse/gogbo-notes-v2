import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAnnee } from '../../context/AnneeContext';
import { storage } from '../../lib/storage';
import { EnregistrementPresence, StatutPresence, Eleve, Classe, Periode } from '../../types';
import { 
  ShieldCheck, 
  Users, 
  School, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Plus, 
  Trash2, 
  Edit3, 
  Search, 
  Filter, 
  Clock, 
  UserX,
  FileCheck,
  AlertOctagon,
  ArrowRight,
  BookOpen
} from 'lucide-react';
import { TabKey } from '../Navigation';

interface SurveillantDashboardProps {
  onNavigate: (tab: TabKey) => void;
}

type ModuleView = 'saisie' | 'registre' | 'bilan';

export const SurveillantDashboard: React.FC<SurveillantDashboardProps> = ({ onNavigate }) => {
  const { currentUser, isSurveillant, isCenseur, isDirecteur } = useAuth();
  const { selectedAnnee, activeAnnee, isArchive } = useAnnee();

  const [currentView, setCurrentView] = useState<ModuleView>('saisie');
  const [selectedClasseId, setSelectedClasseId] = useState<string>('cls-6a');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const classes = storage.getClasses();
  const periodes = storage.getPeriodes().filter((p) => p.annee_scolaire === selectedAnnee.libelle);
  const activePeriode = periodes.find((p) => p.is_active) || periodes[0] || storage.getActivePeriode();
  const [selectedPeriodeId, setSelectedPeriodeId] = useState<string>(activePeriode?.id || '');

  // Élèves de la classe pour l'année scolaire sélectionnée
  const elevesClasse: Eleve[] = useMemo(() => {
    return storage.getElevesByClasse(selectedClasseId, selectedAnnee.libelle);
  }, [selectedClasseId, selectedAnnee.libelle]);

  // État local de la feuille d'appel du jour (clé: eleveId -> { statut, motif })
  const [appelState, setAppelState] = useState<Record<string, { statut: StatutPresence; motif: string }>>({});

  // Initialisation de la feuille d'appel quand la classe change
  React.useEffect(() => {
    const initial: Record<string, { statut: StatutPresence; motif: string }> = {};
    const existingDatePresences = storage.getPresencesByClasse(selectedClasseId, selectedAnnee.libelle)
      .filter((p) => p.date === selectedDate);
    const existingMap = new Map(existingDatePresences.map((p) => [p.eleve_id, p]));

    elevesClasse.forEach((el) => {
      const existing = existingMap.get(el.id);
      if (existing) {
        initial[el.id] = { statut: existing.statut, motif: existing.motif || '' };
      } else {
        initial[el.id] = { statut: 'PRESENT', motif: '' };
      }
    });
    setAppelState(initial);
  }, [selectedClasseId, selectedDate, elevesClasse, selectedAnnee.libelle]);

  // Registre des présences et filtres
  const [searchEleve, setSearchEleve] = useState('');
  const [filtreStatut, setFiltreStatut] = useState<'ALL' | StatutPresence>('ALL');
  const [filtreClasse, setFiltreClasse] = useState<string>('ALL');

  const presencesAnnee = storage.getPresencesByAnnee(selectedAnnee.libelle);

  const filteredPresences = useMemo(() => {
    return presencesAnnee.filter((p) => {
      if (filtreClasse !== 'ALL' && p.classe_id !== filtreClasse) return false;
      if (filtreStatut !== 'ALL' && p.statut !== filtreStatut) return false;
      if (searchEleve.trim() !== '') {
        const el = storage.getEleveById(p.eleve_id);
        const searchStr = `${el?.nom || ''} ${el?.prenom || ''} ${el?.matricule || ''}`.toLowerCase();
        if (!searchStr.includes(searchEleve.toLowerCase())) return false;
      }
      return true;
    });
  }, [presencesAnnee, filtreClasse, filtreStatut, searchEleve]);

  // Enregistrer la feuille d'appel complète
  const handleSaveFeuilleAppel = () => {
    if (!currentUser) return;
    if (isArchive) {
      setStatusMessage({ type: 'error', text: 'Impossible d’enregistrer : l’année consultée est clôturée ou en lecture seule.' });
      return;
    }

    try {
      let count = 0;
      elevesClasse.forEach((el) => {
        const row = appelState[el.id] || { statut: 'PRESENT', motif: '' };
        // On enregistre les Absents et Abandons prioritairement, ou la présence
        storage.savePresence(
          {
            annee_scolaire: selectedAnnee.libelle,
            classe_id: selectedClasseId,
            eleve_id: el.id,
            date: selectedDate,
            statut: row.statut,
            motif: row.motif || (row.statut === 'PRESENT' ? 'Présent en cours' : undefined),
            enregistre_par_id: currentUser.id,
            enregistre_par_nom: `${currentUser.nom} ${currentUser.prenom}`,
            date_saisie: new Date().toISOString(),
            periode_id: selectedPeriodeId,
          },
          currentUser
        );
        count++;
      });

      setStatusMessage({
        type: 'success',
        text: `✓ Contrôle des présences enregistré avec succès pour la classe (${count} apprenants pointés le ${selectedDate}).`,
      });
    } catch (e: unknown) {
      setStatusMessage({ type: 'error', text: e instanceof Error ? e.message : 'Erreur lors de l’enregistrement.' });
    }
  };

  // Enregistrer ponctuellement un statut pour un apprenant
  const handleQuickSaveRow = (eleve: Eleve, statut: StatutPresence) => {
    if (!currentUser) return;
    if (isArchive) {
      setStatusMessage({ type: 'error', text: 'Opération refusée en consultation d’archives historiques.' });
      return;
    }

    const currentMotif = appelState[eleve.id]?.motif || '';
    setAppelState((prev) => ({
      ...prev,
      [eleve.id]: { statut, motif: currentMotif },
    }));

    try {
      storage.savePresence(
        {
          annee_scolaire: selectedAnnee.libelle,
          classe_id: selectedClasseId,
          eleve_id: eleve.id,
          date: selectedDate,
          statut,
          motif: currentMotif || undefined,
          enregistre_par_id: currentUser.id,
          enregistre_par_nom: `${currentUser.nom} ${currentUser.prenom}`,
          date_saisie: new Date().toISOString(),
          periode_id: selectedPeriodeId,
        },
        currentUser
      );
      setStatusMessage({
        type: 'success',
        text: `✓ Statut "${statut}" consigné pour ${eleve.nom} ${eleve.prenom}.`,
      });
    } catch (e: unknown) {
      setStatusMessage({ type: 'error', text: e instanceof Error ? e.message : 'Erreur lors de l’enregistrement.' });
    }
  };

  // Supprimer une entrée erronée
  const handleDeletePresence = (id: string) => {
    if (!currentUser) return;
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet enregistrement de présence ?")) {
      try {
        storage.deletePresence(id, currentUser);
        setStatusMessage({ type: 'success', text: '✓ Enregistrement supprimé avec succès.' });
      } catch (e: unknown) {
        setStatusMessage({ type: 'error', text: e instanceof Error ? e.message : 'Erreur lors de la suppression.' });
      }
    }
  };

  // Totaux statistiques
  const totalAbsencesAnnee = presencesAnnee.filter((p) => p.statut === 'ABSENT').length;
  const totalAbandonsAnnee = presencesAnnee.filter((p) => p.statut === 'ABANDON').length;
  const allEleves = storage.getElevesByAnnee(selectedAnnee.libelle);

  return (
    <div className="space-y-6">
      {/* 1. EN-TÊTE OFFICIEL DU MODULE */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-xl p-5 sm:p-6 shadow-md border border-slate-700">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-amber-400 text-slate-950 text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-wider flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-950" />
                <span>Surveillance Générale • CEG GOGBO</span>
              </span>
              <span className="text-indigo-200 text-xs">• Année {selectedAnnee.libelle}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black mt-1 text-white flex items-center space-x-2">
              <span>SUIVI DES PRÉSENCES, ABSENCES & ABANDONS</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl">
              Module officiel de contrôle de l’assiduité scolaire : pointage journalier par classe, enregistrement des absences et abandons, alertes de décrochage et report automatique sur le bulletin scolaire.
            </p>
          </div>

          {/* Navigation interne du module */}
          <div className="flex items-center bg-slate-800/80 p-1 rounded-lg border border-slate-700 shrink-0">
            <button
              onClick={() => setCurrentView('saisie')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                currentView === 'saisie'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Pointage du Jour</span>
            </button>
            <button
              onClick={() => setCurrentView('registre')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                currentView === 'registre'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Registre & Historique ({presencesAnnee.length})</span>
            </button>
            <button
              onClick={() => setCurrentView('bilan')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                currentView === 'bilan'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Bilan Assiduité</span>
            </button>
          </div>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-3.5 rounded-lg text-xs flex items-center justify-between space-x-2 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : 'bg-red-50 text-red-900 border border-red-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span className="font-semibold">{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-slate-600 text-xs px-2 py-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. STATS RAPIDES */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-lg">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-bold uppercase">Élèves Inscrits ({selectedAnnee.libelle})</div>
            <div className="text-xl font-black text-slate-900">{allEleves.length} apprenants</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="p-2.5 bg-amber-50 text-amber-700 rounded-lg">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-bold uppercase">Absences Enregistrées</div>
            <div className="text-xl font-black text-amber-700">{totalAbsencesAnnee} séance(s)</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="p-2.5 bg-red-50 text-red-700 rounded-lg">
            <UserX className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-bold uppercase">Abandons Constatés</div>
            <div className="text-xl font-black text-red-700">{totalAbandonsAnnee} cas</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-lg">
            <School className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-bold uppercase">Divisions Surveillées</div>
            <div className="text-xl font-black text-slate-900">{classes.length} classes</div>
          </div>
        </div>
      </div>

      {/* 3. VUE 1 : POINTAGE JOURNALIER PAR CLASSE */}
      {currentView === 'saisie' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Barre de configuration du pointage */}
          <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Classe à pointer
                </label>
                <select
                  value={selectedClasseId}
                  onChange={(e) => setSelectedClasseId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg py-2 px-3 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nom} ({c.niveau})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Date du pointage
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg py-2 px-3 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Période scolaire
                </label>
                <select
                  value={selectedPeriodeId}
                  onChange={(e) => setSelectedPeriodeId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg py-2 px-3 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                >
                  {periodes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nom} {p.is_active ? '★ (Active)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <button
                  onClick={handleSaveFeuilleAppel}
                  disabled={isArchive}
                  className="w-full bg-indigo-700 hover:bg-indigo-800 disabled:bg-slate-400 text-white font-bold text-xs py-2.5 px-4 rounded-lg shadow-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Valider l’appel de la classe</span>
                </button>
              </div>
            </div>
          </div>

          {/* Table de pointage des élèves */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3">Matricule</th>
                  <th className="px-4 py-3">Nom & Prénoms</th>
                  <th className="px-4 py-3 text-center">Sexe</th>
                  <th className="px-4 py-3 text-center">Statut du jour</th>
                  <th className="px-4 py-3">Motif / Observation du Surveillant</th>
                  <th className="px-4 py-3 text-center">Total Absences Cumulées</th>
                  <th className="px-4 py-3 text-center">Action Rapide</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {elevesClasse.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                      Aucun élève inscrit dans cette classe pour l’année {selectedAnnee.libelle}.
                    </td>
                  </tr>
                ) : (
                  elevesClasse.map((el) => {
                    const row = appelState[el.id] || { statut: 'PRESENT', motif: '' };
                    const totalAbs = storage.getEleveAbsencesCount(el.id, selectedAnnee.libelle);
                    const isAbandon = storage.isEleveAbandon(el.id, selectedAnnee.libelle);

                    return (
                      <tr 
                        key={el.id} 
                        className={`hover:bg-slate-50 transition-colors ${
                          row.statut === 'ABANDON' || isAbandon ? 'bg-red-50/50' : row.statut === 'ABSENT' ? 'bg-amber-50/40' : ''
                        }`}
                      >
                        <td className="px-4 py-3 font-mono font-bold text-slate-900">
                          {el.matricule}
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-900">
                          <span className="uppercase">{el.nom}</span> {el.prenom}
                          {isAbandon && (
                            <span className="ml-2 bg-red-700 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                              Abandon
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-slate-600">
                          {el.sexe}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="inline-flex rounded-lg border border-slate-300 p-0.5 bg-slate-100">
                            <button
                              onClick={() => {
                                setAppelState((prev) => ({
                                  ...prev,
                                  [el.id]: { ...row, statut: 'PRESENT' },
                                }));
                              }}
                              className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                                row.statut === 'PRESENT'
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              Présent
                            </button>
                            <button
                              onClick={() => {
                                setAppelState((prev) => ({
                                  ...prev,
                                  [el.id]: { ...row, statut: 'ABSENT' },
                                }));
                              }}
                              className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                                row.statut === 'ABSENT'
                                  ? 'bg-amber-600 text-white shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              Absent
                            </button>
                            <button
                              onClick={() => {
                                setAppelState((prev) => ({
                                  ...prev,
                                  [el.id]: { ...row, statut: 'ABANDON' },
                                }));
                              }}
                              className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                                row.statut === 'ABANDON'
                                  ? 'bg-red-700 text-white shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              Abandon
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            placeholder="Motif / Observation..."
                            value={row.motif}
                            onChange={(e) => {
                              const val = e.target.value;
                              setAppelState((prev) => ({
                                ...prev,
                                [el.id]: { ...row, motif: val },
                              }));
                            }}
                            className="w-full bg-white border border-slate-300 rounded px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </td>
                        <td className="px-4 py-3 text-center font-bold">
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            totalAbs > 3 ? 'bg-red-100 text-red-800' : totalAbs > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {totalAbs} abs.
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleQuickSaveRow(el, row.statut)}
                            disabled={isArchive}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold px-2 py-1 rounded border border-slate-300 transition-colors cursor-pointer"
                            title="Consigner immédiatement pour cet élève"
                          >
                            ✓ Consigner
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. VUE 2 : REGISTRE COMPLET & RECHERCHE */}
      {currentView === 'registre' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Registre Historique des Événements d’Assiduité
              </h3>
              <p className="text-xs text-slate-500">
                Consultation, recherche et rectification des saisies d’absences et d’abandons pour l’année {selectedAnnee.libelle}
              </p>
            </div>

            {/* Filtres de recherche */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-48">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Rechercher élève..."
                  value={searchEleve}
                  onChange={(e) => setSearchEleve(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <select
                value={filtreClasse}
                onChange={(e) => setFiltreClasse(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-2.5 text-xs text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="ALL">Toutes les classes</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.nom}</option>
                ))}
              </select>

              <select
                value={filtreStatut}
                onChange={(e) => setFiltreStatut(e.target.value as any)}
                className="bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-2.5 text-xs text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="ALL">Tous les statuts</option>
                <option value="ABSENT">Absences uniquement</option>
                <option value="ABANDON">Abandons uniquement</option>
                <option value="PRESENT">Présences</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-3.5 py-2.5">Date</th>
                  <th className="px-3.5 py-2.5">Élève Concerné</th>
                  <th className="px-3.5 py-2.5">Classe</th>
                  <th className="px-3.5 py-2.5 text-center">Statut</th>
                  <th className="px-3.5 py-2.5">Motif / Observation</th>
                  <th className="px-3.5 py-2.5">Enregistré par</th>
                  <th className="px-3.5 py-2.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredPresences.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                      Aucune saisie de présence correspondant aux critères sélectionnés.
                    </td>
                  </tr>
                ) : (
                  filteredPresences.map((p) => {
                    const el = storage.getEleveById(p.eleve_id);
                    const cls = storage.getClasseById(p.classe_id);

                    return (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="px-3.5 py-2.5 font-mono text-slate-700">
                          {p.date}
                        </td>
                        <td className="px-3.5 py-2.5 font-bold text-slate-900">
                          {el ? `${el.nom} ${el.prenom}` : p.eleve_id}
                          <span className="block font-mono text-[10px] text-slate-400 font-normal">
                            {el?.matricule}
                          </span>
                        </td>
                        <td className="px-3.5 py-2.5 font-semibold text-slate-700">
                          {cls?.nom || p.classe_id}
                        </td>
                        <td className="px-3.5 py-2.5 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            p.statut === 'PRESENT'
                              ? 'bg-emerald-100 text-emerald-800'
                              : p.statut === 'ABSENT'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {p.statut}
                          </span>
                        </td>
                        <td className="px-3.5 py-2.5 text-slate-600 italic">
                          {p.motif || '—'}
                        </td>
                        <td className="px-3.5 py-2.5 text-slate-500 text-[11px]">
                          {p.enregistre_par_nom || 'Surveillance'}
                        </td>
                        <td className="px-3.5 py-2.5 text-center">
                          {!isArchive && (isSurveillant || isCenseur || isDirecteur) && (
                            <button
                              onClick={() => handleDeletePresence(p.id)}
                              className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 cursor-pointer"
                              title="Supprimer cet enregistrement erroné"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
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
      )}

      {/* 5. VUE 3 : BILAN PAR ÉLÈVE & DÉTECTION DES ABANDONS */}
      {currentView === 'bilan' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-5">
          <div className="flex justify-between items-center pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Bilan Assiduité & Registre des Abandons
              </h3>
              <p className="text-xs text-slate-500">
                Synthèse cumulative des absences par élève et repérage des situations d'abandon scolaire.
              </p>
            </div>
            <span className="text-xs bg-indigo-50 text-indigo-800 font-bold px-3 py-1 rounded-full border border-indigo-200">
              Année Scolaire {selectedAnnee.libelle}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cas d'abandons déclarés */}
            <div className="border border-red-200 rounded-xl p-4 bg-red-50/40 space-y-3">
              <div className="flex items-center space-x-2 text-red-900 font-bold text-sm">
                <AlertOctagon className="w-4 h-4 text-red-600" />
                <span>Liste Officielle des Abandons ({totalAbandonsAnnee})</span>
              </div>
              <p className="text-xs text-red-800">
                Les apprenants listés ci-dessous portent la mention réglementaire "ABANDONNÉ" sur leur bulletin officiel.
              </p>

              {totalAbandonsAnnee === 0 ? (
                <div className="bg-white/80 p-4 rounded-lg text-center text-xs text-slate-500 border border-slate-200">
                  Aucun cas d’abandon scolaire enregistré pour l’année {selectedAnnee.libelle}.
                </div>
              ) : (
                <div className="space-y-2">
                  {presencesAnnee
                    .filter((p) => p.statut === 'ABANDON')
                    .map((p) => {
                      const el = storage.getEleveById(p.eleve_id);
                      const cls = storage.getClasseById(p.classe_id);
                      return (
                        <div key={p.id} className="bg-white p-3 rounded-lg border border-red-200 shadow-2xs flex justify-between items-center">
                          <div>
                            <div className="font-bold text-slate-900 text-xs">
                              {el?.nom} {el?.prenom}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Matricule: {el?.matricule} • Classe: {cls?.nom}
                            </div>
                            {p.motif && (
                              <div className="text-[10px] text-red-700 italic mt-0.5">
                                Motif: {p.motif}
                              </div>
                            )}
                          </div>
                          <span className="bg-red-700 text-white font-black text-[10px] px-2 py-0.5 rounded uppercase">
                            Abandonné
                          </span>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Élèves à forte assiduité défaillante (plus de 2 absences) */}
            <div className="border border-amber-200 rounded-xl p-4 bg-amber-50/40 space-y-3">
              <div className="flex items-center space-x-2 text-amber-900 font-bold text-sm">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Apprenants à Vigilance Absences</span>
              </div>
              <p className="text-xs text-amber-800">
                Élèves ayant cumulé des absences répétées au cours de la session.
              </p>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {allEleves
                  .map((el) => ({
                    eleve: el,
                    absCount: storage.getEleveAbsencesCount(el.id, selectedAnnee.libelle),
                    isAbandon: storage.isEleveAbandon(el.id, selectedAnnee.libelle),
                  }))
                  .filter((item) => item.absCount > 0)
                  .sort((a, b) => b.absCount - a.absCount)
                  .map((item) => {
                    const cls = storage.getClasseOfEleve(item.eleve.id, selectedAnnee.libelle);
                    return (
                      <div key={item.eleve.id} className="bg-white p-3 rounded-lg border border-amber-200 shadow-2xs flex justify-between items-center">
                        <div>
                          <div className="font-bold text-slate-900 text-xs">
                            {item.eleve.nom} {item.eleve.prenom}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Classe: {cls?.nom} • Matricule: {item.eleve.matricule}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="bg-amber-100 text-amber-900 font-bold text-xs px-2.5 py-1 rounded">
                            {item.absCount} absence(s)
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
