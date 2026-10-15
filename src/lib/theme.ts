'use client';

export type ThemeMode = 'system' | 'light' | 'dark';

export function getStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'system';
  try {
    const saved = localStorage.getItem('pillflow_theme') as ThemeMode | null;
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {}
  return 'system';
}

export function applyTheme(mode: ThemeMode) {
  if (typeof window === 'undefined') return;
  try {
    if (mode === 'system') {
      localStorage.removeItem('pillflow_theme');
      const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', isSystemDark);
    } else {
      localStorage.setItem('pillflow_theme', mode);
      document.documentElement.classList.toggle('dark', mode === 'dark');
    }
  } catch {}
}

export function isCurrentlyDark(): boolean {
  if (typeof window === 'undefined') return false;
  return document.documentElement.classList.contains('dark');
}
