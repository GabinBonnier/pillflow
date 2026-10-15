'use client';

import React, { useState, useEffect } from 'react';
import { SymptomLog, MoodType, BleedingType } from '@/types';
import { X, Heart, Droplets, Smile, Check, FileText } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

interface SymptomModalProps {
  isOpen: boolean;
  onClose: () => void;
  dateStr: string;
  initialData?: SymptomLog;
  onSave: (dateStr: string, data: Partial<SymptomLog>) => void;
}

const MOODS: { id: MoodType; label: string; emoji: string }[] = [
  { id: 'great', label: 'Super', emoji: '🤩' },
  { id: 'good', label: 'Bien', emoji: '😊' },
  { id: 'neutral', label: 'Neutre', emoji: '😐' },
  { id: 'sad', label: 'Triste', emoji: '😔' },
  { id: 'anxious', label: 'Stressée', emoji: '😰' },
  { id: 'irritable', label: 'Irritée', emoji: '😠' },
];

const BLEEDINGS: { id: BleedingType; label: string; color: string }[] = [
  { id: 'none', label: 'Aucun', color: 'border-slate-200 text-slate-600' },
  { id: 'spotting', label: 'Spotting', color: 'border-pink-200 text-pink-700 bg-pink-50/50' },
  { id: 'light', label: 'Règles légères', color: 'border-rose-300 text-rose-700 bg-rose-50' },
  { id: 'medium', label: 'Règles moyennes', color: 'border-rose-400 text-rose-800 bg-rose-100/50' },
  { id: 'heavy', label: 'Règles abondantes', color: 'border-rose-600 text-rose-900 bg-rose-100' },
];

const SYMPTOM_OPTIONS = [
  { id: 'headache', label: 'Maux de tête / Migraine' },
  { id: 'cramps', label: 'Crampes pelviennes' },
  { id: 'nausea', label: 'Nausées' },
  { id: 'bloating', label: 'Ballonnements' },
  { id: 'breast_tenderness', label: 'Tension des seins' },
  { id: 'fatigue', label: 'Fatigue intense' },
  { id: 'acne', label: 'Poussée d’acné' },
  { id: 'mood_swings', label: 'Sautes d’humeur' },
];

export const SymptomModal: React.FC<SymptomModalProps> = ({
  isOpen,
  onClose,
  dateStr,
  initialData,
  onSave,
}) => {
  const [mood, setMood] = useState<MoodType | undefined>(initialData?.mood);
  const [bleeding, setBleeding] = useState<BleedingType | undefined>(initialData?.bleeding || 'none');
  const [symptoms, setSymptoms] = useState<string[]>(initialData?.symptoms || []);
  const [notes, setNotes] = useState<string>(initialData?.notes || '');

  useEffect(() => {
    if (initialData) {
      setMood(initialData.mood);
      setBleeding(initialData.bleeding || 'none');
      setSymptoms(initialData.symptoms || []);
      setNotes(initialData.notes || '');
    } else {
      setMood(undefined);
      setBleeding('none');
      setSymptoms([]);
      setNotes('');
    }
  }, [initialData, dateStr]);

  if (!isOpen) return null;

  let displayDate = dateStr;
  try {
    displayDate = format(parseISO(dateStr), 'EEEE d MMMM yyyy', { locale: fr });
  } catch {}

  const toggleSymptom = (id: string) => {
    setSymptoms((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleSave = () => {
    onSave(dateStr, {
      mood,
      bleeding,
      symptoms,
      notes,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col">
        {/* En-tête */}
        <div className="bg-gradient-to-r from-pink-500 to-rose-500 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Heart className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-lg">Journal des symptômes</h2>
              <p className="text-xs text-rose-100 capitalize">{displayDate}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulaire */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Humeur */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
              Humeur & Moral
            </label>
            <div className="grid grid-cols-6 gap-1.5">
              {MOODS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMood(m.id)}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border transition cursor-pointer ${
                    mood === m.id
                      ? 'border-rose-500 bg-rose-50 shadow-xs ring-1 ring-rose-300'
                      : 'border-slate-100 hover:border-slate-200 bg-slate-50/50'
                  }`}
                >
                  <span className="text-2xl mb-1">{m.emoji}</span>
                  <span className="text-[10px] font-medium text-slate-600 truncate w-full text-center">
                    {m.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Saignements / Pertes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5 text-rose-500" />
              Saignements / Règles
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {BLEEDINGS.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setBleeding(b.id)}
                  className={`p-2.5 rounded-xl border text-left text-xs font-medium transition cursor-pointer ${b.color} ${
                    bleeding === b.id ? 'ring-2 ring-rose-400 font-bold' : ''
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          {/* Symptômes physiques */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
              Effets indésirables & Symptômes physiques
            </label>
            <div className="grid grid-cols-2 gap-2">
              {SYMPTOM_OPTIONS.map((item) => {
                const checked = symptoms.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleSymptom(item.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs text-left transition cursor-pointer ${
                      checked
                        ? 'border-rose-400 bg-rose-50 text-rose-900 font-semibold'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-md flex items-center justify-center border shrink-0 ${
                        checked
                          ? 'bg-rose-500 border-rose-500 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {checked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes libres */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Notes personnelles
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Pris au réveil avec de l’eau, fatigue passagère..."
              rows={3}
              className="w-full p-3 rounded-xl border-2 border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
            />
          </div>
        </div>

        {/* Pied de page */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs text-slate-600 hover:text-slate-800 transition cursor-pointer"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-semibold text-xs shadow-md transition cursor-pointer"
          >
            Enregistrer mes observations
          </button>
        </div>
      </div>
    </div>
  );
};
