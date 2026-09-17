import React, { useState } from 'react';
import { storage } from '../../lib/storage';
import { School, Users, BookOpen, Clock, AlertTriangle } from 'lucide-react';

export const GestionClasses: React.FC = () => {
  const classes = storage.getClasses();
  const eleves = storage.getEleves();
  const affectations = storage.getAffectations();
  const [selectedCycle, setSelectedCycle] = useState<'ALL' | 'PREMIER' | 'SECOND'>('ALL');

  const premierCycleNiveaux = ['6ème', '5ème', '4ème', '3ème'];
  const secondCycleNiveaux = ['Seconde', 'Première', 'Terminale'];

  const filteredClasses = classes.filter((cls) => {
    if (selectedCycle === 'PREMIER') return premierCycleNiveaux.includes(cls.niveau);
    if (selectedCycle === 'SECOND') return secondCycleNiveaux.includes(cls.niveau);
    return true;
  });

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center space-x-2">
            <School className="w-6 h-6 text-emerald-700" />
            <span>Structure Pédagogique des 28 Classes</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Répartition officielle du CEG GOGBO (16 classes au Premier Cycle • 12 classes au Second Cycle)
          </p>
        </div>

        {/* Filtre Cycle */}
        <div className="flex bg-slate-200/80 p-1 rounded-lg text-xs font-semibold">
          <button
            onClick={() => setSelectedCycle('ALL')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              selectedCycle === 'ALL' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'
            }`}
          >
            Toutes ({classes.length})
          </button>
          <button
            onClick={() => setSelectedCycle('PREMIER')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              selectedCycle === 'PREMIER' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'
            }`}
          >
            1er Cycle (16)
          </button>
          <button
            onClick={() => setSelectedCycle('SECOND')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              selectedCycle === 'SECOND' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'
            }`}
          >
            2nd Cycle (12)
          </button>
        </div>
      </div>

      {/* Grille des 28 classes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {filteredClasses.map((cls) => {
          const classEleves = eleves.filter((e) => e.classe_id === cls.id && e.statut === 'ACTIF');
          const classAffs = affectations.filter((a) => a.classe_id === cls.id && a.statut === 'ACTIF');
          const totalHours = classAffs.reduce((acc, curr) => acc + curr.heures_hebdo, 0);
          const percent = Math.min(100, Math.round((classEleves.length / cls.effectif_max) * 100));

          const isSecondCycle = secondCycleNiveaux.includes(cls.niveau);

          return (
            <div
              key={cls.id}
              className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                    isSecondCycle ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {cls.niveau} • {cls.serie}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Max: {cls.effectif_max}
                  </span>
                </div>

                <h3 className="font-extrabold text-slate-900 text-lg">{cls.nom}</h3>

                {/* Effectif et barre de progression (Règle max 100 élèves) */}
                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1 font-medium">
                    <span className="text-slate-600 flex items-center space-x-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>Effectif :</span>
                    </span>
                    <span className={`font-bold ${percent >= 90 ? 'text-amber-600' : 'text-slate-800'}`}>
                      {classEleves.length} / {cls.effectif_max} élèves
                    </span>
                  </div>

                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        percent >= 100
                          ? 'bg-red-500'
                          : percent >= 80
                          ? 'bg-amber-500'
                          : 'bg-emerald-600'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Détails Pédagogiques */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center space-x-1">
                  <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{classAffs.length} cours</span>
                </span>
                <span className="flex items-center space-x-1 font-semibold text-slate-700">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{totalHours} h / sem</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
