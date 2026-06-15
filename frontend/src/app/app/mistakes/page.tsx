'use client';

import { useCallback, useEffect, useState } from 'react';
import { homework, type Mistake, type Tag, type Paginated } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import {
  Card, Skeleton, EmptyState, Spinner, LevelBadge, Badge, useToast,
} from '@/components/ui';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import AnswerInput from '@/components/AnswerInput';

const LEVELS = [
  { value: '', label: 'Все уровни' },
  { value: 'school', label: 'Школьный' },
  { value: 'municipal', label: 'Муниципальный' },
  { value: 'regional', label: 'Региональный' },
  { value: 'final', label: 'Заключительный' },
];

export default function MistakesPage() {
  const { token } = useAuth();
  const [tags, setTags] = useState<Tag[]>([]);
  const [filters, setFilters] = useState({ level: '', tag: '' });
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Paginated<Mistake> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!token) return;
    homework.tags(token).then(setTags).catch(() => {});
  }, [token]);

  const load = useCallback(() => {
    if (!token) return;
    setLoading(true);
    setError(false);
    homework
      .mistakes(token, { ...filters, page })
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [token, filters, page]);

  useEffect(() => { load(); }, [load]);

  const setFilter = (k: string, v: string) => { setPage(1); setFilters((f) => ({ ...f, [k]: v })); };
  const results = data?.results ?? [];

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-6">
        <h1 className="font-serif text-2xl font-semibold text-[#F0EDE8]">Мои ошибки</h1>
        <p className="text-sm text-[#A8A5A0] mt-1">
          Все задачи, где вы ошиблись — собраны в одном месте для повторения перед олимпиадой.
        </p>
      </header>

      <Card className="mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <select className="rounded-lg bg-[#070C18] border border-[#1E2D4A] px-3 py-2 text-sm text-[#F0EDE8]" value={filters.level} onChange={(e) => setFilter('level', e.target.value)}>
            {LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
          <select className="rounded-lg bg-[#070C18] border border-[#1E2D4A] px-3 py-2 text-sm text-[#F0EDE8]" value={filters.tag} onChange={(e) => setFilter('tag', e.target.value)}>
            <option value="">Все темы</option>
            {tags.map((t) => <option key={t.id} value={t.slug}>{t.name}</option>)}
          </select>
        </div>
      </Card>

      {loading ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-32 w-full" />)}</div>
      ) : error ? (
        <EmptyState title="Не удалось загрузить" subtitle="Попробуйте обновить страницу." />
      ) : results.length === 0 ? (
        <EmptyState
          icon={<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
          title="Ошибок нет — отличная работа!"
          subtitle="Когда вы ошибётесь в задаче, она появится здесь для повторения."
        />
      ) : (
        <>
          <p className="text-sm text-[#6A6860] mb-3">Задач с ошибками: {data?.count ?? results.length}</p>
          <div className="space-y-3">
            {results.map((m) => (
              <MistakeCard key={m.problem.id} mistake={m} token={token!} onResolved={load} />
            ))}
          </div>
          {(data?.previous || data?.next) && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <button disabled={!data?.previous} onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-4 py-2 rounded-lg border border-[#1E2D4A] text-sm text-[#A8A5A0] hover:bg-[#152035] disabled:opacity-40 disabled:pointer-events-none">← Назад</button>
              <span className="text-sm text-[#6A6860]">Стр. {page}</span>
              <button disabled={!data?.next} onClick={() => setPage((p) => p + 1)} className="px-4 py-2 rounded-lg border border-[#1E2D4A] text-sm text-[#A8A5A0] hover:bg-[#152035] disabled:opacity-40 disabled:pointer-events-none">Вперёд →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function formatAnswer(answer: any): string {
  if (answer == null) return '—';
  if (typeof answer === 'object') {
    if ('text' in answer) return String(answer.text);
    if ('value' in answer) return String(answer.value);
    if ('latex' in answer) return String(answer.latex);
    if ('option_id' in answer) return `вариант #${answer.option_id}`;
    if ('option_ids' in answer) return `варианты: ${(answer.option_ids || []).join(', ')}`;
    return JSON.stringify(answer);
  }
  return String(answer);
}

function MistakeCard({ mistake, token, onResolved }: { mistake: Mistake; token: string; onResolved: () => void; }) {
  const { show } = useToast();
  const { problem, submission } = mistake;
  const [open, setOpen] = useState(false);
  const [answer, setAnswer] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  const retry = async () => {
    if (answer == null) { show('Введите ответ', 'info'); return; }
    setSubmitting(true);
    try {
      const res: any = await homework.submit(token, problem.id, answer);
      if (res?.is_correct) { show('Верно! Задача решена', 'success'); onResolved(); }
      else show('Снова неверно — посмотрите разбор', 'error');
    } catch {
      show('Не удалось отправить', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <div className="flex flex-wrap items-center gap-2 mb-2">
        {problem.title && <span className="font-medium text-[#F0EDE8]">{problem.title}</span>}
        {problem.level && <LevelBadge level={problem.level} />}
        <Badge color="error">Ошибка</Badge>
      </div>
      <div className="text-sm text-[#D7D3CC] mb-2"><MarkdownRenderer content={problem.statement} /></div>
      <div className="flex flex-wrap items-center gap-1.5 mb-2">
        {(problem.tags ?? []).map((t) => (
          <span key={t.id} className="text-xs text-[#7AB6F5] bg-[rgba(122,182,245,0.1)] rounded px-2 py-0.5">#{t.name}</span>
        ))}
      </div>
      <p className="text-sm text-[#FF7B6D] mb-3">Ваш ответ: <span className="text-[#D7D3CC]">{formatAnswer(submission?.answer)}</span></p>

      {problem.solution && (
        <div className="rounded-lg bg-[#152035] border border-[#1E2D4A] p-3 mb-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#D9A441] mb-1.5">Разбор</p>
          <div className="text-sm text-[#D7D3CC]"><MarkdownRenderer content={problem.solution} /></div>
        </div>
      )}

      <button onClick={() => setOpen((o) => !o)} className="text-sm font-medium text-[#4ECDD4] hover:text-[#6EE8EE]">
        {open ? 'Свернуть' : 'Решить заново →'}
      </button>
      {open && (
        <div className="mt-3 border-t border-[#1E2D4A] pt-3 space-y-3">
          <AnswerInput answerType={problem.answer_type || 'text'} options={problem.options} value={answer} onChange={setAnswer} disabled={submitting} />
          <button onClick={retry} disabled={submitting} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#D9A441] text-[#070C18] text-sm font-semibold hover:bg-[#F4B860] disabled:opacity-60">
            {submitting && <Spinner size={16} />} Проверить
          </button>
        </div>
      )}
    </Card>
  );
}
