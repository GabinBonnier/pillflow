'use client';

import React from 'react';
import { PillSettings, PillLog } from '@/types';
import { Check, Clock, X, Coffee } from 'lucide-react';
import { format, addDays, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

interface BlisterPackViewProps {
  settings: PillSettings;
  logs: Record<string, PillLog>;
  currentDayInCycle: number;
  onSelectDay?: (dateStr: string) => void;
}

export const BlisterPackView: React.FC<BlisterPackViewProps> = ({
  settings,
  logs,
  currentDayInCycle,
  onSelectDay,
}) => {
  const activeDays = settings.pack_active_days || 21;
  const breakDays = settings.pack_break_days || 7;
  const totalDays = activeDays + breakDays;

  // Calcul des dates pour chaque alvéole
  let cycleStart = new Date('2026-10-01T00:00:00');
  try {
    cycleStart = parseISO(settings.cycle_start_date || '2026-10-01');
  } catch {
    cycleStart = new Date('2026-10-01T00:00:00');
  }

  const daysList = Array.from({ length: totalDays }, (_, i) => {
    const pillNumber = i + 1;
    const isBreak = pillNumber > activeDays;
    const isCurrent = pillNumber === currentDayInCycle;
    const isPast = pillNumber < currentDayInCycle;
    const isFuture = pillNumber > currentDayInCycle;

    const dateObj = addDays(cycleStart, i);
    const dateStr = format(dateObj, 'yyyy-MM-dd');
    const dayOfWeek = format(dateObj, 'EEEEEE', { locale: fr }).toUpperCase(); // L, M, M, J, V, S, D
    const log = logs[dateStr];

    return {
      pillNumber,
      isBreak,
      isCurrent,
      isPast,
      isFuture,
      dateStr,
      dayOfWeek,
      log,
    };
  });

  return (
    <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-rose-100/80 dark:border-slate-800 p-3.5 sm:p-6 shadow-xs overflow-hidden">
      {/* En-tête */}
      <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
        <div>
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm sm:text-base flex items-center gap-1.5 sm:gap-2">
            <span>Plaquette en cours</span>
            <span className="text-[10px] sm:text-xs font-normal text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
              {activeDays} comp. {breakDays > 0 ? `+ ${breakDays}j pause` : 'continu'}
            </span>
          </h3>
          <p className="text-[11px] sm:text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            Comprimé actuel : <strong className="text-rose-600 dark:text-rose-400 font-semibold">n°{currentDayInCycle}</strong>
          </p>
        </div>

        {/* Légende compacte */}
        <div className="flex items-center gap-2 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Pris
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block ring-2 ring-rose-200 dark:ring-rose-900/60" /> Aujourd'hui
          </span>
        </div>
      </div>

      {/* Rendu réaliste alvéolé - 100% Responsive sans débordement sur mobile */}
      <div className="p-2 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-slate-100 via-rose-50/30 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 border border-slate-200/80 dark:border-slate-800 shadow-inner">
        <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center">
          {daysList.map((item) => {
            const isTaken = item.log?.status === 'taken' || item.log?.status === 'delayed';
            const isDelayed = item.log?.status === 'delayed';
            const isMissed = item.isPast && !isTaken && !item.isBreak;

            return (
              <div
                key={item.pillNumber}
                onClick={() => onSelectDay && onSelectDay(item.dateStr)}
                className={`relative flex flex-col items-center justify-center p-1 sm:p-2 rounded-lg sm:rounded-xl border transition-all cursor-pointer ${
                  item.isCurrent
                    ? 'bg-white dark:bg-slate-800 border-rose-400 dark:border-rose-500 ring-2 ring-rose-300 dark:ring-rose-500/50 shadow-md transform scale-102 z-10'
                    : isTaken
                    ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60'
                    : isMissed
                    ? 'bg-red-50/80 dark:bg-red-950/40 border-red-200 dark:border-red-800/60'
                    : item.isBreak
                    ? 'bg-slate-100/70 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-700/60 opacity-60'
                    : 'bg-white/90 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700 hover:border-rose-200 dark:hover:border-slate-600'
                }`}
              >
                {/* Jour de la semaine (L, M, M, J, V, S, D) */}
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-0.5 sm:mb-1">
                  {item.dayOfWeek}
                </span>

                {/* Comprimé tactile */}
                <div
                  className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold transition-all ${
                    isTaken
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : isMissed
                      ? 'bg-red-500 text-white shadow-xs'
                      : item.isBreak
                      ? 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300 border border-dashed border-slate-300 dark:border-slate-600'
                      : item.isCurrent
                      ? 'bg-gradient-to-tr from-rose-500 to-pink-500 text-white shadow-sm ring-2 ring-rose-300 animate-pulse'
                      : 'bg-gradient-to-b from-rose-100 to-pink-50 dark:from-slate-700 dark:to-slate-800 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-slate-600'
                  }`}
                >
                  {isTaken ? (
                    <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
                  ) : isMissed ? (
                    <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
                  ) : item.isBreak ? (
                    <span className="text-[9px] sm:text-[10px]">☕</span>
                  ) : (
                    <span>{item.pillNumber}</span>
                  )}
                </div>

                {/* Label bas */}
                <span className="text-[8px] sm:text-[9px] text-slate-400 dark:text-slate-500 mt-0.5 font-mono">
                  {item.isBreak ? 'Pause' : `n°${item.pillNumber}`}
                </span>

                {/* Badge retard */}
                {isDelayed && (
                  <span
                    className="absolute -top-1 -right-1 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-amber-500 rounded-full text-white flex items-center justify-center"
                    title="Pris avec retard"
                  >
                    <Clock className="w-2 h-2" />
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
