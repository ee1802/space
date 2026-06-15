'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { courses as coursesAPI, unwrap, Course } from '@/lib/api';
import { ToastHost } from '@/components/ui';

interface CourseItem {
  id: number;
  title: string;
  slug?: string;
}

// SVG icon paths (24x24 stroke icons)
const iconPaths: Record<string, string> = {
  home: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  bank: 'M4 7h16M4 12h16M4 17h16M7 4v16',
  mock: 'M12 2l2.4 7.4H22l-6 4.5 2.3 7.1L12 16.6 5.7 21l2.3-7.1-6-4.5h7.6z',
  mistakes: 'M12 9v4M12 17h.01M10.3 3.8 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0z',
  stats: 'M3 3v18h18M7 16l4-5 3 3 5-7',
  materials: 'M4 4h10l6 6v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zM14 4v6h6',
  schedule: 'M9 11l3 3 8-8M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11',
  calendar: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
  favorites: 'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7z',
  questions: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
  trainer: 'M3 18l4-8 4 4M11 14l3-6 3 3M14 11l4-8M19 3l2 1M12 22v-4M9 22h6',
  courses: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z',
  star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  chevronDown: 'M6 9l6 6 6-6',
  chevronRight: 'M9 18l6-6-6-6',
  menu: 'M3 12h18M3 6h18M3 18h18',
  externalLink: 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35',
};

function SvgIcon({ name, size = 18, className = '' }: { name: string; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden="true">
      <path d={iconPaths[name] || iconPaths.home} />
    </svg>
  );
}

// Grouped navigation surfacing every feature.
const NAV_GROUPS: Array<{ label?: string; items: Array<{ href: string; label: string; icon: string }> }> = [
  {
    items: [{ href: '/app', label: 'Главная', icon: 'home' }],
  },
  {
    label: 'Учёба',
    items: [
      { href: '/app/bank', label: 'Банк задач', icon: 'bank' },
      { href: '/app/mock', label: 'Пробные олимпиады', icon: 'mock' },
      { href: '/app/trainer', label: 'Тренажёр', icon: 'trainer' },
      { href: '/app/mistakes', label: 'Мои ошибки', icon: 'mistakes' },
    ],
  },
  {
    label: 'Прогресс',
    items: [
      { href: '/app/stats', label: 'Статистика', icon: 'stats' },
      { href: '/app/schedule', label: 'Расписание', icon: 'schedule' },
      { href: '/app/calendar', label: 'Календарь олимпиад', icon: 'calendar' },
    ],
  },
  {
    label: 'Библиотека',
    items: [
      { href: '/app/materials', label: 'Материалы', icon: 'materials' },
      { href: '/app/favorites', label: 'Избранное', icon: 'favorites' },
      { href: '/app/questions', label: 'Вопросы', icon: 'questions' },
    ],
  },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, token, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [myCourses, setMyCourses] = useState<CourseItem[]>([]);
  const [coursesOpen, setCoursesOpen] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (token) {
      coursesAPI.myCourses(token)
        .then((data) => setMyCourses(unwrap<Course>(data)))
        .catch(() => {});
    }
  }, [token]);

  // Close mobile drawer on route change.
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#070C18]">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#1E2D4A] border-t-[#D9A441]" />
    </div>
  );
  if (!user) return null;

  const isActive = (href: string) =>
    href === '/app' ? pathname === '/app' : pathname === href || pathname.startsWith(href + '/');

  const navLinkClass = (active: boolean) =>
    `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm mb-0.5 transition-all border-l-[3px] ${
      active
        ? 'bg-[#152035] text-[#4ECDD4] font-medium border-[#4ECDD4]'
        : 'text-[#A8A5A0] hover:bg-[#152035] hover:text-[#F0EDE8] border-transparent'
    }`;

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = search.trim();
    if (!q) return;
    router.push(`/app/bank?q=${encodeURIComponent(q)}`);
  };

  return (
    <div className="min-h-screen flex bg-[#070C18]">
      {/* Mobile hamburger */}
      <button
        onClick={() => setSidebarOpen((v) => !v)}
        aria-label={sidebarOpen ? 'Закрыть меню' : 'Открыть меню'}
        className="md:hidden fixed top-3 left-3 z-50 p-2 bg-[#0D1525] border border-[#1E2D4A] rounded-lg shadow-lg text-[#A8A5A0]"
      >
        <SvgIcon name="menu" size={20} />
      </button>

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-40 w-60 bg-[#0D1525] border-r border-[#1E2D4A]
        transform transition-transform flex flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
      `}>
        {/* Logo */}
        <div className="p-4 border-b border-[#1E2D4A] flex items-center gap-2.5">
          <div className="w-7 h-7 flex-shrink-0">
            <svg width="28" height="28" viewBox="0 0 100 100" fill="none">
              <circle cx="36" cy="22" r="3.5" fill="#D9A441" opacity="0.95"/>
              <circle cx="72" cy="18" r="2.5" fill="#D9A441" opacity="0.95"/>
              <circle cx="40" cy="50" r="1.8" fill="#D9A441" opacity="0.95"/>
              <circle cx="52" cy="52" r="2.2" fill="#D9A441" opacity="0.95"/>
              <circle cx="64" cy="49" r="1.8" fill="#D9A441" opacity="0.95"/>
              <circle cx="38" cy="82" r="2" fill="#D9A441" opacity="0.95"/>
              <circle cx="74" cy="80" r="3.2" fill="#D9A441" opacity="0.95"/>
              <line x1="36" y1="22" x2="40" y2="50" stroke="#D9A441" strokeWidth="0.6" opacity="0.4"/>
              <line x1="72" y1="18" x2="64" y2="49" stroke="#D9A441" strokeWidth="0.6" opacity="0.4"/>
              <line x1="40" y1="50" x2="52" y2="52" stroke="#D9A441" strokeWidth="0.6" opacity="0.4"/>
              <line x1="52" y1="52" x2="64" y2="49" stroke="#D9A441" strokeWidth="0.6" opacity="0.4"/>
              <line x1="40" y1="50" x2="38" y2="82" stroke="#D9A441" strokeWidth="0.6" opacity="0.4"/>
              <line x1="64" y1="49" x2="74" y2="80" stroke="#D9A441" strokeWidth="0.6" opacity="0.4"/>
            </svg>
          </div>
          <span className="font-serif text-xl font-semibold text-[#F0EDE8] tracking-tight">apeks</span>
        </div>

        {/* Global search */}
        <div className="px-3 pt-3">
          <form onSubmit={submitSearch} className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6A6860] pointer-events-none">
              <SvgIcon name="search" size={15} />
            </span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск..."
              aria-label="Поиск по платформе"
              className="w-full pl-8 pr-3 py-2 rounded-lg bg-[#152035] border border-[#1E2D4A] text-sm text-[#F0EDE8] placeholder-[#6A6860] focus:outline-none focus:border-[#4ECDD4] focus:ring-1 focus:ring-[#4ECDD4] transition-colors"
            />
          </form>
        </div>

        {/* Navigation */}
        <nav className="p-2 flex-1 overflow-y-auto scrollbar-thin">
          {NAV_GROUPS.map((group, gi) => (
            <div key={gi} className={gi === 0 ? '' : 'mt-4'}>
              {group.label && (
                <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#6A6860]">
                  {group.label}
                </p>
              )}
              {group.items.map((item) => (
                <Link key={item.href} href={item.href} className={navLinkClass(isActive(item.href))}>
                  <SvgIcon name={item.icon} size={18} />
                  {item.label}
                </Link>
              ))}
            </div>
          ))}

          {/* Courses section - expandable */}
          <div className="mt-4">
            <button
              onClick={() => setCoursesOpen((v) => !v)}
              aria-expanded={coursesOpen}
              className="w-full flex items-center justify-between px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#6A6860] hover:text-[#A8A5A0]"
            >
              <span>Курсы</span>
              <SvgIcon name={coursesOpen ? 'chevronDown' : 'chevronRight'} size={14} />
            </button>
            {coursesOpen && (
              <div className="mt-1">
                {myCourses.length === 0 ? (
                  <p className="px-3 py-1 text-xs text-[#6A6860]">Нет доступных курсов</p>
                ) : (
                  myCourses.map((c) => (
                    <Link
                      key={c.id}
                      href={`/app/courses/${c.id}`}
                      className={navLinkClass(pathname.startsWith(`/app/courses/${c.id}`))}
                    >
                      <SvgIcon name="courses" size={16} />
                      <span className="truncate">{c.title}</span>
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>
        </nav>

        {/* Bottom section */}
        <div className="p-2 border-t border-[#1E2D4A]">
          <Link
            href="/app/profile"
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm mb-0.5 transition-all ${
              isActive('/app/profile')
                ? 'bg-[#152035] text-[#4ECDD4] font-medium'
                : 'text-[#A8A5A0] hover:bg-[#152035] hover:text-[#F0EDE8]'
            }`}
          >
            <div className="w-7 h-7 rounded-full bg-[rgba(217,164,65,0.12)] border border-[#D9A44144] flex items-center justify-center text-[10px] font-semibold text-[#D9A441] flex-shrink-0">
              {(user.full_name || user.email || '').slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-[13px] font-medium text-[#F0EDE8] truncate">{user.full_name || user.email}</div>
              <div className="text-[11px] text-[#6A6860]">Ученик</div>
            </div>
          </Link>

          {user.is_admin && (
            <a
              href="/admin/"
              target="_blank"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[#D9A441] hover:bg-[rgba(217,164,65,0.12)] transition-all"
            >
              <SvgIcon name="externalLink" size={16} />
              Админ-панель
            </a>
          )}

          <a
            href="https://t.me/obiqe"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[#4ECDD4] hover:bg-[rgba(78,205,212,0.12)] transition-all"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.04 9.608c-.152.68-.556.847-1.126.527l-3.109-2.291-1.5 1.443c-.166.166-.305.305-.626.305l.223-3.164 5.755-5.197c.25-.222-.054-.346-.388-.123L7.03 14.765l-3.032-.948c-.66-.206-.673-.66.137-.977l11.848-4.569c.55-.198 1.032.134.579 1.977z"/></svg>
            Поддержка
          </a>

          <button
            onClick={() => { logout(); router.push('/'); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[#FF7B6D] hover:bg-[rgba(255,123,109,0.12)] transition-all text-left"
          >
            <SvgIcon name="logout" size={16} />
            Выйти
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <main className="flex-1 p-4 md:p-8 min-w-0 bg-[#070C18] text-[#F0EDE8]">
        {children}
      </main>

      {/* Global toast host */}
      <ToastHost />
    </div>
  );
}
