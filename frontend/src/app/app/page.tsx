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
      <h1 className="text-2xl font-bold mb-6">
        Привет{user?.full_name ? `, ${user.full_name}` : ''}!
      </h1>

      {/* My Courses */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Мои курсы</h2>
        {myCourses.length === 0 ? (
          <p className="text-gray-500">У вас пока нет доступных курсов. Обратитесь к администратору для получения доступа.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {myCourses.map((c) => (
              <div key={c.id} className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">{c.title}</h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{c.description}</p>
                {c.progress !== null && (
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Прогресс</span>
                      <span>{c.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${c.progress}%` }} />
                    </div>
                  </div>
                )}
                <Link href={`/app/courses/${c.id}`}
                  className="inline-block px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                  Открыть
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Upcoming events */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Ближайшие олимпиады</h2>
        {events.length === 0 ? (
          <p className="text-gray-500">Нет предстоящих событий.</p>
        ) : (
          <div className="space-y-3">
            {events.map((e) => (
              <div key={e.id} className="border rounded-lg p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: e.event_type_color }} />
                    <span className="text-xs text-gray-500">{e.event_type_name}</span>
                  </div>
                  <h3 className="font-medium">{e.title}</h3>
                  <p className="text-sm text-gray-500">{new Date(e.start_date).toLocaleDateString('ru-RU')}</p>
                </div>
                {e.external_url && (
                  <a href={e.external_url} target="_blank" rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline">
                    Подробнее
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
        <Link href="/app/calendar" className="inline-block mt-4 text-sm text-blue-600 hover:underline">
          Все события →
        </Link>
      </section>
    </div>
  );
}
