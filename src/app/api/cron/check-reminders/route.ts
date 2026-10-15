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
    const secret = process.env.CRON_SECRET || 'pillflow_secret_cron_token_2026';

    const isAuthorized =
      authHeader === `Bearer ${secret}` || tokenParam === secret;

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

    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTotalMinutes = currentHours * 60 + currentMinutes;

    // Récupérer tous les réglages actifs
    const { data: settingsList, error: settingsError } = await db
      .from('pill_settings')
      .select('*, profiles(timezone)')
      .eq('reminders_enabled', true);

    if (settingsError || !settingsList) {
      return NextResponse.json({ error: settingsError?.message }, { status: 500 });
    }

    const results = [];

    for (const settings of settingsList) {
      const [schedH, schedM] = (settings.scheduled_time || '20:00').split(':').map(Number);
      const scheduledTotalMinutes = schedH * 60 + schedM;
      const diffMinutes = currentTotalMinutes - scheduledTotalMinutes;

      // Vérifier si la pilule a déjà été prise aujourd'hui
      const { data: log } = await db
        .from('pill_logs')
        .select('*')
        .eq('user_id', settings.user_id)
        .eq('date', todayStr)
        .maybeSingle();

      const isTaken = log && log.status === 'taken';
      if (isTaken) {
        results.push({ userId: settings.user_id, status: 'already_taken' });
        continue;
      }

      // Déterminer le type de rappel nécessaire
      let reminderType: 'initial' | 'delay_30m' | 'delay_60m' | null = null;
      let title = '';
      let body = '';

      // Fenêtre heure H (ex: entre 0 et 4 minutes après l'heure)
      if (settings.remind_at_pill_time && diffMinutes >= 0 && diffMinutes < 5) {
        reminderType = 'initial';
        title = `💊 PillFlow - C'est l'heure de votre pilule (${settings.scheduled_time})`;
        body = `Prenez votre comprimé ${settings.pill_name || ''} pour rester sereine.`;
      }
      // Fenêtre H + 30 min (entre 30 et 35 minutes)
      else if (settings.remind_after_30m && diffMinutes >= 30 && diffMinutes < 35) {
        reminderType = 'delay_30m';
        title = `⏰ PillFlow - Rappel (+30 min)`;
        body = `Avez-vous pris votre pilule ? Elle n'a pas encore été validée.`;
      }
      // Fenêtre H + 1 heure (entre 60 et 65 minutes)
      else if (settings.remind_after_60m && diffMinutes >= 60 && diffMinutes < 65) {
        reminderType = 'delay_60m';
        title = `⚠️ PillFlow - Alerte (+1h de retard)`;
        body = `Attention : votre pilule n'a toujours pas été confirmée. Pensez-y sans tarder !`;
      }

      if (!reminderType) {
        results.push({
          userId: settings.user_id,
          status: 'no_reminder_window',
          diffMinutes,
        });
        continue;
      }

      // Vérifier si ce rappel a déjà été envoyé aujourd'hui
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

      // Récupérer les abonnements Web Push de l'utilisateur
      const { data: subscriptions } = await db
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', settings.user_id);

      if (subscriptions && subscriptions.length > 0) {
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
                actions: [
                  { action: 'take_pill', title: "💊 J'ai pris ma pilule" },
                  { action: 'open_app', title: "Ouvrir l'application" },
                ],
              }
            );
          } catch (pushErr) {
            console.error('Erreur envoi push à un endpoint:', pushErr);
          }
        }

        // Marquer le rappel comme envoyé
        await db.from('sent_reminders').insert({
          user_id: settings.user_id,
          date: todayStr,
          reminder_type: reminderType,
        });

        results.push({
          userId: settings.user_id,
          status: 'sent',
          reminderType,
        });
      } else {
        results.push({
          userId: settings.user_id,
          status: 'no_push_subscription',
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (error: any) {
    console.error('Erreur globale cron:', error);
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}
