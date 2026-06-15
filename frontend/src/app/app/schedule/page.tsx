'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { calendar as calendarAPI, unwrap, ScheduleItem } from '@/lib/api';
import {
  Card,
  Spinner,
  Skeleton,
  EmptyState,
  Badge,
  HomeworkStatusBadge,
  LessonTypeBadge,
} from '@/components/ui';

/* ------------------------------------------------------------------ *
 * Constants / helpers
 * ------------------------------------------------------------------ */

type KindFilter = 'all' | 'olympiad' | 'homework' | 'lesson';

const FILTERS: Array<{ key: KindFilter; label: string }> = [
  { key: 'all', label: 'Все' },
  { key: 'olympiad', label: 'Олимпиады' },
  { key: 'homework', label: 'Дедлайны ДЗ' },
  { key: 'lesson', label: 'Уроки' },
];

const MONTHS_RU = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];

const WEEKDAYS_RU = [
  'воскресенье', 'понедельник', 'вторник', 'среда',
  'четверг', 'пятница', 'суббота',
];

// Parse the YYYY-MM-DD (or ISO) date portion into a local Date at midnight.
function parseDay(dateStr: string): Date {
  const datePart = dateStr.slice(0, 10);
  const [y, m, d] = datePart.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function startOfToday(): Date {
  const t = new Date();
  return new Date(t.getFullYear(), t.getMonth(), t.getDate());
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

// Human header for a date group: "Сегодня", "Завтра", or "12 марта, среда".
function groupHeading(d: Date): { label: string; relative: string | null } {
  const today = startOfToday();
  const diffDays = Math.round((d.getTime() - today.getTime()) / 86400000);
  let relative: string | null = null;
  if (diffDays === 0) relative = 'Сегодня';
  else if (diffDays === 1) relative = 'Завтра';
  else if (diffDays === -1) relative = 'Вчера';
  const label = `${d.getDate()} ${MONTHS_RU[d.getMonth()]}, ${WEEKDAYS_RU[d.getDay()]}`;
  return { label, relative };
}

function timePart(dateStr: string): string | null {
  // Items may carry an ISO timestamp; surface HH:MM if present and non-midnight.
  const m = dateStr.match(/T(\d{2}):(\d{2})/);
  if (!m) return null;
  if (m[1] === '00' && m[2] === '00') return null;
  return `${m[1]}:${m[2]}`;
}

const KIND_META: Record<
  Exclude<KindFilter, 'all'>,
  { label: string; color: string; dot: string }
> = {
  olympiad: { label: 'Олимпиада', color: '#8B6DD4', dot: '#8B6DD4' },
  homework: { label: 'Дедлайн ДЗ', color: '#FFB547', dot: '#FFB547' },
  lesson: { label: 'Урок', color: '#4ECDD4', dot: '#4ECDD4' },
};

/* ------------------------------------------------------------------ *
 * Icons
 * ------------------------------------------------------------------ */

function KindIcon({ kind }: { kind: ScheduleItem['kind'] }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  if (kind === 'olympiad') {
    return (
      <svg {...common}>
        <path d="M12 2l2.4 7.4H22l-6 4.5 2.3 7.1L12 16.6 5.7 21l2.3-7.1-6-4.5h7.6z" />
      </svg>
    );
  }
  if (kind === 'homework') {
    return (
      <svg {...common}>
        <path d="M10.3 3.8 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0z" />
        <path d="M12 9v4M12 17h.01" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function ExternalIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
    </svg>
  );
}

function ArrowIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

/* ------------------------------------------------------------------ *
 * Item card
 * ------------------------------------------------------------------ */

function ScheduleRow({ item }: { item: ScheduleItem }) {
  const meta = KIND_META[item.kind];
  const today = startOfToday();
  const itemDate = parseDay(item.date);
  const time = timePart(item.date);

  const status = item.status as string | undefined;
  const isHomework = item.kind === 'homework';
  const isDone = status === 'done' || status === 'correct';
  const isOverdue = isHomework && itemDate.getTime() < today.getTime() && !isDone;

  // Resolve a destination link.
  const href = item.action_url || null;
  const externalUrl: string | undefined =
    (item.external_url as string) || (item.url as string) || undefined;
  const isExternal = item.kind === 'olympiad' && !!externalUrl;

  const body = (
    <div
      className={`group relative flex items-start gap-3.5 rounded-xl border bg-[#0D1525] p-4 transition-colors ${
        isOverdue
          ? 'border-[#FF7B6D55] hover:border-[#FF7B6D]'
          : 'border-[#1E2D4A] hover:border-[#2C4068]'
      }`}
    >
      {/* Kind icon */}
      <span
        className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg"
        style={{ color: meta.color, backgroundColor: `${meta.color}1F` }}
        aria-hidden="true"
      >
        <KindIcon kind={item.kind} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="text-[11px] font-semibold uppercase tracking-wide"
            style={{ color: meta.color }}
          >
            {meta.label}
          </span>
          {time && (
            <span className="text-xs text-[#6A6860]">в {time}</span>
          )}
          {isOverdue && <Badge color="error">Просрочено</Badge>}
          {isHomework && status && status !== 'none' && (
            <HomeworkStatusBadge status={status} />
          )}
          {item.kind === 'lesson' && item.lesson_type && (
            <LessonTypeBadge type={item.lesson_type as string} />
          )}
        </div>

        <h3 className="mt-1 truncate font-medium text-[#F0EDE8]">{item.title}</h3>

        {item.course_title && (
          <p className="mt-0.5 truncate text-sm text-[#A8A5A0]">{item.course_title}</p>
        )}

        {item.description && (
          <p className="mt-1 line-clamp-2 text-sm text-[#A8A5A0]">
            {item.description as string}
          </p>
        )}

        {/* Action affordance */}
        {(href || isExternal) && (
          <span
            className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium"
            style={{ color: meta.color }}
          >
            {item.kind === 'homework'
              ? 'Перейти к ДЗ'
              : item.kind === 'lesson'
              ? 'Открыть урок'
              : 'Подробнее'}
            {isExternal ? (
              <ExternalIcon className="transition-transform group-hover:translate-x-0.5" />
            ) : (
              <ArrowIcon className="transition-transform group-hover:translate-x-0.5" />
            )}
          </span>
        )}
      </div>
    </div>
  );

  if (isExternal) {
    return (
      <a href={externalUrl} target="_blank" rel="noopener noreferrer" className="block">
        {body}
      </a>
    );
  }
  if (href) {
    return (
      <Link href={href} className="block">
        {body}
      </Link>
    );
  }
  return body;
}

/* ------------------------------------------------------------------ *
 * Page
 * ------------------------------------------------------------------ */

export default function SchedulePage() {
  const { token } = useAuth();
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState<KindFilter>('all');

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLoading(true);
    setError(false);

    // Pull a forward-looking window (today .. +90 days) plus a little history
    // so just-missed homework deadlines still surface as «Просрочено».
    const today = startOfToday();
    const from = new Date(today);
    from.setDate(from.getDate() - 14);
    const to = new Date(today);
    to.setDate(to.getDate() + 90);

    calendarAPI
      .schedule(token, { from: dateKey(from), to: dateKey(to) })
      .then((data) => {
        if (cancelled) return;
        setItems(unwrap<ScheduleItem>(data));
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  // Counts per kind for the filter chips.
  const counts = useMemo(() => {
    const c: Record<KindFilter, number> = { all: 0, olympiad: 0, homework: 0, lesson: 0 };
    for (const it of items) {
      c.all += 1;
      if (it.kind in c) c[it.kind] += 1;
    }
    return c;
  }, [items]);

  const overdueCount = useMemo(() => {
    const today = startOfToday();
    return items.filter(
      (it) =>
        it.kind === 'homework' &&
        parseDay(it.date).getTime() < today.getTime() &&
        it.status !== 'done' &&
        it.status !== 'correct'
    ).length;
  }, [items]);

  // Filter + chronological group by day.
  const groups = useMemo(() => {
    const filtered = items.filter((it) => filter === 'all' || it.kind === filter);

    const byDay = new Map<string, { date: Date; items: ScheduleItem[] }>();
    for (const it of filtered) {
      const d = parseDay(it.date);
      const key = dateKey(d);
      if (!byDay.has(key)) byDay.set(key, { date: d, items: [] });
      byDay.get(key)!.items.push(it);
    }

    const ordered = Array.from(byDay.values()).sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );
    // Keep stable intra-day order: by time then title.
    for (const g of ordered) {
      g.items.sort((a, b) => {
        const ta = timePart(a.date) || '';
        const tb = timePart(b.date) || '';
        if (ta !== tb) return ta.localeCompare(tb);
        return a.title.localeCompare(b.title, 'ru');
      });
    }
    return ordered;
  }, [items, filter]);

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-semibold text-[#F0EDE8]">
          Расписание и дедлайны
        </h1>
        <p className="mt-1 text-sm text-[#A8A5A0]">
          Ближайшие олимпиады, дедлайны домашних заданий и уроки в одной ленте.
        </p>
      </div>

      {/* Overdue alert */}
      {!loading && !error && overdueCount > 0 && (
        <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-[#FF7B6D55] bg-[rgba(255,123,109,0.08)] px-4 py-3">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FF7B6D"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="flex-shrink-0"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
          <p className="text-sm text-[#F0EDE8]">
            Просроченных дедлайнов:{' '}
            <span className="font-semibold text-[#FF7B6D]">{overdueCount}</span>. Сдайте
            задания как можно скорее.
          </p>
        </div>
      )}

      {/* Filter chips */}
      <div
        className="mb-6 flex flex-wrap gap-2"
        role="tablist"
        aria-label="Фильтр расписания"
      >
        {FILTERS.map((f) => {
          const active = filter === f.key;
          const count = counts[f.key];
          return (
            <button
              key={f.key}
              role="tab"
              aria-selected={active}
              onClick={() => setFilter(f.key)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4ECDD4] ${
                active
                  ? 'border-[#4ECDD4] bg-[#4ECDD4] font-medium text-[#070C18]'
                  : 'border-[#1E2D4A] text-[#A8A5A0] hover:border-[#2C4068] hover:text-[#F0EDE8]'
              }`}
            >
              {f.label}
              {!loading && (
                <span
                  className={`rounded-full px-1.5 text-[11px] tabular-nums ${
                    active ? 'bg-[#070C18]/15 text-[#070C18]' : 'text-[#6A6860]'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-6">
          {[0, 1].map((g) => (
            <div key={g}>
              <Skeleton className="mb-3 h-4 w-40" />
              <div className="space-y-3">
                {[0, 1].map((i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3.5 rounded-xl border border-[#1E2D4A] bg-[#0D1525] p-4"
                  >
                    <Skeleton className="h-9 w-9 flex-shrink-0 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <Card>
          <EmptyState
            icon={
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.4}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
            }
            title="Не удалось загрузить расписание"
            subtitle="Произошла ошибка при загрузке данных. Проверьте подключение и попробуйте обновить страницу."
          />
        </Card>
      )}

      {/* Empty */}
      {!loading && !error && groups.length === 0 && (
        <Card>
          <EmptyState
            icon={
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.4}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
                <path d="M9 16l2 2 4-4" />
              </svg>
            }
            title={
              filter === 'all'
                ? 'Пока ничего не запланировано'
                : 'Здесь пусто'
            }
            subtitle={
              filter === 'all'
                ? 'Когда появятся олимпиады, дедлайны ДЗ или новые уроки, они отобразятся в этой ленте.'
                : 'Нет элементов для выбранного фильтра. Попробуйте выбрать «Все».'
            }
          />
        </Card>
      )}

      {/* Timeline */}
      {!loading && !error && groups.length > 0 && (
        <div className="space-y-7">
          {groups.map((g) => {
            const { label, relative } = groupHeading(g.date);
            const isPast = g.date.getTime() < startOfToday().getTime();
            return (
              <section key={dateKey(g.date)}>
                <div className="mb-3 flex items-baseline gap-2">
                  <h2
                    className={`font-serif text-base font-semibold ${
                      relative === 'Сегодня' ? 'text-[#4ECDD4]' : 'text-[#F0EDE8]'
                    }`}
                  >
                    {relative || label}
                  </h2>
                  {relative && (
                    <span className="text-sm text-[#6A6860]">{label}</span>
                  )}
                  {isPast && !relative && (
                    <span className="text-xs text-[#6A6860]">(прошло)</span>
                  )}
                </div>
                <div className="space-y-3">
                  {g.items.map((it) => (
                    <ScheduleRow key={`${it.kind}-${it.id}`} item={it} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
