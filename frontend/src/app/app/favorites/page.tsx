'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import {
  engagement as engagementAPI,
  Favorite,
  Lesson,
  Problem,
} from '@/lib/api';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import {
  Card,
  Skeleton,
  EmptyState,
  LevelBadge,
  LessonTypeBadge,
  ProblemStatusBadge,
  useToast,
} from '@/components/ui';

/* ------------------------------------------------------------------ *
 * Icons
 * ------------------------------------------------------------------ */
function Icon({ name, size = 18, className }: { name: string; size?: number; className?: string }) {
  const paths: Record<string, string> = {
    heart: 'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7z',
    play: 'M5 3l14 9-14 9V3z',
    chevronRight: 'M9 18l6-6-6-6',
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}

/* A solid heart used for the "remove from favorites" button. */
function HeartFilled({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7z" />
    </svg>
  );
}

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

// Build a route for a favorited lesson. The favorites payload may or may not
// carry a course id, so fall back to the standalone lesson resolver route.
function lessonHref(lesson: Lesson & { course_id?: number; course?: number }): string {
  const courseId = (lesson as any).course_id ?? (lesson as any).course;
  if (courseId) return `/app/courses/${courseId}/lessons/${lesson.id}`;
  // Fallback: the lesson page can resolve its own course from the id.
  return `/app/lessons/${lesson.id}`;
}

// Trim a problem statement down to a readable single-paragraph excerpt while
// keeping inline LaTeX intact for the renderer.
function statementExcerpt(statement: string, max = 240): string {
  const oneLine = statement.replace(/\s*\n\s*/g, ' ').trim();
  if (oneLine.length <= max) return oneLine;
  return oneLine.slice(0, max).replace(/\s+\S*$/, '') + '…';
}

/* ------------------------------------------------------------------ *
 * Remove button
 * ------------------------------------------------------------------ */
function RemoveFavoriteButton({
  onRemove,
  pending,
  label,
}: {
  onRemove: () => void;
  pending: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onRemove}
      disabled={pending}
      aria-label={label}
      title={label}
      className="flex-shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-lg border border-[#1E2D4A] text-[#D9A441] hover:text-[#FF7B6D] hover:border-[rgba(255,123,109,0.4)] hover:bg-[rgba(255,123,109,0.08)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF7B6D] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
    >
      <HeartFilled size={16} />
    </button>
  );
}

/* ------------------------------------------------------------------ *
 * Page
 * ------------------------------------------------------------------ */
export default function FavoritesPage() {
  const { token } = useAuth();
  const toast = useToast();

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!token) return;
    let active = true;
    setLoading(true);
    setError(false);
    engagementAPI
      .favorites(token)
      .then((data: Favorite) => {
        if (!active) return;
        setLessons(Array.isArray(data?.lessons) ? data.lessons : []);
        setProblems(Array.isArray(data?.problems) ? data.problems : []);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token]);

  const markPending = (key: string, on: boolean) => {
    setPendingIds((prev) => {
      const next = new Set(prev);
      if (on) next.add(key);
      else next.delete(key);
      return next;
    });
  };

  const removeLesson = async (lesson: Lesson) => {
    if (!token) return;
    const key = `lesson-${lesson.id}`;
    if (pendingIds.has(key)) return;
    markPending(key, true);
    // Optimistic removal.
    const prev = lessons;
    setLessons((cur) => cur.filter((l) => l.id !== lesson.id));
    try {
      await engagementAPI.toggleFavorite(token, { lesson_id: lesson.id });
      toast.show('Удалено из избранного', 'info');
    } catch {
      setLessons(prev); // rollback
      toast.show('Не удалось удалить. Попробуйте ещё раз', 'error');
    } finally {
      markPending(key, false);
    }
  };

  const removeProblem = async (problem: Problem) => {
    if (!token) return;
    const key = `problem-${problem.id}`;
    if (pendingIds.has(key)) return;
    markPending(key, true);
    const prev = problems;
    setProblems((cur) => cur.filter((p) => p.id !== problem.id));
    try {
      await engagementAPI.toggleFavorite(token, { problem_id: problem.id });
      toast.show('Удалено из избранного', 'info');
    } catch {
      setProblems(prev);
      toast.show('Не удалось удалить. Попробуйте ещё раз', 'error');
    } finally {
      markPending(key, false);
    }
  };

  const totalCount = lessons.length + problems.length;

  return (
    <div className="max-w-4xl">
      <header className="mb-6">
        <h1 className="font-serif text-2xl font-bold text-[#F0EDE8]">Избранное</h1>
        <p className="text-sm text-[#A8A5A0] mt-1">
          Сохранённые уроки и задачи для повторения.
        </p>
      </header>

      {/* Loading */}
      {loading && (
        <div className="space-y-8">
          <section>
            <Skeleton className="h-5 w-28 mb-4" />
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </section>
          <section>
            <Skeleton className="h-5 w-28 mb-4" />
            <div className="space-y-3">
              {[0, 1].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          </section>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <Card>
          <EmptyState
            icon={<Icon name="heart" size={40} />}
            title="Не удалось загрузить избранное"
            subtitle="Что-то пошло не так. Обновите страницу или попробуйте позже."
          />
        </Card>
      )}

      {/* Empty */}
      {!loading && !error && totalCount === 0 && (
        <Card>
          <EmptyState
            icon={<Icon name="heart" size={40} />}
            title="Пока нет избранного"
            subtitle="Сохраняйте сложные материалы для повторения — они появятся здесь."
            action={
              <Link
                href="/app/bank"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#D9A441] text-[#0A0E1A] text-sm font-medium rounded-lg hover:bg-[#F4B860] transition-colors"
              >
                Перейти в банк задач
                <Icon name="chevronRight" size={16} />
              </Link>
            }
          />
        </Card>
      )}

      {/* Content */}
      {!loading && !error && totalCount > 0 && (
        <div className="space-y-8">
          {/* Lessons */}
          <section>
            <div className="flex items-baseline gap-2 mb-4">
              <h2 className="font-serif text-lg font-semibold text-[#F0EDE8]">Уроки</h2>
              <span className="text-sm text-[#6A6860]">{lessons.length}</span>
            </div>
            {lessons.length === 0 ? (
              <Card>
                <p className="text-sm text-[#6A6860] text-center py-2">
                  Нет сохранённых уроков.
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {lessons.map((lesson) => {
                  const key = `lesson-${lesson.id}`;
                  return (
                    <Card
                      key={lesson.id}
                      className="flex items-center gap-4 hover:border-[#253558] transition-colors !py-4"
                    >
                      <Link
                        href={lessonHref(lesson)}
                        className="flex items-center gap-4 min-w-0 flex-1 group"
                      >
                        <span className="flex-shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[rgba(78,205,212,0.1)] text-[#4ECDD4]">
                          <Icon name="play" size={18} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-medium text-[#F0EDE8] group-hover:text-[#4ECDD4] transition-colors truncate">
                              {lesson.title}
                            </h3>
                            {lesson.lesson_type && (
                              <LessonTypeBadge type={lesson.lesson_type} />
                            )}
                          </div>
                          {lesson.homework_status && lesson.homework_status !== 'none' && (
                            <div className="mt-1.5">
                              <ProblemStatusBadge status={lesson.homework_status} />
                            </div>
                          )}
                        </div>
                      </Link>
                      <RemoveFavoriteButton
                        onRemove={() => removeLesson(lesson)}
                        pending={pendingIds.has(key)}
                        label="Убрать урок из избранного"
                      />
                    </Card>
                  );
                })}
              </div>
            )}
          </section>

          {/* Problems */}
          <section>
            <div className="flex items-baseline gap-2 mb-4">
              <h2 className="font-serif text-lg font-semibold text-[#F0EDE8]">Задачи</h2>
              <span className="text-sm text-[#6A6860]">{problems.length}</span>
            </div>
            {problems.length === 0 ? (
              <Card>
                <p className="text-sm text-[#6A6860] text-center py-2">
                  Нет сохранённых задач.
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {problems.map((problem) => {
                  const key = `problem-${problem.id}`;
                  return (
                    <Card
                      key={problem.id}
                      className="hover:border-[#253558] transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            {problem.level && <LevelBadge level={problem.level} />}
                            {problem.status && problem.status !== 'none' && (
                              <ProblemStatusBadge status={problem.status} />
                            )}
                            {problem.tags?.slice(0, 3).map((t) => (
                              <span
                                key={t.id}
                                className="text-xs text-[#6A6860] bg-[#152035] rounded-full px-2 py-0.5"
                              >
                                {t.name}
                              </span>
                            ))}
                          </div>
                          <Link
                            href={`/app/bank?problem=${problem.id}`}
                            className="block group"
                          >
                            <MarkdownRenderer
                              content={statementExcerpt(problem.statement)}
                              className="text-sm text-[#A8A5A0] group-hover:text-[#F0EDE8] transition-colors [&_p]:my-0"
                            />
                            <span className="inline-flex items-center gap-1 mt-2.5 text-sm text-[#4ECDD4] group-hover:text-[#6EE8EE] font-medium transition-colors">
                              Решать
                              <Icon name="chevronRight" size={15} />
                            </span>
                          </Link>
                        </div>
                        <RemoveFavoriteButton
                          onRemove={() => removeProblem(problem)}
                          pending={pendingIds.has(key)}
                          label="Убрать задачу из избранного"
                        />
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
