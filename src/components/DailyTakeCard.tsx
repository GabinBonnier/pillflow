'use client';

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { PillSettings, PillLog, SymptomLog } from '@/types';
import { CheckCircle2, Clock, AlertTriangle, Coffee, Sparkles, HeartHandshake, Undo2, Bell } from 'lucide-react';
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
  const [dateLabel, setDateLabel] = useState('Aujourd’hui');
  const [currentParisTime, setCurrentParisTime] = useState<string>('');

  useEffect(() => {
    const formatted = format(new Date(), 'EEEE d MMMM yyyy', { locale: fr });
    setDateLabel(formatted.charAt(0).toUpperCase() + formatted.slice(1));

    // Mettre à jour l'heure française
    const updateTime = () => {
      const timeStr = new Intl.DateTimeFormat('fr-FR', {
        timeZone: 'Europe/Paris',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date());
      setCurrentParisTime(timeStr);
    };

    updateTime();
    const timer = setInterval(updateTime, 10000);
    return () => clearInterval(timer);
  }, []);

  // Découpage horaire arithmétique
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
    <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white border border-rose-100 shadow-lg sm:shadow-xl shadow-rose-100/50 p-4 sm:p-6 md:p-8">
      {/* Fond décoratif doux */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-gradient-to-br from-rose-100/60 to-pink-50/20 rounded-full blur-2xl pointer-events-none" />

      {/* En-tête de la carte */}
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 sm:pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-rose-500">
              {dateLabel}
            </span>
            {currentParisTime && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-mono">
                {currentParisTime} (FR)
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mt-0.5">
            {isBreakPeriod ? 'Période de pause' : `Comprimé n°${currentDayInCycle}`}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {settings.pill_name} •{' '}
            {isBreakPeriod
              ? `Jour ${currentDayInCycle - settings.pack_active_days} sur ${settings.pack_break_days} de pause`
              : `Plaquette de ${settings.pack_active_days} comprimés`}
          </p>
        </div>

        {/* Badge d'état */}
        <div className="self-start sm:self-auto shrink-0">
          {isBreakPeriod ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
              <Coffee className="w-3.5 h-3.5 text-slate-500" />
              Semaine de pause
            </span>
          ) : isTodayTaken ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Validée aujourd'hui
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold">
              <Clock className="w-3.5 h-3.5 text-rose-500" />
              Prévue à {settings.scheduled_time}
            </span>
          )}
        </div>
      </div>

      {/* Corps principal : Gros bouton d'action tactile */}
      <div className="relative my-6 sm:my-8 flex flex-col items-center text-center">
        {isBreakPeriod ? (
          <div className="py-4 px-2 max-w-md">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-3xl bg-slate-100 flex items-center justify-center text-2xl sm:text-3xl mb-3 sm:mb-4">
              ☕
            </div>
            <h3 className="font-semibold text-slate-800 text-base sm:text-lg">Profitez de votre pause</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Vous êtes actuellement dans vos {settings.pack_break_days} jours de pause (ou placebos).
              Les rappels reprendront automatiquement au début de la nouvelle plaquette.
            </p>
          </div>
        ) : isTodayTaken ? (
          <div className="py-2 sm:py-4">
            <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-200 mb-3 sm:mb-4 animate-in zoom-in-90 duration-300">
              <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-800">C'est fait pour aujourd'hui !</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
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
              className="mt-3 sm:mt-4 inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 underline transition cursor-pointer"
            >
              <Undo2 className="w-3.5 h-3.5" />
              Annuler cette prise (erreur de clic)
            </button>
          </div>
        ) : (
          <div className="w-full max-w-sm flex flex-col items-center">
            <button
              onClick={handleTakePillWithConfetti}
              className="group relative w-full py-4 sm:py-5 px-6 sm:px-8 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 hover:from-rose-600 hover:to-pink-600 text-white font-bold text-base sm:text-lg shadow-lg shadow-rose-300/60 hover:shadow-xl hover:shadow-rose-300 transition-all transform active:scale-98 flex items-center justify-center gap-2.5 sm:gap-3 cursor-pointer"
            >
              <span className="text-xl sm:text-2xl transition group-hover:rotate-12">💊</span>
              <span>J'ai pris ma pilule</span>
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-rose-200 animate-pulse" />
            </button>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-2">
              Un clic pour enregistrer et stopper les rappels de la journée
            </p>
          </div>
        )}
      </div>

      {/* Frise des rappels programmés (H, +30min, +1h) - 100% Adaptée mobile */}
      <div className="relative mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-slate-100">
        <div className="flex items-center justify-between mb-2.5 sm:mb-3">
          <span className="text-[11px] sm:text-xs font-semibold text-slate-700 uppercase tracking-wide">
            Vos 3 rappels programmés
          </span>
          <span className="text-[10px] sm:text-[11px] text-slate-400">
            {settings.reminders_enabled ? 'Actifs' : 'En pause'}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1.5 sm:gap-3 text-center">
          {/* Étape 1 : Heure H */}
          <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
            <div className="text-[10px] sm:text-xs font-semibold text-slate-700 truncate">1. Heure H</div>
            <div className="font-mono text-xs sm:text-sm font-extrabold text-rose-600 my-0.5">{timeInitial}</div>
            <p className="text-[9px] sm:text-[10px] text-slate-400 truncate">Normale</p>
          </div>

          {/* Étape 2 : +30 min */}
          <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-amber-50/60 border border-amber-100 flex flex-col justify-between">
            <div className="text-[10px] sm:text-xs font-semibold text-amber-800 truncate">2. +30 min</div>
            <div className="font-mono text-xs sm:text-sm font-extrabold text-amber-600 my-0.5">{time30m}</div>
            <p className="text-[9px] sm:text-[10px] text-amber-600/80 truncate">Rappel 1</p>
          </div>

          {/* Étape 3 : +1h */}
          <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-rose-50/60 border border-rose-100 flex flex-col justify-between">
            <div className="text-[10px] sm:text-xs font-semibold text-rose-800 truncate">3. +1 heure</div>
            <div className="font-mono text-xs sm:text-sm font-extrabold text-red-600 my-0.5">{time60m}</div>
            <p className="text-[9px] sm:text-[10px] text-red-600/80 truncate">Alerte</p>
          </div>
        </div>
      </div>

      {/* Raccourci vers les symptômes du jour */}
      <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-slate-50 flex items-center justify-between text-[11px] sm:text-xs">
        <div className="flex items-center gap-1.5 text-slate-500 truncate">
          <HeartHandshake className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          <span className="truncate">
            {todaySymptoms?.symptoms && todaySymptoms.symptoms.length > 0
              ? `${todaySymptoms.symptoms.length} symptôme(s) noté(s)`
              : 'Un symptôme à noter ?'}
          </span>
        </div>
        <button
          onClick={onOpenSymptoms}
          className="text-rose-600 font-medium hover:text-rose-700 hover:underline shrink-0 ml-2 cursor-pointer"
        >
          {todaySymptoms?.symptoms && todaySymptoms.symptoms.length > 0
            ? 'Modifier'
            : 'Noter'}
        </button>
      </div>
    </div>
  );
};
