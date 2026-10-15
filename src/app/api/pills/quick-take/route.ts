import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured, getServiceSupabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { userId } = body;
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();

    if (isSupabaseConfigured()) {
      const db = getServiceSupabase() || supabase;
      if (db) {
        let finalUserId = userId;
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId || '');
        if (!isUuid) {
          const { data: firstProfile } = await db
            .from('profiles')
            .select('id')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          if (firstProfile) {
            finalUserId = firstProfile.id;
          }
        }

        if (finalUserId) {
          // Enregistrer la prise pour aujourd'hui
          const { error } = await db.from('pill_logs').upsert(
            {
              user_id: finalUserId,
              date: today,
              status: 'taken',
              taken_at: now,
              notes: 'Validé via notification push directe',
            },
            { onConflict: 'user_id,date' }
          );

          if (error) {
            console.error('Erreur Supabase enregistrement quick-take:', error);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      date: today,
      taken_at: now,
      message: 'Prise enregistrée avec succès !',
    });
  } catch (error: any) {
    console.error('Erreur dans /api/pills/quick-take:', error);
    return NextResponse.json(
      { error: error?.message || 'Erreur interne' },
      { status: 500 }
    );
  }
}
