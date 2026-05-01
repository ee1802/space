'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { courses as coursesAPI, calendar as calendarAPI } from '@/lib/api';

interface CourseItem {
  id: number;
  title: string;
  description: string;
  progress: number | null;
}

interface EventItem {
  id: number;
  title: string;
  start_date: string;
  event_type_name: string;
  event_type_color: string;
  external_url: string;
}

export default function DashboardPage() {
  const { user, token } = useAuth();
  const [myCourses, setMyCourses] = useState<CourseItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);

  useEffect(() => {
    if (!token) return;
    coursesAPI.myCourses(token).then((data: any) => {
      setMyCourses(data.results || data || []);
    }).catch(() => {});

    const today = new Date().toISOString().split('T')[0];
    calendarAPI.events(token, { start_date: today }).then((data: any) => {
      const items = data.results || data || [];
      setEvents(items.slice(0, 3));
    }).catch(() => {});
  }, [token]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-[#F0EDE8]">
        Привет{user?.full_name ? `, ${user.full_name}` : ''}!
      </h1>

      {/* My Courses */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4 text-[#F0EDE8]">Мои курсы</h2>
        {myCourses.length === 0 ? (
          <p className="text-[#6A6860]">У вас пока нет доступных курсов. Обратитесь к администратору для получения доступа.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {myCourses.map((c) => (
              <div key={c.id} className="bg-[#0D1525] border border-[#1E2D4A] rounded-xl p-5 hover:border-[#253558] transition-colors">
                <h3 className="font-semibold mb-2 text-[#F0EDE8]">{c.title}</h3>
                <p className="text-sm text-[#A8A5A0] mb-3 line-clamp-2">{c.description}</p>
                {c.progress !== null && (
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-[#6A6860] mb-1">
                      <span>Прогресс</span>
                      <span className="text-[#D9A441] font-medium">{c.progress}%</span>
                    </div>
                    <div className="w-full bg-[#1E2D4A] rounded-full h-2">
                      <div className="bg-[#D9A441] h-2 rounded-full transition-all" style={{ width: `${c.progress}%` }} />
                    </div>
                  </div>
                )}
                <Link href={`/app/courses/${c.id}`}
                  className="inline-block px-4 py-2 bg-[#D9A441] text-[#0A0E1A] text-sm font-medium rounded-lg hover:bg-[#F4B860] transition-colors">
                  Открыть
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Upcoming events */}
      <section>
        <h2 className="text-lg font-semibold mb-4 text-[#F0EDE8]">Ближайшие олимпиады</h2>
        {events.length === 0 ? (
          <p className="text-[#6A6860]">Нет предстоящих событий.</p>
        ) : (
          <div className="space-y-3">
            {events.map((e) => (
              <div key={e.id} className="bg-[#0D1525] border border-[#1E2D4A] rounded-xl p-4 flex items-center justify-between hover:border-[#253558] transition-colors">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: e.event_type_color }} />
                    <span className="text-xs text-[#6A6860]">{e.event_type_name}</span>
                  </div>
                  <h3 className="font-medium text-[#F0EDE8]">{e.title}</h3>
                  <p className="text-sm text-[#A8A5A0]">{new Date(e.start_date).toLocaleDateString('ru-RU')}</p>
                </div>
                {e.external_url && (
                  <a href={e.external_url} target="_blank" rel="noopener noreferrer"
                    className="text-sm text-[#4ECDD4] hover:text-[#6EE8EE] transition-colors">
                    Подробнее
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
        <Link href="/app/calendar" className="inline-block mt-4 text-sm text-[#4ECDD4] hover:text-[#6EE8EE] transition-colors">
          Все события →
        </Link>
      </section>
    </div>
  );
}
