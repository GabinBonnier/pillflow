'use client';

import React from 'react';
import { PillSettings, PillLog } from '@/types';
import { Check, Clock, X, AlertCircle } from 'lucide-react';
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

  // Calcul des dates pour chaque case de la plaquette courante
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

    // Date correspondante dans ce cycle
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
    <div className="rounded-3xl bg-gradient-to-b from-slate-50 to-white border border-slate-200/80 p-5 sm:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
            <span>Plaquette en cours</span>
            <span className="text-xs font-normal text-slate-500">
              ({activeDays} comprimés {breakDays > 0 ? `+ ${breakDays} pause` : 'continu'})
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Vue réaliste de votre plaquette de pilules
          </p>
        </div>

        {/* Légende rapide */}
        <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Pris
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block ring-2 ring-rose-200" /> Aujourd'hui
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block" /> Pause
          </span>
        </div>
      </div>

      {/* Rendu visuel de la plaquette alvéolée */}
      <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-tr from-slate-100 via-rose-50/40 to-slate-100 border border-slate-200 shadow-inner">
        <div className="grid grid-cols-7 gap-2 sm:gap-3">
          {daysList.map((item) => {
            const isTaken = item.log?.status === 'taken' || item.log?.status === 'delayed';
            const isDelayed = item.log?.status === 'delayed';
            const isMissed = item.isPast && !isTaken && !item.isBreak;

            return (
              <div
                key={item.pillNumber}
                onClick={() => onSelectDay && onSelectDay(item.dateStr)}
                className={`group relative flex flex-col items-center justify-center p-2 rounded-xl border transition-all cursor-pointer ${
                  item.isCurrent
                    ? 'bg-white border-rose-400 ring-2 ring-rose-300 shadow-md transform scale-105 z-10'
                    : isTaken
                    ? 'bg-emerald-50/70 border-emerald-200'
                    : isMissed
                    ? 'bg-red-50/80 border-red-200'
                    : item.isBreak
                    ? 'bg-slate-100/80 border-slate-200 opacity-70'
                    : 'bg-white/80 border-slate-200 hover:border-rose-200'
                }`}
              >
                {/* Jour de la semaine */}
                <span className="text-[10px] font-bold text-slate-400 mb-1">
                  {item.dayOfWeek}
                </span>

                {/* Alvéole / Pilule physique */}
                <div
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isTaken
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : isMissed
                      ? 'bg-red-500 text-white shadow-xs'
                      : item.isBreak
                      ? 'bg-slate-200 text-slate-400 border border-dashed border-slate-300'
                      : item.isCurrent
                      ? 'bg-gradient-to-tr from-rose-500 to-pink-500 text-white shadow-md animate-pulse'
                      : 'bg-gradient-to-b from-rose-100 to-pink-50 text-rose-700 border border-rose-200 shadow-xs'
                  }`}
                >
                  {isTaken ? (
                    <Check className="w-4 h-4 stroke-[3]" />
                  ) : isMissed ? (
                    <X className="w-4 h-4 stroke-[3]" />
                  ) : item.isBreak ? (
                    <span className="text-[10px]">☕</span>
                  ) : (
                    <span>{item.pillNumber}</span>
                  )}
                </div>

                {/* Petit label sous la pilule */}
                <span className="text-[9px] text-slate-400 mt-1 font-mono">
                  {item.isBreak ? 'Pause' : `n°${item.pillNumber}`}
                </span>

                {/* Indicateur de retard */}
                {isDelayed && (
                  <span
                    className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-500 rounded-full text-white flex items-center justify-center"
                    title="Pris avec retard"
                  >
                    <Clock className="w-2.5 h-2.5" />
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
