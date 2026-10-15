'use client';

import React, { useState } from 'react';
import { PillSettings } from '@/types';
import { X, ShieldAlert, CheckCircle, AlertTriangle, Phone, ArrowRight, HelpCircle } from 'lucide-react';

interface EmergencyGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: PillSettings;
}

export const EmergencyGuideModal: React.FC<EmergencyGuideModalProps> = ({
  isOpen,
  onClose,
  settings,
}) => {
  const [step, setStep] = useState<number>(1);
  const [tolerance, setTolerance] = useState<number>(settings.tolerance_hours || 12);
  const [delayHours, setDelayHours] = useState<number>(14);
  const [packWeek, setPackWeek] = useState<'w1' | 'w2' | 'w3' | 'placebo'>('w1');
  const [hadIntercourse, setHadIntercourse] = useState<boolean>(true);

  if (!isOpen) return null;

  const isDelayExceeded = delayHours > tolerance;

  // Calcul du protocole recommandé
  const getAdvice = () => {
    if (!isDelayExceeded) {
      return {
        severity: 'low',
        title: 'Pas de panique : vous êtes dans la marge de sécurité !',
        steps: [
          'Prenez immédiatement le comprimé oublié dès maintenant.',
          'Prenez le comprimé suivant à l’heure habituelle (même si vous devez prendre 2 comprimés le même jour).',
          'L’efficacité contraceptive est maintenue. Aucun moyen supplémentaire (préservatif, pilule du lendemain) n’est nécessaire.',
        ],
      };
    }

    if (packWeek === 'placebo') {
      return {
        severity: 'low',
        title: 'Comprimé placebo (sans principe actif)',
        steps: [
          'Jetez le comprimé placebo oublié.',
          'L’efficacité contraceptive n’est pas affectée.',
          'Poursuivez la plaquette normalement et commencez la suivante à la date prévue.',
        ],
      };
    }

    // Retard > tolérance sur comprimé actif
    const emergencyPillRecommended = packWeek === 'w1' && hadIntercourse;
    const chainNextPack = packWeek === 'w3';

    return {
      severity: 'high',
      title: 'Dépassement du délai de sécurité',
      steps: [
        'Prenez immédiatement le comprimé oublié, même si cela signifie prendre 2 comprimés en même temps.',
        'Poursuivez votre plaquette à l’heure habituelle jusqu’à la fin.',
        'Utilisez des préservatifs lors de chaque rapport pendant les 7 prochains jours.',
        emergencyPillRecommended
          ? '⚠️ RAPPORT À RISQUE : Comme l’oubli a eu lieu en Semaine 1 avec rapport dans les 5 jours, prenez une contraception d’urgence (pilule du lendemain type NorLevo / EllaOne) le plus vite possible en pharmacie.'
          : 'Si vous avez eu un rapport non protégé dans les 5 jours précédant l’oubli, une contraception d’urgence peut être nécessaire.',
        chainNextPack
          ? '⚠️ FIN DE PLAQUETTE (Semaine 3) : Ne faites pas de semaine de pause ! Enchaînez directement avec la plaquette suivante dès la fin de celle-ci.'
          : 'Faites votre semaine de pause habituelle à la fin de la plaquette.',
        'Effectuez un test de grossesse urinaire 3 semaines après la date du rapport à risque.',
      ],
    };
  };

  const advice = getAdvice();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col transition-colors">
        {/* En-tête */}
        <div className="bg-gradient-to-r from-red-500 to-rose-600 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-lg">Guide d’urgence en cas d’oubli</h2>
              <p className="text-xs text-rose-100">
                Protocole basé sur les recommandations médicales officielles (HAS)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenu avec défilement */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Question 1 : Type de pilule / Tolérance */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide mb-2">
              1. Type de pilule & tolérance de retard
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTolerance(12)}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  tolerance === 12
                    ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 font-semibold'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-800/50'
                }`}
              >
                <div className="text-sm font-bold">Tolérance 12 heures</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Combinée standard ou Désogestrel (ex: Optilova, Leeloo, Cerazette)
                </div>
              </button>
              <button
                type="button"
                onClick={() => setTolerance(3)}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  tolerance === 3
                    ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 font-semibold'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-800/50'
                }`}
              >
                <div className="text-sm font-bold">Tolérance 3 heures</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Microprogestative pure (ex: Microval)
                </div>
              </button>
            </div>
          </div>

          {/* Question 2 : Heures de retard */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">
                2. Combien de temps de retard avez-vous ?
              </label>
              <span className="text-sm font-bold text-rose-600 dark:text-rose-400">{delayHours} heures</span>
            </div>
            <input
              type="range"
              min="1"
              max="36"
              value={delayHours}
              onChange={(e) => setDelayHours(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
            <div className="flex justify-between text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              <span>Moins de 2h</span>
              <span>12h (limite)</span>
              <span>24h</span>
              <span>36h+</span>
            </div>
          </div>

          {/* Question 3 : Semaine de la plaquette */}
          {isDelayExceeded && (
            <div className="animate-in fade-in">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide mb-2">
                3. À quelle période de la plaquette étiez-vous ?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'w1', label: 'Semaine 1', desc: 'Comprimés 1 à 7' },
                  { id: 'w2', label: 'Semaine 2', desc: 'Comprimés 8 à 14' },
                  { id: 'w3', label: 'Semaine 3', desc: 'Comprimés 15 à 21' },
                  { id: 'placebo', label: 'Placebo', desc: 'Comprimé inactif' },
                ].map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => setPackWeek(w.id as any)}
                    className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                      packWeek === w.id
                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-800/50'
                    }`}
                  >
                    <div className="text-xs">{w.label}</div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500">{w.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Question 4 : Rapport récent */}
          {isDelayExceeded && packWeek !== 'placebo' && (
            <div className="animate-in fade-in">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide mb-2">
                4. Rapport sexuel dans les 5 jours précédant l'oubli ?
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setHadIntercourse(true)}
                  className={`flex-1 py-2 rounded-xl border text-sm font-semibold transition cursor-pointer ${
                    hadIntercourse
                      ? 'border-red-500 bg-red-50 dark:bg-red-950/50 text-red-800 dark:text-red-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-800/50'
                  }`}
                >
                  Oui
                </button>
                <button
                  type="button"
                  onClick={() => setHadIntercourse(false)}
                  className={`flex-1 py-2 rounded-xl border text-sm font-semibold transition cursor-pointer ${
                    !hadIntercourse
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-800/50'
                  }`}
                >
                  Non
                </button>
              </div>
            </div>
          )}

          {/* Résultat et Plan d'action */}
          <div
            className={`p-4 rounded-2xl border ${
              advice.severity === 'low'
                ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60'
                : 'bg-red-50/70 dark:bg-red-950/40 border-red-200 dark:border-red-900/60'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              {advice.severity === 'low' ? (
                <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
              )}
              <h4
                className={`font-bold text-sm ${
                  advice.severity === 'low' ? 'text-emerald-900 dark:text-emerald-200' : 'text-red-900 dark:text-red-200'
                }`}
              >
                {advice.title}
              </h4>
            </div>

            <ol className="space-y-2 mt-3 text-xs text-slate-700 dark:text-slate-300 list-decimal list-inside pl-1">
              {advice.steps.map((st, idx) => (
                <li key={idx} className="leading-relaxed">
                  <span className="text-slate-800 dark:text-slate-100 font-medium">{st}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Contact d'aide gratuit */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-rose-500" />
              <span>Numéro vert sexualités & contraception :</span>
            </div>
            <a
              href="tel:0800081111"
              className="font-bold text-rose-600 dark:text-rose-400 hover:underline"
            >
              0 800 08 11 11 (gratuit)
            </a>
          </div>
        </div>

        {/* Pied de modal */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white font-medium text-xs transition cursor-pointer"
          >
            J'ai compris, fermer
          </button>
        </div>
      </div>
    </div>
  );
};
