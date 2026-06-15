'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAuth } from '@/lib/auth';
import {
  homework as hwAPI,
  engagement as engagementAPI,
  unwrap,
  Problem,
  Tag,
} from '@/lib/api';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import {
  Card,
  Spinner,
  Skeleton,
  EmptyState,
  LevelBadge,
  ProblemStatusBadge,
  Badge,
  useToast,
} from '@/components/ui';

const MathField = dynamic(() => import('@/components/MathField'), { ssr: false });

/* ------------------------------------------------------------------ *
 * Constants
 * ------------------------------------------------------------------ */
const PAGE_SIZE = 20; // matches DRF default page size used by /problems/bank

const LEVELS: { value: string; label: string }[] = [
  { value: 'school', label: 'Школьный' },
  { value: 'municipal', label: 'Муниципальный' },
  { value: 'regional', label: 'Региональный' },
  { value: 'final', label: 'Заключительный' },
];

const ANSWER_TYPES: { value: string; label: string }[] = [
  { value: 'number', label: 'Число' },
  { value: 'text', label: 'Текст' },
  { value: 'formula', label: 'Формула' },
  { value: 'choice', label: 'Выбор варианта' },
];

const STATUSES: { value: string; label: string }[] = [
  { value: 'correct', label: 'Решено' },
  { value: 'not_started', label: 'Не решено' },
  { value: 'wrong', label: 'С ошибкой' },
];

/* ------------------------------------------------------------------ *
 * Shared select / input styling
 * ------------------------------------------------------------------ */
const fieldClass =
  'bg-[#152035] border border-[#1E2D4A] rounded-lg px-3 py-2 text-sm text-[#F0EDE8] placeholder-[#6A6860] focus:outline-none focus:border-[#4ECDD4] focus:ring-1 focus:ring-[#4ECDD4] transition-colors';

/* ------------------------------------------------------------------ *
 * Answer input (per answer_type) — reused by the inline solver
 * ------------------------------------------------------------------ */
function AnswerInput({
  problem,
  value,
  onChange,
  disabled,
}: {
  problem: Problem;
  value: any;
  onChange: (v: any) => void;
  disabled?: boolean;
}) {
  const type = problem.answer_type || 'text';
  const isMulti = type === 'choice_multiple';
  const isChoice = type === 'choice' || type === 'choice_single' || isMulti;

  if (isChoice && problem.options && problem.options.length > 0) {
    const selected: number[] = Array.isArray(value) ? value : value != null ? [value] : [];
    return (
      <div className="space-y-2" role={isMulti ? 'group' : 'radiogroup'}>
        {problem.options.map((opt) => {
          const checked = selected.includes(opt.id);
          return (
            <label
              key={opt.id}
              className={`flex items-start gap-2.5 p-3 border rounded-lg cursor-pointer transition-colors ${
                checked
                  ? 'border-[#4ECDD4] bg-[rgba(78,205,212,0.08)]'
                  : 'border-[#1E2D4A] hover:bg-[#152035]'
              } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <input
                type={isMulti ? 'checkbox' : 'radio'}
                name={`problem-${problem.id}`}
                disabled={disabled}
                checked={checked}
                onChange={(e) => {
                  if (isMulti) {
                    const next = new Set(selected);
                    e.target.checked ? next.add(opt.id) : next.delete(opt.id);
                    onChange(Array.from(next));
                  } else {
                    onChange(opt.id);
                  }
                }}
                className="mt-0.5 accent-[#4ECDD4] flex-shrink-0"
              />
              <span className="text-sm text-[#F0EDE8] min-w-0">
                <MarkdownRenderer content={opt.text} />
              </span>
            </label>
          );
        })}
      </div>
    );
  }

  if (type === 'number') {
    return (
      <input
        type="number"
        step="any"
        disabled={disabled}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Введите число..."
        className={`w-full ${fieldClass} disabled:opacity-60`}
      />
    );
  }

  if (type === 'formula') {
    return (
      <MathField
        value={typeof value === 'string' ? value : ''}
        onChange={(latex: string) => onChange(latex)}
        placeholder="Введите формулу..."
      />
    );
  }

  // text (default)
  return (
    <textarea
      rows={3}
      disabled={disabled}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Введите ответ..."
      className={`w-full ${fieldClass} resize-y disabled:opacity-60`}
    />
  );
}

function answerIsEmpty(v: any): boolean {
  if (v == null) return true;
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === 'string') return v.trim() === '';
  return false;
}

/* ------------------------------------------------------------------ *
 * Inline solver — answer, submit, reveal «Разбор»
 * ------------------------------------------------------------------ */
function ProblemSolver({
  problem,
  token,
  onStatusChange,
}: {
  problem: Problem;
  token: string;
  onStatusChange?: (status: string) => void;
}) {
  const { show } = useToast();
  const [answer, setAnswer] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    is_correct: boolean | null;
    score: number | null;
    max_score: number | null;
    status?: string;
  } | null>(null);
  const [solution, setSolution] = useState<string | null>(problem.solution ?? null);
  const [correctAnswer, setCorrectAnswer] = useState<string | null>(
    problem.correct_answer ?? null
  );
  const [showSolution, setShowSolution] = useState(false);

  const handleSubmit = async () => {
    if (answerIsEmpty(answer)) return;
    setSubmitting(true);
    try {
      // Map the raw input value to the dict payload the backend grader expects.
      const type = problem.answer_type || 'text';
      let payload: any;
      if (type === 'choice_multiple') payload = { option_ids: Array.isArray(answer) ? answer : [answer] };
      else if (type === 'choice' || type === 'choice_single') payload = { option_id: answer };
      else if (type === 'number') payload = { value: answer };
      else if (type === 'formula') payload = { latex: answer };
      else payload = { text: answer };
      const res: any = await hwAPI.submit(token, problem.id, payload);
      const isCorrect =
        res?.is_correct ?? (res?.status === 'correct' ? true : res?.status === 'wrong' ? false : null);
      setResult({
        is_correct: isCorrect,
        score: res?.score ?? null,
        max_score: res?.max_score ?? problem.max_score ?? null,
        status: res?.status,
      });
      if (res?.solution) setSolution(res.solution);
      if (res?.correct_answer != null) setCorrectAnswer(String(res.correct_answer));
      // Reveal the breakdown automatically once an answer has been checked.
      if (isCorrect !== null) setShowSolution(true);
      const newStatus =
        isCorrect === true ? 'correct' : isCorrect === false ? 'wrong' : 'pending';
      onStatusChange?.(newStatus);
      if (isCorrect === true) show('Верно! Ответ принят', 'success');
      else if (isCorrect === false) show('Неверно — посмотрите разбор', 'error');
      else show('Ответ отправлен на проверку', 'info');
    } catch (e: any) {
      show(e?.detail || 'Не удалось отправить ответ', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const hasSolution = !!(solution || correctAnswer);

  return (
    <div className="mt-4 border-t border-[#1E2D4A] pt-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-[#6A6860] mb-2">
        Ваш ответ
      </p>
      <AnswerInput
        problem={problem}
        value={answer}
        onChange={setAnswer}
        disabled={submitting}
      />

      <div className="flex flex-wrap items-center gap-3 mt-4">
        <button
          onClick={handleSubmit}
          disabled={submitting || answerIsEmpty(answer)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#D9A441] text-[#070C18] text-sm font-medium rounded-lg hover:bg-[#F4B860] disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D1525] focus-visible:ring-[#D9A441]"
        >
          {submitting && <Spinner size={16} className="border-t-[#070C18]" />}
          {submitting ? 'Отправка...' : 'Проверить'}
        </button>

        {hasSolution && (
          <button
            onClick={() => setShowSolution((v) => !v)}
            className="text-sm text-[#4ECDD4] hover:text-[#6EE8EE] transition-colors focus:outline-none focus-visible:underline"
          >
            {showSolution ? 'Скрыть разбор' : 'Показать разбор'}
          </button>
        )}
      </div>

      {/* Result banner */}
      {result && (
        <div
          className={`mt-4 px-4 py-3 rounded-lg text-sm border ${
            result.is_correct === true
              ? 'bg-[rgba(91,214,138,0.10)] border-[rgba(91,214,138,0.3)] text-[#5BD68A]'
              : result.is_correct === false
              ? 'bg-[rgba(255,123,109,0.10)] border-[rgba(255,123,109,0.3)] text-[#FF7B6D]'
              : 'bg-[rgba(255,181,71,0.10)] border-[rgba(255,181,71,0.3)] text-[#FFB547]'
          }`}
        >
          {result.is_correct === true &&
            `Верно!${
              result.score != null
                ? ` Баллы: ${result.score}${result.max_score != null ? `/${result.max_score}` : ''}`
                : ''
            }`}
          {result.is_correct === false &&
            `Неверно.${
              result.score != null
                ? ` Баллы: ${result.score}${result.max_score != null ? `/${result.max_score}` : ''}`
                : ''
            } Разберите решение ниже.`}
          {result.is_correct === null && 'Ответ отправлен на проверку преподавателю.'}
        </div>
      )}

      {/* Solution / breakdown */}
      {showSolution && hasSolution && (
        <div className="mt-4 rounded-lg border border-[rgba(217,164,65,0.25)] bg-[rgba(217,164,65,0.06)] p-4">
          <p className="font-serif text-sm font-semibold text-[#D9A441] mb-2">Разбор</p>
          {correctAnswer && (
            <p className="text-sm text-[#A8A5A0] mb-2">
              Правильный ответ:{' '}
              <span className="text-[#F0EDE8] font-medium">{correctAnswer}</span>
            </p>
          )}
          {solution && (
            <div className="prose-dark text-sm">
              <MarkdownRenderer content={solution} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Favorite (star) toggle button
 * ------------------------------------------------------------------ */
function FavoriteButton({
  problemId,
  token,
  initial,
}: {
  problemId: number;
  token: string;
  initial?: boolean;
}) {
  const { show } = useToast();
  const [fav, setFav] = useState(!!initial);
  const [busy, setBusy] = useState(false);

  const toggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    const optimistic = !fav;
    setFav(optimistic);
    try {
      const res = await engagementAPI.toggleFavorite(token, { problem_id: problemId });
      setFav(res.favorited);
      show(res.favorited ? 'Добавлено в избранное' : 'Удалено из избранного', 'info');
    } catch {
      setFav(!optimistic);
      show('Не удалось изменить избранное', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={toggle}
      aria-pressed={fav}
      aria-label={fav ? 'Убрать из избранного' : 'В избранное'}
      title={fav ? 'В избранном' : 'В избранное'}
      className="flex-shrink-0 p-1.5 rounded-lg hover:bg-[#152035] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D9A441]"
    >
      <svg
        width={20}
        height={20}
        viewBox="0 0 24 24"
        fill={fav ? '#D9A441' : 'none'}
        stroke={fav ? '#D9A441' : '#6A6860'}
        strokeWidth={1.5}
        strokeLinejoin="round"
      >
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    </button>
  );
}

/* ------------------------------------------------------------------ *
 * Problem card (collapsed -> expands to inline solver)
 * ------------------------------------------------------------------ */
function plainExcerpt(md: string, n = 160): string {
  const text = (md || '')
    .replace(/\$\$[\s\S]*?\$\$/g, ' [формула] ')
    .replace(/\$[^$\n]+?\$/g, ' [формула] ')
    .replace(/[#>*_`~\[\]()]/g, '')
    .replace(/!\S+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > n ? `${text.slice(0, n)}…` : text;
}

function ProblemCard({
  problem,
  token,
  favorited,
}: {
  problem: Problem;
  token: string;
  favorited?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<string>(problem.status || 'none');

  const title =
    (problem as any).title ||
    `Задача №${problem.id}`;

  return (
    <Card className="p-0 overflow-hidden hover:border-[#253558] transition-colors">
      <div className="flex items-start gap-3 p-5">
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex-1 min-w-0 text-left focus:outline-none"
        >
          <div className="flex items-center gap-2 flex-wrap mb-2">
            {problem.level && <LevelBadge level={problem.level} />}
            <ProblemStatusBadge status={status} />
            {problem.answer_type && (
              <Badge color="muted">
                {ANSWER_TYPES.find((a) => a.value === problem.answer_type)?.label ||
                  problem.answer_type}
              </Badge>
            )}
          </div>
          <h3 className="font-serif text-base font-semibold text-[#F0EDE8] mb-1.5">
            {title}
          </h3>
          <p className="text-sm text-[#A8A5A0] leading-relaxed">
            {plainExcerpt(problem.statement)}
          </p>
          {problem.tags && problem.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {problem.tags.map((t) => (
                <span
                  key={t.id}
                  className="text-xs px-2 py-0.5 rounded-full bg-[#152035] text-[#A8A5A0] border border-[#1E2D4A]"
                >
                  #{t.name}
                </span>
              ))}
            </div>
          )}
        </button>

        <div className="flex items-center gap-1 flex-shrink-0">
          <FavoriteButton problemId={problem.id} token={token} initial={favorited} />
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Свернуть' : 'Решить'}
            className="p-1.5 rounded-lg hover:bg-[#152035] transition-colors text-[#6A6860]"
          >
            <svg
              className={`w-5 h-5 transition-transform ${open ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div className="px-5 pb-5">
          <div className="prose-dark text-sm rounded-lg bg-[#0A1020] border border-[#1E2D4A] p-4">
            <MarkdownRenderer content={problem.statement} />
          </div>
          <ProblemSolver problem={problem} token={token} onStatusChange={setStatus} />
        </div>
      )}
    </Card>
  );
}

/* ------------------------------------------------------------------ *
 * Filter select
 * ------------------------------------------------------------------ */
function Select({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
}) {
  return (
    <label className="flex flex-col gap-1.5 min-w-0">
      <span className="text-xs font-medium text-[#6A6860]">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${fieldClass} cursor-pointer`}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/* ------------------------------------------------------------------ *
 * Main page content
 * ------------------------------------------------------------------ */
function BankContent() {
  const { token } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initial filter state seeded from URL query (links from other pages work).
  const [level, setLevel] = useState(searchParams.get('level') || '');
  const [tag, setTag] = useState(searchParams.get('tag') || '');
  const [answerType, setAnswerType] = useState(searchParams.get('answer_type') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [q, setQ] = useState(searchParams.get('q') || '');
  const [searchInput, setSearchInput] = useState(searchParams.get('q') || '');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);

  const [tags, setTags] = useState<Tag[]>([]);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [favIds, setFavIds] = useState<Set<number>>(new Set());
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const firstRender = useRef(true);

  // Load tags + favorites once.
  useEffect(() => {
    if (!token) return;
    hwAPI
      .tags(token)
      .then((data) => setTags(unwrap<Tag>(data)))
      .catch(() => {});
    engagementAPI
      .favorites(token)
      .then((data) => {
        const ids = new Set((data?.problems || []).map((p) => p.id));
        setFavIds(ids);
      })
      .catch(() => {});
  }, [token]);

  // Keep URL in sync with filters (so the view is shareable / bookmarkable).
  useEffect(() => {
    if (firstRender.current) return;
    const sp = new URLSearchParams();
    if (q) sp.set('q', q);
    if (level) sp.set('level', level);
    if (tag) sp.set('tag', tag);
    if (answerType) sp.set('answer_type', answerType);
    if (status) sp.set('status', status);
    if (page > 1) sp.set('page', String(page));
    const query = sp.toString();
    router.replace(query ? `/app/bank?${query}` : '/app/bank', { scroll: false });
  }, [q, level, tag, answerType, status, page, router]);

  // Fetch problems whenever filters/page change.
  const fetchProblems = useCallback(() => {
    if (!token) return;
    setLoading(true);
    setError(false);
    hwAPI
      .bank(token, {
        level: level || undefined,
        tag: tag || undefined,
        answer_type: answerType || undefined,
        status: status || undefined,
        q: q || undefined,
        page,
      })
      .then((data) => {
        setProblems(unwrap<Problem>(data));
        setCount((data as any)?.count ?? unwrap<Problem>(data).length);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [token, level, tag, answerType, status, q, page]);

  useEffect(() => {
    fetchProblems();
    firstRender.current = false;
  }, [fetchProblems]);

  // Reset to page 1 when a filter (not the page itself) changes.
  const setFilter = (setter: (v: string) => void) => (v: string) => {
    setter(v);
    setPage(1);
  };

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQ(searchInput.trim());
    setPage(1);
  };

  const resetFilters = () => {
    setLevel('');
    setTag('');
    setAnswerType('');
    setStatus('');
    setQ('');
    setSearchInput('');
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const hasFilters = !!(level || tag || answerType || status || q);

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-6">
        <h1 className="font-serif text-2xl md:text-3xl font-bold text-[#F0EDE8]">
          Банк задач
        </h1>
        <p className="text-sm text-[#A8A5A0] mt-1">
          Решайте задачи по уровням и темам, проверяйте ответы и сразу смотрите разбор.
        </p>
      </header>

      {/* Filter bar */}
      <Card className="mb-6">
        <form onSubmit={submitSearch} className="relative mb-4">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6A6860] pointer-events-none">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35" />
            </svg>
          </span>
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Поиск по условию задачи..."
            aria-label="Поиск задач"
            className={`w-full pl-9 pr-24 py-2.5 ${fieldClass}`}
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#152035] hover:bg-[#1E2D4A] border border-[#1E2D4A] text-[#F0EDE8] text-sm rounded-md transition-colors"
          >
            Найти
          </button>
        </form>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Select
            label="Уровень"
            value={level}
            onChange={setFilter(setLevel)}
            options={LEVELS}
            placeholder="Все уровни"
          />
          <Select
            label="Тема"
            value={tag}
            onChange={setFilter(setTag)}
            options={tags.map((t) => ({
              value: t.slug,
              label: t.problem_count != null ? `${t.name} (${t.problem_count})` : t.name,
            }))}
            placeholder="Все темы"
          />
          <Select
            label="Тип ответа"
            value={answerType}
            onChange={setFilter(setAnswerType)}
            options={ANSWER_TYPES}
            placeholder="Любой"
          />
          <Select
            label="Статус"
            value={status}
            onChange={setFilter(setStatus)}
            options={STATUSES}
            placeholder="Любой"
          />
        </div>

        {hasFilters && (
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#1E2D4A]">
            <span className="text-xs text-[#6A6860]">
              {loading ? 'Поиск...' : `Найдено: ${count}`}
            </span>
            <button
              onClick={resetFilters}
              className="text-sm text-[#4ECDD4] hover:text-[#6EE8EE] transition-colors"
            >
              Сбросить фильтры
            </button>
          </div>
        )}
      </Card>

      {/* Results */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <Skeleton className="h-5 w-24 mb-3" />
              <Skeleton className="h-5 w-2/3 mb-2" />
              <Skeleton className="h-4 w-full mb-1.5" />
              <Skeleton className="h-4 w-4/5" />
            </Card>
          ))}
        </div>
      ) : error ? (
        <EmptyState
          icon={
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
          }
          title="Не удалось загрузить задачи"
          subtitle="Проверьте соединение и попробуйте ещё раз."
          action={
            <button
              onClick={fetchProblems}
              className="px-4 py-2 bg-[#D9A441] text-[#070C18] text-sm font-medium rounded-lg hover:bg-[#F4B860] transition-colors"
            >
              Повторить
            </button>
          }
        />
      ) : problems.length === 0 ? (
        <EmptyState
          icon={
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35" />
            </svg>
          }
          title="Задачи не найдены"
          subtitle={
            hasFilters
              ? 'Попробуйте изменить или сбросить фильтры.'
              : 'В банке пока нет задач.'
          }
          action={
            hasFilters ? (
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-[#152035] border border-[#1E2D4A] text-[#F0EDE8] text-sm font-medium rounded-lg hover:bg-[#1E2D4A] transition-colors"
              >
                Сбросить фильтры
              </button>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="space-y-4">
            {problems.map((p) => (
              <ProblemCard
                key={p.id}
                problem={p}
                token={token!}
                favorited={favIds.has(p.id)}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-2 rounded-lg bg-[#0D1525] border border-[#1E2D4A] text-sm text-[#F0EDE8] hover:bg-[#152035] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ← Назад
              </button>
              <span className="px-3 text-sm text-[#A8A5A0]">
                Стр. <span className="text-[#F0EDE8] font-medium">{page}</span> из {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-2 rounded-lg bg-[#0D1525] border border-[#1E2D4A] text-sm text-[#F0EDE8] hover:bg-[#152035] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Вперёд →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function BankPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-16">
          <Spinner size={32} />
        </div>
      }
    >
      <BankContent />
    </Suspense>
  );
}
