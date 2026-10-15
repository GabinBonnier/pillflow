'use client';

import React, { useState } from 'react';
import { AlertTriangle, X, Trash2 } from 'lucide-react';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleDelete = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-red-100 overflow-hidden p-6 text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-600 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-16 h-16 mx-auto rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <h3 className="text-lg font-bold text-slate-900 mb-2">
          Supprimer définitivement votre compte ?
        </h3>

        <p className="text-xs text-slate-500 leading-relaxed mb-6">
          Cette action est <strong>irréversible</strong>. Votre compte, vos réglages de pilule, tout votre historique de prises et vos abonnements de notification seront définitivement effacés de la base de données.
        </p>

        <div className="space-y-2">
          <button
            onClick={handleDelete}
            disabled={loading}
            className="w-full py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-200 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>{loading ? 'Suppression en cours...' : 'Oui, supprimer mon compte'}</span>
          </button>

          <button
            onClick={onClose}
            disabled={loading}
            className="w-full py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
};
