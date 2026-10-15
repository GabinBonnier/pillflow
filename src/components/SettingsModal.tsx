'use client';

import React, { useState } from 'react';
import { PillSettings } from '@/types';
import { X, Settings, Clock, Bell, Calendar, ShieldCheck, Mail } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: PillSettings;
  onSave: (newSettings: Partial<PillSettings>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
}) => {
  const [formData, setFormData] = useState<PillSettings>({ ...settings });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col transition-colors">
        {/* En-tête */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 dark:from-slate-900 dark:to-slate-950 px-6 py-5 text-white flex items-center justify-between border-b border-transparent dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-lg">Paramètres du traitement</h2>
              <p className="text-xs text-slate-300 dark:text-slate-400">
                Personnalisez votre pilule, vos horaires et vos rappels
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulaire avec scroll */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
          {/* Section 1 : Informations sur la pilule */}
          <div>
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-rose-500" />
              1. Votre pilule contraceptive
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nom commercial de la pilule
                </label>
                <input
                  type="text"
                  value={formData.pill_name}
                  onChange={(e) =>
                    setFormData({ ...formData, pill_name: e.target.value })
                  }
                  placeholder="Ex: Optilova 20, Leeloo Gé, Cerazette..."
                  className="w-full p-2.5 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-200 dark:focus:ring-rose-800 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tolérance de retard autorisée
                </label>
                <select
                  value={formData.tolerance_hours}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tolerance_hours: Number(e.target.value),
                    })
                  }
                  className="w-full p-2.5 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-200 dark:focus:ring-rose-800 focus:outline-none"
                >
                  <option value={12}>12 heures (Pilules combinées, Désogestrel)</option>
                  <option value={3}>3 heures (Microprogestatives pures)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2 : Heure de prise et durée de plaquette */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-rose-500" />
              2. Horaires & Structure du cycle
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Heure quotidienne de prise
                </label>
                <input
                  type="time"
                  value={formData.scheduled_time}
                  onChange={(e) =>
                    setFormData({ ...formData, scheduled_time: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl border-2 border-slate-300 dark:border-slate-700 text-sm font-bold text-rose-600 dark:text-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 dark:focus:ring-rose-800 focus:outline-none bg-white dark:bg-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Comprimés actifs / plaquette
                </label>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={formData.pack_active_days}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      pack_active_days: Number(e.target.value),
                    })
                  }
                  className="w-full p-2.5 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-200 dark:focus:ring-rose-800 focus:outline-none"
                  required
                />
                <span className="text-[10px] text-slate-400 dark:text-slate-500">Classique : 21 ou 28</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Jours de pause (ou placebo)
                </label>
                <input
                  type="number"
                  min={0}
                  max={14}
                  value={formData.pack_break_days}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      pack_break_days: Number(e.target.value),
                    })
                  }
                  className="w-full p-2.5 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-200 dark:focus:ring-rose-800 focus:outline-none"
                  required
                />
                <span className="text-[10px] text-slate-400 dark:text-slate-500">0 si prise continue</span>
              </div>
            </div>

            <div className="mt-3">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Date de début de la plaquette actuelle
              </label>
              <input
                type="date"
                value={formData.cycle_start_date}
                onChange={(e) =>
                  setFormData({ ...formData, cycle_start_date: e.target.value })
                }
                className="w-full sm:w-1/2 p-2.5 rounded-xl border-2 border-slate-300 dark:border-slate-700 text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-200 dark:focus:ring-rose-800 focus:outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Section 3 : Mécanisme des rappels (H, +30m, +1h) */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Bell className="w-4 h-4 text-rose-500" />
                3. Échelonnage des rappels automatiques
              </h3>
              <input
                type="checkbox"
                id="reminders_enabled"
                checked={formData.reminders_enabled}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    reminders_enabled: e.target.checked,
                  })
                }
                className="w-4 h-4 text-rose-600 rounded-sm focus:ring-rose-500 cursor-pointer"
              />
            </div>

            <div className="space-y-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                    Rappel à l'heure H ({formData.scheduled_time})
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Notification push dès l'heure exacte de la prise
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.remind_at_pill_time}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      remind_at_pill_time: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-rose-600 rounded-sm focus:ring-rose-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-slate-200/60 dark:border-slate-700">
                <div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                    Rappel 30 minutes après (H + 30m)
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Envoyé uniquement si vous n'avez pas encore validé
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.remind_after_30m}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      remind_after_30m: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-rose-600 rounded-sm focus:ring-rose-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-slate-200/60 dark:border-slate-700">
                <div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                    Alerte 1 heure après (H + 1h)
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Rappel insistant avec bouton de validation directe
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.remind_after_60m}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      remind_after_60m: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-rose-600 rounded-sm focus:ring-rose-500 cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Section 4 : Alerte partenaire optionnelle */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Mail className="w-4 h-4 text-rose-500" />
              4. Alerte Partenaire (Optionnel)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
              Recevoir un email ou prévenir une personne de confiance si la pilule n'a pas été prise après 12h.
            </p>
            <input
              type="email"
              value={formData.partner_email || ''}
              onChange={(e) =>
                setFormData({ ...formData, partner_email: e.target.value })
              }
              placeholder="partenaire@exemple.com"
              className="w-full p-2.5 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-200 dark:focus:ring-rose-800 focus:outline-none"
            />
          </div>

          {/* Boutons d'action */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl flex items-center justify-between border border-transparent dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition cursor-pointer"
            >
              Fermer sans enregistrer
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-semibold text-xs shadow-md transition cursor-pointer"
            >
              Enregistrer mes réglages
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
