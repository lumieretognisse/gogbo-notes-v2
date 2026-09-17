import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storage } from '../../lib/storage';
import { PasswordField } from '../ui/PasswordField';
import { 
  GraduationCap, 
  ShieldCheck, 
  BookOpen, 
  Mail, 
  ArrowRight, 
  ArrowLeft,
  AlertCircle, 
  CheckCircle2, 
  Sparkles,
  Building2
} from 'lucide-react';

export type PortalType = 'ADMIN' | 'ENSEIGNANT';

interface LoginViewProps {
  onBackToHome?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onBackToHome }) => {
  const { login, switchUser } = useAuth();
  const [activePortal, setActivePortal] = useState<PortalType>('ADMIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const profiles = storage.getProfiles();
  const params = storage.getParametres();

  // Profils administratifs (DG, Censeur, Surveillant, Comptable)
  const adminProfiles = profiles.filter((p) => p.role !== 'ENSEIGNANT');

  // Profils pour le portail enseignants (Enseignants purs + Censeur/DG ayant charge d'enseignement)
  const teacherProfiles = profiles.filter((p) => p.is_enseignant || p.role === 'ENSEIGNANT');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await login(email, password, activePortal);
    if (!res.success) {
      setError(res.error || 'Erreur lors de la connexion.');
    }
    setLoading(false);
  };

  const handlePortalSwitch = (portal: PortalType) => {
    setActivePortal(portal);
    setError(null);
    setEmail('');
    setPassword('');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-3 sm:p-6 selection:bg-emerald-500 selection:text-white">
      {/* Bandeau officiel République du Bénin */}
      <header className="w-full max-w-xl text-center mb-5">
        {onBackToHome && (
          <div className="flex justify-start mb-3">
            <button
              id="btn-retour-accueil"
              type="button"
              onClick={onBackToHome}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700/70 transition-colors shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Page d'accueil</span>
            </button>
          </div>
        )}
        <div className="inline-flex items-center space-x-2 bg-emerald-900/90 text-emerald-200 text-[11px] px-3.5 py-1 rounded-full font-semibold uppercase tracking-wider mb-2.5 border border-emerald-700/60 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
          <span>RÉPUBLIQUE DU BÉNIN • {params.ministere}</span>
        </div>

        <div className="flex items-center justify-center space-x-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-emerald-700 text-amber-300 flex items-center justify-center shadow-lg border border-emerald-500/50">
            <GraduationCap className="w-7 h-7" />
          </div>
          <div className="text-left">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              <span>CEG GOGBO</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                V2
              </span>
            </h1>
            <p className="text-xs text-emerald-400 font-medium tracking-wide">
              Plateforme Numérique de Gestion Académique & des Évaluations
            </p>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 flex items-center justify-center gap-2">
          <span>Commune : <strong>{params.commune}</strong></span>
          <span>•</span>
          <span>Arrondissement : <strong>{params.arrondissement}</strong></span>
          <span>•</span>
          <span className="text-amber-300 font-medium">Session {params.annee_academique}</span>
        </div>
      </header>

      {/* Conteneur principal avec Séparation des deux portails */}
      <main className="w-full max-w-xl bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Sélecteur des 2 Portails (Exigence 2) */}
        <div className="grid grid-cols-2 p-1.5 bg-slate-100 border-b border-slate-200 gap-1.5">
          <button
            id="portal-btn-admin"
            type="button"
            onClick={() => handlePortalSwitch('ADMIN')}
            className={`flex items-center justify-center space-x-2 py-3 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all duration-150 ${
              activePortal === 'ADMIN'
                ? 'bg-slate-900 text-white shadow-md border border-slate-800'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <ShieldCheck className={`w-4 h-4 ${activePortal === 'ADMIN' ? 'text-amber-400' : 'text-slate-500'}`} />
            <div className="text-left">
              <div className="text-[10px] uppercase font-bold text-amber-400">Portail Administration</div>
              <div className="leading-tight font-black text-xs sm:text-sm">ACCÈS ADMINISTRATION</div>
              <div className={`text-[10px] font-normal ${activePortal === 'ADMIN' ? 'text-slate-300' : 'text-slate-500'} hidden sm:block`}>
                Direction, Censeur, Surveillance, Comptabilité
              </div>
            </div>
          </button>

          <button
            id="portal-btn-enseignant"
            type="button"
            onClick={() => handlePortalSwitch('ENSEIGNANT')}
            className={`flex items-center justify-center space-x-2 py-3 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all duration-150 ${
              activePortal === 'ENSEIGNANT'
                ? 'bg-emerald-800 text-white shadow-md border border-emerald-700'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <BookOpen className={`w-4 h-4 ${activePortal === 'ENSEIGNANT' ? 'text-amber-300' : 'text-slate-500'}`} />
            <div className="text-left">
              <div className="text-[10px] uppercase font-bold text-emerald-400">Portail Enseignants</div>
              <div className="leading-tight font-black text-xs sm:text-sm">ACCÈS ENSEIGNANTS</div>
              <div className={`text-[10px] font-normal ${activePortal === 'ENSEIGNANT' ? 'text-emerald-200' : 'text-slate-500'} hidden sm:block`}>
                Espace pédagogique, devoirs & saisie de notes
              </div>
            </div>
          </button>
        </div>

        {/* Corps du formulaire selon le portail */}
        <div className="p-6 sm:p-8">
          {/* En-tête du portail actif */}
          <div className="mb-5 pb-4 border-b border-slate-100 flex items-start justify-between">
            <div>
              <span
                className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider mb-1.5 ${
                  activePortal === 'ADMIN'
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                }`}
              >
                {activePortal === 'ADMIN' ? 'Espace Direction & Gestion Administrative' : 'Espace Pédagogique & Évaluations'}
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                {activePortal === 'ADMIN' ? 'Connexion — Administration du CEG' : 'Connexion — Corps Enseignant'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {activePortal === 'ADMIN'
                  ? 'Réservé au Directeur Général, Censeur, Surveillant Général et Comptable.'
                  : 'Réservé aux enseignants pour la saisie et consultation de leurs notes.'}
              </p>
            </div>

            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                activePortal === 'ADMIN' ? 'bg-slate-900 text-amber-400' : 'bg-emerald-700 text-white'
              }`}
            >
              {activePortal === 'ADMIN' ? <Building2 className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
            </div>
          </div>

          {/* Rappel bienveillant Double Casquette (Exigence 3) */}
          <div className="mb-4 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 flex items-start space-x-2">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              <strong>Double fonction reconnue :</strong> Le Censeur (SVT) et le Directeur Général (Mathématiques) disposent également d’affectations de cours et peuvent accéder à leur espace pédagogique.
            </p>
          </div>

          {/* Message d'erreur avec bouton de changement si mauvais portail */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-800 border border-red-200 rounded-lg text-xs flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">{error}</p>
                {error.includes('Portail Enseignants') && (
                  <button
                    type="button"
                    onClick={() => handlePortalSwitch('ENSEIGNANT')}
                    className="mt-1.5 text-xs text-emerald-800 underline font-bold hover:text-emerald-950"
                  >
                    Basculer immédiatement vers le Portail Enseignants →
                  </button>
                )}
                {error.includes('Portail Administration') && (
                  <button
                    type="button"
                    onClick={() => handlePortalSwitch('ADMIN')}
                    className="mt-1.5 text-xs text-slate-800 underline font-bold hover:text-slate-950"
                  >
                    Basculer immédiatement vers le Portail Administration →
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Formulaire de connexion avec PasswordField sécurisé (Exigence 1) */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email-input" className="block text-slate-700 font-semibold mb-1 text-xs sm:text-sm">
                Identifiant ou Email académique <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="login-email-input"
                  type="email"
                  required
                  placeholder={activePortal === 'ADMIN' ? 'censeur@ceggogbo.bj' : 'prof.maths@ceggogbo.bj'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 bg-white"
                />
              </div>
            </div>

            {/* Mot de passe masqué par défaut avec œil pour afficher/masquer (Exigence 1 & 5) */}
            <PasswordField
              id="login-password-input"
              label="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              helpText="Masqué par défaut. Cliquez sur l’icône 👁 pour afficher ou masquer temporairement."
            />

            {/* Bouton de validation obligatoire SE CONNECTER (Exigence 6) */}
            <button
              id="btn-login-submit"
              type="submit"
              disabled={loading}
              className={`w-full py-3 text-white font-extrabold rounded-xl transition-all duration-150 flex items-center justify-center space-x-2 text-sm shadow-md tracking-wider uppercase ${
                activePortal === 'ADMIN'
                  ? 'bg-slate-900 hover:bg-slate-800 border border-slate-800'
                  : 'bg-emerald-700 hover:bg-emerald-800 border border-emerald-600'
              } disabled:opacity-50`}
            >
              <span>{loading ? 'Vérification en cours...' : 'SE CONNECTER'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Profils pré-configurés pour tests rapides : Remplissage SANS auto-connexion (Exigence 6) */}
          <div className="mt-6 pt-5 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                {activePortal === 'ADMIN' ? 'Sélection rapide compte administratif' : 'Sélection rapide compte enseignant'}
              </span>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                {activePortal === 'ADMIN' ? `${adminProfiles.length} comptes` : `${teacherProfiles.length} comptes`}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mb-2">
              Cliquez pour renseigner l'identifiant, puis cliquez obligatoirement sur <strong>SE CONNECTER</strong>.
            </p>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {(activePortal === 'ADMIN' ? adminProfiles : teacherProfiles).map((p) => (
                <button
                  key={p.id}
                  id={`quick-select-${p.id}`}
                  type="button"
                  onClick={() => {
                    setEmail(p.email);
                    setPassword('Passer123!');
                    setError(null);
                  }}
                  className="w-full text-left p-2 rounded-lg bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-xs transition-colors flex items-center justify-between group"
                >
                  <div className="flex items-center space-x-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        p.role === 'DIRECTEUR_GENERAL'
                          ? 'bg-red-500'
                          : p.role === 'CENSEUR'
                          ? 'bg-amber-500'
                          : p.role === 'SURVEILLANT_GENERAL'
                          ? 'bg-blue-500'
                          : p.role === 'COMPTABLE'
                          ? 'bg-purple-500'
                          : 'bg-emerald-500'
                      }`}
                    ></span>
                    <div>
                      <span className="font-bold text-slate-800 group-hover:text-emerald-800">
                        {p.nom} {p.prenom}
                      </span>
                      <span className="text-[10px] text-slate-500 ml-1.5 font-medium">({p.role})</span>
                      {p.is_enseignant && p.role !== 'ENSEIGNANT' && (
                        <span className="text-[10px] text-emerald-700 bg-emerald-100/80 px-1.5 py-0.2 rounded ml-1 font-semibold">
                          + Enseigne
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400 group-hover:text-emerald-700 font-semibold">
                    Renseigner →
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-6 text-center text-xs text-slate-500">
        Collège d’Enseignement Général de GOGBO • République du Bénin • Système certifié conforme
      </footer>
    </div>
  );
};
