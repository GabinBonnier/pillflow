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
        const { error } = await db.from('push_subscriptions').upsert(
          {
            user_id: userId || 'demo-user-id',
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
