'use client';

import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Mascot, MascotMood } from '@/components/Mascot';
import { PillSettings } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { format, subDays } from 'date-fns';
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Lock,
  Mail,
  Sparkles,
  Clock,
  ShieldCheck,
  Bell,
  Heart,
  ChevronRight,
  Check,
  Coffee,
} from 'lucide-react';

interface OnboardingFlowProps {
  onComplete: (
    user: { id: string; email: string },
    settings: Partial<PillSettings>,
    alreadyTakenToday?: boolean
  ) => void;
}

const POPULAR_PILLS = [
  { name: 'Optilova 20', type: 'combined', tolerance: 12, desc: 'Combinée (12h de marge)' },
  { name: 'Leeloo Gé', type: 'combined', tolerance: 12, desc: 'Combinée (12h de marge)' },
  { name: 'Cerazette / Optimizette', type: 'progestin_12h', tolerance: 12, desc: 'Désogestrel (12h de marge)' },
  { name: 'Slinda', type: 'progestin_12h', tolerance: 12, desc: 'Drospirénone (24h de marge)' },
  { name: 'Microval', type: 'progestin_3h', tolerance: 3, desc: 'Progestative pure (3h de marge)' },
  { name: 'Autre pilule', type: 'combined', tolerance: 12, desc: 'Personnalisée' },
];

const PACK_TYPES = [
  {
    id: '21_7',
    label: '21 comprimés + 7 jours de pause',
    activeDays: 21,
    breakDays: 7,
    desc: 'Le format classique le plus répandu (règles pendant la pause)',
    emoji: '🌸',
  },
  {
    id: '28_placebo',
    label: '28 comprimés (avec placebos)',
    activeDays: 21,
    breakDays: 7,
    desc: '21 comprimés actifs + 7 comprimés placebo sans pause pour garder le rythme',
    emoji: '🤍',
  },
  {
    id: 'continuous',
    label: 'Prise en continu (365 jours)',
    activeDays: 365,
    breakDays: 0,
    desc: 'Sans aucune pause ni règles d’interruption',
    emoji: '♾️',
  },
];

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const [step, setStep] = useState<number>(1);
  const [isLoginMode, setIsLoginMode] = useState<boolean>(false);

  // Réponses du questionnaire
  const [firstName, setFirstName] = useState<string>('');
  const [pillName, setPillName] = useState<string>('Optilova 20');
  const [tolerance, setTolerance] = useState<number>(12);
  const [scheduledTime, setScheduledTime] = useState<string>('20:00');
  const [packType, setPackType] = useState<string>('21_7');

  // NOUVEAU : Position exacte dans la plaquette actuelle
  const [currentPillNumber, setCurrentPillNumber] = useState<number>(1);
  const [inBreakPeriod, setInBreakPeriod] = useState<boolean>(false);
  const [breakDayNumber, setBreakDayNumber] = useState<number>(1);
  const [alreadyTakenToday, setAlreadyTakenToday] = useState<boolean>(false);

  const [reminders, setReminders] = useState({
    initial: true,
    after30m: true,
    after60m: true,
  });

  // Identifiants pour la création ou connexion
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // État de calcul simulé
  const [calculationProgress, setCalculationProgress] = useState<number>(0);

  const totalSteps = 8;
  const progressPercent = Math.round((step / totalSteps) * 100);

  const selectedPack = PACK_TYPES.find((p) => p.id === packType) || PACK_TYPES[0];

  // Choix de l'humeur de Pilly selon l'étape
  const getPillyMood = (): MascotMood => {
    if (isLoginMode) return 'waving';
    switch (step) {
      case 1:
        return 'waving';
      case 2:
      case 3:
      case 5:
        return 'thinking';
      case 4:
        return 'cautious';
      case 6:
        return 'happy';
      case 7:
        return 'excited';
      case 8:
        return 'proud';
      default:
        return 'happy';
    }
  };

  const getPillySpeech = (): string => {
    if (isLoginMode) {
      return "Ravi de te revoir ! Connecte-toi pour retrouver ton calendrier et tes rappels ✨";
    }
    switch (step) {
      case 1:
        return "Coucou ! Moi c’est Pilly 💊 Ta coach perso pour ne plus jamais stresser avec ta pilule. Comment tu t’appelles ?";
      case 2:
        return `Enchantée ${firstName || 'toi'} ! Quelle pilule prends-tu au quotidien ?`;
      case 3:
        return "Le secret d’une protection optimale, c’est la régularité ! À quelle heure es-tu la plus tranquille ?";
      case 4:
        return "Chaque formule est unique ! Comment est organisée ta plaquette ?";
      case 5:
        return inBreakPeriod
          ? "Tu es en pause de plaquette ! Quel jour de pause traverses-tu aujourd'hui ?"
          : `À quel comprimé en es-tu aujourd'hui ? Comme ça, je cale ton calendrier pile au bon endroit !`;
      case 6:
        return "Je veille sur toi : si tu n’as pas validé à l’heure, je t’envoie un rappel à +30min puis à +1h. Ça te convient ?";
      case 7:
        return "Génial ! Je calcule ton plan personnalisé et je positionne ton jour de cycle...";
      case 8:
        return `Tout est prêt ${firstName || ''} ! Crée ton compte pour sauvegarder ton suivi et le synchroniser sur ton téléphone et ton PC 📲`;
      default:
        return "C'est parti !";
    }
  };

  // Passage à l'étape suivante
  const nextStep = () => {
    setErrorMessage(null);
    if (step === 1 && !firstName.trim()) {
      setErrorMessage('Dis-moi comment tu t’appelles pour qu’on fasse connaissance !');
      return;
    }
    if (step === 6) {
      // Étape d'animation calculatoire (comme les apps de sport)
      setStep(7);
      let p = 0;
      const interval = setInterval(() => {
        p += 25;
        setCalculationProgress(p);
        if (p >= 100) {
          clearInterval(interval);
          setTimeout(() => setStep(8), 600);
        }
      }, 400);
      return;
    }
    setStep((prev) => Math.min(totalSteps, prev + 1));
  };

  const prevStep = () => {
    setErrorMessage(null);
    setStep((prev) => Math.max(1, prev - 1));
  };

  // Connexion pour utilisateur existant
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      if (isSupabaseConfigured() && supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        if (data.user) {
          onComplete(
            { id: data.user.id, email: data.user.email || '' },
            {}
          );
        }
      } else {
        const localUser = { id: `local-${Date.now()}`, email };
        localStorage.setItem('pillflow_user', JSON.stringify(localUser));
        onComplete(localUser, {});
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Erreur lors de la connexion. Vérifiez vos identifiants.');
    } finally {
      setLoading(false);
    }
  };

  // Création du compte à la fin du quiz
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    // Calcul précis de la date de début du cycle actuel en fonction du comprimé renseigné
    const today = new Date();
    const dayOffset = inBreakPeriod
      ? selectedPack.activeDays + (breakDayNumber - 1)
      : Math.max(0, currentPillNumber - 1);

    const cycleStartDate = format(subDays(today, dayOffset), 'yyyy-MM-dd');
    const todayStr = format(today, 'yyyy-MM-dd');

    const userSettings: Partial<PillSettings> = {
      pill_name: pillName,
      tolerance_hours: tolerance,
      scheduled_time: scheduledTime,
      pack_active_days: selectedPack.activeDays,
      pack_break_days: selectedPack.breakDays,
      cycle_start_date: cycleStartDate,
      reminders_enabled: true,
      remind_at_pill_time: reminders.initial,
      remind_after_30m: reminders.after30m,
      remind_after_60m: reminders.after60m,
    };

    try {
      if (isSupabaseConfigured() && supabase) {
        const detectedTimezone =
          typeof Intl !== 'undefined'
            ? Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Paris'
            : 'Europe/Paris';

        // 1. Créer le compte dans Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: firstName,
              timezone: detectedTimezone,
            },
          },
        });

        if (authError) throw authError;

        const userId = authData.user?.id || 'demo-user-id';

        // 2. Mettre à jour le profil avec le fuseau horaire
        await supabase
          .from('profiles')
          .update({
            full_name: firstName,
            timezone: detectedTimezone,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        // 3. Enregistrer les réglages personnalisés avec onConflict explicite
        const { error: settingsError } = await supabase.from('pill_settings').upsert(
          {
            user_id: userId,
            ...userSettings,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );

        if (settingsError) {
          console.error('Erreur enregistrement réglages onboarding:', settingsError);
          throw settingsError;
        }

        // 4. Si l'utilisateur a indiqué avoir déjà pris son comprimé aujourd'hui
        if (alreadyTakenToday && !inBreakPeriod) {
          const { error: logError } = await supabase.from('pill_logs').upsert(
            {
              user_id: userId,
              date: todayStr,
              status: 'taken',
              taken_at: new Date().toISOString(),
              notes: `Comprimé n°${currentPillNumber} validé lors du questionnaire`,
            },
            { onConflict: 'user_id,date' }
          );

          if (logError) {
            console.warn('Erreur pill_log initial onboarding:', logError);
          }
        }

        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });

        onComplete({ id: userId, email }, userSettings, alreadyTakenToday);
      } else {
        // Mode local
        const localUser = { id: `local-${Date.now()}`, email };
        localStorage.setItem('pillflow_user', JSON.stringify(localUser));
        localStorage.setItem('pillflow_settings', JSON.stringify(userSettings));

        if (alreadyTakenToday && !inBreakPeriod) {
          const initLogs: Record<string, any> = {};
          initLogs[todayStr] = {
            id: `init-${todayStr}`,
            date: todayStr,
            status: 'taken',
            taken_at: new Date().toISOString(),
            delay_minutes: 0,
            notes: `Comprimé n°${currentPillNumber} validé`,
          };
          localStorage.setItem('pillflow_logs', JSON.stringify(initLogs));
        }

        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });

        onComplete(localUser, userSettings, alreadyTakenToday);
      }
    } catch (err: any) {
      let msg = err?.message || 'Impossible de créer le compte. Vérifiez les informations.';
      if (msg.includes('Database error saving new user') || msg.includes('schema cache')) {
        msg = "Erreur base de données Supabase : les tables n'ont pas encore été créées dans votre projet. Veuillez exécuter le script SQL dans votre console Supabase SQL Editor.";
      }
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-pink-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-800 dark:text-slate-100 flex flex-col justify-between py-6 px-4 transition-colors">
      {/* Barre supérieure : Progression & Bouton de connexion */}
      <div className="max-w-xl w-full mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💊</span>
            <span className="font-extrabold text-lg text-slate-800 dark:text-slate-100 tracking-tight">PillFlow</span>
          </div>

          <button
            onClick={() => {
              setIsLoginMode(!isLoginMode);
              setErrorMessage(null);
            }}
            className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 bg-rose-50 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-slate-700 border border-rose-100 dark:border-slate-700 px-3 py-1.5 rounded-full transition cursor-pointer"
          >
            {isLoginMode ? '← Faire le questionnaire' : 'Déjà un compte ? Se connecter'}
          </button>
        </div>

        {/* Barre de progression (style Duolingo / Fitness apps) */}
        {!isLoginMode && (
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden mb-6">
            <div
              className="bg-gradient-to-r from-rose-500 to-pink-500 h-full transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
      </div>

      {/* Contenu principal : Mascotte Pilly + Étape active */}
      <div className="max-w-xl w-full mx-auto flex-1 flex flex-col justify-center my-4">
        {/* Mascotte Pilly avec sa bulle de dialogue */}
        <Mascot
          mood={getPillyMood()}
          size="lg"
          bubbleText={getPillySpeech()}
          className="mb-6"
        />

        {/* Message d'erreur éventuel */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs flex items-center gap-2 animate-in fade-in">
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Mode Connexion pour utilisateur existant */}
        {isLoginMode ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl dark:shadow-none border border-rose-100 dark:border-slate-800 animate-in fade-in">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-1">Bon retour parmi nous !</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Connectez-vous pour synchroniser votre pilule et vos rappels.
            </p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Adresse email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ton-email@exemple.com"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-base font-medium focus:border-rose-500 focus:ring-2 focus:ring-rose-200 dark:focus:ring-rose-800 focus:outline-none shadow-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-base font-medium focus:border-rose-500 focus:ring-2 focus:ring-rose-200 dark:focus:ring-rose-800 focus:outline-none shadow-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-bold text-sm shadow-lg shadow-rose-200 dark:shadow-none transition disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Connexion en cours...' : 'Me connecter à mon compte'}
              </button>
            </form>
          </div>
        ) : (
          /* Questionnaire pas-à-pas */
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl dark:shadow-none border border-rose-100 dark:border-slate-800">
            {/* Étape 1 : Prénom */}
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in">
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Faisons connaissance !</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Quel est ton prénom pour que Pilly puisse personnaliser ton suivi ?
                </p>

                <input
                  type="text"
                  autoFocus
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Ex: Emma, Léa, Camille..."
                  onKeyDown={(e) => e.key === 'Enter' && nextStep()}
                  className="w-full p-4 rounded-2xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-base font-semibold focus:border-rose-500 focus:ring-2 focus:ring-rose-100 dark:focus:ring-rose-800 focus:outline-none shadow-xs"
                />
              </div>
            )}

            {/* Étape 2 : Nom de la pilule */}
            {step === 2 && (
              <div className="space-y-4 animate-in fade-in">
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Quelle pilule prends-tu ?</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {POPULAR_PILLS.map((p) => {
                    const isSelected = pillName === p.name;
                    return (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => {
                          setPillName(p.name);
                          setTolerance(p.tolerance);
                        }}
                        className={`p-3.5 rounded-2xl border-2 text-left transition cursor-pointer ${
                          isSelected
                            ? 'border-rose-500 bg-rose-50/60 dark:bg-rose-950/40 ring-1 ring-rose-200 dark:ring-rose-800'
                            : 'border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60'
                        }`}
                      >
                        <div className="font-bold text-sm text-slate-800 dark:text-slate-100">{p.name}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{p.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Étape 3 : Heure de prise */}
            {step === 3 && (
              <div className="space-y-4 animate-in fade-in">
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">À quelle heure est ton rituel ?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Choisis un moment fixe où tu as toujours ton sac ou ton verre d'eau sous la main.
                </p>

                <div className="flex justify-center py-2">
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="p-4 rounded-2xl border-2 border-rose-400 dark:border-rose-500 bg-white dark:bg-slate-800 text-2xl font-extrabold text-rose-600 dark:text-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-300 dark:focus:ring-rose-800 shadow-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  {['20:00 (Dîner)', '21:30 (Coucher)', '08:00 (Matin)', '12:30 (Déjeuner)'].map(
                    (preset) => {
                      const time = preset.slice(0, 5);
                      return (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setScheduledTime(time)}
                          className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                            scheduledTime === time
                              ? 'border-rose-400 bg-rose-100/50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 font-bold'
                              : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-800/50'
                          }`}
                        >
                          {preset}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>
            )}

            {/* Étape 4 : Format de la plaquette */}
            {step === 4 && (
              <div className="space-y-4 animate-in fade-in">
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Format de ta plaquette</h3>
                <div className="space-y-2.5">
                  {PACK_TYPES.map((pack) => {
                    const isSelected = packType === pack.id;
                    return (
                      <button
                        key={pack.id}
                        type="button"
                        onClick={() => {
                          setPackType(pack.id);
                          setCurrentPillNumber(1);
                          setInBreakPeriod(false);
                        }}
                        className={`w-full p-4 rounded-2xl border-2 text-left flex items-start gap-3 transition cursor-pointer ${
                          isSelected
                            ? 'border-rose-500 bg-rose-50/60 dark:bg-rose-950/40 ring-1 ring-rose-200 dark:ring-rose-800'
                            : 'border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60'
                        }`}
                      >
                        <span className="text-2xl mt-0.5">{pack.emoji}</span>
                        <div>
                          <div className="font-bold text-sm text-slate-800 dark:text-slate-100">{pack.label}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{pack.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Étape 5 : Où en es-tu dans ta plaquette aujourd'hui ? */}
            {step === 5 && (
              <div className="space-y-5 animate-in fade-in">
                <div>
                  <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">
                    Où en es-tu aujourd'hui ?
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Sélectionne le numéro du comprimé correspondant à aujourd'hui pour positionner ta plaquette avec précision.
                  </p>
                </div>

                {!inBreakPeriod ? (
                  <div>
                    <div className="flex items-center justify-between mb-3 bg-rose-50 dark:bg-slate-800/80 p-3 rounded-2xl border border-rose-100 dark:border-slate-700">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Comprimé sélectionné :</span>
                      <span className="text-base font-extrabold text-rose-600 dark:text-rose-400 bg-white dark:bg-slate-900 px-3 py-1 rounded-xl shadow-xs">
                        Comprimé n°{currentPillNumber} / {selectedPack.activeDays}
                      </span>
                    </div>

                    {/* Grille tactile des numéros de comprimés */}
                    <div className="grid grid-cols-7 gap-1.5 sm:gap-2 max-h-48 overflow-y-auto p-1 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700">
                      {Array.from({ length: selectedPack.activeDays }, (_, i) => i + 1).map((num) => {
                        const isSelected = currentPillNumber === num;
                        return (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setCurrentPillNumber(num)}
                            className={`h-9 sm:h-10 rounded-xl text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                              isSelected
                                ? 'bg-gradient-to-tr from-rose-500 to-pink-500 text-white shadow-md scale-105'
                                : 'bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {num}
                          </button>
                        );
                      })}
                    </div>

                    {selectedPack.breakDays > 0 && (
                      <div className="text-center mt-3">
                        <button
                          type="button"
                          onClick={() => setInBreakPeriod(true)}
                          className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-800 underline font-medium cursor-pointer"
                        >
                          ☕ Je suis actuellement dans ma semaine de pause
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                        Jour de pause en cours :
                      </span>
                      <button
                        type="button"
                        onClick={() => setInBreakPeriod(false)}
                        className="text-xs text-rose-600 dark:text-rose-400 underline font-medium cursor-pointer"
                      >
                        Revenir aux comprimés actifs
                      </button>
                    </div>

                    <div className="grid grid-cols-7 gap-2">
                      {Array.from({ length: selectedPack.breakDays }, (_, i) => i + 1).map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setBreakDayNumber(d)}
                          className={`p-2.5 rounded-xl text-center text-xs font-bold transition cursor-pointer ${
                            breakDayNumber === d
                              ? 'bg-slate-800 dark:bg-rose-600 text-white'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                          }`}
                        >
                          Jour {d}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Question : As-tu déjà pris le comprimé aujourd'hui ? */}
                {!inBreakPeriod && (
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-2">
                      As-tu déjà pris ton comprimé d'aujourd'hui ?
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setAlreadyTakenToday(true)}
                        className={`p-3 rounded-2xl border-2 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                          alreadyTakenToday
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 ring-1 ring-emerald-200 dark:ring-emerald-800'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-800/50'
                        }`}
                      >
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>Oui, déjà pris</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAlreadyTakenToday(false)}
                        className={`p-3 rounded-2xl border-2 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                          !alreadyTakenToday
                            ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 ring-1 ring-rose-200 dark:ring-rose-800'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-800/50'
                        }`}
                      >
                        <Clock className="w-4 h-4 text-rose-500" />
                        <span>Pas encore pris</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Étape 6 : Rappels échelonnés (+30min et +1h) */}
            {step === 6 && (
              <div className="space-y-4 animate-in fade-in">
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">
                  La sécurité des 3 rappels intelligents
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Si tu n'as pas validé ta prise, Pilly relance automatiquement :
                </p>

                <div className="space-y-3 bg-rose-50/60 dark:bg-slate-800/80 p-4 rounded-2xl border border-rose-100 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      1
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                        À l'heure exacte ({scheduledTime})
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Notification push douce pour ne pas oublier
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2 border-t border-rose-100 dark:border-slate-700">
                    <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      2
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                        Rappel à +30 min (si non validé)
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Pour rattraper la prise avant de sortir de la fenêtre
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2 border-t border-rose-100 dark:border-slate-700">
                    <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      3
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                        Alerte à +1 heure (si toujours en attente)
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Dernier rappel avec bouton direct « J'ai pris ma pilule »
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Étape 7 : Animation de calcul personnalisé */}
            {step === 7 && (
              <div className="text-center py-8 space-y-6 animate-in zoom-in-95">
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">
                  Génération de ton rituel personnalisé...
                </h3>

                <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-rose-500 via-pink-500 to-emerald-500 h-full transition-all duration-300"
                    style={{ width: `${calculationProgress}%` }}
                  />
                </div>

                <div className="space-y-2 text-xs text-left max-w-xs mx-auto text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Position : {inBreakPeriod ? `Pause (Jour ${breakDayNumber})` : `Comprimé n°${currentPillNumber}`}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Pilule : {pillName} ({tolerance}h de marge)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Rappels synchronisés à {scheduledTime}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Étape 8 : Création de compte pour débloquer l'accès */}
            {step === 8 && (
              <form onSubmit={handleSignUp} className="space-y-4 animate-in fade-in">
                <div className="text-center pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-500">
                    Dernière étape
                  </span>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                    Crée ton compte pour débloquer l'accès
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Retrouve exactement ton suivi sur ton ordinateur et ton téléphone.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Adresse email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ton-email@exemple.com"
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-base font-medium focus:border-rose-500 focus:ring-2 focus:ring-rose-200 dark:focus:ring-rose-800 focus:outline-none shadow-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Au moins 6 caractères"
                      required
                      minLength={6}
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-base font-medium focus:border-rose-500 focus:ring-2 focus:ring-rose-200 dark:focus:ring-rose-800 focus:outline-none shadow-xs"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 hover:from-rose-600 hover:to-pink-600 text-white font-bold text-base shadow-xl shadow-rose-200 dark:shadow-none transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-5 h-5 text-rose-200" />
                  <span>{loading ? 'Création de ton compte...' : 'Accéder à mon application'}</span>
                </button>
              </form>
            )}

            {/* Boutons Suivant / Retour du Quiz */}
            {step < 7 && (
              <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800 mt-6">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Précédent</span>
                  </button>
                ) : (
                  <div />
                )}

                <button
                  type="button"
                  onClick={nextStep}
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-bold text-sm shadow-md shadow-rose-200 dark:shadow-none transition cursor-pointer"
                >
                  <span>Continuer</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pied de page discret */}
      <div className="text-center text-[11px] text-slate-400 dark:text-slate-500 max-w-sm mx-auto">
        🔒 Vos données de santé sont chiffrées et protégées.
      </div>
    </div>
  );
};
