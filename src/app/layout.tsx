import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PillFlow - Suivi de Pilule & Rappels Intelligents',
  description:
    'Application PWA complète de suivi de contraception orale avec rappels personnalisés à l’heure, à +30min et +1h en cas d’oubli.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'PillFlow',
  },
  icons: {
    icon: '/icons/icon-192.svg',
    apple: '/icons/icon-192.svg',
  },
};

export const viewport: Viewport = {
  themeColor: '#f43f5e',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  function updateTheme() {
                    var theme = localStorage.getItem('pillflow_theme');
                    var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    if (theme === 'dark' || (!theme && systemDark)) {
                      document.documentElement.classList.add('dark');
                    } else {
                      document.documentElement.classList.remove('dark');
                    }
                  }
                  updateTheme();
                  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function() {
                    if (!localStorage.getItem('pillflow_theme')) {
                      updateTheme();
                    }
                  });
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-rose-100 selection:text-rose-700 transition-colors duration-150">
        {children}
      </body>
    </html>
  );
}
