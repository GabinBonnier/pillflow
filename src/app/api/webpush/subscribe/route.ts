import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured, getServiceSupabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { subscription, userId } = body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json(
        { error: 'Subscription data is missing or invalid' },
        { status: 400 }
      );
    }

    // Si Supabase est configuré, on persiste la souscription
    if (isSupabaseConfigured()) {
      const db = getServiceSupabase() || supabase;
      if (db) {
        let finalUserId = userId;
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId || '');
        if (!isUuid) {
          const { data: firstProfile } = await db.from('profiles').select('id').limit(1).maybeSingle();
          if (firstProfile) {
            finalUserId = firstProfile.id;
          }
        }

        if (finalUserId) {
          const { error } = await db.from('push_subscriptions').upsert(
            {
              user_id: finalUserId,
              endpoint: subscription.endpoint,
              p256dh: subscription.keys.p256dh,
              auth: subscription.keys.auth,
              user_agent: req.headers.get('user-agent') || 'unknown',
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'endpoint' }
          );

          if (error) {
            console.error('Erreur Supabase enregistrement subscription:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Souscription Web Push enregistrée avec succès',
    });
  } catch (error: any) {
    console.error('Erreur dans /api/webpush/subscribe:', error);
    return NextResponse.json(
      { error: error?.message || 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
