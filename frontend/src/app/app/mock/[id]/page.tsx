'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { olympiads, type Attempt, type AttemptResult, type Problem } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Card, Spinner, EmptyState, Badge, useToast } from '@/components/ui';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import AnswerInput from '@/components/AnswerInput';

type Phase = 'loading' | 'running' | 'results' | 'error';

function fmt(ms: number): string {
  if (ms < 0) ms = 0;
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatAnswer(a: any): string {
  if (a == null || a === '') return '—';
  if (typeof a === 'string') return a;
  if (typeof a === 'object') {
    if ('text' in a) return String(a.text);
    if ('value' in a) return String(a.value);
    if ('latex' in a) return String(a.latex);
    if ('option_id' in a) return `вариант #${a.option_id}`;
    if ('correct_option_id' in a) return `вариант #${a.correct_option_id}`;
    if ('option_ids' in a) return `варианты: ${(a.option_ids || []).join(', ')}`;
    if ('correct_option_ids' in a) return `варианты: ${(a.correct_option_ids || []).join(', ')}`;
    return JSON.stringify(a);
  }
  return String(a);
}

export default function MockRunnerPage() {
  const params = useParams();
  const mockId = Number(params?.id);
  const router = useRouter();
  const { token } = useAuth();
  const { show } = useToast();

  const [phase, setPhase] = useState<Phase>('loading');
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [deadline, setDeadline] = useState<number>(0);
  const [offset, setOffset] = useState<number>(0); // serverNow - clientNow
  const [remaining, setRemaining] = useState<number>(0);
  const [results, setResults] = useState<AttemptResult | null>(null);
  const [finishing, setFinishing] = useState(false);
  const finishedRef = useRef(false);

  const doFinish = useCallback(
    async (attId: number, silent = false) => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      setFinishing(true);
      try {
        // Persist any answers currently in state before grading.
        await Promise.all(
          Object.entries(answers).map(([pid, ans]) =>
            olympiads.answer(token!, attId, Number(pid), ans).catch(() => {})
          )
        );
        const res = await olympiads.finish(token!, attId);
        setResults(res);
        setPhase('results');
        if (!silent) show('Тур завершён', 'success');
      } catch {
        show('Не удалось завершить тур', 'error');
        finishedRef.current = false;
      } finally {
        setFinishing(false);
      }
    },
    [answers, token, show]
  );

  // Start (or resume) the attempt on mount.
  useEffect(() => {
    if (!token || !mockId) return;
    let cancelled = false;
    (async () => {
      try {
        const started: Attempt = await olympiads.start(token, mockId);
        const attId = (started.attempt_id ?? started.id) as number;
        if (!attId) throw new Error('no attempt');
        const state: Attempt = await olympiads.attempt(token, attId).catch(() => started);
        if (cancelled) return;

        setAttemptId(attId);

        if (state.status === 'completed' || (state as any).is_completed) {
          // Already finished — show the breakdown.
          finishedRef.current = true;
          const res = await olympiads.finish(token, attId);
          if (cancelled) return;
          setResults(res);
          setPhase('results');
          return;
        }

        const probs = (state.problems || started.problems || []) as Problem[];
        setProblems(probs);
        setAnswers({ ...(state.my_answers as any) });

        const dl = Date.parse((state.deadline || started.deadline) as string);
        setDeadline(dl);
        if (state.server_now) setOffset(Date.parse(state.server_now) - Date.now());
        setPhase('running');
      } catch {
        if (!cancelled) setPhase('error');
      }
    })();
    return () => { cancelled = true; };
  }, [token, mockId]);

  // Countdown timer.
  useEffect(() => {
    if (phase !== 'running' || !deadline) return;
    const tick = () => {
      const rem = deadline - (Date.now() + offset);
      setRemaining(rem);
      if (rem <= 0 && attemptId && !finishedRef.current) {
        show('Время вышло — тур завершается', 'info');
        doFinish(attemptId, true);
      }
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [phase, deadline, offset, attemptId, doFinish, show]);

  const saveAnswer = async (problemId: number, value: any) => {
    setAnswers((a) => ({ ...a, [problemId]: value }));
    if (!attemptId) return;
    try {
      await olympiads.answer(token!, attemptId, problemId, value);
    } catch {
      /* saved again on finish */
    }
  };

  if (phase === 'loading') {
    return <div className="flex items-center justify-center py-20"><Spinner size={32} /></div>;
  }
  if (phase === 'error') {
    return (
      <EmptyState
        title="Не удалось открыть тур"
        subtitle="Олимпиада не найдена или недоступна."
        action={<Link href="/app/mock" className="text-[#4ECDD4] hover:text-[#6EE8EE]">← К списку олимпиад</Link>}
      />
    );
  }

  if (phase === 'results' && results) {
    const pct = results.percent ?? (results.max_score ? Math.round((100 * results.score) / results.max_score) : 0);
    return (
      <div className="max-w-3xl mx-auto">
        <div className="mb-4"><Link href="/app/mock" className="text-sm text-[#4ECDD4] hover:text-[#6EE8EE]">← К списку олимпиад</Link></div>
        <Card className="mb-6 text-center">
          <p className="text-sm text-[#A8A5A0] mb-1">Результат тура</p>
          <p className="font-serif text-4xl font-bold text-[#D9A441]">{results.score} / {results.max_score}</p>
          <p className="text-lg text-[#F0EDE8] mt-1">{pct}%</p>
        </Card>
        <div className="space-y-3">
          {results.problems.map((p, i) => (
            <Card key={p.id}>
              <div className="flex items-center justify-between gap-3 mb-2">
                <span className="text-sm font-medium text-[#6A6860]">Задача {i + 1}</span>
                <Badge color={p.is_correct ? 'success' : 'error'}>
                  {p.is_correct ? 'Верно' : 'Неверно'} · {p.score}/{p.max_score}
                </Badge>
              </div>
              <div className="text-sm text-[#D7D3CC] mb-2"><MarkdownRenderer content={p.statement} /></div>
              <p className="text-sm text-[#A8A5A0]">Ваш ответ: <span className="text-[#F0EDE8]">{formatAnswer(p.your_answer)}</span></p>
              {p.correct_answer != null && String(p.correct_answer) !== '' && (
                <p className="text-sm text-[#A8A5A0]">Правильный ответ: <span className="text-[#5BD68A]">{formatAnswer(p.correct_answer)}</span></p>
              )}
              {p.solution && (
                <div className="mt-3 rounded-lg bg-[#152035] border border-[#1E2D4A] p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#D9A441] mb-1.5">Разбор</p>
                  <div className="text-sm text-[#D7D3CC]"><MarkdownRenderer content={p.solution} /></div>
                </div>
              )}
            </Card>
          ))}
        </div>
        <div className="mt-6 flex justify-center">
          <button onClick={() => router.push('/app/mock')} className="px-5 py-2.5 rounded-lg bg-[#D9A441] text-[#070C18] text-sm font-semibold hover:bg-[#F4B860]">
            К списку олимпиад
          </button>
        </div>
      </div>
    );
  }

  // Running
  const low = remaining <= 5 * 60 * 1000;
  return (
    <div className="max-w-3xl mx-auto">
      {/* Sticky timer header */}
      <div className="sticky top-0 z-10 -mx-4 md:-mx-8 px-4 md:px-8 py-3 bg-[#070C18]/90 backdrop-blur border-b border-[#1E2D4A] flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="text-sm text-[#A8A5A0]">Осталось времени:</span>
          <span className={`font-mono text-xl font-bold ${low ? 'text-[#FF7B6D]' : 'text-[#4ECDD4]'}`}>{fmt(remaining)}</span>
        </div>
        <button
          onClick={() => attemptId && doFinish(attemptId)}
          disabled={finishing}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#D9A441] text-[#070C18] text-sm font-semibold hover:bg-[#F4B860] disabled:opacity-60"
        >
          {finishing && <Spinner size={16} />} Завершить тур
        </button>
      </div>

      <p className="text-sm text-[#6A6860] mb-4">Отвечайте на задачи — ответы сохраняются автоматически. Правильность станет видна после завершения тура.</p>

      <div className="space-y-4">
        {problems.map((p, i) => (
          <Card key={p.id}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-[#6A6860]">Задача {i + 1}</span>
              {p.max_score != null && <span className="text-xs text-[#6A6860]">· {p.max_score} б.</span>}
            </div>
            <div className="text-sm text-[#D7D3CC] mb-3"><MarkdownRenderer content={p.statement} /></div>
            <AnswerInput
              answerType={p.answer_type || 'text'}
              options={p.options}
              value={answers[p.id]}
              onChange={(v) => saveAnswer(p.id, v)}
            />
          </Card>
        ))}
      </div>

      <div className="mt-6 flex justify-center">
        <button
          onClick={() => attemptId && doFinish(attemptId)}
          disabled={finishing}
          className="px-6 py-3 rounded-lg bg-[#D9A441] text-[#070C18] text-sm font-semibold hover:bg-[#F4B860] disabled:opacity-60"
        >
          Завершить и узнать результат
        </button>
      </div>
    </div>
  );
}
