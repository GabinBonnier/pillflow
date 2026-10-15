import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured, getServiceSupabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();

    if (isSupabaseConfigured()) {
      const db = getServiceSupabase() || supabase;
      if (db) {
        // Enregistrer la prise pour aujourd'hui
        const { error } = await db.from('pill_logs').upsert(
          {
            user_id: 'demo-user-id', // Remplacé par l'ID réel avec auth
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
