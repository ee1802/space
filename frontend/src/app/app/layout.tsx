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

  if (loading) return <div className="min-h-screen flex items-center justify-center">Загрузка...</div>;
  if (!user) return null;

  const navItems = [
    { href: '/app', label: 'Главная', icon: '🏠' },
    { href: '/app/calendar', label: 'Календарь олимпиад', icon: '📅' },
    { href: '/app/trainer', label: 'Тренажёр', icon: '🔭' },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <div className="min-h-screen flex">
      {/* Mobile hamburger */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white border rounded shadow"
      >
        ☰
      </button>

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-40 w-64 bg-white border-r transform transition-transform
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
      `}>
        <div className="p-4 border-b">
          <Link href="/" className="text-xl font-bold">Апекс</Link>
          <div className="text-sm text-gray-500 mt-1 truncate">{user.full_name || user.email}</div>
        </div>
        <nav className="p-2 flex-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`block px-3 py-2 rounded text-sm mb-1 ${
                isActive(item.href) ? 'bg-blue-50 text-blue-700 font-medium' : 'hover:bg-gray-50'
              }`}
            >
              {item.label}
            </Link>
          ))}

          {/* Courses section */}
          <div className="mt-2">
            <button
              onClick={() => setCoursesOpen(!coursesOpen)}
              className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium hover:bg-gray-50 rounded"
            >
              <span>Курсы</span>
              <span className="text-xs">{coursesOpen ? '▼' : '▶'}</span>
            </button>
            {coursesOpen && (
              <div className="ml-3">
                {myCourses.length === 0 ? (
                  <p className="px-3 py-1 text-xs text-gray-400">Нет доступных курсов</p>
                ) : (
                  myCourses.map((c) => (
                    <Link
                      key={c.id}
                      href={`/app/courses/${c.id}`}
                      onClick={() => setSidebarOpen(false)}
                      className={`block px-3 py-1.5 rounded text-sm ${
                        pathname === `/app/courses/${c.id}` ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
                      }`}
                    >
                      {c.title}
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>

          <Link
            href="/app/profile"
            onClick={() => setSidebarOpen(false)}
            className={`block px-3 py-2 rounded text-sm mt-2 ${
              isActive('/app/profile') ? 'bg-blue-50 text-blue-700 font-medium' : 'hover:bg-gray-50'
            }`}
          >
            Профиль
          </Link>

          {user.is_admin && (
            <a
              href="/admin/"
              target="_blank"
              className="block px-3 py-2 rounded text-sm mt-2 text-orange-600 hover:bg-orange-50"
            >
              Админ-панель
            </a>
          )}

          <button
            onClick={() => { logout(); router.push('/'); }}
            className="w-full text-left px-3 py-2 rounded text-sm mt-2 text-red-600 hover:bg-red-50"
          >
            Выйти
          </button>
        </nav>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <main className="flex-1 p-4 md:p-8 min-w-0">
        {children}
      </main>
    </div>
  );
}
