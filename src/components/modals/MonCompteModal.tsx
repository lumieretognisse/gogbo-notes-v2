import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PasswordField } from '../ui/PasswordField';
import { 
  User, 
  KeyRound, 
  Mail, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Loader2,
  ShieldCheck,
  Save
} from 'lucide-react';

interface MonCompteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MonCompteModal: React.FC<MonCompteModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, updateMyEmail, updateMyPassword } = useAuth();

  // Onglet ou section active
  const [activeTab, setActiveTab] = useState<'IDENTIFIANT' | 'MOT_DE_PASSE'>('IDENTIFIANT');

  // Formulaire Identifiant
  const [nouvelEmail, setNouvelEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  // Formulaire Mot de passe
  const [ancienMotDePasse, setAncienMotDePasse] = useState('');
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState('');
  const [confirmMotDePasse, setConfirmMotDePasse] = useState('');
  const [savingPass, setSavingPass] = useState(false);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);
  const [passError, setPassError] = useState<string | null>(null);

  if (!isOpen || !currentUser) return null;

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);
    setEmailSuccess(null);

    const cleanNew = nouvelEmail.trim().toLowerCase();
    const cleanConfirm = confirmEmail.trim().toLowerCase();

    if (!cleanNew) {
      setEmailError('Veuillez saisir un nouvel identifiant.');
      return;
    }

    if (cleanNew !== cleanConfirm) {
      setEmailError('La confirmation ne correspond pas au nouvel identifiant saisi.');
      return;
    }

    if (cleanNew === currentUser.email.toLowerCase()) {
      setEmailError('Le nouvel identifiant doit être différent de l’identifiant actuel.');
      return;
    }

    setSavingEmail(true);
    try {
      const res = await updateMyEmail(cleanNew);
      if (res.success) {
        setEmailSuccess('✓ Identifiant modifié et enregistré avec succès dans la base de données.');
        setNouvelEmail('');
        setConfirmEmail('');
      } else {
        setEmailError(res.error || 'Erreur lors de la mise à jour de l’identifiant.');
      }
    } catch {
      setEmailError('Erreur inattendue lors de l’enregistrement.');
    } finally {
      setSavingEmail(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(null);

    if (!ancienMotDePasse) {
      setPassError('Veuillez renseigner votre ancien mot de passe.');
      return;
    }

    if (!nouveauMotDePasse || nouveauMotDePasse.length < 6) {
      setPassError('Le nouveau mot de passe doit comporter au moins 6 caractères.');
      return;
    }

    if (nouveauMotDePasse !== confirmMotDePasse) {
      setPassError('La confirmation ne correspond pas au nouveau mot de passe saisi.');
      return;
    }

    setSavingPass(true);
    try {
      const res = await updateMyPassword(ancienMotDePasse, nouveauMotDePasse);
      if (res.success) {
        setPassSuccess('✓ Mot de passe mis à jour et synchronisé avec succès.');
        setAncienMotDePasse('');
        setNouveauMotDePasse('');
        setConfirmMotDePasse('');
      } else {
        setPassError(res.error || 'Erreur lors du changement de mot de passe.');
      }
    } catch {
      setPassError('Erreur inattendue lors de la mise à jour.');
    } finally {
      setSavingPass(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* En-tête Modal */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600/30 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base leading-tight">
                Mon compte personnel
              </h3>
              <p className="text-[11px] text-slate-400">
                {currentUser.prenom} {currentUser.nom} • Role : <span className="text-amber-400 font-semibold">{currentUser.role}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Onglets Identifiant / Mot de passe */}
        <div className="grid grid-cols-2 p-1.5 bg-slate-100 border-b border-slate-200 gap-1 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('IDENTIFIANT')}
            className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center space-x-1.5 transition-all ${
              activeTab === 'IDENTIFIANT'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Identifiant (Email)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('MOT_DE_PASSE')}
            className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center space-x-1.5 transition-all ${
              activeTab === 'MOT_DE_PASSE'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Mot de passe</span>
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          {/* SECTION IDENTIFIANT */}
          {activeTab === 'IDENTIFIANT' && (
            <form onSubmit={handleUpdateEmail} className="space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Identifiant actuel (Email)
                </span>
                <span className="text-sm font-mono font-bold text-slate-900 block break-all">
                  {currentUser.email}
                </span>
              </div>

              {emailSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{emailSuccess}</span>
                </div>
              )}

              {emailError && (
                <div className="p-3 bg-red-50 text-red-800 border border-red-200 rounded-xl text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{emailError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nouvel identifiant (email académique) <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={nouvelEmail}
                  onChange={(e) => setNouvelEmail(e.target.value)}
                  placeholder="nouvel.identifiant@ceggogbo.bj"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirmation du nouvel identifiant <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={confirmEmail}
                  onChange={(e) => setConfirmEmail(e.target.value)}
                  placeholder="Confirmez le nouvel identifiant"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 bg-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  id="btn-save-mon-compte-email"
                  type="submit"
                  disabled={savingEmail}
                  className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center space-x-1.5 shadow-sm disabled:opacity-50"
                >
                  {savingEmail ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Enregistrement en cours...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Enregistrer l'identifiant</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* SECTION MOT DE PASSE */}
          {activeTab === 'MOT_DE_PASSE' && (
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              {passSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{passSuccess}</span>
                </div>
              )}

              {passError && (
                <div className="p-3 bg-red-50 text-red-800 border border-red-200 rounded-xl text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{passError}</span>
                </div>
              )}

              {/* Ancien mot de passe avec 👁 */}
              <PasswordField
                id="mon-compte-old-pass"
                label="Ancien mot de passe actuel"
                value={ancienMotDePasse}
                onChange={(e) => setAncienMotDePasse(e.target.value)}
                placeholder="Saisissez votre mot de passe actuel"
                required
                helpText="Vérification de sécurité obligatoire avant modification."
              />

              {/* Nouveau mot de passe avec 👁 */}
              <PasswordField
                id="mon-compte-new-pass"
                label="Nouveau mot de passe"
                value={nouveauMotDePasse}
                onChange={(e) => setNouveauMotDePasse(e.target.value)}
                placeholder="Minimum 6 caractères"
                required
                helpText="Doit contenir au moins 6 caractères."
              />

              {/* Confirmation nouveau mot de passe avec 👁 */}
              <PasswordField
                id="mon-compte-confirm-pass"
                label="Confirmation du nouveau mot de passe"
                value={confirmMotDePasse}
                onChange={(e) => setConfirmMotDePasse(e.target.value)}
                placeholder="Retapez exactement le nouveau mot de passe"
                required
              />

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  id="btn-save-mon-compte-password"
                  type="submit"
                  disabled={savingPass}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors flex items-center space-x-1.5 shadow-sm disabled:opacity-50"
                >
                  {savingPass ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Modification en cours...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Modifier le mot de passe</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
