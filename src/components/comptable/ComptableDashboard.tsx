import React from 'react';
import { storage } from '../../lib/storage';
import { CreditCard, Users, School, ArrowRight } from 'lucide-react';
import { TabKey } from '../Navigation';

interface ComptableDashboardProps {
  onNavigate: (tab: TabKey) => void;
}

export const ComptableDashboard: React.FC<ComptableDashboardProps> = ({ onNavigate }) => {
  const eleves = storage.getEleves().filter((e) => e.statut === 'ACTIF');
  const classes = storage.getClasses();

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 to-teal-950 text-white rounded-xl p-5 sm:p-6 shadow-md border border-slate-700">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-amber-400 text-slate-950 text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                Service Comptabilité & Économat
              </span>
              <span className="text-teal-200 text-xs">• Suivi des Effectifs Réels Inscrits</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold mt-1 text-white">
              Espace du Comptable
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Consultation des listes d'élèves, vérification des effectifs par classe pour l'intendance.
            </p>
          </div>

          <button
            onClick={() => onNavigate('eleves')}
            className="bg-teal-600 hover:bg-teal-500 text-white font-medium text-xs px-3.5 py-2 rounded-lg transition-colors flex items-center space-x-1.5 shadow-sm"
          >
            <span>Consulter les élèves inscrits</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2.5 bg-teal-50 text-teal-700 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-semibold uppercase">Effectif Global Actif</div>
              <div className="text-2xl font-bold text-slate-900">{eleves.length} élèves</div>
            </div>
          </div>
          <p className="text-xs text-slate-600 mt-2">
            Base officielle pour le suivi des frais d'écolage et contributions scolaires.
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-lg">
              <School className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-semibold uppercase">Salles & Divisions</div>
              <div className="text-2xl font-bold text-slate-900">{classes.length} classes</div>
            </div>
          </div>
          <p className="text-xs text-slate-600 mt-2">
            Répartition dans les 28 divisions officielles du CEG GOGBO.
          </p>
        </div>
      </div>
    </div>
  );
};
