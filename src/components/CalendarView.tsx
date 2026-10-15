'use client';

import React, { useState } from 'react';
import { PillLog, SymptomLog } from '@/types';
import { ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, Clock, Heart, Droplets } from 'lucide-react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns';
import { fr } from 'date-fns/locale';

interface CalendarViewProps {
  logs: Record<string, PillLog>;
  symptoms: Record<string, SymptomLog>;
  punctualityRate: number;
  onSelectDate: (dateStr: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  logs,
  symptoms,
  punctualityRate,
  onSelectDate,
}) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date('2026-10-01T00:00:00'));
  const [todayStr, setTodayStr] = useState<string>('2026-10-15');

  React.useEffect(() => {
    const d = new Date();
    setCurrentMonth(d);
    setTodayStr(format(d, 'yyyy-MM-dd'));
  }, []);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const weekDayLabels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  return (
    <div className="rounded-3xl bg-white border border-slate-200/80 p-5 sm:p-6 shadow-xs">
      {/* En-tête mois + navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="font-bold text-slate-800 text-lg">Calendrier & Historique</h3>
          <p className="text-xs text-slate-400">
            Suivi quotidien des prises, retards et symptômes
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Badge régularité */}
          <div className="px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{punctualityRate}% ponctualité</span>
          </div>

          {/* Navigation mois */}
          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-0.5">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition cursor-pointer"
              title="Mois précédent"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-semibold text-slate-700 capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: fr })}
            </span>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition cursor-pointer"
              title="Mois suivant"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Grille du calendrier */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center">
        {/* Noms des jours de la semaine */}
        {weekDayLabels.map((name) => (
          <div key={name} className="text-xs font-bold text-slate-400 py-1">
            {name}
          </div>
        ))}

        {/* Jours du mois */}
        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isCurrentDay = dateStr === todayStr;
          const log = logs[dateStr];
          const symp = symptoms[dateStr];

          const isTaken = log?.status === 'taken';
          const isDelayed = log?.status === 'delayed';
          const isMissed = log?.status === 'missed';
          const hasSymptoms = symp?.symptoms && symp.symptoms.length > 0;
          const hasBleeding = symp?.bleeding && symp.bleeding !== 'none';

          return (
            <button
              key={dateStr}
              onClick={() => onSelectDate(dateStr)}
              className={`min-h-[64px] sm:min-h-[72px] p-1.5 rounded-xl border flex flex-col justify-between text-left transition-all cursor-pointer ${
                !isCurrentMonth
                  ? 'opacity-30 border-transparent bg-slate-50/50'
                  : isCurrentDay
                  ? 'border-rose-400 bg-rose-50/40 ring-1 ring-rose-200'
                  : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50/80 bg-white'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span
                  className={`text-xs font-semibold ${
                    isCurrentDay
                      ? 'w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[11px]'
                      : isCurrentMonth
                      ? 'text-slate-700'
                      : 'text-slate-400'
                  }`}
                >
                  {format(day, 'd')}
                </span>

                {/* Badge d'état de prise */}
                {isTaken && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500" title="Pris à l'heure" />
                )}
                {isDelayed && (
                  <span className="w-2 h-2 rounded-full bg-amber-500" title="Pris avec retard" />
                )}
                {isMissed && (
                  <span className="w-2 h-2 rounded-full bg-red-500" title="Oublié" />
                )}
              </div>

              {/* Indicateurs en bas de case : saignements & humeur */}
              <div className="flex items-center gap-1 mt-1">
                {hasBleeding && (
                  <span title={`Saignements : ${symp.bleeding}`}>
                    <Droplets className="w-3 h-3 text-rose-500 fill-rose-500" />
                  </span>
                )}
                {hasSymptoms && (
                  <span title={`${symp.symptoms.length} symptôme(s) noté(s)`}>
                    <Heart className="w-3 h-3 text-purple-500 fill-purple-400" />
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Légende du calendrier */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500 mt-6 pt-4 border-t border-slate-100">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Pris à l’heure
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Retard (&gt;30m)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Oublié
        </span>
        <span className="flex items-center gap-1.5">
          <Droplets className="w-3 h-3 text-rose-500 fill-rose-500" /> Règles / Spotting
        </span>
        <span className="flex items-center gap-1.5">
          <Heart className="w-3 h-3 text-purple-500 fill-purple-400" /> Notes & Symptômes
        </span>
      </div>
    </div>
  );
};
