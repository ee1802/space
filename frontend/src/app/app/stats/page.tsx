'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import {
  analytics as analyticsAPI,
  Stats,
  TopicStat,
  LevelStat,
  AnswerTypeStat,
  RecentActivityDay,
} from '@/lib/api';
import { Card, CardHeader, Skeleton, EmptyState, Badge, DARK_THEME } from '@/components/ui';

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

// Accuracy → semantic color. red < 50, amber < 70, green ≥ 70.
function accuracyColor(accuracy: number): string {
  if (accuracy < 50) return DARK_THEME.error;
  if (accuracy < 70) return DARK_THEME.warning;
  return DARK_THEME.success;
}

// Russian labels for answer types.
const ANSWER_TYPE_LABELS: Record<string, string> = {
  number: 'Число',
  text: 'Текст',
  formula: 'Формула',
  choice: 'Выбор ответа',
};

function answerTypeLabel(t: string): string {
  return ANSWER_TYPE_LABELS[t] || t || 'Другое';
}

function pct(n: number): string {
  return `${Math.round(n)}%`;
}

// Russian plural for "задача".
function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}

/* ------------------------------------------------------------------ *
 * Inline icons (24x24 stroke)
 * ------------------------------------------------------------------ */
function StatIcon({ name, size = 20 }: { name: string; size?: number }) {
  const paths: Record<string, string> = {
    check: 'M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11',
    target: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
    repeat: 'M17 1l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3',
    play: 'M5 3l14 9-14 9V3z',
    medal: 'M8.21 13.89L7 23l5-3 5 3-1.21-9.12M15 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM12 2v2',
    trophy: 'M6 9a6 6 0 0 0 12 0V3H6zM6 5H3a2 2 0 0 0 2 4M18 5h3a2 2 0 0 1-2 4M8 21h8M12 15v6',
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d={paths[name] || paths.check} />
    </svg>
  );
}

/* ------------------------------------------------------------------ *
 * Top tiles
 * ------------------------------------------------------------------ */
function Tile({
  icon,
  iconColor,
  value,
  label,
  sub,
}: {
  icon: string;
  iconColor: string;
  value: React.ReactNode;
  label: string;
  sub?: React.ReactNode;
}) {
  return (
    <Card className="flex items-start gap-3.5 hover:border-[#253558] transition-colors">
      <div
        className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
        style={{ color: iconColor, backgroundColor: `${iconColor}1F` }}
      >
        <StatIcon name={icon} size={20} />
      </div>
      <div className="min-w-0">
        <div className="font-serif text-2xl font-semibold leading-none text-[#F0EDE8]">{value}</div>
        <div className="mt-1.5 text-[13px] text-[#A8A5A0] leading-tight">{label}</div>
        {sub && <div className="mt-0.5 text-xs text-[#6A6860]">{sub}</div>}
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ *
 * Horizontal accuracy bar (used for topics and levels)
 * ------------------------------------------------------------------ */
function AccuracyBar({
  label,
  accuracy,
  attempted,
  correct,
  tagBadge,
}: {
  label: string;
  accuracy: number;
  attempted: number;
  correct: number;
  tagBadge?: React.ReactNode;
}) {
  const color = accuracyColor(accuracy);
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 mb-1.5">
        <div className="min-w-0 flex items-center gap-2">
          <span className="text-sm text-[#F0EDE8] truncate">{label}</span>
          {tagBadge}
        </div>
        <div className="flex-shrink-0 flex items-baseline gap-2 tabular-nums">
          <span className="text-sm font-semibold" style={{ color }}>
            {pct(accuracy)}
          </span>
          <span className="text-xs text-[#6A6860]">
            {correct}/{attempted}
          </span>
        </div>
      </div>
      <div
        className="w-full h-2.5 rounded-full bg-[#1E2D4A] overflow-hidden"
        role="progressbar"
        aria-valuenow={Math.round(accuracy)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label}: точность ${pct(accuracy)}`}
      >
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.max(2, Math.min(100, accuracy))}%`, backgroundColor: color, transition: 'width 0.5s ease' }}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Activity strip (30-day SVG)
 * ------------------------------------------------------------------ */
function ActivityStrip({ days }: { days: RecentActivityDay[] }) {
  const max = Math.max(1, ...days.map((d) => d.count));
  const total = days.reduce((s, d) => s + d.count, 0);
  const activeDays = days.filter((d) => d.count > 0).length;

  // Layout: a row of vertical bars, evenly spaced.
  const H = 96;
  const barGap = 3;
  const n = days.length;

  const fmtDate = (iso: string) =>
    new Date(iso + 'T00:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });

  return (
    <div>
      <div className="flex items-end gap-[3px] w-full" style={{ height: H }} role="img" aria-label="Активность за 30 дней">
        {days.map((d) => {
          const h = d.count === 0 ? 3 : Math.max(6, Math.round((d.count / max) * H));
          const intensity = d.count === 0 ? 0 : Math.min(1, 0.35 + (d.count / max) * 0.65);
          return (
            <div
              key={d.date}
              className="group relative flex-1 flex items-end"
              style={{ minWidth: 0 }}
            >
              <div
                className="w-full rounded-sm transition-all"
                style={{
                  height: h,
                  backgroundColor: d.count === 0 ? DARK_THEME.border : DARK_THEME.cyan,
                  opacity: d.count === 0 ? 0.5 : intensity,
                }}
              />
              {/* Tooltip */}
              <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block z-10 whitespace-nowrap rounded-md border border-[#1E2D4A] bg-[#152035] px-2 py-1 text-[11px] text-[#F0EDE8] shadow-lg">
                {fmtDate(d.date)}: {d.count} {plural(d.count, 'попытка', 'попытки', 'попыток')}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-[#6A6860]">
        <span>{days.length ? fmtDate(days[0].date) : ''}</span>
        <span className="text-[#A8A5A0]">
          {total} {plural(total, 'попытка', 'попытки', 'попыток')} · активных дней: {activeDays}
        </span>
        <span>{days.length ? fmtDate(days[days.length - 1].date) : 'сегодня'}</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Loading skeleton
 * ------------------------------------------------------------------ */
function StatsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-9 w-48" />
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[88px]" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
      </div>
      <Skeleton className="h-48" />
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Page
 * ------------------------------------------------------------------ */
export default function StatsPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let active = true;
    setLoading(true);
    setError(null);
    analyticsAPI
      .stats(token)
      .then((data) => {
        if (active) setStats(data);
      })
      .catch(() => {
        if (active) setError('Не удалось загрузить статистику. Попробуйте обновить страницу.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token]);

  if (loading) return <StatsSkeleton />;

  if (error) {
    return (
      <div>
        <h1 className="font-serif text-2xl font-semibold mb-6 text-[#F0EDE8]">Статистика</h1>
        <Card>
          <EmptyState
            title="Что-то пошло не так"
            subtitle={error}
            action={
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-lg bg-[#D9A441] text-[#0A0E1A] text-sm font-medium hover:bg-[#F4B860] transition-colors"
              >
                Обновить
              </button>
            }
          />
        </Card>
      </div>
    );
  }

  if (!stats) return null;

  const hasData = (stats.total_attempted ?? 0) > 0;

  if (!hasData) {
    return (
      <div>
        <h1 className="font-serif text-2xl font-semibold mb-1 text-[#F0EDE8]">Статистика</h1>
        <p className="text-sm text-[#A8A5A0] mb-6">Отслеживайте прогресс и готовьтесь точечно.</p>
        <Card>
          <EmptyState
            icon={
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3v18h18M7 16l4-5 3 3 5-7" />
              </svg>
            }
            title="Пока нет данных"
            subtitle="Начните решать задачи — и здесь появится разбор по темам, уровням и динамика вашего прогресса."
            action={
              <Link
                href="/app/bank"
                className="px-4 py-2 rounded-lg bg-[#D9A441] text-[#0A0E1A] text-sm font-medium hover:bg-[#F4B860] transition-colors"
              >
                Перейти к банку задач
              </Link>
            }
          />
        </Card>
      </div>
    );
  }

  const accColor = accuracyColor(stats.accuracy);
  const topics: TopicStat[] = stats.by_topic ?? [];
  const levels: LevelStat[] = stats.by_level ?? [];
  const answerTypes: AnswerTypeStat[] = stats.by_answer_type ?? [];
  const activity: RecentActivityDay[] = stats.recent_activity ?? [];
  const strengths = stats.strengths ?? [];
  const weaknesses = stats.weaknesses ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl font-semibold text-[#F0EDE8]">Статистика</h1>
        <p className="mt-1 text-sm text-[#A8A5A0]">
          Разбор вашего прогресса по темам и уровням — чтобы готовиться точечно.
        </p>
      </div>

      {/* Top tiles */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Tile
          icon="check"
          iconColor={DARK_THEME.success}
          value={stats.solved_problems}
          label="Решено задач"
          sub={`из ${stats.total_attempted} ${plural(stats.total_attempted, 'попытки', 'попыток', 'попыток')}`}
        />
        <Tile
          icon="target"
          iconColor={accColor}
          value={pct(stats.accuracy)}
          label="Точность"
        />
        <Tile
          icon="repeat"
          iconColor={DARK_THEME.info}
          value={stats.total_submissions}
          label="Всего попыток"
        />
        <Tile
          icon="play"
          iconColor={DARK_THEME.purple}
          value={`${stats.lessons_watched}/${stats.lessons_total}`}
          label="Уроков просмотрено"
        />
        <Tile
          icon="medal"
          iconColor={DARK_THEME.cyan}
          value={stats.mock_attempts}
          label="Пройдено пробников"
        />
        <Tile
          icon="trophy"
          iconColor={DARK_THEME.gold}
          value={stats.mock_attempts > 0 ? pct(stats.best_mock_percent) : '—'}
          label="Лучший результат пробника"
        />
      </div>

      {/* Strengths / weaknesses summary */}
      {(strengths.length > 0 || weaknesses.length > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[#5BD68A]">
                <StatIcon name="trophy" size={18} />
              </span>
              <h3 className="font-serif text-base font-semibold text-[#F0EDE8]">Сильные темы</h3>
            </div>
            {strengths.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {strengths.map((s) => (
                  <Badge key={s} color="success">{s}</Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#6A6860]">Пока не выделены — решайте больше задач в одной теме.</p>
            )}
          </Card>
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[#FF7B6D]">
                <StatIcon name="target" size={18} />
              </span>
              <h3 className="font-serif text-base font-semibold text-[#F0EDE8]">Над чем поработать</h3>
            </div>
            {weaknesses.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {weaknesses.map((w) => (
                  <Link key={w} href={`/app/bank?q=${encodeURIComponent(w)}`} className="focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF7B6D] rounded-full">
                    <Badge color="error">{w}</Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#6A6860]">Слабых тем не обнаружено — отличная работа!</p>
            )}
          </Card>
        </div>
      )}

      {/* Topics + levels */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* By topic */}
        <Card>
          <CardHeader
            title="Сильные и слабые темы"
            subtitle="Точность по темам, слабые — сверху"
          />
          {topics.length === 0 ? (
            <p className="text-sm text-[#6A6860] py-4">Нет данных по темам.</p>
          ) : (
            <div className="space-y-4">
              {topics.map((t) => {
                const isWeak = weaknesses.includes(t.tag);
                const isStrong = strengths.includes(t.tag);
                return (
                  <AccuracyBar
                    key={t.slug}
                    label={t.tag}
                    accuracy={t.accuracy}
                    attempted={t.attempted}
                    correct={t.correct}
                    tagBadge={
                      isWeak ? (
                        <Badge color="error">слабая</Badge>
                      ) : isStrong ? (
                        <Badge color="success">сильная</Badge>
                      ) : undefined
                    }
                  />
                );
              })}
            </div>
          )}
        </Card>

        {/* By level */}
        <Card>
          <CardHeader title="По уровням" subtitle="От школьного к заключительному" />
          {levels.length === 0 ? (
            <p className="text-sm text-[#6A6860] py-4">Нет данных по уровням.</p>
          ) : (
            <div className="space-y-4">
              {levels.map((l) => (
                <AccuracyBar
                  key={l.level || 'none'}
                  label={l.label}
                  accuracy={l.accuracy}
                  attempted={l.attempted}
                  correct={l.correct}
                />
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* By answer type */}
      <Card>
        <CardHeader title="По типам заданий" subtitle="Где вы решаете чаще и точнее" />
        {answerTypes.length === 0 ? (
          <p className="text-sm text-[#6A6860] py-4">Нет данных по типам заданий.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {answerTypes.map((a) => {
              const acc = a.attempted > 0 ? Math.round((100 * a.correct) / a.attempted) : 0;
              const color = accuracyColor(acc);
              return (
                <div
                  key={a.answer_type}
                  className="rounded-lg border border-[#1E2D4A] bg-[#152035] p-4"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-medium text-[#F0EDE8] truncate">
                      {answerTypeLabel(a.answer_type)}
                    </span>
                    <span className="text-sm font-semibold tabular-nums" style={{ color }}>
                      {pct(acc)}
                    </span>
                  </div>
                  <div className="mt-2.5 w-full h-2 rounded-full bg-[#1E2D4A] overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${Math.max(2, acc)}%`, backgroundColor: color, transition: 'width 0.5s ease' }}
                    />
                  </div>
                  <div className="mt-2 text-xs text-[#6A6860] tabular-nums">
                    {a.correct} из {a.attempted} {plural(a.attempted, 'задачи', 'задач', 'задач')}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Activity */}
      <Card>
        <CardHeader title="Активность за 30 дней" subtitle="Количество попыток по дням" />
        <ActivityStrip days={activity} />
      </Card>
    </div>
  );
}
