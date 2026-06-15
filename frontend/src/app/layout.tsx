import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth';

export const metadata: Metadata = {
  metadataBase: new URL('https://apex.vvozik.ru'),
  title: {
    default: 'Апекс — школа астрономии и подготовки к олимпиадам',
    template: '%s · Апекс',
  },
  description:
    'Апекс — онлайн-школа астрономии: подготовка к ВсОШ и международным олимпиадам (IAO, IOAA). Уроки, банк задач, пробники на время, ИИ-рекомендации и личный прогресс.',
  applicationName: 'Апекс',
  keywords: ['астрономия', 'олимпиады', 'ВсОШ', 'подготовка', 'IOAA', 'IAO', 'Апекс'],
  openGraph: {
    title: 'Апекс — школа астрономии и подготовки к олимпиадам',
    description:
      'Онлайн-школа астрономии: уроки, банк задач по этапам, пробники на время, ИИ-рекомендации и личный прогресс. Авторская программа Евгения Бойцова.',
    url: 'https://apex.vvozik.ru',
    siteName: 'Апекс',
    locale: 'ru_RU',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Апекс — школа астрономии',
    description: 'Подготовка к олимпиадам по астрономии: уроки, банк задач, пробники, ИИ-рекомендации.',
  },
};

export const viewport: Viewport = {
  themeColor: '#0A0E1A',
  colorScheme: 'dark',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Unbounded:wght@500;600;700;800&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-screen bg-[#070C18] text-[#F0EDE8]">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
