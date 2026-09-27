import React, { useState } from 'react';
import { storage } from '../../lib/storage';
import { History, Search, ShieldCheck } from 'lucide-react';

export const JournalAudit: React.FC = () => {
  const logs = storage.getAuditLogs();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = logs.filter((l) => {
    const term = searchTerm.toLowerCase();
    return (
      l.user_nom.toLowerCase().includes(term) ||
      l.action.toLowerCase().includes(term) ||
      l.user_role.toLowerCase().includes(term) ||
      l.details.toLowerCase().includes(term) ||
      l.table_cible.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center space-x-2">
            <History className="w-6 h-6 text-emerald-700" />
            <span>Journal d'Audit & Traçabilité Officielle</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Historique chronologique et immuable des actions administratives, modifications de notes et connexions
          </p>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filtrer le journal par utilisateur, action, table ou mot-clé..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Tableau des logs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3">Date & Heure</th>
                <th className="px-4 py-3">Utilisateur / Auteur</th>
                <th className="px-4 py-3">Rôle</th>
                <th className="px-4 py-3 text-center">Action</th>
                <th className="px-4 py-3">Module Cible</th>
                <th className="px-4 py-3">Détails de l'opération</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredLogs.map((log) => {
                return (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('fr-FR')}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900 whitespace-nowrap">
                      {log.user_nom}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        log.user_role === 'CONCEPTEUR'
                          ? 'bg-purple-100 text-purple-900 border border-purple-300 font-bold'
                          : log.user_role === 'CENSEUR'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300 font-bold'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {log.user_role === 'CONCEPTEUR' ? 'CONCEPTEUR / SUPER ADMINISTRATEUR' : log.user_role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.action.includes('SUPPRESSION') || log.action.includes('VERROUILLAGE')
                          ? 'bg-red-100 text-red-800'
                          : log.action.includes('CREATION') || log.action.includes('CONNEXION')
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600 uppercase text-[11px] whitespace-nowrap">
                      {log.table_cible}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {log.details}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
