import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storage } from '../../lib/storage';
import { Matiere } from '../../types';
import { Layers, CheckCircle2, AlertCircle, Edit3, Save, X, Info } from 'lucide-react';

export const GestionMatieres: React.FC = () => {
  const { currentUser, isCenseur } = useAuth();
  const [matieres, setMatieres] = useState<Matiere[]>(storage.getMatieres());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCoef, setEditCoef] = useState<number>(1);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const affectations = storage.getAffectations();

  const handleStartEdit = (m: Matiere) => {
    if (!isCenseur) return;
    setEditingId(m.id);
    setEditCoef(m.coefficient);
    setStatusMessage(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveCoef = async (matiere: Matiere) => {
    if (!currentUser || !isCenseur) return;
    if (isNaN(editCoef) || editCoef < 1 || editCoef > 10) {
      setStatusMessage({ type: 'error', text: 'Le coefficient doit être un nombre entier compris entre 1 et 10.' });
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);

    try {
      await storage.updateMatiereAsync(matiere.id, { coefficient: Number(editCoef) }, currentUser);
      const updatedList = storage.getMatieres();
      setMatieres(updatedList);
      setEditingId(null);
      setStatusMessage({
        type: 'success',
        text: `Coefficient de "${matiere.nom}" mis à jour avec succès (${editCoef}). Les moyennes et classements sont automatiquement recalculés.`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatusMessage({ type: 'error', text: msg });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center space-x-2">
            <Layers className="w-6 h-6 text-emerald-700" />
            <span>Nomenclature des Matières & Coefficients</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Consultez et modifiez les coefficients officiels en vigueur au CEG GOGBO (Section 5)
          </p>
        </div>
      </div>

      {/* Note d'information réglementaire */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-900 flex items-start space-x-3">
        <Info className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">Coefficients dynamiques et calculs en temps réel :</p>
          <p className="text-emerald-800 leading-relaxed">
            Les coefficients ne sont jamais figés en dur dans le code. En tant que Censeur, vous pouvez modifier
            le coefficient d'une matière (ex: SVT de 2 à 3). Dès l'enregistrement, tous les points pondérés,
            moyennes générales, appréciations, classements et bulletins scolaires sont automatiquement recalculés.
          </p>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-3.5 rounded-lg text-xs flex items-center space-x-2 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span className="font-semibold">{statusMessage.text}</span>
        </div>
      )}

      {/* Tableau des matières */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3">Code Officiel</th>
                <th className="px-4 py-3">Intitulé de la Matière</th>
                <th className="px-4 py-3">Catégorie</th>
                <th className="px-4 py-3 text-center">Coefficient en vigueur</th>
                <th className="px-4 py-3 text-center">Option LV2</th>
                <th className="px-4 py-3 text-center">Affectations Actives</th>
                <th className="px-4 py-3 text-center">Action Censeur</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {matieres.map((m) => {
                const countAff = affectations.filter((a) => a.matiere_id === m.id && a.statut === 'ACTIF').length;
                const isEditing = editingId === m.id;

                return (
                  <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">
                      {m.code}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800 text-sm">
                      {m.nom}
                    </td>
                    <td className="px-4 py-3">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium">
                        {m.categorie}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {isEditing ? (
                        <div className="inline-flex items-center space-x-1">
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={editCoef}
                            onChange={(e) => setEditCoef(parseInt(e.target.value, 10) || 1)}
                            className="w-16 px-2 py-1 border border-emerald-500 rounded text-center font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                            autoFocus
                          />
                        </div>
                      ) : (
                        <span className="inline-block bg-slate-100 text-slate-900 px-3 py-1 rounded-full font-black text-sm">
                          {m.coefficient}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {m.is_langue_option ? (
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-300">
                          Option LV2
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">Tronc commun</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-emerald-800">
                      {countAff} classe(s)
                    </td>
                    <td className="px-4 py-3 text-center">
                      {isCenseur ? (
                        isEditing ? (
                          <div className="inline-flex items-center space-x-1">
                            <button
                              id={`btn-save-coef-${m.id}`}
                              onClick={() => handleSaveCoef(m)}
                              disabled={isSaving}
                              className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-bold text-[11px] flex items-center space-x-1 shadow-xs"
                              title="Enregistrer la modification"
                            >
                              <Save className="w-3.5 h-3.5" />
                              <span>{isSaving ? '...' : 'Valider'}</span>
                            </button>
                            <button
                              id={`btn-cancel-coef-${m.id}`}
                              onClick={handleCancelEdit}
                              className="p-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[11px]"
                              title="Annuler"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            id={`btn-edit-coef-${m.id}`}
                            onClick={() => handleStartEdit(m)}
                            className="px-2.5 py-1 text-emerald-800 hover:bg-emerald-50 border border-emerald-300 rounded font-medium text-[11px] flex items-center space-x-1 mx-auto transition-colors"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Modifier Coef</span>
                          </button>
                        )
                      ) : (
                        <span className="text-slate-400 text-[11px]">Verrouillé</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
