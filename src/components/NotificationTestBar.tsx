'use client';

import React, { useState } from 'react';
import { Bell, Play, CheckCircle2, AlertTriangle, Clock, Sparkles } from 'lucide-react';

interface NotificationTestBarProps {
  pushSupported: boolean;
  pushPermission: NotificationPermission;
  onEnablePush: () => Promise<{ success: boolean; message: string }>;
  onTriggerTest: (type: 'initial' | 'delay_30m' | 'delay_60m') => Promise<{ success: boolean; message: string }>;
}

export const NotificationTestBar: React.FC<NotificationTestBarProps> = ({
  pushSupported,
  pushPermission,
  onEnablePush,
  onTriggerTest,
}) => {
  const [loadingType, setLoadingType] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ text: string; success: boolean } | null>(null);

  const handleTest = async (type: 'initial' | 'delay_30m' | 'delay_60m') => {
    setLoadingType(type);
    setStatusMsg(null);

    if (pushPermission !== 'granted') {
      const res = await onEnablePush();
      if (!res.success) {
        setStatusMsg({ text: res.message, success: false });
        setLoadingType(null);
        return;
      }
    }

    const res = await onTriggerTest(type);
    setStatusMsg({
      text: res.message || 'Notification envoyée !',
      success: res.success,
    });
    setLoadingType(null);

    setTimeout(() => {
      setStatusMsg(null);
    }, 5000);
  };

  return (
    <div className="rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4 shadow-lg border border-slate-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Info */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <Bell className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-white">Simulateur de notifications</h4>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 font-mono">
                {pushPermission === 'granted' ? '✅ Push Actif' : '⚠️ Permission requise'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Testez instantanément les 3 niveaux de rappel demandés (+30min et +1h)
            </p>
          </div>
        </div>

        {/* Boutons de test instantané */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleTest('initial')}
            disabled={loadingType !== null}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-xs font-semibold text-white transition cursor-pointer disabled:opacity-50"
            title="Notification à l'heure normale"
          >
            <Clock className="w-3.5 h-3.5 text-rose-400" />
            <span>Heure H</span>
          </button>

          <button
            onClick={() => handleTest('delay_30m')}
            disabled={loadingType !== null}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-200 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
            title="Rappel 30 minutes après"
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Rappel +30 min</span>
          </button>

          <button
            onClick={() => handleTest('delay_60m')}
            disabled={loadingType !== null}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-200 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
            title="Alerte 1 heure après"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>Alerte +1 heure</span>
          </button>
        </div>
      </div>

      {/* Message de confirmation ou d'instruction */}
      {statusMsg && (
        <div
          className={`mt-3 p-2.5 rounded-xl text-xs flex items-center gap-2 ${
            statusMsg.success
              ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/20 border border-red-500/30 text-red-300'
          }`}
        >
          {statusMsg.success ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}
    </div>
  );
};
