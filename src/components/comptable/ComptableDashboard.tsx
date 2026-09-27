import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAnnee } from '../../context/AnneeContext';
import { storage } from '../../lib/storage';
import { PaiementContribution, TranchePaiement, ModePaiement, Eleve, Classe } from '../../types';
import { 
  CreditCard, 
  Users, 
  School, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Printer, 
  Search, 
  Filter, 
  Receipt, 
  TrendingUp, 
  DollarSign, 
  Check, 
  Trash2, 
  ArrowRight,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { TabKey } from '../Navigation';

interface ComptableDashboardProps {
  onNavigate: (tab: TabKey) => void;
}

type TabCompta = 'nouveau' | 'registre' | 'etats';

const MONTANT_EXIGE_STANDARD = 50000; // 50 000 FCFA par an (CEG GOGBO)

export const ComptableDashboard: React.FC<ComptableDashboardProps> = ({ onNavigate }) => {
  const { currentUser, isComptable, isCenseur, isDirecteur } = useAuth();
  const { selectedAnnee, isArchive } = useAnnee();

  const [activeTab, setActiveTab] = useState<TabCompta>('registre');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const classes = storage.getClasses();
  const allEleves = storage.getElevesByAnnee(selectedAnnee.libelle);

  // Formulaire d'enregistrement d'un versement
  const [formClasseId, setFormClasseId] = useState<string>('cls-6a');
  const elevesFormClasse = useMemo(() => {
    return storage.getElevesByClasse(formClasseId, selectedAnnee.libelle);
  }, [formClasseId, selectedAnnee.libelle]);

  const [formEleveId, setFormEleveId] = useState<string>(elevesFormClasse[0]?.id || '');
  const [formTranche, setFormTranche] = useState<TranchePaiement>('TRANCHE_1');
  const [formMontant, setFormMontant] = useState<number>(25000);
  const [formMode, setFormMode] = useState<ModePaiement>('ESPECES');
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formReference, setFormReference] = useState<string>('');
  const [formObservation, setFormObservation] = useState<string>('');

  // Reçu sélectionné pour affichage / impression
  const [selectedRecuForPrint, setSelectedRecuForPrint] = useState<PaiementContribution | null>(null);

  // Synchroniser l'élève sélectionné quand la classe change
  React.useEffect(() => {
    if (elevesFormClasse.length > 0 && !elevesFormClasse.some((e) => e.id === formEleveId)) {
      setFormEleveId(elevesFormClasse[0].id);
    }
  }, [elevesFormClasse, formEleveId]);

  // Paiements de l'année scolaire sélectionnée
  const paiementsAnnee = storage.getPaiementsByAnnee(selectedAnnee.libelle);

  // Filtres pour le registre
  const [searchEleve, setSearchEleve] = useState('');
  const [filtreClasse, setFiltreClasse] = useState('ALL');
  const [filtreStatut, setFiltreStatut] = useState<'ALL' | 'SOLDE' | 'PARTIEL'>('ALL');

  const filteredPaiements = useMemo(() => {
    return paiementsAnnee.filter((p) => {
      if (filtreClasse !== 'ALL' && p.classe_id !== filtreClasse) return false;
      if (filtreStatut !== 'ALL' && p.statut_paiement !== filtreStatut) return false;
      if (searchEleve.trim() !== '') {
        const el = storage.getEleveById(p.eleve_id);
        const q = `${el?.nom || ''} ${el?.prenom || ''} ${p.numero_recu}`.toLowerCase();
        if (!q.includes(searchEleve.toLowerCase())) return false;
      }
      return true;
    });
  }, [paiementsAnnee, filtreClasse, filtreStatut, searchEleve]);

  // Statistiques financières
  const totalEncaisse = useMemo(() => {
    return paiementsAnnee.reduce((acc, curr) => acc + curr.montant_paye, 0);
  }, [paiementsAnnee]);

  const totalExigibleTheorique = allEleves.length * MONTANT_EXIGE_STANDARD;
  const resteGlobal = Math.max(0, totalExigibleTheorique - totalEncaisse);
  const tauxRecouvrement = totalExigibleTheorique > 0 
    ? Math.round((totalEncaisse / totalExigibleTheorique) * 100) 
    : 0;

  // Calcul du cumul déjà payé par un élève pour cette année
  const getCumulPaye = (eleveId: string) => {
    const list = storage.getPaiementsByEleve(eleveId, selectedAnnee.libelle);
    return list.reduce((acc, curr) => acc + curr.montant_paye, 0);
  };

  // Enregistrer un nouveau versement
  const handleSavePaiement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (isArchive) {
      setStatusMessage({ type: 'error', text: 'Impossible d’enregistrer : l’année consultée est clôturée ou en lecture seule.' });
      return;
    }
    if (!formEleveId) {
      setStatusMessage({ type: 'error', text: 'Veuillez sélectionner un élève valide.' });
      return;
    }
    if (formMontant <= 0) {
      setStatusMessage({ type: 'error', text: 'Le montant payé doit être supérieur à zéro.' });
      return;
    }

    try {
      const dejaPaye = getCumulPaye(formEleveId);
      const nouveauCumul = dejaPaye + Number(formMontant);
      const reste = Math.max(0, MONTANT_EXIGE_STANDARD - nouveauCumul);
      const statut = reste === 0 ? 'SOLDE' : 'PARTIEL';

      // Numérotation automatique du reçu officiel : REC-YYYY-XXXX
      const anneePrefix = selectedAnnee.libelle.split('–')[0].trim();
      const numSequence = String(paiementsAnnee.length + 1).padStart(4, '0');
      const numeroRecu = `REC-${anneePrefix}-${numSequence}`;

      const nouveau = storage.savePaiement(
        {
          numero_recu: numeroRecu,
          annee_scolaire: selectedAnnee.libelle,
          eleve_id: formEleveId,
          classe_id: formClasseId,
          tranche: formTranche,
          montant_paye: Number(formMontant),
          montant_total_exige: MONTANT_EXIGE_STANDARD,
          reste_a_payer: reste,
          statut_paiement: statut,
          mode_paiement: formMode,
          reference_recu: formReference || undefined,
          observation: formObservation || undefined,
          enregistre_par_id: currentUser.id,
          enregistre_par_nom: `${currentUser.nom} ${currentUser.prenom}`,
          date_paiement: formDate,
        },
        currentUser
      );

      setStatusMessage({
        type: 'success',
        text: `✓ Versement enregistré avec succès sous le reçu n° ${nouveau.numero_recu} (${formMontant.toLocaleString()} FCFA). Reste à payer pour l'élève: ${reste.toLocaleString()} FCFA.`,
      });

      // Ouvrir automatiquement l'aperçu du reçu
      setSelectedRecuForPrint(nouveau);
    } catch (err: unknown) {
      setStatusMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Erreur lors de l’enregistrement du versement.',
      });
    }
  };

  // Supprimer un reçu erroné
  const handleDeletePaiement = (id: string) => {
    if (!currentUser) return;
    if (window.confirm("Êtes-vous certain de vouloir annuler et supprimer ce versement ?")) {
      try {
        storage.deletePaiement(id, currentUser);
        setStatusMessage({ type: 'success', text: '✓ Reçu supprimé de la comptabilité.' });
      } catch (err: unknown) {
        setStatusMessage({ type: 'error', text: err instanceof Error ? err.message : 'Erreur suppression.' });
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. EN-TÊTE OFFICIEL COMPTABILITÉ */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white rounded-xl p-5 sm:p-6 shadow-md border border-slate-700">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-amber-400 text-slate-950 text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-wider flex items-center space-x-1">
                <CreditCard className="w-3.5 h-3.5 text-slate-950" />
                <span>Service Comptabilité & Économat • CEG GOGBO</span>
              </span>
              <span className="text-teal-200 text-xs">• Année {selectedAnnee.libelle}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black mt-1 text-white flex items-center space-x-2">
              <span>GESTION DES CONTRIBUTIONS & FRAIS SCOLAIRES</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl">
              Suivi officiel des règlements des contributions scolaires, émission des reçus de caisse numérotés, gestion des échéances de paiement et balance financière annuelle.
            </p>
          </div>

          {/* Navigation interne du module */}
          <div className="flex items-center bg-slate-800/80 p-1 rounded-lg border border-slate-700 shrink-0">
            <button
              onClick={() => setActiveTab('registre')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'registre'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Registre des Reçus ({paiementsAnnee.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('nouveau')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'nouveau'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <Plus className="w-3.5 h-3.5 text-amber-300" />
              <span>Nouveau Versement</span>
            </button>
            <button
              onClick={() => setActiveTab('etats')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'etats'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-300" />
              <span>Soldes par Élève</span>
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
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
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

      {/* 2. TABLEAU DE BORD FINANCIER RAPIDE */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="p-2.5 bg-teal-50 text-teal-700 rounded-lg">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-bold uppercase">Total Encaissé ({selectedAnnee.libelle})</div>
            <div className="text-xl font-black text-slate-900">{totalEncaisse.toLocaleString()} FCFA</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="p-2.5 bg-amber-50 text-amber-700 rounded-lg">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-bold uppercase">Reste Global à Recouvrer</div>
            <div className="text-xl font-black text-amber-700">{resteGlobal.toLocaleString()} FCFA</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-lg">
            <Check className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-bold uppercase">Taux de Recouvrement</div>
            <div className="text-xl font-black text-emerald-700">{tauxRecouvrement} %</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-lg">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-bold uppercase">Reçus Délivrés</div>
            <div className="text-xl font-black text-slate-900">{paiementsAnnee.length} reçus</div>
          </div>
        </div>
      </div>

      {/* 3. VUE 1 : NOUVEAU VERSEMENT & ÉMISSION DE REÇU */}
      {activeTab === 'nouveau' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-5">
          <div className="pb-3 border-b border-slate-200">
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Receipt className="w-5 h-5 text-teal-700" />
              <span>Enregistrement d’un Nouveau Versement de Contribution</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Établissez un reçu officiel avec mise à jour instantanée du solde de l'élève.
            </p>
          </div>

          <form onSubmit={handleSavePaiement} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  1. Sélectionner la Division
                </label>
                <select
                  value={formClasseId}
                  onChange={(e) => setFormClasseId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-teal-500 cursor-pointer"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.nom}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  2. Sélectionner l'Élève Bénéficiaire
                </label>
                <select
                  value={formEleveId}
                  onChange={(e) => setFormEleveId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-teal-500 cursor-pointer"
                >
                  {elevesFormClasse.length === 0 ? (
                    <option value="">Aucun élève inscrit</option>
                  ) : (
                    elevesFormClasse.map((el) => {
                      const paye = getCumulPaye(el.id);
                      const reste = Math.max(0, MONTANT_EXIGE_STANDARD - paye);
                      return (
                        <option key={el.id} value={el.id}>
                          {el.nom} {el.prenom} ({el.matricule}) — Reste: {reste.toLocaleString()} F
                        </option>
                      );
                    })
                  )}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  3. Tranche concernée
                </label>
                <select
                  value={formTranche}
                  onChange={(e) => setFormTranche(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-teal-500 cursor-pointer"
                >
                  <option value="TRANCHE_1">1ère Tranche (25 000 FCFA)</option>
                  <option value="TRANCHE_2">2ème Tranche (15 000 FCFA)</option>
                  <option value="TRANCHE_3">3ème Tranche (10 000 FCFA)</option>
                  <option value="SOLDE_TOTAL">Solde Total Intégral (50 000 FCFA)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  4. Montant versé en Francs CFA
                </label>
                <input
                  type="number"
                  min="1000"
                  step="500"
                  value={formMontant}
                  onChange={(e) => setFormMontant(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-lg py-2 px-3 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  5. Mode de Règlement
                </label>
                <select
                  value={formMode}
                  onChange={(e) => setFormMode(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-teal-500 cursor-pointer"
                >
                  <option value="ESPECES">Espèces (Caisse établissement)</option>
                  <option value="MOBILE_MONEY">Mobile Money (MTN / Moov)</option>
                  <option value="VIREMENT_BANCAIRE">Virement Bancaire (Trésor)</option>
                  <option value="CHEQUE">Chèque Bancaire</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  6. Date d'encaissement
                </label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg py-2 px-3 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Référence de la transaction / Numéro de transaction externe
                </label>
                <input
                  type="text"
                  placeholder="Ex: TXN-MTN-98471 ou N° Chèque"
                  value={formReference}
                  onChange={(e) => setFormReference(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg py-2 px-3 text-xs text-slate-800 focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Observation / Remarque
                </label>
                <input
                  type="text"
                  placeholder="Ex: Paiement effectué par le tuteur légal"
                  value={formObservation}
                  onChange={(e) => setFormObservation(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg py-2 px-3 text-xs text-slate-800 focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                type="submit"
                disabled={isArchive}
                className="bg-teal-700 hover:bg-teal-800 disabled:bg-slate-400 text-white font-bold text-xs py-2.5 px-6 rounded-lg shadow-sm transition-all flex items-center space-x-2 cursor-pointer"
              >
                <Receipt className="w-4 h-4 text-teal-200" />
                <span>Enregistrer & Générer le Reçu Officiel</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 4. VUE 2 : REGISTRE COMPLET DES REÇUS */}
      {activeTab === 'registre' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Grand Livre des Encaissements & Reçus
              </h3>
              <p className="text-xs text-slate-500">
                Historique inaltérable de tous les versements pour l'année scolaire {selectedAnnee.libelle}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-48">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Élève ou N° reçu..."
                  value={searchEleve}
                  onChange={(e) => setSearchEleve(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
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
                <option value="SOLDE">Soldé intégral</option>
                <option value="PARTIEL">Paiement partiel</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-3.5 py-2.5">N° Reçu</th>
                  <th className="px-3.5 py-2.5">Date</th>
                  <th className="px-3.5 py-2.5">Élève & Matricule</th>
                  <th className="px-3.5 py-2.5">Classe</th>
                  <th className="px-3.5 py-2.5 text-right">Montant Versé</th>
                  <th className="px-3.5 py-2.5 text-right">Reste à Payer</th>
                  <th className="px-3.5 py-2.5 text-center">Statut</th>
                  <th className="px-3.5 py-2.5 text-center">Mode</th>
                  <th className="px-3.5 py-2.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredPaiements.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                      Aucun versement enregistré pour cette sélection en {selectedAnnee.libelle}.
                    </td>
                  </tr>
                ) : (
                  filteredPaiements.map((p) => {
                    const el = storage.getEleveById(p.eleve_id);
                    const cls = storage.getClasseById(p.classe_id);

                    return (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="px-3.5 py-2.5 font-mono font-bold text-teal-800">
                          {p.numero_recu}
                        </td>
                        <td className="px-3.5 py-2.5 font-mono text-slate-600">
                          {p.date_paiement}
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
                        <td className="px-3.5 py-2.5 text-right font-black text-slate-900">
                          {p.montant_paye.toLocaleString()} FCFA
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-semibold text-slate-600">
                          {p.reste_a_payer.toLocaleString()} FCFA
                        </td>
                        <td className="px-3.5 py-2.5 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            p.statut_paiement === 'SOLDE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {p.statut_paiement}
                          </span>
                        </td>
                        <td className="px-3.5 py-2.5 text-center font-medium text-slate-600 text-[11px]">
                          {p.mode_paiement}
                        </td>
                        <td className="px-3.5 py-2.5 text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              onClick={() => setSelectedRecuForPrint(p)}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-800 p-1 rounded text-xs font-semibold flex items-center space-x-1 cursor-pointer"
                              title="Aperçu & Impression du reçu"
                            >
                              <Printer className="w-3.5 h-3.5 text-teal-700" />
                              <span className="hidden sm:inline">Reçu</span>
                            </button>
                            {!isArchive && (isComptable || isCenseur || isDirecteur) && (
                              <button
                                onClick={() => handleDeletePaiement(p.id)}
                                className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 cursor-pointer"
                                title="Supprimer ce reçu erroné"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
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

      {/* 5. VUE 3 : ÉTAT DES SOLDES PAR APPRENANT */}
      {activeTab === 'etats' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                État Récapitulatif des Paiements par Élève
              </h3>
              <p className="text-xs text-slate-500">
                Suivi des versements cumulés, des reliquats et des apprenants à jour de leurs contributions.
              </p>
            </div>
            <span className="text-xs bg-teal-50 text-teal-800 font-bold px-3 py-1 rounded-full border border-teal-200">
              Session {selectedAnnee.libelle}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3">Matricule</th>
                  <th className="px-4 py-3">Nom & Prénoms</th>
                  <th className="px-4 py-3">Classe</th>
                  <th className="px-4 py-3 text-right">Montant Exigé</th>
                  <th className="px-4 py-3 text-right">Total Versé</th>
                  <th className="px-4 py-3 text-right">Reste Dû</th>
                  <th className="px-4 py-3 text-center">Situation Comptable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {allEleves.map((el) => {
                  const paye = getCumulPaye(el.id);
                  const reste = Math.max(0, MONTANT_EXIGE_STANDARD - paye);
                  const cls = storage.getClasseOfEleve(el.id, selectedAnnee.libelle);
                  const estSolde = reste === 0;

                  return (
                    <tr key={el.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">
                        {el.matricule}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900">
                        <span className="uppercase">{el.nom}</span> {el.prenom}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-700">
                        {cls?.nom || 'Non affectée'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-600">
                        {MONTANT_EXIGE_STANDARD.toLocaleString()} F
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-teal-800 font-mono">
                        {paye.toLocaleString()} F
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-black text-slate-900">
                        {reste > 0 ? (
                          <span className="text-amber-700">{reste.toLocaleString()} F</span>
                        ) : (
                          <span className="text-emerald-700">0 F (Soldé)</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider ${
                          estSolde
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : paye > 0
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-red-100 text-red-800 border border-red-300'
                        }`}>
                          {estSolde ? '✓ Soldé' : paye > 0 ? 'Partiel' : 'Non Soldé'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. MODAL OFFICIEL D'IMPRESSION DU REÇU DE PAIEMENT */}
      {selectedRecuForPrint && (
        <div className="fixed inset-0 bg-slate-900/75 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-2xl w-full flex flex-col shadow-2xl border border-slate-300 overflow-hidden">
            <div className="p-3.5 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Receipt className="w-4 h-4 text-teal-400" />
                <span className="font-bold text-sm">
                  Reçu de Caisse N° {selectedRecuForPrint.numero_recu}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="px-2.5 py-1 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded flex items-center space-x-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimer</span>
                </button>
                <button
                  onClick={() => setSelectedRecuForPrint(null)}
                  className="p-1 text-slate-400 hover:text-white font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Corps imprimable du reçu officiel */}
            <div className="p-6 sm:p-8 bg-white text-slate-900 text-xs font-serif space-y-4">
              {/* En-tête officiel */}
              <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-start">
                <div>
                  <div className="font-bold uppercase text-[10px]">RÉPUBLIQUE DU BÉNIN</div>
                  <div className="text-[9px] text-slate-600">Ministère des Enseignements Secondaire, Technique et Professionnel</div>
                  <div className="text-sm font-black text-slate-900 mt-0.5">CEG GOGBO</div>
                  <div className="text-[10px] text-slate-500">Commune d'Adjohoun • Arrondissement de Gangban</div>
                </div>
                <div className="text-right">
                  <div className="inline-block bg-teal-100 border border-teal-400 text-teal-950 font-black px-2 py-0.5 rounded text-[10px] uppercase">
                    REÇU DE CONTRIBUTION SCOLAIRE
                  </div>
                  <div className="text-xs font-bold text-slate-900 mt-1">
                    N° {selectedRecuForPrint.numero_recu}
                  </div>
                  <div className="text-[11px] text-slate-600">
                    Date : <strong>{selectedRecuForPrint.date_paiement}</strong>
                  </div>
                </div>
              </div>

              {/* Détails du paiement */}
              {(() => {
                const el = storage.getEleveById(selectedRecuForPrint.eleve_id);
                const cls = storage.getClasseById(selectedRecuForPrint.classe_id);
                return (
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-300 space-y-2 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-slate-500 font-sans">Nom & Prénoms :</span>{' '}
                        <strong className="text-slate-900 uppercase">{el?.nom} {el?.prenom}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 font-sans">Matricule :</span>{' '}
                        <strong className="font-mono text-slate-900">{el?.matricule}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 font-sans">Classe :</span>{' '}
                        <strong className="text-slate-900">{cls?.nom}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 font-sans">Année Scolaire :</span>{' '}
                        <strong className="text-slate-900">{selectedRecuForPrint.annee_scolaire}</strong>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-slate-500 font-sans">Tranche :</span>{' '}
                        <strong>{selectedRecuForPrint.tranche}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 font-sans">Mode de règlement :</span>{' '}
                        <strong>{selectedRecuForPrint.mode_paiement}</strong>
                      </div>
                    </div>

                    <div className="pt-3 border-t-2 border-slate-900 flex justify-between items-center text-sm">
                      <span className="font-bold uppercase font-sans">Montant Réglé :</span>
                      <strong className="text-base font-black px-3 py-1 bg-slate-900 text-white rounded">
                        {selectedRecuForPrint.montant_paye.toLocaleString()} FCFA
                      </strong>
                    </div>

                    <div className="flex justify-between items-center text-xs pt-1 text-slate-600">
                      <span>Reste à solder sur la contribution annuelle :</span>
                      <strong className="text-slate-900">
                        {selectedRecuForPrint.reste_a_payer.toLocaleString()} FCFA
                      </strong>
                    </div>
                  </div>
                );
              })()}

              {/* Signatures */}
              <div className="pt-4 grid grid-cols-2 gap-4 text-center">
                <div className="border-t border-slate-400 pt-1 text-[11px] text-slate-600">
                  Signature du Déposant / Parent
                </div>
                <div className="border-t border-slate-400 pt-1 text-[11px] text-slate-600">
                  Le Comptable / Économe du CEG GOGBO
                  <div className="font-bold text-slate-900 uppercase mt-4">
                    {selectedRecuForPrint.enregistre_par_nom || 'AGBOSSA Jeanne'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
