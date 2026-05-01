'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { courses as coursesAPI } from '@/lib/api';

interface CourseItem {
  id: number;
  title: string;
  slug: string;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, token, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [myCourses, setMyCourses] = useState<CourseItem[]>([]);
  const [coursesOpen, setCoursesOpen] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (token) {
      coursesAPI.myCourses(token).then((data: any) => {
        setMyCourses(data.results || data || []);
      }).catch(() => {});
    }
  }, [token]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#070C18]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D9A441]"></div>
    </div>
  );
  if (!user) return null;

  const navItems = [
    { href: '/app', label: 'Главная', icon: 'home' },
    { href: '/app/calendar', label: 'Олимпиады', icon: 'calendar' },
    { href: '/app/trainer', label: 'Тренажёр', icon: 'telescope' },
  ];

  const isActive = (href: string) => pathname === href;
  const isCourseActive = pathname.startsWith('/app/courses');

  // SVG icon paths matching the design archive
  const iconPaths: Record<string, string> = {
    home: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
    calendar: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
    telescope: 'M3 18l4-8 4 4M11 14l3-6 3 3M14 11l4-8M19 3l2 1M12 22v-4M9 22h6',
    star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
    user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
    logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
    chevronDown: 'M6 9l6 6 6-6',
    chevronRight: 'M9 18l6-6-6-6',
    menu: 'M3 12h18M3 6h18M3 18h18',
    externalLink: 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3',
  };

  const SvgIcon = ({ name, size = 18, className = '' }: { name: string; size?: number; className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
      className={className}>
      <path d={iconPaths[name] || iconPaths.home} />
    </svg>
  );

  return (
    <div className="min-h-screen flex bg-[#070C18]">
      {/* Mobile hamburger */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-[#0D1525] border border-[#1E2D4A] rounded-lg shadow-lg text-[#A8A5A0]"
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

        {/* Navigation */}
        <nav className="p-2 flex-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm mb-0.5 transition-all ${
                isActive(item.href)
                  ? 'bg-[#152035] text-[#4ECDD4] font-medium border-l-[3px] border-[#4ECDD4]'
                  : 'text-[#A8A5A0] hover:bg-[#152035] hover:text-[#F0EDE8] border-l-[3px] border-transparent'
              }`}
            >
              <SvgIcon name={item.icon} size={18} />
              {item.label}
            </Link>
          ))}

          {/* Courses section - expandable */}
          <div className="mt-4">
            <button
              onClick={() => setCoursesOpen(!coursesOpen)}
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
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm mb-0.5 transition-all ${
                        pathname.startsWith(`/app/courses/${c.id}`)
                          ? 'bg-[#152035] text-[#4ECDD4] font-medium border-l-[3px] border-[#4ECDD4]'
                          : 'text-[#A8A5A0] hover:bg-[#152035] hover:text-[#F0EDE8] border-l-[3px] border-transparent'
                      }`}
                    >
                      <SvgIcon name="star" size={16} />
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
            onClick={() => setSidebarOpen(false)}
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
    </div>
  );
}
