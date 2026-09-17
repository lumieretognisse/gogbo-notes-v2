import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storage } from '../../lib/storage';
import { Settings, Save, CheckCircle2, AlertCircle, Building2, MapPin, Calendar, Award } from 'lucide-react';

export const ParametresEtablissement: React.FC = () => {
  const { currentUser, isCenseur } = useAuth();
  const [params, setParams] = useState(storage.getParametres());
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [nom, setNom] = useState(params.nom_etablissement);
  const [ministere, setMinistere] = useState(params.ministere);
  const [titre, setTitre] = useState(params.titre_plateforme);
  const [annee, setAnnee] = useState(params.annee_academique);
  const [commune, setCommune] = useState(params.commune);
  const [arrondissement, setArrondissement] = useState(params.arrondissement);
  const [directeur, setDirecteur] = useState(params.directeur_nom);
  const [censeur, setCenseur] = useState(params.censeur_nom);
  const [devise, setDevise] = useState(params.devise);
  const [email, setEmail] = useState(params.contact_email);
  const [tel, setTel] = useState(params.contact_tel);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setSuccessMessage(null);

    const updated = storage.updateParametres(
      {
        nom_etablissement: nom,
        ministere,
        titre_plateforme: titre,
        annee_academique: annee,
        commune,
        arrondissement,
        directeur_nom: directeur,
        censeur_nom: censeur,
        devise,
        contact_email: email,
        contact_tel: tel,
      },
      currentUser
    );

    setParams(updated);
    setSuccessMessage('Paramètres officiels de l’établissement enregistrés avec succès.');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center space-x-2">
            <Settings className="w-6 h-6 text-emerald-700" />
            <span>Paramètres Officiels de l'Établissement</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Identité ministérielle, localisation géographique, direction et année académique
          </p>
        </div>
      </div>

      {successMessage && (
        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Formulaire */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6">
        <form onSubmit={handleSave} className="space-y-5 text-xs sm:text-sm">
          {/* Section Institutionnelle */}
          <div className="border-b border-slate-200 pb-4">
            <h3 className="font-bold text-slate-800 text-sm mb-3 flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <span>Tutelle & Dénomination Officielle</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-slate-700 font-semibold mb-1">Ministère de Tutelle</label>
                <input
                  type="text"
                  disabled={!isCenseur}
                  value={ministere}
                  onChange={(e) => setMinistere(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nom de l'Établissement</label>
                <input
                  type="text"
                  disabled={!isCenseur}
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Titre de la Plateforme</label>
                <input
                  type="text"
                  disabled={!isCenseur}
                  value={titre}
                  onChange={(e) => setTitre(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>
          </div>

          {/* Section Localisation & Année */}
          <div className="border-b border-slate-200 pb-4">
            <h3 className="font-bold text-slate-800 text-sm mb-3 flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>Localisation & Année Académique</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Commune</label>
                <input
                  type="text"
                  disabled={!isCenseur}
                  value={commune}
                  onChange={(e) => setCommune(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Arrondissement</label>
                <input
                  type="text"
                  disabled={!isCenseur}
                  value={arrondissement}
                  onChange={(e) => setArrondissement(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Année Académique</label>
                <input
                  type="text"
                  disabled={!isCenseur}
                  value={annee}
                  onChange={(e) => setAnnee(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-xs text-emerald-800"
                />
              </div>
            </div>
          </div>

          {/* Direction */}
          <div className="border-b border-slate-200 pb-4">
            <h3 className="font-bold text-slate-800 text-sm mb-3 flex items-center space-x-2">
              <Award className="w-4 h-4 text-emerald-600" />
              <span>Responsables de Direction</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Directeur Général</label>
                <input
                  type="text"
                  disabled={!isCenseur}
                  value={directeur}
                  onChange={(e) => setDirecteur(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Censeur des Études</label>
                <input
                  type="text"
                  disabled={!isCenseur}
                  value={censeur}
                  onChange={(e) => setCenseur(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>
          </div>

          {isCenseur && (
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-xs transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Enregistrer les paramètres officiels</span>
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
