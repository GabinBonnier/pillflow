'use client';

import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { X, User, Lock, Mail, Sparkles, LogOut, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: { email: string } | null;
  setUser: (user: { id: string; email: string } | null) => void;
  isLiveSupabase: boolean;
  onOpenDeleteAccount?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  user,
  setUser,
  isLiveSupabase,
  onOpenDeleteAccount,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (!isLiveSupabase || !supabase) {
      // Mode Démo local sans clés Supabase
      const demoUser = { id: `local-user-${Date.now()}`, email };
      setUser(demoUser);
      localStorage.setItem('pillflow_user', JSON.stringify(demoUser));
      setMessage({
        text: 'Connecté avec succès en mode Démo Local !',
        type: 'success',
      });
      setLoading(false);
      setTimeout(onClose, 1000);
      return;
    }

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMessage({
          text: 'Compte créé ! Vérifiez votre boîte mail pour confirmer votre inscription.',
          type: 'success',
        });
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        if (data.user) {
          setUser({ id: data.user.id, email: data.user.email || '' });
          setMessage({ text: 'Connexion réussie !', type: 'success' });
          setTimeout(onClose, 1000);
        }
      }
    } catch (err: any) {
      setMessage({ text: err?.message || 'Erreur d’authentification', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (isLiveSupabase && supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    localStorage.removeItem('pillflow_user');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors">
        {/* En-tête */}
        <div className="bg-gradient-to-r from-rose-500 to-pink-500 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-lg">Votre Compte</h2>
              <p className="text-xs text-rose-100">
                {isLiveSupabase ? 'Synchronisation Cloud Supabase' : 'Stockage Local & Démo'}
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

        <div className="p-6">
          {user && user.email !== 'demo@pillflow.app' ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 flex items-center justify-center text-2xl font-bold">
                {user.email[0].toUpperCase()}
              </div>
              <div>
                <p className="text-xs text-slate-400 dark:text-slate-500">Connecté(e) en tant que</p>
                <p className="font-bold text-slate-800 dark:text-slate-100 text-base">{user.email}</p>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <button
                  onClick={handleLogout}
                  className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Se déconnecter
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onOpenDeleteAccount && onOpenDeleteAccount();
                  }}
                  className="w-full py-2.5 rounded-xl border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                  Supprimer mon compte définitivement
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
                {isLiveSupabase ? (
                  <span>🔒 Vos données sont synchronisées de manière sécurisée sur votre base de données Supabase.</span>
                ) : (
                  <span>💡 <strong>Mode Démo Actif :</strong> Entrez votre email pour simuler votre compte ou configurez Supabase dans <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded text-[11px]">.env.local</code> pour la vraie persistance cloud.</span>
                )}
              </div>

              {message && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    message.type === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                      : 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-900/60'
                  }`}
                >
                  {message.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{message.text}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Adresse email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="exemple@email.com"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-base font-medium focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-200 dark:focus:ring-rose-800 shadow-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-base font-medium focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-200 dark:focus:ring-rose-800 shadow-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-semibold text-sm shadow-md transition disabled:opacity-50 cursor-pointer"
              >
                {loading
                  ? 'Chargement...'
                  : isSignUp
                  ? 'Créer mon compte'
                  : 'Se connecter'}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-xs text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                >
                  {isSignUp
                    ? 'Déjà un compte ? Se connecter'
                    : 'Pas encore de compte ? S’inscrire'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
