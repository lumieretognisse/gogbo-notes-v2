import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storage } from '../../lib/storage';
import { 
  getAppreciation, 
  getAppreciationColor, 
  calculerSyntheseMatiere,
  calculerClassementClasse
} from '../../lib/appreciation';
import { Eleve, Note, TypeEvaluation } from '../../types';
import { 
  BookOpen, 
  Users, 
  CheckCircle, 
  AlertCircle, 
  Save, 
  Award, 
  Lock, 
  FileText,
  Calculator,
  RefreshCw,
  CheckCheck
} from 'lucide-react';

interface EspacePedagogiqueProps {
  onOpenBulletin?: (eleveId: string, classeId: string, periodeId: string) => void;
}

type EvalInputKey = 'INTERROGATION_1' | 'INTERROGATION_2' | 'INTERROGATION_3' | 'DEVOIR_1' | 'DEVOIR_2';

export const EspacePedagogique: React.FC<EspacePedagogiqueProps> = ({ onOpenBulletin }) => {
  const { currentUser, affectations } = useAuth();
  const periodes = storage.getPeriodes();
  const [selectedPeriodeId, setSelectedPeriodeId] = useState<string>(
    storage.getActivePeriode().id
  );

  // Attribution sélectionnée (anciennement affectation)
  const [selectedAffId, setSelectedAffId] = useState<string>(
    affectations.length > 0 ? affectations[0].id : ''
  );

  const [activeTab, setActiveTab] = useState<'saisie' | 'resultats'>('saisie');

  // État de saisie des notes en cours (clé : `${eleveId}_${type}` -> valeur string)
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

  const currentAff = affectations.find((a) => a.id === selectedAffId);
  const classe = currentAff ? storage.getClasseById(currentAff.classe_id) : undefined;
  const matiere = currentAff ? storage.getMatiereById(currentAff.matiere_id) : undefined;
  const periode = periodes.find((p) => p.id === selectedPeriodeId) || periodes[0];

  // Élèves de la classe sélectionnée
  const eleves: Eleve[] = classe ? storage.getElevesByClasse(classe.id) : [];

  // Notes existantes pour cette attribution et cette période
  const existingNotes: Note[] = currentAff
    ? storage.getNotesByAffectationAndPeriode(currentAff.id, selectedPeriodeId)
    : [];

  // Récupérer la valeur actuelle d'un champ d'évaluation (I1, I2, I3, D1, D2)
  const getInputValue = (eleveId: string, type: EvalInputKey): string => {
    const key = `${eleveId}_${type}`;
    if (noteInputs[key] !== undefined) {
      return noteInputs[key];
    }
    const note = existingNotes.find((n) => {
      if (n.eleve_id !== eleveId) return false;
      if (n.type_evaluation === type) return true;
      // Compatibilité rétroactive pour ancienne étiquette INTERROGATION vers INTERROGATION_1
      if (type === 'INTERROGATION_1' && n.type_evaluation === 'INTERROGATION') return true;
      return false;
    });
    return note !== undefined ? String(note.valeur) : '';
  };

  const handleInputChange = (eleveId: string, type: EvalInputKey, val: string) => {
    const cleaned = val.replace(',', '.');
    const key = `${eleveId}_${type}`;
    setNoteInputs((prev) => ({ ...prev, [key]: cleaned }));
  };

  const triggerRecalculationVisual = () => {
    setIsRecalculating(true);
    setTimeout(() => {
      setIsRecalculating(false);
    }, 250);
  };

  // Enregistrer toutes les notes (I1, I2, I3, D1, D2) pour un élève
  const handleSaveStudentRow = (eleve: Eleve) => {
    if (!currentUser || !currentAff || !matiere) return;
    setStatusMessage(null);

    const evalTypes: EvalInputKey[] = [
      'INTERROGATION_1',
      'INTERROGATION_2',
      'INTERROGATION_3',
      'DEVOIR_1',
      'DEVOIR_2',
    ];

    let savedCount = 0;
    const errors: string[] = [];

    evalTypes.forEach((type) => {
      const rawVal = getInputValue(eleve.id, type);
      if (rawVal !== undefined && rawVal.trim() !== '') {
        const num = parseFloat(rawVal);
        if (isNaN(num) || num < 0 || num > 20) {
          errors.push(`${type} invalide (${rawVal})`);
        } else {
          try {
            storage.saveNote(
              {
                eleve_id: eleve.id,
                affectation_id: currentAff.id,
                periode_id: selectedPeriodeId,
                valeur: num,
                type_evaluation: type as TypeEvaluation,
              },
              currentUser
            );
            savedCount++;
          } catch (e: unknown) {
            errors.push(e instanceof Error ? e.message : 'Erreur');
          }
        }
      }
    });

    if (errors.length > 0) {
      setStatusMessage({ type: 'error', text: `Erreurs pour ${eleve.nom}: ${errors.join(', ')}` });
    } else if (savedCount > 0) {
      triggerRecalculationVisual();
      setLastSavedTime(new Date().toLocaleTimeString('fr-FR'));
      setStatusMessage({
        type: 'success',
        text: `✓ Notes enregistrées avec succès pour ${eleve.nom} ${eleve.prenom} (${savedCount} note(s)). Moyenne et rang actualisés.`,
      });
    } else {
      setStatusMessage({ type: 'error', text: `Aucune note saisie pour ${eleve.nom} ${eleve.prenom}.` });
    }
  };

  // Enregistrer toutes les notes saisies pour toute la classe
  const handleSaveAllNotes = () => {
    if (!currentUser || !currentAff) return;
    setStatusMessage(null);

    const evalTypes: EvalInputKey[] = [
      'INTERROGATION_1',
      'INTERROGATION_2',
      'INTERROGATION_3',
      'DEVOIR_1',
      'DEVOIR_2',
    ];

    let totalSaved = 0;
    const errors: string[] = [];

    eleves.forEach((el) => {
      evalTypes.forEach((type) => {
        const rawVal = getInputValue(el.id, type);
        if (rawVal !== undefined && rawVal.trim() !== '') {
          const num = parseFloat(rawVal);
          if (isNaN(num) || num < 0 || num > 20) {
            errors.push(`${el.nom} (${type}: ${rawVal})`);
          } else {
            try {
              storage.saveNote(
                {
                  eleve_id: el.id,
                  affectation_id: currentAff.id,
                  periode_id: selectedPeriodeId,
                  valeur: num,
                  type_evaluation: type as TypeEvaluation,
                },
                currentUser
              );
              totalSaved++;
            } catch (e: unknown) {
              errors.push(e instanceof Error ? e.message : 'Erreur');
            }
          }
        }
      });
    });

    if (errors.length > 0) {
      setStatusMessage({
        type: 'error',
        text: `Certaines notes n'ont pas pu être enregistrées : ${errors.slice(0, 3).join(' • ')}${errors.length > 3 ? ` (+${errors.length - 3} autres)` : ''}`,
      });
    } else if (totalSaved > 0) {
      triggerRecalculationVisual();
      setLastSavedTime(new Date().toLocaleTimeString('fr-FR'));
      setStatusMessage({
        type: 'success',
        text: `✓ Succès total : ${totalSaved} note(s) enregistrée(s) dans la base de données. Moyennes de classe, classements et bulletins mis à jour.`,
      });
    } else {
      setStatusMessage({ type: 'error', text: 'Aucune nouvelle note à enregistrer dans la classe.' });
    }
  };

  if (affectations.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 sm:p-10 text-center max-w-2xl mx-auto my-8">
        <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Aucune attribution de classe active</h2>
        <p className="text-slate-600 text-sm mb-6 leading-relaxed">
          Votre compte (<strong>{currentUser?.prenom} {currentUser?.nom}</strong>, rôle : {currentUser?.role}) 
          n'a pas encore d'attribution de classe ou de matière active pour l'année 2026–2027.
        </p>
        <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200">
          La saisie des notes requiert une attribution de classe validée par le Censeur des Études.
        </p>
      </div>
    );
  }

  // Calcul du classement et bulletins complets pour les résultats
  const allMatieres = storage.getMatieres();
  const allNotes = storage.getNotes();
  const allAffectations = storage.getAffectations();

  const { classement, bulletinsMap } = classe
    ? calculerClassementClasse(classe, eleves, periode, allMatieres, allNotes, allAffectations)
    : { classement: [], bulletinsMap: {} };

  return (
    <div className="space-y-6">
      {/* Bandeau d'en-tête Espace Pédagogique */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-slate-900 text-white rounded-xl p-4 sm:p-6 shadow-md border border-emerald-700/50">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-emerald-500/20 text-emerald-300 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-emerald-500/40">
                Espace Pédagogique — Attributions de classe
              </span>
              <span className="text-slate-300 text-xs">• Année 2026–2027</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold mt-1 text-white">
              {currentUser?.prenom} {currentUser?.nom}
            </h2>
            <p className="text-xs sm:text-sm text-emerald-200/90 mt-0.5">
              Saisie séparée des 3 interrogations (I1, I2, I3) & 2 devoirs (D1, D2) • Calcul en temps réel
            </p>
          </div>

          {/* Sélecteur de période */}
          <div className="flex items-center space-x-2 bg-slate-900/80 p-1.5 rounded-lg border border-slate-700 text-xs">
            <span className="text-slate-400 pl-2">Période :</span>
            <select
              aria-label="Sélectionner la période scolaire"
              value={selectedPeriodeId}
              onChange={(e) => setSelectedPeriodeId(e.target.value)}
              className="bg-slate-800 text-white font-medium rounded px-2.5 py-1.5 border border-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-400"
            >
              {periodes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nom} {p.is_locked ? '(Verrouillé)' : '(Ouvert)'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Mes attributions de classe (Pills cliquables) */}
        <div className="mt-5 pt-4 border-t border-emerald-700/40">
          <div className="text-xs font-semibold text-emerald-300 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Mes classes et matières attribuées :</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {affectations.map((aff) => {
              const cls = storage.getClasseById(aff.classe_id);
              const mat = storage.getMatiereById(aff.matiere_id);
              const isSelected = aff.id === selectedAffId;
              return (
                <button
                  key={aff.id}
                  id={`btn-select-aff-${aff.id}`}
                  onClick={() => {
                    setSelectedAffId(aff.id);
                    setNoteInputs({});
                    setStatusMessage(null);
                  }}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-amber-400 text-slate-950 font-bold shadow-sm ring-2 ring-white/30'
                      : 'bg-emerald-950/70 hover:bg-emerald-900 text-emerald-100 border border-emerald-700/50'
                  }`}
                >
                  <span className="text-sm font-black">{cls?.nom}</span>
                  <span className="opacity-80">|</span>
                  <span className="truncate max-w-[150px]">{mat?.nom}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-normal ${
                    isSelected ? 'bg-slate-900 text-amber-300' : 'bg-emerald-800 text-emerald-200'
                  }`}>
                    Coef {mat?.coefficient}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Détail de l'attribution de classe active */}
      {currentAff && classe && matiere && (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
          {/* Header de la vue classe */}
          <div className="px-4 sm:px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-lg">
                {classe.nom.split(' ')[0]}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                  {classe.nom} — {matiere.nom}
                </h3>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="flex items-center space-x-1">
                    <Users className="w-3.5 h-3.5" />
                    <span>{eleves.length} apprenants</span>
                  </span>
                  <span>•</span>
                  <span>Coefficient : <strong className="text-slate-900">{matiere.coefficient}</strong></span>
                  <span>•</span>
                  <span className="text-blue-700 font-medium">
                    Moy. Int. = (I1 + I2 + I3) ÷ 3
                  </span>
                  <span>•</span>
                  <span className="text-emerald-700 font-medium">
                    Moy. Matière = (Moy. Int. + D1 + D2) ÷ 3
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation Saisie vs Résultats */}
            <div className="flex bg-slate-200/80 p-1 rounded-lg text-xs font-medium w-full sm:w-auto">
              <button
                id="btn-tab-saisie-notes"
                onClick={() => setActiveTab('saisie')}
                className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-md transition-all ${
                  activeTab === 'saisie'
                    ? 'bg-white text-emerald-800 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Saisie des Notes (I1, I2, I3, D1, D2)
              </button>
              <button
                id="btn-tab-consultation-resultats"
                onClick={() => setActiveTab('resultats')}
                className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-md transition-all ${
                  activeTab === 'resultats'
                    ? 'bg-white text-emerald-800 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Synthèse & Classement
              </button>
            </div>
          </div>

          {/* Indicateur de recalcul en temps réel */}
          {isRecalculating && (
            <div className="bg-amber-50 text-amber-800 border-b border-amber-200 px-4 py-1.5 text-xs flex items-center justify-center space-x-2 animate-pulse">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600" />
              <span className="font-semibold">Actualisation instantanée des moyennes, classements et bulletins...</span>
            </div>
          )}

          {/* Message de statut */}
          {statusMessage && (
            <div
              className={`mx-4 sm:mx-6 mt-4 p-3 rounded-lg text-xs flex items-center justify-between space-x-2 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              <div className="flex items-center space-x-2">
                {statusMessage.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                )}
                <span className="font-medium">{statusMessage.text}</span>
              </div>
              {lastSavedTime && (
                <span className="text-[11px] text-slate-400 font-mono">
                  Enregistré à {lastSavedTime}
                </span>
              )}
            </div>
          )}

          {/* Contenu selon l'onglet actif */}
          {activeTab === 'saisie' ? (
            <div className="p-4 sm:p-6 space-y-4">
              {/* Alerte si la période est verrouillée */}
              {periode.is_locked && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 flex items-center space-x-2">
                  <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    La saisie des notes pour <strong>{periode.nom}</strong> est actuellement clôturée par le Censeur des Études.
                  </span>
                </div>
              )}

              {/* Barre d'outils et bouton Enregistrer Toute la Classe */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <div className="flex items-center space-x-2 text-xs text-slate-700">
                  <Calculator className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold">
                    Tableau officiel de saisie simultanée — 3 Interrogations & 2 Devoirs
                  </span>
                </div>

                {!periode.is_locked && (
                  <button
                    id="btn-save-all-notes"
                    onClick={handleSaveAllNotes}
                    className="flex items-center space-x-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors shadow-xs"
                  >
                    <CheckCheck className="w-4 h-4" />
                    <span>Enregistrer toutes les notes de la classe</span>
                  </button>
                )}
              </div>

              {/* Tableau officiel de saisie avec I1, I2, I3, Moy. Int, D1, D2, Moy. Matière, Points, Appréciation */}
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="px-2 sm:px-3 py-3 w-10 text-center">N°</th>
                      <th className="px-2 sm:px-3 py-3 w-24">Matricule</th>
                      <th className="px-3 sm:px-4 py-3 min-w-[160px]">Nom & Prénoms</th>
                      <th className="px-1 sm:px-2 py-3 text-center w-12">Sexe</th>
                      <th className="px-2 py-3 text-center w-20 bg-blue-50/70 text-blue-900 border-x border-blue-200/60 font-bold">
                        I1
                      </th>
                      <th className="px-2 py-3 text-center w-20 bg-blue-50/70 text-blue-900 border-r border-blue-200/60 font-bold">
                        I2
                      </th>
                      <th className="px-2 py-3 text-center w-20 bg-blue-50/70 text-blue-900 border-r border-blue-200/60 font-bold">
                        I3
                      </th>
                      <th className="px-2 py-3 text-center w-24 bg-blue-100/80 text-blue-950 font-black border-r border-blue-300">
                        Moy. Int.
                      </th>
                      <th className="px-2 py-3 text-center w-20 bg-emerald-50/70 text-emerald-900 border-r border-emerald-200/60 font-bold">
                        D1
                      </th>
                      <th className="px-2 py-3 text-center w-20 bg-emerald-50/70 text-emerald-900 border-r border-emerald-200/60 font-bold">
                        D2
                      </th>
                      <th className="px-2 py-3 text-center w-24 bg-emerald-100/80 text-emerald-950 font-black border-r border-emerald-300">
                        Moy. Matière
                      </th>
                      <th className="px-2 py-3 text-center w-16 bg-slate-100 font-bold border-r border-slate-200">
                        Points
                      </th>
                      <th className="px-3 py-3 min-w-[110px]">Appréciation</th>
                      <th className="px-3 py-3 text-right w-16">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {eleves.map((eleve, index) => {
                      const vI1Str = getInputValue(eleve.id, 'INTERROGATION_1');
                      const vI2Str = getInputValue(eleve.id, 'INTERROGATION_2');
                      const vI3Str = getInputValue(eleve.id, 'INTERROGATION_3');
                      const vD1Str = getInputValue(eleve.id, 'DEVOIR_1');
                      const vD2Str = getInputValue(eleve.id, 'DEVOIR_2');

                      const nI1 = vI1Str.trim() !== '' ? parseFloat(vI1Str) : null;
                      const nI2 = vI2Str.trim() !== '' ? parseFloat(vI2Str) : null;
                      const nI3 = vI3Str.trim() !== '' ? parseFloat(vI3Str) : null;
                      const nD1 = vD1Str.trim() !== '' ? parseFloat(vD1Str) : null;
                      const nD2 = vD2Str.trim() !== '' ? parseFloat(vD2Str) : null;

                      // Calcul strict de la moyenne d'interrogation
                      const interros = [nI1, nI2, nI3].filter((x): x is number => x !== null && !isNaN(x) && x >= 0 && x <= 20);
                      let moyInterros: number | null = null;
                      if (interros.length > 0) {
                        if (interros.length === 3) {
                          moyInterros = Math.round(((nI1! + nI2! + nI3!) / 3) * 100) / 100;
                        } else {
                          moyInterros = Math.round((interros.reduce((a, b) => a + b, 0) / interros.length) * 100) / 100;
                        }
                      }

                      // Calcul strict de la moyenne de matière : (Moy. Int. + D1 + D2) ÷ 3
                      let moyMatiere: number | null = null;
                      const hasD1 = nD1 !== null && !isNaN(nD1) && nD1 >= 0 && nD1 <= 20;
                      const hasD2 = nD2 !== null && !isNaN(nD2) && nD2 >= 0 && nD2 <= 20;

                      if (moyInterros !== null && hasD1 && hasD2) {
                        moyMatiere = Math.round(((moyInterros + nD1! + nD2!) / 3) * 100) / 100;
                      } else {
                        const parts: number[] = [];
                        if (moyInterros !== null) parts.push(moyInterros);
                        if (hasD1) parts.push(nD1!);
                        if (hasD2) parts.push(nD2!);
                        if (parts.length > 0) {
                          moyMatiere = Math.round((parts.reduce((a, b) => a + b, 0) / parts.length) * 100) / 100;
                        }
                      }

                      const points = moyMatiere !== null ? Math.round((moyMatiere * matiere.coefficient) * 100) / 100 : null;
                      const appreciation = getAppreciation(moyMatiere);
                      const colorStyle = getAppreciationColor(appreciation);

                      return (
                        <tr key={eleve.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-2 sm:px-3 py-2.5 text-center font-bold text-slate-500">
                            {index + 1}
                          </td>
                          <td className="px-2 sm:px-3 py-2.5 font-mono text-[11px] text-slate-600 font-medium whitespace-nowrap">
                            {eleve.matricule}
                          </td>
                          <td className="px-3 sm:px-4 py-2.5">
                            <div className="font-bold text-slate-900 text-xs">
                              {eleve.nom} {eleve.prenom}
                            </div>
                          </td>
                          <td className="px-1 sm:px-2 py-2.5 text-center">
                            <span className={`inline-block px-1.5 py-0.5 text-[10px] font-bold rounded ${
                              eleve.sexe === 'F' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                              {eleve.sexe}
                            </span>
                          </td>

                          {/* Interrogation 1 */}
                          <td className="px-1.5 py-2 text-center bg-blue-50/20 border-x border-blue-100">
                            <input
                              id={`input-i1-${eleve.id}`}
                              type="text"
                              inputMode="decimal"
                              disabled={periode.is_locked}
                              placeholder="—"
                              value={vI1Str}
                              onChange={(e) => handleInputChange(eleve.id, 'INTERROGATION_1', e.target.value)}
                              className={`w-14 text-center font-bold text-xs py-1 px-1 rounded border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                                nI1 !== null && (nI1 < 0 || nI1 > 20)
                                  ? 'border-red-500 bg-red-50 text-red-700'
                                  : 'border-slate-300 bg-white text-slate-900'
                              } ${periode.is_locked ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''}`}
                            />
                          </td>

                          {/* Interrogation 2 */}
                          <td className="px-1.5 py-2 text-center bg-blue-50/20 border-r border-blue-100">
                            <input
                              id={`input-i2-${eleve.id}`}
                              type="text"
                              inputMode="decimal"
                              disabled={periode.is_locked}
                              placeholder="—"
                              value={vI2Str}
                              onChange={(e) => handleInputChange(eleve.id, 'INTERROGATION_2', e.target.value)}
                              className={`w-14 text-center font-bold text-xs py-1 px-1 rounded border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                                nI2 !== null && (nI2 < 0 || nI2 > 20)
                                  ? 'border-red-500 bg-red-50 text-red-700'
                                  : 'border-slate-300 bg-white text-slate-900'
                              } ${periode.is_locked ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''}`}
                            />
                          </td>

                          {/* Interrogation 3 */}
                          <td className="px-1.5 py-2 text-center bg-blue-50/20 border-r border-blue-100">
                            <input
                              id={`input-i3-${eleve.id}`}
                              type="text"
                              inputMode="decimal"
                              disabled={periode.is_locked}
                              placeholder="—"
                              value={vI3Str}
                              onChange={(e) => handleInputChange(eleve.id, 'INTERROGATION_3', e.target.value)}
                              className={`w-14 text-center font-bold text-xs py-1 px-1 rounded border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                                nI3 !== null && (nI3 < 0 || nI3 > 20)
                                  ? 'border-red-500 bg-red-50 text-red-700'
                                  : 'border-slate-300 bg-white text-slate-900'
                              } ${periode.is_locked ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''}`}
                            />
                          </td>

                          {/* Moyenne Interrogations */}
                          <td className="px-2 py-2 text-center bg-blue-50/80 border-r border-blue-200">
                            {moyInterros !== null ? (
                              <span className="font-extrabold text-xs text-blue-900 font-mono">
                                {moyInterros.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-slate-300 italic text-[11px]">—</span>
                            )}
                          </td>

                          {/* Devoir 1 */}
                          <td className="px-1.5 py-2 text-center bg-emerald-50/20 border-r border-emerald-100">
                            <input
                              id={`input-d1-${eleve.id}`}
                              type="text"
                              inputMode="decimal"
                              disabled={periode.is_locked}
                              placeholder="—"
                              value={vD1Str}
                              onChange={(e) => handleInputChange(eleve.id, 'DEVOIR_1', e.target.value)}
                              className={`w-14 text-center font-bold text-xs py-1 px-1 rounded border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                                nD1 !== null && (nD1 < 0 || nD1 > 20)
                                  ? 'border-red-500 bg-red-50 text-red-700'
                                  : 'border-slate-300 bg-white text-slate-900'
                              } ${periode.is_locked ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''}`}
                            />
                          </td>

                          {/* Devoir 2 */}
                          <td className="px-1.5 py-2 text-center bg-emerald-50/20 border-r border-emerald-100">
                            <input
                              id={`input-d2-${eleve.id}`}
                              type="text"
                              inputMode="decimal"
                              disabled={periode.is_locked}
                              placeholder="—"
                              value={vD2Str}
                              onChange={(e) => handleInputChange(eleve.id, 'DEVOIR_2', e.target.value)}
                              className={`w-14 text-center font-bold text-xs py-1 px-1 rounded border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                                nD2 !== null && (nD2 < 0 || nD2 > 20)
                                  ? 'border-red-500 bg-red-50 text-red-700'
                                  : 'border-slate-300 bg-white text-slate-900'
                              } ${periode.is_locked ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''}`}
                            />
                          </td>

                          {/* Moyenne Matière */}
                          <td className="px-2 py-2 text-center bg-emerald-100/70 border-r border-emerald-300">
                            {moyMatiere !== null ? (
                              <span className="font-black text-xs text-emerald-950 font-mono">
                                {moyMatiere.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-slate-300 italic text-[11px]">—</span>
                            )}
                          </td>

                          {/* Points Pondérés */}
                          <td className="px-2 py-2 text-center bg-slate-50 border-r border-slate-200">
                            {points !== null ? (
                              <span className="font-bold text-xs text-slate-800 font-mono">
                                {points.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-slate-300 italic text-[11px]">—</span>
                            )}
                          </td>

                          {/* Appréciation */}
                          <td className="px-3 py-2 whitespace-nowrap">
                            {moyMatiere !== null ? (
                              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${colorStyle.bg} ${colorStyle.border}`}>
                                {appreciation}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">En attente</span>
                            )}
                          </td>

                          {/* Action individuelle */}
                          <td className="px-2 py-2 text-right whitespace-nowrap">
                            <button
                              id={`btn-save-row-${eleve.id}`}
                              disabled={periode.is_locked}
                              onClick={() => handleSaveStudentRow(eleve)}
                              className={`p-1.5 rounded text-white font-medium text-xs transition-colors ${
                                periode.is_locked
                                  ? 'bg-slate-300 cursor-not-allowed'
                                  : 'bg-emerald-600 hover:bg-emerald-700'
                              }`}
                              title="Enregistrer les notes de cet élève"
                            >
                              <Save className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Consultation détaillée des résultats de la matière et moyennes générales */
            <div className="p-4 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-200">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm sm:text-base flex items-center space-x-2">
                    <Award className="w-4 h-4 text-amber-500" />
                    <span>Synthèse complète : {matiere.nom} — {classe.nom} ({periode.nom})</span>
                  </h4>
                  <p className="text-xs text-slate-500">
                    Détail des 3 interrogations, devoirs, moyennes et rangs au CEG GOGBO
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-semibold text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="px-3 sm:px-4 py-3">Rang</th>
                      <th className="px-3 sm:px-4 py-3">Matricule</th>
                      <th className="px-3 sm:px-4 py-3">Nom & Prénoms</th>
                      <th className="px-2 sm:px-4 py-3 text-center">I1</th>
                      <th className="px-2 sm:px-4 py-3 text-center">I2</th>
                      <th className="px-2 sm:px-4 py-3 text-center">I3</th>
                      <th className="px-2 sm:px-4 py-3 text-center bg-blue-50 text-blue-900 font-bold">Moy. Int.</th>
                      <th className="px-2 sm:px-4 py-3 text-center">Dev. 1</th>
                      <th className="px-2 sm:px-4 py-3 text-center">Dev. 2</th>
                      <th className="px-3 sm:px-4 py-3 text-center font-black bg-emerald-50 text-emerald-900">Moyenne {matiere.nom}</th>
                      <th className="px-3 sm:px-4 py-3 text-center font-black">Moyenne Générale</th>
                      <th className="px-3 sm:px-4 py-3">Appréciation</th>
                      <th className="px-3 sm:px-4 py-3 text-right">Bulletin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {classement.map((item) => {
                      const b = bulletinsMap[item.eleve_id];
                      const mn = b?.matieres_notes.find((m) => m.matiere_id === matiere.id);
                      const apprecStyle = getAppreciationColor(item.appreciation);

                      return (
                        <tr key={item.eleve_id} className="hover:bg-slate-50">
                          <td className="px-3 sm:px-4 py-3 font-bold text-slate-900">
                            {item.rang === 1 && item.moyenne_generale !== null ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-black">
                                🥇 {item.rang_label}
                              </span>
                            ) : (
                              <span>{item.rang_label}</span>
                            )}
                          </td>
                          <td className="px-3 sm:px-4 py-3 font-mono text-slate-500 text-[11px]">
                            {item.matricule}
                          </td>
                          <td className="px-3 sm:px-4 py-3 font-semibold text-slate-800">
                            {item.nom} {item.prenom}
                          </td>
                          <td className="px-2 sm:px-4 py-3 text-center">
                            {mn?.interro_1 !== null && mn?.interro_1 !== undefined ? mn.interro_1 : '—'}
                          </td>
                          <td className="px-2 sm:px-4 py-3 text-center">
                            {mn?.interro_2 !== null && mn?.interro_2 !== undefined ? mn.interro_2 : '—'}
                          </td>
                          <td className="px-2 sm:px-4 py-3 text-center">
                            {mn?.interro_3 !== null && mn?.interro_3 !== undefined ? mn.interro_3 : '—'}
                          </td>
                          <td className="px-2 sm:px-4 py-3 text-center font-bold bg-blue-50/60 text-blue-900">
                            {mn?.moyenne_interros !== null && mn?.moyenne_interros !== undefined ? mn.moyenne_interros.toFixed(2) : '—'}
                          </td>
                          <td className="px-2 sm:px-4 py-3 text-center">
                            {mn?.devoir_1 !== null && mn?.devoir_1 !== undefined ? mn.devoir_1 : '—'}
                          </td>
                          <td className="px-2 sm:px-4 py-3 text-center">
                            {mn?.devoir_2 !== null && mn?.devoir_2 !== undefined ? mn.devoir_2 : '—'}
                          </td>
                          <td className="px-3 sm:px-4 py-3 text-center font-black text-emerald-900 bg-emerald-50/70">
                            {mn?.moyenne !== null && mn?.moyenne !== undefined ? `${mn.moyenne.toFixed(2)}/20` : '—'}
                          </td>
                          <td className="px-3 sm:px-4 py-3 text-center font-black text-sm text-slate-900">
                            {item.moyenne_generale !== null ? `${item.moyenne_generale.toFixed(2)}/20` : '—'}
                          </td>
                          <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${apprecStyle.bg} ${apprecStyle.border}`}>
                              {item.appreciation}
                            </span>
                          </td>
                          <td className="px-3 sm:px-4 py-3 text-right whitespace-nowrap">
                            <button
                              id={`btn-open-bulletin-${item.eleve_id}`}
                              onClick={() => onOpenBulletin && onOpenBulletin(item.eleve_id, classe.id, periode.id)}
                              className="inline-flex items-center space-x-1 px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded font-medium text-[11px]"
                              title="Générer le bulletin scolaire"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Bulletin</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
