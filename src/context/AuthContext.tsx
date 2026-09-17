import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, AffectationPedagogique } from '../types';
import { storage } from '../lib/storage';

interface AuthContextType {
  currentUser: UserProfile | null;
  affectations: AffectationPedagogique[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string, portalTarget?: 'ADMIN' | 'ENSEIGNANT') => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  switchUser: (profileId: string) => void;
  refreshUserData: () => void;
  updateMyEmail: (newEmail: string) => Promise<{ success: boolean; error?: string }>;
  updateMyPassword: (oldPass: string, newPass: string) => Promise<{ success: boolean; error?: string }>;
  isCenseur: boolean;
  isDirecteur: boolean;
  isSurveillant: boolean;
  isComptable: boolean;
  hasPedagogicalAssignments: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CURRENT_USER_KEY = 'gogbo_v2_current_user_id';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [affectations, setAffectations] = useState<AffectationPedagogique[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadUserData = (profileId: string | null) => {
    if (!profileId) {
      setCurrentUser(null);
      setAffectations([]);
      return;
    }
    const profile = storage.getProfileById(profileId);
    if (profile && profile.statut === 'ACTIF') {
      setCurrentUser(profile);
      const userAffs = storage.getAffectationsByProfile(profile.id);
      setAffectations(userAffs);
    } else {
      setCurrentUser(null);
      setAffectations([]);
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  };

  useEffect(() => {
    storage.init();
    // Conserver la session existante si connectée
    const storedId = localStorage.getItem(CURRENT_USER_KEY);
    loadUserData(storedId);
    setIsLoading(false);
  }, []);

  const login = async (email: string, pass: string, portalTarget?: 'ADMIN' | 'ENSEIGNANT'): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const profiles = storage.getProfiles();
      const user = profiles.find((p) => p.email.toLowerCase() === email.trim().toLowerCase());

      // 1. Vérification de l'existence de l'identifiant et du mot de passe
      if (!user) {
        setIsLoading(false);
        return { success: false, error: 'Identifiant ou mot de passe incorrect.' };
      }

      const isPasswordValid = storage.verifyUserPassword(user.id, pass);
      if (!isPasswordValid) {
        setIsLoading(false);
        return { success: false, error: 'Identifiant ou mot de passe incorrect.' };
      }

      if (user.statut !== 'ACTIF') {
        setIsLoading(false);
        return { success: false, error: 'Ce compte a été désactivé par l’administration.' };
      }

      // 2. Contrôle de séparation des portails (Exigence 2, 3 & 4)
      if (portalTarget === 'ADMIN') {
        const adminRoles = ['DIRECTEUR_GENERAL', 'CENSEUR', 'SURVEILLANT_GENERAL', 'COMPTABLE'];
        if (!adminRoles.includes(user.role)) {
          setIsLoading(false);
          return {
            success: false,
            error: "Accès refusé au Portail Administration : Ce compte possède un rôle Enseignant. Veuillez vous connecter via le « Portail Enseignants ».",
          };
        }
      } else if (portalTarget === 'ENSEIGNANT') {
        // Double casquette : Censeur enseignant ou DG enseignant ou Enseignant titulaire
        const canTeach = user.is_enseignant || user.role === 'ENSEIGNANT';
        if (!canTeach) {
          setIsLoading(false);
          return {
            success: false,
            error: "Accès refusé au Portail Enseignants : Ce compte administratif n'exerce aucune fonction pédagogique active. Veuillez utiliser le « Portail Administration ».",
          };
        }
      }

      localStorage.setItem(CURRENT_USER_KEY, user.id);
      loadUserData(user.id);

      storage.addAuditLog({
        user_id: user.id,
        user_nom: `${user.nom} ${user.prenom}`,
        user_role: user.role,
        action: 'CONNEXION',
        table_cible: 'auth',
        details: `Connexion réussie via Portail ${portalTarget || 'STANDARD'} : ${user.nom} ${user.prenom} (${user.role})`,
      });

      setIsLoading(false);
      return { success: true };
    } catch {
      setIsLoading(false);
      return { success: false, error: 'Une erreur est survenue lors de l’authentification.' };
    }
  };

  const logout = () => {
    if (currentUser) {
      storage.addAuditLog({
        user_id: currentUser.id,
        user_nom: `${currentUser.nom} ${currentUser.prenom}`,
        user_role: currentUser.role,
        action: 'DECONNEXION',
        table_cible: 'auth',
        details: `Déconnexion de ${currentUser.nom} ${currentUser.prenom}`,
      });
    }
    localStorage.removeItem(CURRENT_USER_KEY);
    setCurrentUser(null);
    setAffectations([]);
  };

  const updateMyEmail = async (newEmail: string): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) return { success: false, error: 'Aucun utilisateur connecté' };
    const res = await storage.updateUserEmail(currentUser.id, newEmail);
    if (res.success) {
      loadUserData(currentUser.id);
    }
    return res;
  };

  const updateMyPassword = async (oldPass: string, newPass: string): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) return { success: false, error: 'Aucun utilisateur connecté' };
    return storage.updateUserPassword(currentUser.id, oldPass, newPass);
  };

  const switchUser = (profileId: string) => {
    localStorage.setItem(CURRENT_USER_KEY, profileId);
    loadUserData(profileId);
  };

  const refreshUserData = () => {
    if (currentUser) {
      loadUserData(currentUser.id);
    }
  };

  const isCenseur = currentUser?.role === 'CENSEUR';
  const isDirecteur = currentUser?.role === 'DIRECTEUR_GENERAL';
  const isSurveillant = currentUser?.role === 'SURVEILLANT_GENERAL';
  const isComptable = currentUser?.role === 'COMPTABLE';
  const hasPedagogicalAssignments = affectations.length > 0;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        affectations,
        isAuthenticated: !!currentUser,
        isLoading,
        login,
        logout,
        switchUser,
        refreshUserData,
        updateMyEmail,
        updateMyPassword,
        isCenseur,
        isDirecteur,
        isSurveillant,
        isComptable,
        hasPedagogicalAssignments,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
