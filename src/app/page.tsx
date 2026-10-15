'use client';

import React, { useState } from 'react';
import { usePillStore } from '@/lib/store';
import { Navbar } from '@/components/Navbar';
import { DailyTakeCard } from '@/components/DailyTakeCard';
import { BlisterPackView } from '@/components/BlisterPackView';
import { CalendarView } from '@/components/CalendarView';
import { NotificationTestBar } from '@/components/NotificationTestBar';
import { SettingsModal } from '@/components/SettingsModal';
import { EmergencyGuideModal } from '@/components/EmergencyGuideModal';
import { SymptomModal } from '@/components/SymptomModal';
import { AuthModal } from '@/components/AuthModal';
import { Sparkles, HeartHandshake, ShieldCheck, HelpCircle } from 'lucide-react';

export default function Home() {
  const store = usePillStore();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [selectedDateForSymptoms, setSelectedDateForSymptoms] = useState<string | null>(null);

  if (!store.isClient || store.isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-3xl shadow-lg shadow-rose-200 animate-pulse mb-4">
          💊
        </div>
        <p className="text-slate-600 font-semibold text-sm">Chargement de PillFlow...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/40 via-white to-slate-50 text-slate-800">
      {/* Barre de navigation */}
      <Navbar
        streak={store.streak}
        pushPermission={store.pushPermission}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenEmergency={() => setIsEmergencyOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onEnablePush={store.enablePushNotifications}
        user={store.user}
        isLiveSupabase={store.isLiveSupabase}
      />

      {/* Contenu principal */}
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Simulateur interactif de notifications pour tester facilement les rappels +30m et +1h */}
        <NotificationTestBar
          pushSupported={store.pushSupported}
          pushPermission={store.pushPermission}
          onEnablePush={store.enablePushNotifications}
          onTriggerTest={store.triggerPushTest}
        />

        {/* Carte principale de prise du jour */}
        <DailyTakeCard
          settings={store.settings}
          isTodayTaken={store.isTodayTaken}
          todayLog={store.todayLog}
          todaySymptoms={store.todaySymptoms}
          currentDayInCycle={store.currentDayInCycle}
          isBreakPeriod={store.isBreakPeriod}
          onTakePill={() => store.takePill()}
          onUndoTakePill={() => store.undoTakePill(store.todayStr)}
          onOpenSymptoms={() => setSelectedDateForSymptoms(store.todayStr)}
        />

        {/* Vue physique de la plaquette de pilules */}
        <BlisterPackView
          settings={store.settings}
          logs={store.logs}
          currentDayInCycle={store.currentDayInCycle}
          onSelectDay={(dateStr) => setSelectedDateForSymptoms(dateStr)}
        />

        {/* Vue Calendrier & Historique avec ponctualité */}
        <CalendarView
          logs={store.logs}
          symptoms={store.symptoms}
          punctualityRate={store.punctualityRate}
          onSelectDate={(dateStr) => setSelectedDateForSymptoms(dateStr)}
        />

        {/* Section d'information et conseils */}
        <footer className="pt-8 pb-12 border-t border-slate-200/60 text-center text-xs text-slate-500 space-y-3">
          <div className="flex flex-wrap items-center justify-center gap-6 text-slate-600 font-medium">
            <button
              onClick={() => setIsEmergencyOpen(true)}
              className="hover:text-rose-600 flex items-center gap-1 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-rose-500" />
              Que faire en cas d'oubli ?
            </button>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="hover:text-rose-600 flex items-center gap-1 cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Paramètres de mon cycle
            </button>
          </div>
          <p>
            PillFlow est un compagnon de rappel et de santé. En cas de doute persistant ou de rapport à risque, contactez un professionnel de santé ou le Planning Familial (0 800 08 11 11).
          </p>
        </footer>
      </main>

      {/* Modales */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={store.settings}
        onSave={store.updateSettings}
      />

      <EmergencyGuideModal
        isOpen={isEmergencyOpen}
        onClose={() => setIsEmergencyOpen(false)}
        settings={store.settings}
      />

      <SymptomModal
        isOpen={selectedDateForSymptoms !== null}
        onClose={() => setSelectedDateForSymptoms(null)}
        dateStr={selectedDateForSymptoms || store.todayStr}
        initialData={
          selectedDateForSymptoms ? store.symptoms[selectedDateForSymptoms] : undefined
        }
        onSave={store.saveSymptoms}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        user={store.user}
        setUser={store.setUser}
        isLiveSupabase={store.isLiveSupabase}
      />
    </div>
  );
}
