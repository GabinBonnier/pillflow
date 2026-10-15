import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured, getServiceSupabase } from '@/lib/supabase';
import { sendWebPush } from '@/lib/webpush';

export async function GET(req: NextRequest) {
  return handleCron(req);
}

export async function POST(req: NextRequest) {
  return handleCron(req);
}

async function handleCron(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const tokenParam = req.nextUrl.searchParams.get('token');
    const isVercelCron = req.headers.get('x-vercel-cron') === '1';
    const secret = process.env.CRON_SECRET || 'pillflow_secret_cron_token_2026';

    const isAuthorized =
      isVercelCron ||
      authHeader === `Bearer ${secret}` ||
      tokenParam === secret;

    if (!isAuthorized && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        status: 'demo_mode',
        message: 'Supabase non configuré. Le système tourne en mode local.',
        timestamp: new Date().toISOString(),
      });
    }

    const db = getServiceSupabase() || supabase;
    if (!db) {
      return NextResponse.json({ error: 'Base de données inaccessible' }, { status: 500 });
    }

    // Récupérer tous les réglages actifs
    const { data: settingsList, error: settingsError } = await db
      .from('pill_settings')
      .select('*, profiles(timezone)')
      .eq('reminders_enabled', true);

    if (settingsError || !settingsList) {
      return NextResponse.json({ error: settingsError?.message }, { status: 500 });
    }

    const results = [];
    const now = new Date();

    for (const settings of settingsList) {
      // Fuseau horaire spécifique de l'utilisatrice (défaut : Europe/Paris)
      const userTimezone = (settings.profiles as any)?.timezone || 'Europe/Paris';

      const userFormatter = new Intl.DateTimeFormat('fr-FR', {
        timeZone: userTimezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      });
      const parts = userFormatter.formatToParts(now);
      const getPart = (type: string) => parts.find((p) => p.type === type)?.value || '';

      const currentYear = getPart('year');
      const currentMonth = getPart('month');
      const currentDay = getPart('day');
      const todayStr = `${currentYear}-${currentMonth}-${currentDay}`;

      const currentHours = Number(getPart('hour'));
      const currentMinutes = Number(getPart('minute'));
      const currentTotalMinutes = currentHours * 60 + currentMinutes;

      const [schedH, schedM] = (settings.scheduled_time || '20:00').split(':').map(Number);
      const scheduledTotalMinutes = schedH * 60 + schedM;
      let diffMinutes = currentTotalMinutes - scheduledTotalMinutes;

      // Gestion du franchissement de minuit (ex: prévu à 23h50, cron à 00h10 -> +20 min)
      if (diffMinutes < -720) {
        diffMinutes += 1440;
      } else if (diffMinutes > 720) {
        diffMinutes -= 1440;
      }

      // Vérifier si la pilule a déjà été prise aujourd'hui
      const { data: log } = await db
        .from('pill_logs')
        .select('*')
        .eq('user_id', settings.user_id)
        .eq('date', todayStr)
        .maybeSingle();

      const isTaken =
        log && (log.status === 'taken' || log.status === 'delayed' || log.status === 'missed');
      if (isTaken) {
        results.push({ userId: settings.user_id, status: 'already_taken' });
        continue;
      }

      // Déterminer le type de rappel nécessaire selon le décalage (en minutes)
      let reminderType: 'initial' | 'delay_30m' | 'delay_60m' | null = null;
      let title = '';
      let body = '';

      // Fenêtre 1 : Heure H programmée (de 0 à 29 minutes après)
      if (settings.remind_at_pill_time && diffMinutes >= 0 && diffMinutes < 30) {
        reminderType = 'initial';
        title = `💊 PillFlow - C'est l'heure de votre pilule (${settings.scheduled_time})`;
        body = `Prenez votre comprimé ${settings.pill_name || ''} pour rester protégée.`;
      }
      // Fenêtre 2 : Rappel +30 min (de 30 à 59 minutes après)
      else if (settings.remind_after_30m && diffMinutes >= 30 && diffMinutes < 60) {
        reminderType = 'delay_30m';
        title = `⏰ PillFlow - Rappel (+30 min)`;
        body = `Avez-vous pris votre pilule ? Elle n'a pas encore été validée.`;
      }
      // Fenêtre 3 : Alerte renforcée +1 heure (de 60 à 180 minutes après, pour éviter alertes nocturnes)
      else if (settings.remind_after_60m && diffMinutes >= 60 && diffMinutes < 180) {
        reminderType = 'delay_60m';
        title = `⚠️ PillFlow - Alerte (+1h de retard)`;
        body = `Attention : votre pilule n'a toujours pas été confirmée. Pensez-y sans tarder !`;
      }

      if (!reminderType) {
        results.push({
          userId: settings.user_id,
          status: 'no_reminder_window',
          diffMinutes,
          currentTime: `${String(currentHours).padStart(2, '0')}:${String(currentMinutes).padStart(2, '0')}`,
          timezone: userTimezone,
        });
        continue;
      }

      // Vérifier si ce type de rappel a déjà été envoyé aujourd'hui
      const { data: alreadySent } = await db
        .from('sent_reminders')
        .select('id')
        .eq('user_id', settings.user_id)
        .eq('date', todayStr)
        .eq('reminder_type', reminderType)
        .maybeSingle();

      if (alreadySent) {
        results.push({
          userId: settings.user_id,
          status: 'already_sent',
          reminderType,
        });
        continue;
      }

      // Récupérer les abonnements Web Push (smartphone + PC)
      const { data: subscriptions } = await db
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', settings.user_id);

      if (subscriptions && subscriptions.length > 0) {
        let sentCount = 0;
        for (const sub of subscriptions) {
          try {
            await sendWebPush(
              {
                endpoint: sub.endpoint,
                keys: { p256dh: sub.p256dh, auth: sub.auth },
              },
              {
                title,
                body,
                tag: `pill-${reminderType}`,
                data: {
                  url: '/',
                  userId: settings.user_id,
                  reminderType,
                  scheduledTime: settings.scheduled_time,
                },
                actions: [
                  { action: 'take_pill', title: "💊 J'ai pris ma pilule" },
                  { action: 'open_app', title: "Ouvrir l'application" },
                ],
              }
            );
            sentCount++;
          } catch (pushErr: any) {
            console.error('Erreur push subscription:', pushErr?.message);
          }
        }

        // Marquer le rappel comme envoyé en base pour éviter les doublons
        await db.from('sent_reminders').insert({
          user_id: settings.user_id,
          date: todayStr,
          reminder_type: reminderType,
        });

        results.push({
          userId: settings.user_id,
          status: 'sent',
          reminderType,
          devicesNotified: sentCount,
        });
      } else {
        results.push({
          userId: settings.user_id,
          status: 'no_push_subscription',
        });
      }
    }

    const defaultParisFormatter = new Intl.DateTimeFormat('fr-FR', {
      timeZone: 'Europe/Paris',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    });

    return NextResponse.json({
      success: true,
      timeZone: 'Europe/Paris',
      currentTime: defaultParisFormatter.format(now),
      timestamp: now.toISOString(),
      processed: results.length,
      results,
    });
  } catch (error: any) {
    console.error('Erreur globale cron:', error);
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}
