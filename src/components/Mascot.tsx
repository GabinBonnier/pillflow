'use client';

import React from 'react';

export type MascotMood =
  | 'waving'
  | 'happy'
  | 'thinking'
  | 'excited'
  | 'proud'
  | 'cautious';

interface MascotProps {
  mood?: MascotMood;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  bubbleText?: string;
  className?: string;
}

export const Mascot: React.FC<MascotProps> = ({
  mood = 'waving',
  size = 'md',
  bubbleText,
  className = '',
}) => {
  const sizeMap = {
    sm: { w: 64, h: 64, text: 'text-xs' },
    md: { w: 96, h: 96, text: 'text-sm' },
    lg: { w: 140, h: 140, text: 'text-base' },
    xl: { w: 180, h: 180, text: 'text-lg' },
  };

  const { w, h } = sizeMap[size];

  return (
    <div className={`relative flex flex-col items-center select-none ${className}`}>
      {/* Bulle de dialogue interactive (style Duo) */}
      {bubbleText && (
        <div className="relative mb-3 max-w-xs sm:max-w-md bg-white border-2 border-rose-200 text-slate-800 px-4 py-2.5 rounded-2xl shadow-lg shadow-rose-100/60 font-medium text-xs sm:text-sm animate-in fade-in zoom-in-95 duration-200">
          <p className="leading-snug">{bubbleText}</p>
          {/* Petite flèche pointant vers Pilly */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-r-2 border-b-2 border-rose-200 rotate-45 transform" />
        </div>
      )}

      {/* SVG Animé de Pilly */}
      <div className="relative cursor-pointer transition-transform hover:scale-105 active:scale-95 duration-200">
        <svg
          width={w}
          height={h}
          viewBox="0 0 160 160"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-md"
        >
          <defs>
            {/* Dégradé partie haute blanche de la gélule */}
            <linearGradient id="pillyTop" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#ffffff" />
              <stop offset="100%" stop-color="#f8fafc" />
            </linearGradient>

            {/* Dégradé partie basse rose vif */}
            <linearGradient id="pillyBottom" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#fb7185" />
              <stop offset="100%" stop-color="#f43f5e" />
            </linearGradient>

            {/* Ombre portée douce */}
            <filter id="pillyGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#f43f5e" flood-opacity="0.25" />
            </filter>
          </defs>

          {/* Ombre sous les pieds */}
          <ellipse cx="80" cy="148" rx="38" ry="8" fill="#e2e8f0" opacity="0.6" />

          {/* Corps de Pilly (Gélule verticale arrondie) */}
          <g filter="url(#pillyGlow)">
            {/* Moitié haute (Tête / Casquette blanche) */}
            <path
              d="M 44 80 L 44 48 C 44 28 60 12 80 12 C 100 12 116 28 116 48 L 116 80 Z"
              fill="url(#pillyTop)"
              stroke="#e2e8f0"
              strokeWidth="3"
            />
            {/* Moitié basse (Corps rose) */}
            <path
              d="M 44 80 L 44 112 C 44 132 60 144 80 144 C 100 144 116 132 116 112 L 116 80 Z"
              fill="url(#pillyBottom)"
              stroke="#f43f5e"
              strokeWidth="3"
            />
            {/* Ceinture / Ligne de démarcation */}
            <line x1="44" y1="80" x2="116" y2="80" stroke="#fecdd3" strokeWidth="4" />
          </g>

          {/* Joues roses mignonnes (Blush) */}
          <ellipse cx="56" cy="74" rx="7" ry="4" fill="#fda4af" opacity="0.8" />
          <ellipse cx="104" cy="74" rx="7" ry="4" fill="#fda4af" opacity="0.8" />

          {/* Yeux selon l'humeur */}
          {mood === 'happy' || mood === 'excited' ? (
            // Yeux plissés de joie (^ ^)
            <g stroke="#1e293b" strokeWidth="4" strokeLinecap="round" fill="none">
              <path d="M 54 58 Q 62 50 70 58" />
              <path d="M 90 58 Q 98 50 106 58" />
            </g>
          ) : mood === 'thinking' ? (
            // Un œil grand ouvert, un sourcil froncé
            <g>
              <ellipse cx="62" cy="56" rx="6" ry="8" fill="#1e293b" />
              <circle cx="60" cy="54" r="2.5" fill="#ffffff" />
              <ellipse cx="98" cy="56" rx="5" ry="6" fill="#1e293b" />
              <circle cx="96" cy="54" r="2" fill="#ffffff" />
              <path d="M 56 46 Q 64 42 72 45" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" fill="none" />
              <path d="M 92 48 Q 100 45 106 49" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" fill="none" />
            </g>
          ) : (
            // Grands yeux brillants expressifs normaux
            <g>
              <ellipse cx="62" cy="56" rx="6" ry="8" fill="#1e293b" />
              <circle cx="60" cy="53" r="2.5" fill="#ffffff" />
              <circle cx="64" cy="59" r="1.2" fill="#ffffff" />

              <ellipse cx="98" cy="56" rx="6" ry="8" fill="#1e293b" />
              <circle cx="96" cy="53" r="2.5" fill="#ffffff" />
              <circle cx="100" cy="59" r="1.2" fill="#ffffff" />
            </g>
          )}

          {/* Bouche */}
          {mood === 'excited' ? (
            // Grande bouche ouverte en D
            <path d="M 72 68 Q 80 84 88 68 Z" fill="#e11d48" stroke="#1e293b" strokeWidth="2.5" />
          ) : mood === 'thinking' ? (
            // Petite bouche en O de côté
            <circle cx="82" cy="72" r="3.5" fill="#1e293b" />
          ) : (
            // Joli sourire
            <path
              d="M 73 68 Q 80 77 87 68"
              stroke="#1e293b"
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
            />
          )}

          {/* Bras & Mains */}
          {mood === 'waving' ? (
            // Bras droit qui fait coucou
            <g>
              {/* Bras gauche posé */}
              <path d="M 44 88 Q 30 94 36 104" stroke="#f43f5e" strokeWidth="6" strokeLinecap="round" fill="none" />
              {/* Bras droit levé qui salue */}
              <path d="M 116 82 Q 134 68 132 50" stroke="#f43f5e" strokeWidth="6" strokeLinecap="round" fill="none" />
              <circle cx="132" cy="48" r="6" fill="#f43f5e" />
              {/* Petits traits de mouvement */}
              <path d="M 138 42 Q 142 46 142 52" stroke="#fb7185" strokeWidth="2" strokeLinecap="round" fill="none" />
            </g>
          ) : mood === 'excited' || mood === 'proud' ? (
            // Deux bras en l'air de victoire
            <g stroke="#f43f5e" strokeWidth="6" strokeLinecap="round" fill="none">
              <path d="M 44 86 Q 26 72 28 54" />
              <path d="M 116 86 Q 134 72 132 54" />
              <circle cx="28" cy="52" r="6" fill="#f43f5e" stroke="none" />
              <circle cx="132" cy="52" r="6" fill="#f43f5e" stroke="none" />
            </g>
          ) : (
            // Petits bras mignons sur le ventre
            <g stroke="#f43f5e" strokeWidth="6" strokeLinecap="round" fill="none">
              <path d="M 44 88 Q 32 96 40 106" />
              <path d="M 116 88 Q 128 96 120 106" />
            </g>
          )}

          {/* Accessoire / Étoile magique quand excité */}
          {(mood === 'excited' || mood === 'proud') && (
            <g transform="translate(118, 18) scale(0.9)">
              <polygon points="12,0 15,9 24,12 15,15 12,24 9,15 0,12 9,9" fill="#fbbf24" />
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};
