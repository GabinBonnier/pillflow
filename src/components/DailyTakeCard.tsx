'use client';

import React from 'react';
import confetti from 'canvas-confetti';
import { PillSettings, PillLog, SymptomLog } from '@/types';
import { CheckCircle2, Clock, AlertTriangle, Coffee, Sparkles, HeartHandshake, Undo2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface DailyTakeCardProps {
  settings: PillSettings;
  isTodayTaken: boolean;
  todayLog?: PillLog;
  todaySymptoms?: SymptomLog;
  currentDayInCycle: number;
  isBreakPeriod: boolean;
  onTakePill: () => void;
  onUndoTakePill: () => void;
  onOpenSymptoms: () => void;
}

export const DailyTakeCard: React.FC<DailyTakeCardProps> = ({
  settings,
  isTodayTaken,
  todayLog,
  todaySymptoms,
  currentDayInCycle,
  isBreakPeriod,
  onTakePill,
  onUndoTakePill,
  onOpenSymptoms,
}) => {
  const [dateLabel, setDateLabel] = React.useState('Aujourd’hui');

  React.useEffect(() => {
    const formatted = format(new Date(), 'EEEE d MMMM yyyy', { locale: fr });
    setDateLabel(formatted.charAt(0).toUpperCase() + formatted.slice(1));
  }, []);

  // Découpage horaire arithmétique (évite new Date() au prerender)
  const [schedH, schedM] = (settings.scheduled_time || '20:00').split(':').map(Number);
  const timeInitial = settings.scheduled_time || '20:00';

  const m30 = (schedM + 30) % 60;
  const h30 = (schedH + Math.floor((schedM + 30) / 60)) % 24;
  const time30m = `${String(h30).padStart(2, '0')}:${String(m30).padStart(2, '0')}`;

  const h60 = (schedH + 1) % 24;
  const time60m = `${String(h60).padStart(2, '0')}:${String(schedM).padStart(2, '0')}`;

  const handleTakePillWithConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.65 },
      colors: ['#f43f5e', '#fb7185', '#fda4af', '#10b981', '#38bdf8'],
    });
    onTakePill();
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-white border border-rose-100 shadow-xl shadow-rose-100/50 p-6 md:p-8">
      {/* Fond décoratif doux */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-gradient-to-br from-rose-100/60 to-pink-50/20 rounded-full blur-2xl pointer-events-none" />

      {/* En-tête de la carte */}
      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-rose-500">
            {dateLabel}
          </span>
          <h2 className="text-2xl font-bold text-slate-800 mt-0.5">
            {isBreakPeriod ? 'Période de pause' : `Comprimé n°${currentDayInCycle}`}
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {settings.pill_name} •{' '}
            {isBreakPeriod
              ? `Jour ${currentDayInCycle - settings.pack_active_days} sur ${settings.pack_break_days} de pause`
              : `Plaquette de ${settings.pack_active_days} comprimés`}
          </p>
        </div>

        {/* Badge d'état */}
        <div className="self-start md:self-auto">
          {isBreakPeriod ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
              <Coffee className="w-4 h-4 text-slate-500" />
              Semaine sans pilule
            </span>
          ) : isTodayTaken ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Validée aujourd'hui
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold">
              <Clock className="w-4 h-4 text-rose-500" />
              Prévue à {settings.scheduled_time}
            </span>
          )}
        </div>
      </div>

      {/* Corps principal : Gros bouton d'action */}
      <div className="relative my-8 flex flex-col items-center text-center">
        {isBreakPeriod ? (
          <div className="py-6 px-4 max-w-md">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-slate-100 flex items-center justify-center text-3xl mb-4">
              ☕
            </div>
            <h3 className="font-semibold text-slate-800 text-lg">Profitez de votre pause</h3>
            <p className="text-sm text-slate-500 mt-1">
              Vous êtes actuellement dans vos {settings.pack_break_days} jours de pause (ou comprimés placebo).
              Les rappels reprendront automatiquement au début de la nouvelle plaquette.
            </p>
          </div>
        ) : isTodayTaken ? (
          <div className="py-4">
            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-200 mb-4 animate-in zoom-in-90 duration-300">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">C'est fait pour aujourd'hui !</h3>
            <p className="text-sm text-slate-500 mt-1">
              Prise enregistrée
              {todayLog?.taken_at
                ? ` à ${format(new Date(todayLog.taken_at), 'HH:mm')}`
                : ''}
              {todayLog?.delay_minutes && todayLog.delay_minutes > 15
                ? ` (décalage de ${todayLog.delay_minutes} min)`
                : ' • À l’heure ✨'}
            </p>

            <button
              onClick={onUndoTakePill}
              className="mt-4 inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 underline transition cursor-pointer"
            >
              <Undo2 className="w-3.5 h-3.5" />
              Annuler cette prise (erreur de clic)
            </button>
          </div>
        ) : (
          <div className="w-full max-w-sm flex flex-col items-center">
            <button
              onClick={handleTakePillWithConfetti}
              className="group relative w-full py-5 px-8 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 hover:from-rose-600 hover:to-pink-600 text-white font-bold text-lg shadow-lg shadow-rose-300/60 hover:shadow-xl hover:shadow-rose-300 transition-all transform active:scale-98 flex items-center justify-center gap-3 cursor-pointer"
            >
              <span className="text-2xl transition group-hover:rotate-12">💊</span>
              <span>J'ai pris ma pilule</span>
              <Sparkles className="w-5 h-5 text-rose-200 animate-pulse" />
            </button>
            <p className="text-xs text-slate-400 mt-2.5">
              Un clic pour enregistrer et stopper les rappels de la journée
            </p>
          </div>
        )}
      </div>

      {/* Frise des rappels programmés (Spécificité demandée : Rappel H, +30min, +1h) */}
      <div className="relative mt-6 pt-6 border-t border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
            Cycle des rappels aujourd'hui
          </span>
          <span className="text-[11px] text-slate-400">
            {settings.reminders_enabled ? 'Notifications automatiques actives' : 'Notifications en pause'}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {/* Étape 1 : Heure H */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold text-slate-700">1. Heure H</span>
              <span className="font-mono text-[11px] font-bold text-rose-600">{timeInitial}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Notification initiale</p>
          </div>

          {/* Étape 2 : +30 min */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold text-slate-700">2. Rappel +30m</span>
              <span className="font-mono text-[11px] font-bold text-amber-600">{time30m}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Si non validé à l'heure</p>
          </div>

          {/* Étape 3 : +1h */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold text-slate-700">3. Alerte +1h</span>
              <span className="font-mono text-[11px] font-bold text-red-600">{time60m}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Dernier rappel d'urgence</p>
          </div>
        </div>
      </div>

      {/* Raccourci vers les symptômes du jour */}
      <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-slate-500">
          <HeartHandshake className="w-4 h-4 text-rose-400" />
          <span>
            {todaySymptoms?.symptoms && todaySymptoms.symptoms.length > 0
              ? `${todaySymptoms.symptoms.length} symptôme(s) noté(s) aujourd'hui`
              : 'Comment vous sentez-vous aujourd’hui ?'}
          </span>
        </div>
        <button
          onClick={onOpenSymptoms}
          className="text-rose-600 font-medium hover:text-rose-700 hover:underline cursor-pointer"
        >
          {todaySymptoms?.symptoms && todaySymptoms.symptoms.length > 0
            ? 'Modifier mes notes'
            : 'Noter mes symptômes'}
        </button>
      </div>
    </div>
  );
};
