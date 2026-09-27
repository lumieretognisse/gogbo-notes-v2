import React, { createContext, useContext, useState, useEffect } from 'react';
import { AnneeScolaire } from '../types';
import { storage } from '../lib/storage';

interface AnneeContextType {
  annees: AnneeScolaire[];
  allAnnees: AnneeScolaire[];
  activeAnnee: AnneeScolaire;
  selectedAnnee: AnneeScolaire;
  isArchive: boolean;
  isViewingArchived: boolean;
  isViewingFuture: boolean;
  setSelectedAnnee: (annee: AnneeScolaire) => void;
  setSelectedAnneeByLibelle: (libelle: string) => void;
  changerAnneeActive: (anneeId: string) => void;
  refreshAnnees: () => void;
}

const AnneeContext = createContext<AnneeContextType | undefined>(undefined);

const SELECTED_ANNEE_STORAGE_KEY = 'gogbo_v2_selected_annee_id';

export const AnneeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [annees, setAnnees] = useState<AnneeScolaire[]>([]);
  const [activeAnnee, setActiveAnnee] = useState<AnneeScolaire>(storage.getActiveAnneeScolaire());
  const [selectedAnnee, setSelectedAnneeState] = useState<AnneeScolaire>(storage.getActiveAnneeScolaire());

  const refreshAnnees = () => {
    const list = storage.getAnneesScolaires();
    setAnnees(list);
    const active = storage.getActiveAnneeScolaire();
    setActiveAnnee(active);

    const savedId = localStorage.getItem(SELECTED_ANNEE_STORAGE_KEY);
    const found = list.find((a) => a.id === savedId) || active || list[0];
    if (found) {
      setSelectedAnneeState(found);
    }
  };

  useEffect(() => {
    refreshAnnees();
  }, []);

  const setSelectedAnnee = (annee: AnneeScolaire) => {
    setSelectedAnneeState(annee);
    localStorage.setItem(SELECTED_ANNEE_STORAGE_KEY, annee.id);
  };

  const setSelectedAnneeByLibelle = (libelle: string) => {
    const list = storage.getAnneesScolaires();
    const found = list.find((a) => a.libelle === libelle);
    if (found) {
      setSelectedAnnee(found);
    }
  };

  const changerAnneeActive = (anneeId: string) => {
    const user = storage.getProfiles().find((p) => p.role === 'CENSEUR') || storage.getProfiles()[0];
    const activated = storage.setActiveAnneeScolaire(anneeId, user);
    refreshAnnees();
    setSelectedAnnee(activated);
  };

  const isArchive = selectedAnnee?.statut === 'CLOTUREE' || (!selectedAnnee?.is_active && new Date(selectedAnnee?.date_fin || '').getTime() < Date.now());
  const isViewingFuture = selectedAnnee?.statut === 'A_VENIR';

  return (
    <AnneeContext.Provider
      value={{
        annees,
        allAnnees: annees,
        activeAnnee,
        selectedAnnee,
        isArchive,
        isViewingArchived: isArchive,
        isViewingFuture,
        setSelectedAnnee,
        setSelectedAnneeByLibelle,
        changerAnneeActive,
        refreshAnnees,
      }}
    >
      {children}
    </AnneeContext.Provider>
  );
};

export const useAnnee = () => {
  const context = useContext(AnneeContext);
  if (!context) {
    throw new Error('useAnnee must be used within an AnneeProvider');
  }
  return context;
};
