'use client';

import { useState, useEffect, useCallback } from 'react';
import { PillSettings, PillLog, SymptomLog, DayStatus } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { format, addDays, subDays, parseISO, differenceInDays } from 'date-fns';

const DEFAULT_SETTINGS: PillSettings = {
  pill_name: 'Optilova 20',
  pill_type: 'combined',
  tolerance_hours: 12,
  scheduled_time: '20:00',
  pack_active_days: 21,
  pack_break_days: 7,
  cycle_start_date: '2026-10-01', // Date fixe par défaut
  reminders_enabled: true,
  remind_at_pill_time: true,
  remind_after_30m: true,
  remind_after_60m: true,
};

// Données d'exemple réalistes pour les jours précédents
const getInitialSampleLogs = (startDateStr: string): Record<string, PillLog> => {
  const logs: Record<string, PillLog> = {};
  const today = new Date();

  for (let i = 12; i >= 1; i--) {
    const d = subDays(today, i);
    const dateStr = format(d, 'yyyy-MM-dd');
    const isDelayed = i === 4; // Un jour pris avec 45 min de retard
    logs[dateStr] = {
      id: `sample-log-${dateStr}`,
      date: dateStr,
      status: isDelayed ? 'delayed' : 'taken',
      scheduled_at: `${dateStr}T20:00:00.000Z`,
      taken_at: `${dateStr}T${isDelayed ? '20:45:00' : '20:05:00'}.000Z`,
      delay_minutes: isDelayed ? 45 : 5,
      pill_number_in_pack: 13 - i,
      notes: isDelayed ? 'Rappel +30m reçu' : undefined,
    };
  }
  return logs;
};

const getInitialSampleSymptoms = (): Record<string, SymptomLog> => {
  const symptoms: Record<string, SymptomLog> = {};
  const today = new Date();
  const d1 = format(subDays(today, 4), 'yyyy-MM-dd');
  const d2 = format(subDays(today, 8), 'yyyy-MM-dd');

  symptoms[d1] = {
    id: `symp-${d1}`,
    date: d1,
    mood: 'anxious',
    symptoms: ['headache', 'fatigue'],
    bleeding: 'none',
    notes: 'Journée fatigante de travail',
  };

  symptoms[d2] = {
    id: `symp-${d2}`,
    date: d2,
    mood: 'good',
    symptoms: ['bloating'],
    bleeding: 'spotting',
    notes: 'Léger spotting passager',
  };

  return symptoms;
};

export function usePillStore() {
  const [isClient, setIsClient] = useState(false);
  const [settings, setSettings] = useState<PillSettings>(DEFAULT_SETTINGS);
  const [logs, setLogs] = useState<Record<string, PillLog>>({});
  const [symptoms, setSymptoms] = useState<Record<string, SymptomLog>>({});
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [isLiveSupabase, setIsLiveSupabase] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');
  const [pushSubscription, setPushSubscription] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [now, setNow] = useState<Date | null>(null);

  // Charger depuis LocalStorage ou initialiser
  useEffect(() => {
    setIsClient(true);
    setNow(new Date());
    const hasSupabase = isSupabaseConfigured();
    setIsLiveSupabase(hasSupabase);

    // Vérifier support Web Push & Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      setPushSupported(true);
      setPushPermission(Notification.permission);
      navigator.serviceWorker.register('/sw.js').then(async (reg) => {
        try {
          const sub = await reg.pushManager.getSubscription();
          if (sub) {
            setPushSubscription(sub);
            // Si un utilisateur est déjà en session locale, synchroniser tout de suite
            const storedUser = localStorage.getItem('pillflow_user');
            if (storedUser) {
              const u = JSON.parse(storedUser);
              if (u?.id) {
                fetch('/api/webpush/subscribe', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ subscription: sub, userId: u.id }),
                }).catch(() => {});
              }
            }
          }
        } catch (e) {
          console.warn('Erreur push check:', e);
        }
      }).catch(console.error);
    }

    // Ticker régulier (toutes les 20 secondes) pour vérifier les rappels en heure française
    const reminderInterval = setInterval(() => {
      fetch('/api/cron/check-reminders?token=pillflow_secret_cron_token_2026').catch(() => {});
    }, 20000);
    // Charger les données locales
    try {
      const storedSettings = localStorage.getItem('pillflow_settings');
      const storedLogs = localStorage.getItem('pillflow_logs');
      const storedSymptoms = localStorage.getItem('pillflow_symptoms');
      const storedUser = localStorage.getItem('pillflow_user');

      if (storedSettings) {
        setSettings(JSON.parse(storedSettings));
      } else {
        localStorage.setItem('pillflow_settings', JSON.stringify(DEFAULT_SETTINGS));
      }

      if (storedLogs) {
        setLogs(JSON.parse(storedLogs));
      } else {
        const initialLogs = getInitialSampleLogs(DEFAULT_SETTINGS.cycle_start_date);
        setLogs(initialLogs);
        localStorage.setItem('pillflow_logs', JSON.stringify(initialLogs));
      }

      if (storedSymptoms) {
        setSymptoms(JSON.parse(storedSymptoms));
      } else {
        const initialSymp = getInitialSampleSymptoms();
        setSymptoms(initialSymp);
        localStorage.setItem('pillflow_symptoms', JSON.stringify(initialSymp));
      }

      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        if (parsed && parsed.email && parsed.email !== 'demo@pillflow.app') {
          setUser(parsed);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (e) {
      console.error('Erreur chargement local:', e);
    } finally {
      setIsLoading(false);
    }

    // Vérifier session Supabase si disponible
    if (hasSupabase && supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          const u = { id: session.user.id, email: session.user.email || '' };
          setUser(u);
          localStorage.setItem('pillflow_user', JSON.stringify(u));
          loadFromSupabase(session.user.id);
        } else {
          setUser(null);
          localStorage.removeItem('pillflow_user');
        }
      });

      const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          const u = { id: session.user.id, email: session.user.email || '' };
          setUser(u);
          localStorage.setItem('pillflow_user', JSON.stringify(u));
          loadFromSupabase(session.user.id);
        } else {
          setUser(null);
          localStorage.removeItem('pillflow_user');
        }
      });

      return () => {
        authListener?.subscription.unsubscribe();
      };
    }
  }, []);

  // Charger les données depuis Supabase
  const loadFromSupabase = async (userId: string) => {
    if (!supabase) return;
    try {
      // Settings
      const { data: userSettings } = await supabase
        .from('pill_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (userSettings) {
        setSettings(userSettings);
        localStorage.setItem('pillflow_settings', JSON.stringify(userSettings));
      }

      // Logs
      const { data: userLogs } = await supabase
        .from('pill_logs')
        .select('*')
        .eq('user_id', userId);

      if (userLogs) {
        const map: Record<string, PillLog> = {};
        userLogs.forEach((l) => (map[l.date] = l));
        setLogs(map);
        localStorage.setItem('pillflow_logs', JSON.stringify(map));
      }

      // Symptoms
      const { data: userSymps } = await supabase
        .from('symptom_logs')
        .select('*')
        .eq('user_id', userId);

      if (userSymps) {
        const map: Record<string, SymptomLog> = {};
        userSymps.forEach((s) => (map[s.date] = s));
        setSymptoms(map);
        localStorage.setItem('pillflow_symptoms', JSON.stringify(map));
      }

      // Synchroniser automatiquement l'abonnement Web Push de l'appareil
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
        try {
          const reg = await navigator.serviceWorker.ready;
          let sub = await reg.pushManager.getSubscription();
          if (sub) {
            setPushSubscription(sub);
            await fetch('/api/webpush/subscribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ subscription: sub, userId }),
            });
          }
        } catch (subErr) {
          console.warn('Erreur push sync:', subErr);
        }
      }
    } catch (err) {
      console.error('Erreur chargement Supabase:', err);
    }
  };

  // Mettre à jour les réglages
  const updateSettings = useCallback((newSettings: Partial<PillSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('pillflow_settings', JSON.stringify(updated));

      // Sync Supabase
      if (isSupabaseConfigured() && supabase && user) {
        const timeChanged =
          newSettings.scheduled_time &&
          newSettings.scheduled_time !== prev.scheduled_time;

        // Si l'heure programmée a changé aujourd'hui, on réinitialise les sent_reminders du jour
        // pour que l'alerte à la nouvelle heure ne soit pas bloquée par un ancien rappel
        if (timeChanged) {
          const today = format(new Date(), 'yyyy-MM-dd');
          supabase
            .from('sent_reminders')
            .delete()
            .eq('user_id', user.id)
            .eq('date', today)
            .then(({ error }) => {
              if (error) console.error('Erreur réinitialisation sent_reminders:', error);
            });
        }

        supabase
          .from('pill_settings')
          .upsert(
            {
              user_id: user.id,
              ...updated,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
          )
          .then(({ error }) => {
            if (error) console.error('Erreur sauvegarde réglages Supabase:', error);
          });
      }

      return updated;
    });
  }, [user]);

  // Prendre la pilule (pour aujourd'hui ou date donnée)
  const takePill = useCallback(
    (targetDate?: string, targetTime?: string) => {
      const dateStr = targetDate || format(new Date(), 'yyyy-MM-dd');
      const now = new Date();
      const takenAt = targetTime || now.toISOString();

      // Calculer le décalage en minutes par rapport à l'heure programmée
      const [schedH, schedM] = settings.scheduled_time.split(':').map(Number);
      const scheduledDate = new Date();
      scheduledDate.setHours(schedH, schedM, 0, 0);

      const delayMinutes = Math.max(
        0,
        Math.round((now.getTime() - scheduledDate.getTime()) / (1000 * 60))
      );

      // Tolérance en heures
      const toleranceMinutes = (settings.tolerance_hours || 12) * 60;
      let status: PillLog['status'] = 'taken';

      if (delayMinutes > toleranceMinutes) {
        status = 'missed';
      } else if (delayMinutes > 30) {
        status = 'delayed';
      }

      const newLog: PillLog = {
        id: `log-${dateStr}-${Date.now()}`,
        user_id: user?.id,
        date: dateStr,
        status,
        scheduled_at: `${dateStr}T${settings.scheduled_time}:00.000Z`,
        taken_at: takenAt,
        delay_minutes: delayMinutes,
        notes: delayMinutes > 30 ? `Validé avec ${delayMinutes} min de décalage` : 'Pris à l’heure',
      };

      setLogs((prev) => {
        const updated = { ...prev, [dateStr]: newLog };
        localStorage.setItem('pillflow_logs', JSON.stringify(updated));
        return updated;
      });

      // Sync Supabase
      if (isSupabaseConfigured() && supabase && user) {
        supabase.from('pill_logs').upsert({
          user_id: user.id,
          date: dateStr,
          status,
          scheduled_at: newLog.scheduled_at,
          taken_at: takenAt,
          delay_minutes: delayMinutes,
          notes: newLog.notes,
        }, { onConflict: 'user_id,date' }).then(({ error }) => {
          if (error) console.error('Erreur sync takePill:', error);
        });
      }

      return newLog;
    },
    [settings, user]
  );

  // Annuler la prise d'un jour
  const undoTakePill = useCallback(
    (dateStr: string) => {
      setLogs((prev) => {
        const copy = { ...prev };
        delete copy[dateStr];
        localStorage.setItem('pillflow_logs', JSON.stringify(copy));
        return copy;
      });

      if (isSupabaseConfigured() && supabase && user) {
        supabase
          .from('pill_logs')
          .delete()
          .match({ user_id: user.id, date: dateStr })
          .then(({ error }) => {
            if (error) console.error('Erreur undoTakePill:', error);
          });
      }
    },
    [user]
  );

  // Enregistrer des symptômes pour un jour
  const saveSymptoms = useCallback(
    (dateStr: string, data: Partial<SymptomLog>) => {
      setSymptoms((prev) => {
        const existing = prev[dateStr] || {
          id: `symp-${dateStr}`,
          user_id: user?.id,
          date: dateStr,
          symptoms: [],
        };
        const updated = { ...existing, ...data };
        const newMap = { ...prev, [dateStr]: updated };
        localStorage.setItem('pillflow_symptoms', JSON.stringify(newMap));
        return newMap;
      });

      if (isSupabaseConfigured() && supabase && user) {
        supabase.from('symptom_logs').upsert({
          user_id: user.id,
          date: dateStr,
          mood: data.mood,
          bleeding: data.bleeding,
          symptoms: data.symptoms || [],
          notes: data.notes,
        }, { onConflict: 'user_id,date' }).then(({ error }) => {
          if (error) console.error('Erreur saveSymptoms:', error);
        });
      }
    },
    [user]
  );

  // Souscrire aux notifications Web Push
  const enablePushNotifications = async (): Promise<{ success: boolean; message: string }> => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return { success: false, message: 'Les notifications Web Push ne sont pas supportées par votre navigateur.' };
    }

    try {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);

      if (permission !== 'granted') {
        return {
          success: false,
          message: 'Permission refusée. Rendez-vous dans Réglages iPhone > Notifications > PillFlow pour autoriser les alertes.',
        };
      }

      const registration = await navigator.serviceWorker.ready;
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

      if (!vapidPublicKey) {
        return { success: false, message: 'Clé VAPID publique non définie.' };
      }

      // Convertir la clé VAPID base64url en Uint8Array
      const padding = '='.repeat((4 - (vapidPublicKey.length % 4)) % 4);
      const base64 = (vapidPublicKey + padding).replace(/\-/g, '+').replace(/_/g, '/');
      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }

      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: outputArray,
        });
      }

      setPushSubscription(subscription);

      // Résoudre l'ID utilisateur
      let resolvedUserId = user?.id;
      if (!resolvedUserId && typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('pillflow_user');
          if (stored) resolvedUserId = JSON.parse(stored)?.id;
        } catch (e) {}
      }

      // Enregistrer auprès du backend
      const res = await fetch('/api/webpush/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription,
          userId: resolvedUserId,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        return { success: false, message: resData.error || 'Erreur lors de l’enregistrement de l’appareil.' };
      }

      return { success: true, message: 'Appareil connecté aux notifications push avec succès !' };
    } catch (err: any) {
      console.error('Erreur activation notifications:', err);
      return { success: false, message: err?.message || 'Erreur lors de l’activation.' };
    }
  };

  // Déclencher un test de notification
  const triggerPushTest = async (type: 'initial' | 'delay_30m' | 'delay_60m') => {
    let currentSub = pushSubscription;
    if (!currentSub && typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.ready;
        currentSub = await reg.pushManager.getSubscription();
        if (currentSub) setPushSubscription(currentSub);
      } catch (e) {}
    }

    if (!currentSub) {
      const enableRes = await enablePushNotifications();
      if (!enableRes.success) {
        return enableRes;
      }
      try {
        const reg = await navigator.serviceWorker.ready;
        currentSub = await reg.pushManager.getSubscription();
      } catch (e) {}
    }

    if (currentSub) {
      try {
        const res = await fetch('/api/webpush/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription: currentSub, type }),
        });
        const data = await res.json();
        return data;
      } catch (e: any) {
        return { success: false, message: e.message };
      }
    }

    // Fallback Service Worker notification (compatible iOS)
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && Notification.permission === 'granted') {
      try {
        const reg = await navigator.serviceWorker.ready;
        const titles = {
          initial: `💊 PillFlow - C'est l'heure de votre pilule ! (${settings.scheduled_time})`,
          delay_30m: "⏰ PillFlow - Rappel (+30 min) : Avez-vous pris votre pilule ?",
          delay_60m: "⚠️ PillFlow - Alerte (+1h) : Pilule non validée !",
        };
        await reg.showNotification(titles[type], {
          body: "Cliquez pour ouvrir l'application et confirmer votre prise.",
          icon: '/icons/icon-192.svg',
          tag: `pill-${type}`,
        });
        return { success: true, message: 'Notification envoyée sur votre écran !' };
      } catch (swErr: any) {
        return { success: false, message: swErr?.message || 'Erreur affichage notification.' };
      }
    }

  };

  // Calcul du jour actuel dans la plaquette
  const todayStr = now ? format(now, 'yyyy-MM-dd') : '2026-10-15';
  const totalCycleDays = (settings.pack_active_days || 21) + (settings.pack_break_days || 7);
  
  let daysSinceStart = 0;
  if (now) {
    try {
      const start = parseISO(settings.cycle_start_date);
      daysSinceStart = Math.max(0, differenceInDays(now, start));
    } catch (e) {
      daysSinceStart = 0;
    }
  }

  const currentDayInCycle = (daysSinceStart % totalCycleDays) + 1; // 1 to totalCycleDays
  const isBreakPeriod = currentDayInCycle > settings.pack_active_days;
  const isTodayTaken = Boolean(
    logs[todayStr] &&
      (logs[todayStr].status === 'taken' ||
        logs[todayStr].status === 'delayed' ||
        logs[todayStr].status === 'missed')
  );

  // Calcul de la série (streak)
  let streak = 0;
  if (now) {
    let checkDate = isTodayTaken ? now : subDays(now, 1);
    while (true) {
      const dStr = format(checkDate, 'yyyy-MM-dd');
      const log = logs[dStr];
      if (log && (log.status === 'taken' || log.status === 'delayed')) {
        streak++;
        checkDate = subDays(checkDate, 1);
      } else {
        break;
      }
    }
  }

  // Taux de ponctualité sur les 30 derniers jours
  const last30DaysLogs = Object.values(logs).filter((l) => {
    if (!now) return false;
    try {
      const d = parseISO(l.date);
      return differenceInDays(now, d) <= 30;
    } catch {
      return false;
    }
  });

  const onTimeCount = last30DaysLogs.filter((l) => l.status === 'taken').length;
  const punctualityRate =
    last30DaysLogs.length > 0
      ? Math.round((onTimeCount / last30DaysLogs.length) * 100)
      : 100;

  return {
    isClient,
    isLoading,
    user,
    setUser,
    isLiveSupabase,
    settings,
    updateSettings,
    logs,
    symptoms,
    todayStr,
    isTodayTaken,
    todayLog: logs[todayStr],
    todaySymptoms: symptoms[todayStr],
    takePill,
    undoTakePill,
    saveSymptoms,
    // Cycle stats
    currentDayInCycle,
    totalCycleDays,
    isBreakPeriod,
    streak,
    punctualityRate,
    // Push notifications
    pushSupported,
    pushPermission,
    pushSubscription,
    enablePushNotifications,
    triggerPushTest,
  };
}
