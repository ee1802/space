'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import {
  courses as coursesAPI,
  analytics as analyticsAPI,
  calendar as calendarAPI,
  unwrap,
  Course,
  Recommendation,
  RecommendationResponse,
  ScheduleItem,
  Stats,
} from '@/lib/api';
import {
  Card,
  CardHeader,
  Skeleton,
  EmptyState,
  ProgressRing,
  Badge,
} from '@/components/ui';

/* ------------------------------------------------------------------ *
 * Small helpers
 * ------------------------------------------------------------------ */

type ThemeColor =
  | 'gold'
  | 'cyan'
  | 'purple'
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
  | 'muted';

// Deterministic gradient per course so cards look distinct without a cover image.
const COVER_GRADIENTS = [
  'linear-gradient(135deg, #1b2c52 0%, #0D1525 70%)',
  'linear-gradient(135deg, #2a2150 0%, #0D1525 70%)',
  'linear-gradient(135deg, #143a3d 0%, #0D1525 70%)',
  'linear-gradient(135deg, #3a2a18 0%, #0D1525 70%)',
  'linear-gradient(135deg, #1a3050 0%, #0D1525 70%)',
];

function gradientFor(id: number): string {
  return COVER_GRADIENTS[Math.abs(id) % COVER_GRADIENTS.length];
}

const MONTHS_GEN = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];

function parseDate(raw: string): Date | null {
  if (!raw) return null;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}

// Friendly relative-ish Russian date: "Сегодня", "Завтра", or "5 июня".
function formatScheduleDate(raw: string): string {
  const d = parseDate(raw);
  if (!d) return raw;
  const now = new Date();
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diffDays = Math.round((startOf(d) - startOf(now)) / 86400000);
  if (diffDays === 0) return 'Сегодня';
  if (diffDays === 1) return 'Завтра';
  if (diffDays === -1) return 'Вчера';
  const base = `${d.getDate()} ${MONTHS_GEN[d.getMonth()]}`;
  return d.getFullYear() === now.getFullYear()
    ? base
    : `${base} ${d.getFullYear()}`;
}

const SCHEDULE_KIND: Record<string, { label: string; color: ThemeColor }> = {
  olympiad: { label: 'Пробник', color: 'gold' },
  homework: { label: 'Домашка', color: 'cyan' },
  lesson: { label: 'Урок', color: 'info' },
};

// Recommendation priority -> badge. Accepts numeric (1=high) or string priorities.
function priorityBadge(priority: number | string): { label: string; color: ThemeColor } {
  const p = String(priority).toLowerCase();
  if (p === '1' || p === 'high' || p === 'высокий') return { label: 'Высокий', color: 'error' };
  if (p === '2' || p === 'medium' || p === 'средний') return { label: 'Средний', color: 'warning' };
  if (p === '3' || p === 'low' || p === 'низкий') return { label: 'Низкий', color: 'muted' };
  return { label: 'Совет', color: 'cyan' };
}

function numberRu(n: number): string {
  return n.toLocaleString('ru-RU');
}

/* Section header shared by every block. */
function SectionHead({
  title,
  href,
  hrefLabel = 'Смотреть все',
}: {
  title: string;
  href?: string;
  hrefLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 mb-4">
      <h2 className="font-serif text-xl font-semibold text-[#F0EDE8]">{title}</h2>
      {href && (
        <Link
          href={href}
          className="text-sm text-[#4ECDD4] hover:text-[#6EE8EE] transition-colors whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4ECDD4] rounded px-1"
        >
          {hrefLabel} →
        </Link>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Courses section
 * ------------------------------------------------------------------ */

function CourseCard({ course }: { course: Course }) {
  const total = course.lessons_total ?? 0;
  const done = course.lessons_completed ?? 0;
  const progress = course.progress ?? (total > 0 ? Math.round((done / total) * 100) : 0);
  const next = course.next_lesson;
  const completed = !next && total > 0 && done >= total;

  const continueHref = next
    ? `/app/courses/${course.id}/lessons/${next.id}`
    : `/app/courses/${course.id}`;

  return (
    <div className="group bg-[#0D1525] border border-[#1E2D4A] rounded-xl overflow-hidden flex flex-col hover:border-[#253558] transition-colors">
      {/* Cover / gradient */}
      <div
        className="relative h-24 flex items-end p-4"
        style={
          course.cover_url
            ? { backgroundImage: `url(${course.cover_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : { background: gradientFor(course.id) }
        }
      >
        {course.cover_url && (
          <div className="absolute inset-0 bg-gradient-to-t from-[#0D1525] via-[#0D1525]/40 to-transparent" />
        )}
        <h3 className="relative font-serif text-base font-semibold text-[#F0EDE8] line-clamp-2 drop-shadow">
          {course.title}
        </h3>
      </div>

      {/* Body */}
      <div className="flex items-center gap-4 p-5 pt-4">
        <ProgressRing value={progress} size={58} />
        <div className="min-w-0 flex-1">
          <p className="text-sm text-[#A8A5A0]">
            {total > 0 ? (
              <>
                <span className="text-[#F0EDE8] font-medium">{done}</span> из {total}{' '}
                {total === 1 ? 'урока' : 'уроков'}
              </>
            ) : (
              'Уроки скоро появятся'
            )}
          </p>
          {next ? (
            <p className="mt-0.5 text-xs text-[#6A6860] line-clamp-1">
              Далее: {next.title}
            </p>
          ) : completed ? (
            <p className="mt-0.5 text-xs text-[#5BD68A]">Курс пройден</p>
          ) : null}
        </div>
      </div>

      {/* Action */}
      <div className="px-5 pb-5 mt-auto">
        <Link
          href={continueHref}
          className={`block w-full text-center px-4 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D1525] ${
            completed
              ? 'bg-[#152035] text-[#A8A5A0] border border-[#1E2D4A] hover:text-[#F0EDE8] hover:border-[#253558] focus-visible:ring-[#4ECDD4]'
              : 'bg-[#D9A441] text-[#0A0E1A] hover:bg-[#F4B860] focus-visible:ring-[#D9A441]'
          }`}
        >
          {completed ? 'Открыть курс' : next ? 'Продолжить' : 'Открыть курс'}
        </Link>
      </div>
    </div>
  );
}

function CoursesSection() {
  const { token } = useAuth();
  const [data, setData] = useState<Course[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!token) return;
    let alive = true;
    coursesAPI
      .myCourses(token)
      .then((res) => {
        if (alive) setData(unwrap<Course>(res));
      })
      .catch(() => {
        if (alive) setError(true);
      });
    return () => {
      alive = false;
    };
  }, [token]);

  return (
    <section>
      <SectionHead title="Мои курсы" />
      {data === null && !error ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Card key={i} className="!p-0 overflow-hidden">
              <Skeleton className="h-24 w-full rounded-none" />
              <div className="flex items-center gap-4 p-5">
                <Skeleton className="h-[58px] w-[58px] rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
              <div className="px-5 pb-5">
                <Skeleton className="h-9 w-full" />
              </div>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card>
          <EmptyState
            title="Не удалось загрузить курсы"
            subtitle="Попробуйте обновить страницу немного позже."
          />
        </Card>
      ) : data && data.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((c) => (
            <CourseCard key={c.id} course={c} />
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            }
            title="У вас пока нет курсов"
            subtitle="Доступ к курсам открывает администратор. Напишите в поддержку, если ждёте доступ."
            action={
              <a
                href="https://t.me/obiqe"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-4 py-2 bg-[#152035] border border-[#1E2D4A] text-sm text-[#4ECDD4] rounded-lg hover:border-[#253558] transition-colors"
              >
                Написать в поддержку
              </a>
            }
          />
        </Card>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * Recommendations section
 * ------------------------------------------------------------------ */

function RecommendationsSection() {
  const { token } = useAuth();
  const [data, setData] = useState<RecommendationResponse | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!token) return;
    let alive = true;
    analyticsAPI
      .recommendations(token)
      .then((res) => {
        if (alive) setData(res);
      })
      .catch(() => {
        if (alive) setError(true);
      });
    return () => {
      alive = false;
    };
  }, [token]);

  const items: Recommendation[] = data?.items ?? [];
  const isAI = (data?.generated_by || '').toLowerCase().includes('ai') ||
    (data?.generated_by || '').toLowerCase().includes('gpt') ||
    (data?.generated_by || '').toLowerCase().includes('ml') ||
    (data?.generated_by || '').toLowerCase().includes('ии');
  const caption = isAI ? 'сгенерировано ИИ' : 'подобрано для вас';

  return (
    <Card>
      <CardHeader
        title="Рекомендации"
        subtitle={data ? caption : undefined}
        action={
          <span className="text-[#8B6DD4]" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 3v4M3 5h4M6 17v4M4 19h4M13 3l2.5 6.5L22 12l-6.5 2.5L13 21l-2.5-6.5L4 12l6.5-2.5z" />
            </svg>
          </span>
        }
      />

      {data === null && !error ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-lg border border-[#1E2D4A] p-3 space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-full" />
            </div>
          ))}
        </div>
      ) : error ? (
        <p className="text-sm text-[#6A6860] py-4">
          Не удалось загрузить рекомендации.
        </p>
      ) : items.length > 0 ? (
        <ul className="space-y-2.5">
          {items.map((rec, i) => {
            const pr = priorityBadge(rec.priority);
            return (
              <li key={i}>
                <Link
                  href={rec.action_url || '#'}
                  className="block rounded-lg border border-[#1E2D4A] p-3 hover:border-[#253558] hover:bg-[#152035] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8B6DD4]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-[#F0EDE8] text-sm leading-snug">
                      {rec.title}
                    </p>
                    <Badge color={pr.color} className="flex-shrink-0">{pr.label}</Badge>
                  </div>
                  {rec.reason && (
                    <p className="mt-1 text-xs text-[#A8A5A0] line-clamp-2">{rec.reason}</p>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState
          title="Пока нет рекомендаций"
          subtitle="Решайте задачи и смотрите уроки — мы подскажем, что изучить дальше."
          className="!py-8"
        />
      )}
    </Card>
  );
}

/* ------------------------------------------------------------------ *
 * Upcoming (schedule) section
 * ------------------------------------------------------------------ */

function UpcomingSection() {
  const { token } = useAuth();
  const [data, setData] = useState<ScheduleItem[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!token) return;
    let alive = true;
    const today = new Date().toISOString().split('T')[0];
    calendarAPI
      .schedule(token, { from: today })
      .then((res) => {
        if (alive) setData(unwrap<ScheduleItem>(res).slice(0, 5));
      })
      .catch(() => {
        if (alive) setError(true);
      });
    return () => {
      alive = false;
    };
  }, [token]);

  return (
    <Card>
      <CardHeader
        title="Ближайшее"
        action={
          <Link
            href="/app/schedule"
            className="text-sm text-[#4ECDD4] hover:text-[#6EE8EE] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4ECDD4] rounded px-1"
          >
            Расписание →
          </Link>
        }
      />

      {data === null && !error ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <p className="text-sm text-[#6A6860] py-4">Не удалось загрузить расписание.</p>
      ) : data && data.length > 0 ? (
        <ul className="space-y-1">
          {data.map((item) => {
            const kind = SCHEDULE_KIND[item.kind] || { label: item.kind, color: 'muted' as ThemeColor };
            const href = item.action_url || '/app/schedule';
            return (
              <li key={`${item.kind}-${item.id}`}>
                <Link
                  href={href}
                  className="flex items-center gap-3 rounded-lg p-2 -mx-2 hover:bg-[#152035] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4ECDD4]"
                >
                  <div className="flex-shrink-0 w-11 h-11 rounded-lg bg-[#152035] border border-[#1E2D4A] flex flex-col items-center justify-center text-center leading-none">
                    <span className="text-sm font-semibold text-[#F0EDE8]">
                      {(() => {
                        const d = parseDate(item.date);
                        return d ? d.getDate() : '—';
                      })()}
                    </span>
                    <span className="text-[9px] uppercase text-[#6A6860] mt-0.5">
                      {(() => {
                        const d = parseDate(item.date);
                        return d ? MONTHS_GEN[d.getMonth()].slice(0, 3) : '';
                      })()}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[#F0EDE8] line-clamp-1">{item.title}</p>
                    <p className="text-xs text-[#6A6860]">{formatScheduleDate(item.date)}</p>
                  </div>
                  <Badge color={kind.color} className="flex-shrink-0">{kind.label}</Badge>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState
          title="Ничего не запланировано"
          subtitle="Дедлайны и пробники появятся здесь, как только наступит срок."
          className="!py-8"
        />
      )}
    </Card>
  );
}

/* ------------------------------------------------------------------ *
 * Quick stats section
 * ------------------------------------------------------------------ */

function StatTile({
  label,
  value,
  suffix,
  color,
  icon,
}: {
  label: string;
  value: string;
  suffix?: string;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-[#152035] border border-[#1E2D4A] rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-[#A8A5A0]">{label}</span>
        <span style={{ color }} aria-hidden="true">{icon}</span>
      </div>
      <div className="font-serif text-2xl font-semibold text-[#F0EDE8] leading-none">
        {value}
        {suffix && <span className="text-base text-[#6A6860] ml-0.5">{suffix}</span>}
      </div>
    </div>
  );
}

function QuickStatsSection() {
  const { token } = useAuth();
  const [data, setData] = useState<Stats | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!token) return;
    let alive = true;
    analyticsAPI
      .stats(token)
      .then((res) => {
        if (alive) setData(res || {});
      })
      .catch(() => {
        if (alive) setError(true);
      });
    return () => {
      alive = false;
    };
  }, [token]);

  // Best mock score: pull from common shapes, default to 0.
  const bestMock =
    (data?.best_mock_percent as number | undefined) ??
    (data?.best_olympiad_percent as number | undefined) ??
    (data?.best_mock as number | undefined) ??
    null;

  const solved = data?.problems_solved ?? 0;
  const accuracy = data?.accuracy ?? 0;
  const watched = data?.lessons_watched ?? 0;

  const icons = {
    target: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" />
      </svg>
    ),
    check: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3" />
      </svg>
    ),
    play: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="15" rx="2" /><path d="m10 9 4 2.5-4 2.5z" fill="currentColor" />
      </svg>
    ),
    trophy: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0z" />
      </svg>
    ),
  };

  return (
    <section>
      <SectionHead title="Краткая статистика" href="/app/stats" hrefLabel="Подробнее" />
      {data === null && !error ? (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[88px] w-full rounded-lg" />
          ))}
        </div>
      ) : error ? (
        <Card>
          <p className="text-sm text-[#6A6860]">Не удалось загрузить статистику.</p>
        </Card>
      ) : (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <StatTile
            label="Решено задач"
            value={numberRu(solved)}
            color="#4ECDD4"
            icon={icons.target}
          />
          <StatTile
            label="Точность"
            value={String(Math.round(accuracy))}
            suffix="%"
            color="#5BD68A"
            icon={icons.check}
          />
          <StatTile
            label="Просмотрено уроков"
            value={numberRu(watched)}
            color="#7AB6F5"
            icon={icons.play}
          />
          <StatTile
            label="Лучший пробник"
            value={bestMock !== null ? String(Math.round(bestMock)) : '—'}
            suffix={bestMock !== null ? '%' : undefined}
            color="#D9A441"
            icon={icons.trophy}
          />
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * Page
 * ------------------------------------------------------------------ */

export default function DashboardPage() {
  const { user } = useAuth();

  const firstName = (user?.full_name || '').trim().split(/\s+/)[0] || '';
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 6) return 'Доброй ночи';
    if (h < 12) return 'Доброе утро';
    if (h < 18) return 'Добрый день';
    return 'Добрый вечер';
  })();

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      {/* Greeting */}
      <header className="pt-1">
        <h1 className="font-serif text-3xl font-semibold text-[#F0EDE8]">
          {greeting}{firstName ? `, ${firstName}` : ''}!
        </h1>
        <p className="mt-1 text-[#A8A5A0]">
          Продолжайте подготовку — ваш прогресс и ближайшие задачи ниже.
        </p>
      </header>

      {/* Courses */}
      <CoursesSection />

      {/* Recommendations + Upcoming */}
      <section className="grid gap-6 lg:grid-cols-2 items-start">
        <RecommendationsSection />
        <UpcomingSection />
      </section>

      {/* Quick stats */}
      <QuickStatsSection />
    </div>
  );
}
