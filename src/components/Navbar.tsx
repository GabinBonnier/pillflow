'use client';

import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellOff,
  Settings,
  ShieldAlert,
  Sparkles,
  User,
  Flame,
  Menu,
  X,
  LogOut,
  Trash2,
  ChevronRight,
  Sun,
  Moon,
} from 'lucide-react';
import { getStoredTheme, applyTheme, ThemeMode } from '@/lib/theme';

interface NavbarProps {
  streak: number;
  pushPermission: NotificationPermission;
  onOpenSettings: () => void;
  onOpenEmergency: () => void;
  onOpenAuth: () => void;
  onEnablePush: () => void;
  onOpenDeleteAccount: () => void;
  onLogout: () => void;
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
  onOpenDeleteAccount,
  onLogout,
  user,
  isLiveSupabase,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');
  const [isDarkActive, setIsDarkActive] = useState(false);

  useEffect(() => {
    setThemeMode(getStoredTheme());
    setIsDarkActive(document.documentElement.classList.contains('dark'));

    const observer = new MutationObserver(() => {
      setIsDarkActive(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const toggleTheme = () => {
    // Si actif en dark, on passe en light, sinon dark
    const nextTheme: ThemeMode = isDarkActive ? 'light' : 'dark';
    setThemeMode(nextTheme);
    applyTheme(nextTheme);
    setIsDarkActive(nextTheme === 'dark');
  };

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <>
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/95 dark:bg-slate-900/95 border-b border-rose-100/80 dark:border-slate-800 shadow-xs transition-colors">
        <div className="max-w-4xl mx-auto px-4 h-14 sm:h-16 flex items-center justify-between">
          {/* Logo & Titre */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center shadow-md shadow-rose-200 dark:shadow-none">
              <span className="text-base sm:text-xl">💊</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base sm:text-lg text-slate-800 dark:text-slate-100 tracking-tight">PillFlow</span>
                <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                  {isLiveSupabase ? 'Cloud' : 'Démo'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 hidden md:block">Suivi de contraception serein & intelligent</p>
            </div>
          </div>

          {/* Navigation DESKTOP (cachée sur mobile) */}
          <div className="hidden md:flex items-center gap-3">
            {/* Série / Streak */}
            {streak > 0 && (
              <div
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 font-bold text-xs"
                title={`${streak} jours consécutifs de prise régulière`}
              >
                <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>{streak}j</span>
              </div>
            )}

            {/* Bouton Guide d'urgence */}
            <button
              onClick={onOpenEmergency}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 font-semibold text-xs transition cursor-pointer"
            >
              <ShieldAlert className="w-4 h-4 text-red-500" />
              <span>Oubli ?</span>
            </button>

            {/* Statut Notifications */}
            {pushPermission === 'granted' ? (
              <button
                onClick={onOpenSettings}
                className="p-2 rounded-full text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition cursor-pointer"
                title="Notifications actives"
              >
                <Bell className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={onEnablePush}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 text-xs font-semibold transition cursor-pointer"
              >
                <BellOff className="w-4 h-4 text-rose-500" />
                <span>Rappels</span>
              </button>
            )}

            {/* Bouton bascule thème Clair / Sombre */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title={isDarkActive ? 'Passer en mode clair' : 'Passer en mode sombre'}
              aria-label="Changer de thème"
            >
              {isDarkActive ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
            </button>

            {/* Réglages */}
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-full text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Paramètres"
            >
              <Settings className="w-5 h-5" />
            </button>

            {/* Compte Utilisateur */}
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium transition cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200 flex items-center justify-center font-bold text-xs">
                {user?.email ? user.email[0].toUpperCase() : <User className="w-3.5 h-3.5" />}
              </div>
              <span className="max-w-[120px] truncate text-slate-700 dark:text-slate-200 font-semibold">
                {user?.email || 'Compte'}
              </span>
            </button>
          </div>

          {/* Navigation MOBILE */}
          <div className="flex md:hidden items-center gap-2">
            {/* Série compacte */}
            {streak > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 font-bold text-xs">
                <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>{streak}j</span>
              </div>
            )}

            {/* Bouton thème rapide sur mobile */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 transition cursor-pointer"
              aria-label="Basculer thème"
            >
              {isDarkActive ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Bouton Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition cursor-pointer"
              aria-label="Ouvrir le menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-rose-600" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* TIROIR DU MENU MOBILE 📱 */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="fixed top-0 right-0 w-5/6 max-w-sm h-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col justify-between p-5 overflow-y-auto animate-in slide-in-from-right duration-200 border-l border-slate-100 dark:border-slate-800">
            {/* Haut du menu : Profil & Fermeture */}
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-rose-200 dark:shadow-none">
                    {user?.email ? user.email[0].toUpperCase() : <User className="w-5 h-5" />}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs text-slate-400 dark:text-slate-500">Compte connecté</p>
                    <p className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate max-w-[170px]">
                      {user?.email || 'Invité'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={closeMenu}
                  className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Liste des actions du menu */}
              <div className="py-4 space-y-1.5">
                <button
                  onClick={() => {
                    closeMenu();
                    onOpenSettings();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-rose-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-rose-700 dark:hover:text-rose-300 transition cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      <Settings className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-sm">Paramètres & Pilule</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                </button>

                <button
                  onClick={() => {
                    closeMenu();
                    onOpenEmergency();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-700 dark:text-slate-200 hover:text-red-700 dark:hover:text-red-400 transition cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400">
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-sm">Que faire en cas d'oubli ?</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                </button>

                <button
                  onClick={() => {
                    closeMenu();
                    onEnablePush();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-400 transition cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-sm">Notifications Push</div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500">
                        {pushPermission === 'granted' ? '✅ Déjà actives' : 'Activer maintenant'}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                </button>

                {/* Bascule de thème dans le menu mobile */}
                <button
                  onClick={toggleTheme}
                  className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {isDarkActive ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-sm">Thème d'affichage</div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500">
                        {isDarkActive ? '🌙 Mode Sombre actif' : '☀️ Mode Clair actif'}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    Changer
                  </span>
                </button>
              </div>
            </div>

            {/* Bas du menu : Déconnexion et Suppression de compte */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <button
                onClick={() => {
                  closeMenu();
                  onLogout();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Se déconnecter</span>
              </button>

              <button
                onClick={() => {
                  closeMenu();
                  onOpenDeleteAccount();
                }}
                className="w-full py-2.5 px-4 rounded-xl border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
                <span>Supprimer mon compte</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
