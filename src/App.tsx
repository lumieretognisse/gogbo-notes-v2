/**
 * GOGBO NOTES V2
 * Système Numérique Officiel de Gestion Scolaire
 * CEG GOGBO — Année Académique 2026–2027
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AnneeProvider } from './context/AnneeContext';
import { Header } from './components/Header';
import { Navigation, TabKey } from './components/Navigation';
import { LoginView } from './components/auth/LoginView';
import { EspacePedagogique } from './components/pedagogique/EspacePedagogique';
import { DashboardCenseur } from './components/censeur/DashboardCenseur';
import { PresenceEnseignants } from './components/censeur/PresenceEnseignants';
import { GestionEleves } from './components/censeur/GestionEleves';
import { GestionEnseignants } from './components/censeur/GestionEnseignants';
import { GestionAffectations } from './components/censeur/GestionAffectations';
import { GestionClasses } from './components/censeur/GestionClasses';
import { GestionMatieres } from './components/censeur/GestionMatieres';
import { GestionPeriodes } from './components/censeur/GestionPeriodes';
import { JournalAudit } from './components/censeur/JournalAudit';
import { ParametresEtablissement } from './components/censeur/ParametresEtablissement';
import { HistoriqueAnneesScolaires } from './components/censeur/HistoriqueAnneesScolaires';
import { DirecteurDashboard } from './components/directeur/DirecteurDashboard';
import { SurveillantDashboard } from './components/surveillant/SurveillantDashboard';
import { ComptableDashboard } from './components/comptable/ComptableDashboard';
import { ClassementView } from './components/pedagogique/ClassementView';
import { BulletinView } from './components/pedagogique/BulletinView';
import { HomePage } from './components/home/HomePage';
import { SuiteTestsModal } from './components/modals/SuiteTestsModal';
import { SqlSchemaModal } from './components/modals/SqlSchemaModal';
import { MonCompteModal } from './components/modals/MonCompteModal';

const MainAppContent: React.FC = () => {
  const { currentUser, isCenseur, isDirecteur, isConcepteur, isSurveillant, isComptable, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<TabKey>('censeur_dashboard');
  const [bulletinTarget, setBulletinTarget] = useState<{ eleveId?: string; classeId?: string; periodeId?: string } | null>(null);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);
  const [isMonCompteOpen, setIsMonCompteOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  // Mettre à jour l'onglet par défaut lorsque le rôle de l'utilisateur change
  useEffect(() => {
    if (!currentUser) return;

    if (isCenseur || isConcepteur) {
      setCurrentTab('censeur_dashboard');
    } else if (isDirecteur) {
      setCurrentTab('directeur_stats');
    } else if (isSurveillant) {
      setCurrentTab('surveillant');
    } else if (isComptable) {
      setCurrentTab('comptable');
    } else {
      setCurrentTab('pedagogique');
    }
  }, [currentUser?.id, currentUser?.role]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-sm">
        <div className="flex items-center space-x-3">
          <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
          <span>Chargement de GOGBO NOTES V2...</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    if (!showLogin) {
      return <HomePage onAccederPlateforme={() => setShowLogin(true)} />;
    }
    return <LoginView onBackToHome={() => setShowLogin(false)} />;
  }

  const renderTabContent = () => {
    switch (currentTab) {
      case 'censeur_dashboard':
        return <DashboardCenseur onNavigate={setCurrentTab} />;
      case 'presence_enseignants':
        return <PresenceEnseignants />;
      case 'pedagogique':
        return (
          <EspacePedagogique 
            onOpenBulletin={(eleveId, classeId, periodeId) => {
              setBulletinTarget({ eleveId, classeId, periodeId });
              setCurrentTab('bulletins');
            }}
          />
        );
      case 'classement':
        return (
          <ClassementView 
            onOpenBulletin={(eleveId, classeId, periodeId) => {
              setBulletinTarget({ eleveId, classeId, periodeId });
              setCurrentTab('bulletins');
            }}
          />
        );
      case 'bulletins':
        return (
          <BulletinView
            initialEleveId={bulletinTarget?.eleveId}
            initialClasseId={bulletinTarget?.classeId}
            initialPeriodeId={bulletinTarget?.periodeId}
          />
        );
      case 'eleves':
        return <GestionEleves />;
      case 'enseignants':
        return <GestionEnseignants />;
      case 'affectations':
        return <GestionAffectations />;
      case 'classes':
        return <GestionClasses />;
      case 'matieres':
        return <GestionMatieres />;
      case 'periodes':
        return <GestionPeriodes />;
      case 'audit':
        return <JournalAudit />;
      case 'parametres':
        return <ParametresEtablissement />;
      case 'historique_annees':
        return (
          <HistoriqueAnneesScolaires
            onNavigate={setCurrentTab}
            onOpenBulletin={(eleveId, classeId, periodeId) => {
              setBulletinTarget({ eleveId, classeId, periodeId });
              setCurrentTab('bulletins');
            }}
          />
        );
      case 'directeur_stats':
        return <DirecteurDashboard onNavigate={setCurrentTab} />;
      case 'surveillant':
        return <SurveillantDashboard onNavigate={setCurrentTab} />;
      case 'comptable':
        return <ComptableDashboard onNavigate={setCurrentTab} />;
      default:
        return <EspacePedagogique />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-900 antialiased font-sans">
      {/* En-tête officiel */}
      <Header
        onOpenTestModal={() => setIsTestModalOpen(true)}
        onOpenSqlModal={() => setIsSqlModalOpen(true)}
        onOpenMonCompte={() => setIsMonCompteOpen(true)}
      />

      {/* Barre de navigation dynamique selon le profil avec déconnexion à gauche */}
      <Navigation 
        currentTab={currentTab} 
        onSelectTab={setCurrentTab} 
        onOpenMonCompte={() => setIsMonCompteOpen(true)}
      />

      {/* Corps principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6">
        {renderTabContent()}
      </main>

      {/* Pied de page officiel Bénin */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-4 border-t border-slate-800 text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <div>
            <strong>GOGBO NOTES V2</strong> — Système Numérique Officiel de Gestion Scolaire • CEG GOGBO
          </div>
          <div className="text-[11px] text-slate-500">
            Commune d'ADJOHOUN • Arrondissement de GANGBAN • Session 2026–2027
          </div>
        </div>
      </footer>

      {/* Modal Mon Compte Personnel (Exigence 7) */}
      <MonCompteModal
        isOpen={isMonCompteOpen}
        onClose={() => setIsMonCompteOpen(false)}
      />

      {/* Modal des 25 Tests obligatoires */}
      <SuiteTestsModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
      />

      {/* Modal du Schéma SQL Supabase */}
      <SqlSchemaModal
        isOpen={isSqlModalOpen}
        onClose={() => setIsSqlModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AnneeProvider>
        <MainAppContent />
      </AnneeProvider>
    </AuthProvider>
  );
}
