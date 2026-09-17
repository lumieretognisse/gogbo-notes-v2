import React from 'react';
import { School, ArrowRight } from 'lucide-react';

interface HomePageProps {
  onAccederPlateforme: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onAccederPlateforme }) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onAccederPlateforme();
    }
  };

  return (
    <div 
      onClick={onAccederPlateforme}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label="Accéder à GOGBO NOTES V2"
      className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-[#071330] to-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-8 select-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 relative overflow-hidden"
    >
      {/* Halo lumineux d'ambiance bleu royal en arrière-plan */}
      <div 
        aria-hidden="true" 
        className="absolute w-[600px] h-[600px] rounded-full bg-blue-600/15 blur-[120px] pointer-events-none -top-20 -left-20"
      />
      <div 
        aria-hidden="true" 
        className="absolute w-[600px] h-[600px] rounded-full bg-blue-800/15 blur-[140px] pointer-events-none -bottom-20 -right-20"
      />

      {/* Affiche institutionnelle centrale */}
      <div className="relative z-10 w-full max-w-2xl mx-auto rounded-3xl bg-slate-900/80 border border-blue-600/40 shadow-2xl shadow-blue-950/80 backdrop-blur-md p-8 sm:p-14 md:p-16 flex flex-col items-center text-center transition-all duration-300 hover:border-blue-500/70 hover:shadow-blue-900/50 group">
        
        {/* Emblème institutionnel discret */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-b from-blue-700 to-blue-900 border border-blue-400/30 flex items-center justify-center text-white shadow-lg shadow-blue-950 mb-6 sm:mb-8 transition-transform duration-300 group-hover:scale-105">
          <School className="w-8 h-8 sm:w-10 sm:h-10 text-blue-100" />
        </div>

        {/* Ligne 1 : Nom de l'établissement */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-wider text-white drop-shadow-sm leading-tight">
          CEG GOGBO
        </h1>

        {/* Filet séparateur stylisé */}
        <div className="w-16 sm:w-24 h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent my-4 sm:my-6 rounded-full opacity-80" />

        {/* Ligne 2 : Intitulé officiel unique */}
        <h2 className="text-base sm:text-xl md:text-2xl font-bold uppercase tracking-wide text-blue-300 leading-snug">
          SYSTÈME NUMÉRIQUE DE GESTION DES NOTES
        </h2>

        {/* Bouton icône de transition interactif */}
        <div className="mt-8 sm:mt-10">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-blue-600 group-hover:bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-600/30 transition-all duration-300 group-hover:translate-x-0.5 group-hover:scale-110 border border-blue-400/40">
            <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>
      </div>
    </div>
  );
};
