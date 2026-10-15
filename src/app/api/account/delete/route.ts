import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Identifiant utilisateur requis' }, { status: 400 });
    }

    const adminDb = getServiceSupabase();
    if (!adminDb) {
      return NextResponse.json(
        { error: 'Clé administrative Supabase manquante' },
        { status: 500 }
      );
    }

    // 1. Supprimer les données dans les tables publiques
    await adminDb.from('sent_reminders').delete().eq('user_id', userId);
    await adminDb.from('push_subscriptions').delete().eq('user_id', userId);
    await adminDb.from('symptom_logs').delete().eq('user_id', userId);
    await adminDb.from('pill_logs').delete().eq('user_id', userId);
    await adminDb.from('pill_settings').delete().eq('user_id', userId);
    await adminDb.from('profiles').delete().eq('id', userId);

    // 2. Supprimer le compte utilisateur dans auth.users
    const { error: authError } = await adminDb.auth.admin.deleteUser(userId);
    if (authError) {
      console.error('Erreur suppression auth.user:', authError);
    }

    return NextResponse.json({
      success: true,
      message: 'Compte et données supprimés avec succès',
    });
  } catch (error: any) {
    console.error('Erreur API delete account:', error);
    return NextResponse.json(
      { error: error?.message || 'Erreur interne' },
      { status: 500 }
    );
  }
}
