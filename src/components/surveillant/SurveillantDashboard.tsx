import React from 'react';
import { storage } from '../../lib/storage';
import { ShieldCheck, Users, School, ArrowRight, BookOpen } from 'lucide-react';
import { TabKey } from '../Navigation';

interface SurveillantDashboardProps {
  onNavigate: (tab: TabKey) => void;
}

export const SurveillantDashboard: React.FC<SurveillantDashboardProps> = ({ onNavigate }) => {
  const eleves = storage.getEleves().filter((e) => e.statut === 'ACTIF');
  const classes = storage.getClasses();

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-xl p-5 sm:p-6 shadow-md border border-slate-700">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-amber-400 text-slate-950 text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                Surveillance Générale
              </span>
              <span className="text-indigo-200 text-xs">• Discipline & Contrôle des Présences</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold mt-1 text-white">
              Espace du Surveillant Général
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Suivi des effectifs, coordonnées des tuteurs légaux et gestion des registres d'élèves.
            </p>
          </div>

          <button
            onClick={() => onNavigate('eleves')}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs px-3.5 py-2 rounded-lg transition-colors flex items-center space-x-1.5 shadow-sm"
          >
            <span>Consulter le registre des élèves</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-semibold uppercase">Élèves sous surveillance</div>
              <div className="text-2xl font-bold text-slate-900">{eleves.length} inscrits</div>
            </div>
          </div>
          <p className="text-xs text-slate-600 mt-2">
            Accès complet aux informations utiles, numéros d'urgence des parents et classes.
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2.5 bg-blue-50 text-blue-700 rounded-lg">
              <School className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-semibold uppercase">Classes surveillées</div>
              <div className="text-2xl font-bold text-slate-900">{classes.length} classes</div>
            </div>
          </div>
          <p className="text-xs text-slate-600 mt-2">
            Contrôle des flux d'élèves du Premier Cycle (16) et du Second Cycle (12).
          </p>
        </div>
      </div>
    </div>
  );
};
