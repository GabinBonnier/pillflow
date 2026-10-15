'use client';

import React from 'react';
import { Bell, BellOff, Settings, ShieldAlert, Sparkles, User, Flame } from 'lucide-react';

interface NavbarProps {
  streak: number;
  pushPermission: NotificationPermission;
  onOpenSettings: () => void;
  onOpenEmergency: () => void;
  onOpenAuth: () => void;
  onEnablePush: () => void;
  user: { email: string } | null;
  isLiveSupabase: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  streak,
  pushPermission,
  onOpenSettings,
  onOpenEmergency,
  onOpenAuth,
  onEnablePush,
  user,
  isLiveSupabase,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/80 border-b border-rose-100/80 shadow-xs">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo & Titre */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center shadow-md shadow-rose-200">
            <span className="text-xl">💊</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg text-slate-800 tracking-tight">PillFlow</h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                {isLiveSupabase ? 'Cloud' : 'Démo'}
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">Suivi de contraception serein & intelligent</p>
          </div>
        </div>

        {/* Actions & Badges */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Série / Streak */}
          {streak > 0 && (
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 font-semibold text-xs shadow-xs"
              title={`${streak} jours consécutifs de prise régulière`}
            >
              <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>{streak}j</span>
            </div>
          )}

          {/* Bouton Guide d'urgence en cas d'oubli */}
          <button
            onClick={onOpenEmergency}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-medium text-xs transition cursor-pointer"
            title="Que faire en cas d'oubli ?"
          >
            <ShieldAlert className="w-4 h-4 text-red-500" />
            <span className="hidden md:inline">Oubli ?</span>
          </button>

          {/* Statut Notifications */}
          {pushPermission === 'granted' ? (
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-full text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition cursor-pointer"
              title="Notifications actives"
            >
              <Bell className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onEnablePush}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-medium transition cursor-pointer"
              title="Activer les notifications push"
            >
              <BellOff className="w-4 h-4 text-rose-500" />
              <span className="hidden sm:inline">Activer rappels</span>
            </button>
          )}

          {/* Réglages */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
            title="Paramètres de la pilule"
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* Compte Utilisateur */}
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition cursor-pointer"
            title="Gérer le compte"
          >
            <div className="w-6 h-6 rounded-full bg-rose-200 text-rose-800 flex items-center justify-center font-bold text-xs">
              {user?.email ? user.email[0].toUpperCase() : <User className="w-3.5 h-3.5" />}
            </div>
            <span className="max-w-[80px] sm:max-w-[120px] truncate text-slate-700">
              {user?.email || 'Compte'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
