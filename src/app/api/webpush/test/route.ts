import { NextRequest, NextResponse } from 'next/server';
import { sendWebPush } from '@/lib/webpush';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { subscription, type } = body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json(
        { error: 'Données de souscription manquantes ou invalides' },
        { status: 400 }
      );
    }

    let title = "💊 PillFlow - C'est l'heure de votre pilule !";
    let message = "N'oubliez pas de prendre votre comprimé quotidien.";
    let tag = 'pill-initial';

    if (type === 'delay_30m') {
      title = "⏰ PillFlow - Rappel (+30 min)";
      message = "Avez-vous pris votre pilule ? Il est recommandé de la prendre maintenant.";
      tag = 'pill-delay-30';
    } else if (type === 'delay_60m') {
      title = "⚠️ PillFlow - Alerte (+1 heure de retard)";
      message = "Votre pilule n'est toujours pas validée ! Pensez à la prendre pour rester protégée.";
      tag = 'pill-delay-60';
    }

    await sendWebPush(subscription, {
      title,
      body: message,
      icon: '/icons/icon-192.svg',
      badge: '/icons/icon-192.svg',
      tag,
      data: {
        url: '/',
        type,
        timestamp: new Date().toISOString(),
      },
      actions: [
        {
          action: 'take_pill',
          title: "💊 J'ai pris ma pilule",
        },
        {
          action: 'open_app',
          title: "Ouvrir l'application",
        },
      ],
    });

    return NextResponse.json({
      success: true,
      message: `Notification de type "${type || 'standard'}" envoyée avec succès !`,
    });
  } catch (error: any) {
    console.error('Erreur envoi notification test:', error);
    return NextResponse.json(
      { error: error?.message || "Erreur lors de l'envoi de la notification" },
      { status: 500 }
    );
  }
}
