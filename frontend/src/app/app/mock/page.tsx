'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import {
  olympiads as olympiadsAPI,
  unwrap,
  MockOlympiad,
  Attempt,
} from '@/lib/api';
import {
  Card,
  CardHeader,
  Skeleton,
  EmptyState,
  Badge,
  LevelBadge,
  Spinner,
} from '@/components/ui';

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

function formatDate(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('ru-RU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// «5 задач» / «2 задачи» / «1 задача» — Russian pluralization.
function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}

function attemptOlympiadId(a: Attempt): number | undefined {
  if (typeof a.olympiad === 'number') return a.olympiad;
  if (a.olympiad && typeof a.olympiad === 'object') return a.olympiad.id;
  return undefined;
}

function attemptTitle(a: Attempt, byId: Map<number, MockOlympiad>): string {
  if (a.olympiad && typeof a.olympiad === 'object' && a.olympiad.title) {
    return a.olympiad.title;
  }
  const oid = attemptOlympiadId(a);
  if (oid != null) {
    const o = byId.get(oid);
    if (o) return o.title;
  }
  return 'Пробная олимпиада';
}

function isCompleted(a: Attempt): boolean {
  return a.status === 'completed' || a.results != null || a.percent != null;
}

/* ------------------------------------------------------------------ *
 * Icons
 * ------------------------------------------------------------------ */
const StarIcon = ({ size = 40 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const ClockIcon = ({ size = 15 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

const ListIcon = ({ size = 15 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
  </svg>
);

const TrophyIcon = ({ size = 15 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4zM7 6H5a2 2 0 0 0 0 4h2M17 6h2a2 2 0 0 1 0 4h-2" />
  </svg>
);

/* ------------------------------------------------------------------ *
 * Page
 * ------------------------------------------------------------------ */
export default function MockListPage() {
  const { token } = useAuth();
  const [mocks, setMocks] = useState<MockOlympiad[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!token) return;
    let alive = true;
    setLoading(true);
    setError(false);

    Promise.all([
      olympiadsAPI.list(token),
      olympiadsAPI.myAttempts(token).catch(() => null),
    ])
      .then(([listData, attemptsData]) => {
        if (!alive) return;
        setMocks(unwrap<MockOlympiad>(listData));
        setAttempts(unwrap<Attempt>(attemptsData));
      })
      .catch(() => {
        if (alive) setError(true);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [token]);

  // Best percent per olympiad, used as a quick "my best result" hint on cards.
  const bestById = new Map<number, number>();
  attempts.forEach((a) => {
    const oid = attemptOlympiadId(a);
    if (oid == null) return;
    if (a.percent == null) return;
    const prev = bestById.get(oid);
    if (prev == null || a.percent > prev) bestById.set(oid, a.percent);
  });

  const mockById = new Map<number, MockOlympiad>();
  mocks.forEach((m) => mockById.set(m.id, m));

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <header className="mb-6">
        <h1 className="font-serif text-3xl font-bold text-[#F0EDE8]">
          Пробные олимпиады
        </h1>
        <p className="mt-1.5 text-[#A8A5A0]">
          Тренируйтесь в условиях, приближённых к реальным: ограниченное время,
          задачи по уровням и подробный разбор после завершения.
        </p>
      </header>

      {/* ----- Loading ----- */}
      {loading && (
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <Card key={i}>
              <Skeleton className="h-5 w-2/3 mb-3" />
              <Skeleton className="h-4 w-1/3 mb-5" />
              <div className="flex gap-2 mb-5">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-10 w-full" />
            </Card>
          ))}
        </div>
      )}

      {/* ----- Error ----- */}
      {!loading && error && (
        <Card>
          <EmptyState
            title="Не удалось загрузить олимпиады"
            subtitle="Попробуйте обновить страницу. Если ошибка повторяется — напишите в поддержку."
            action={
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-lg bg-[#D9A441] text-[#070C18] text-sm font-medium hover:bg-[#E8B860] transition-colors"
              >
                Обновить
              </button>
            }
          />
        </Card>
      )}

      {/* ----- Empty ----- */}
      {!loading && !error && mocks.length === 0 && (
        <Card>
          <EmptyState
            icon={<StarIcon />}
            title="Пока нет доступных олимпиад"
            subtitle="Новые пробные туры появятся здесь, как только их добавят. Загляните позже."
          />
        </Card>
      )}

      {/* ----- Mock cards ----- */}
      {!loading && !error && mocks.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {mocks.map((m) => {
            const best = bestById.get(m.id);
            const count = m.problem_count ?? 0;
            return (
              <Card
                key={m.id}
                className="flex flex-col transition-colors hover:border-[#2A3F66]"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h2 className="font-serif text-lg font-semibold text-[#F0EDE8] leading-snug">
                    {m.title}
                  </h2>
                  {m.level && <LevelBadge level={m.level} className="flex-shrink-0 mt-0.5" />}
                </div>

                {m.description && (
                  <p className="text-sm text-[#A8A5A0] line-clamp-2 mb-4">
                    {m.description}
                  </p>
                )}

                {/* Meta row */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[#A8A5A0] mb-4">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="text-[#6A6860]"><ClockIcon /></span>
                    {m.duration_minutes} мин
                  </span>
                  {count > 0 && (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="text-[#6A6860]"><ListIcon /></span>
                      {count} {plural(count, 'задача', 'задачи', 'задач')}
                    </span>
                  )}
                  {m.max_score != null && (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="text-[#6A6860]"><TrophyIcon /></span>
                      {m.max_score} {plural(m.max_score, 'балл', 'балла', 'баллов')}
                    </span>
                  )}
                </div>

                {/* Best result */}
                {best != null && (
                  <div className="mb-4">
                    <Badge color={best >= 70 ? 'success' : best >= 40 ? 'warning' : 'muted'}>
                      Лучший результат: {Math.round(best)}%
                    </Badge>
                  </div>
                )}

                <Link
                  href={`/app/mock/${m.id}`}
                  className="mt-auto inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-[#D9A441] text-[#070C18] text-sm font-semibold hover:bg-[#E8B860] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D9A441] focus-visible:ring-offset-2 focus-visible:ring-offset-[#070C18] transition-colors"
                >
                  {best != null ? 'Пройти заново' : 'Начать тур'}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </Link>
              </Card>
            );
          })}
        </div>
      )}

      {/* ----- Attempt history ----- */}
      {!loading && !error && (
        <section className="mt-10">
          <h2 className="font-serif text-xl font-semibold text-[#F0EDE8] mb-4">
            История попыток
          </h2>

          {attempts.length === 0 ? (
            <Card>
              <EmptyState
                title="Вы ещё не проходили ни одного тура"
                subtitle="Начните любую пробную олимпиаду выше — результаты появятся здесь."
              />
            </Card>
          ) : (
            <Card className="p-0 overflow-hidden">
              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#1E2D4A] text-left text-[#6A6860]">
                      <th className="px-5 py-3 font-medium">Олимпиада</th>
                      <th className="px-5 py-3 font-medium whitespace-nowrap">Результат</th>
                      <th className="px-5 py-3 font-medium whitespace-nowrap">%</th>
                      <th className="px-5 py-3 font-medium whitespace-nowrap">Дата</th>
                      <th className="px-5 py-3 font-medium whitespace-nowrap">Статус</th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {attempts.map((a, idx) => {
                      const done = isCompleted(a);
                      const aId = a.attempt_id ?? a.id;
                      const oId = attemptOlympiadId(a);
                      return (
                        <tr
                          key={aId ?? idx}
                          className="border-b border-[#1E2D4A] last:border-0 hover:bg-[#152035]/50 transition-colors"
                        >
                          <td className="px-5 py-3 text-[#F0EDE8]">
                            {attemptTitle(a, mockById)}
                          </td>
                          <td className="px-5 py-3 text-[#A8A5A0] whitespace-nowrap">
                            {done && a.score != null && a.max_score != null
                              ? `${a.score} / ${a.max_score}`
                              : '—'}
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap">
                            {done && a.percent != null ? (
                              <span
                                className="font-medium"
                                style={{
                                  color:
                                    a.percent >= 70
                                      ? '#5BD68A'
                                      : a.percent >= 40
                                      ? '#FFB547'
                                      : '#A8A5A0',
                                }}
                              >
                                {Math.round(a.percent)}%
                              </span>
                            ) : (
                              <span className="text-[#6A6860]">—</span>
                            )}
                          </td>
                          <td className="px-5 py-3 text-[#A8A5A0] whitespace-nowrap">
                            {formatDate(
                              (a as any).created_at ??
                                (a as any).started_at ??
                                a.deadline
                            )}
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap">
                            {done ? (
                              <Badge color="success">Завершено</Badge>
                            ) : (
                              <Badge color="info">В процессе</Badge>
                            )}
                          </td>
                          <td className="px-5 py-3 text-right whitespace-nowrap">
                            {(oId != null || aId != null) && (
                              <Link
                                href={
                                  oId != null
                                    ? `/app/mock/${oId}`
                                    : `/app/mock`
                                }
                                className="text-[#4ECDD4] hover:text-[#6EE8EE] transition-colors"
                              >
                                {done ? 'Разбор' : 'Продолжить'}
                              </Link>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="sm:hidden divide-y divide-[#1E2D4A]">
                {attempts.map((a, idx) => {
                  const done = isCompleted(a);
                  const aId = a.attempt_id ?? a.id;
                  const oId = attemptOlympiadId(a);
                  return (
                    <div key={aId ?? idx} className="p-4">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <span className="text-[#F0EDE8] font-medium">
                          {attemptTitle(a, mockById)}
                        </span>
                        {done ? (
                          <Badge color="success">Завершено</Badge>
                        ) : (
                          <Badge color="info">В процессе</Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[#A8A5A0]">
                          {done && a.score != null && a.max_score != null
                            ? `${a.score} / ${a.max_score}`
                            : '—'}
                          {done && a.percent != null && (
                            <span className="text-[#6A6860]">
                              {' '}
                              · {Math.round(a.percent)}%
                            </span>
                          )}
                        </span>
                        {oId != null && (
                          <Link
                            href={`/app/mock/${oId}`}
                            className="text-[#4ECDD4] hover:text-[#6EE8EE] transition-colors"
                          >
                            {done ? 'Разбор' : 'Продолжить'}
                          </Link>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-[#6A6860]">
                        {formatDate(
                          (a as any).created_at ??
                            (a as any).started_at ??
                            a.deadline
                        )}
                      </p>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </section>
      )}
    </div>
  );
}
