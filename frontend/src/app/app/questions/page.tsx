'use client';

import { useEffect, useState } from 'react';
import { engagement, unwrap, type Question } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Card, Skeleton, EmptyState, Badge } from '@/components/ui';
import MarkdownRenderer from '@/components/MarkdownRenderer';

function contextLabel(q: Question): string | null {
  const l: any = q.lesson;
  const p: any = q.problem;
  if (l && typeof l === 'object') return `Занятие: ${l.title}`;
  if (typeof l === 'number') return `Занятие #${l}`;
  if (p && typeof p === 'object') return `Задача: ${(p.statement || '').slice(0, 40)}…`;
  if (typeof p === 'number') return `Задача #${p}`;
  return null;
}

export default function QuestionsPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    engagement
      .myQuestions(token)
      .then((d) => setItems(unwrap<Question>(d)))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="max-w-3xl mx-auto">
      <header className="mb-6">
        <h1 className="font-serif text-2xl font-semibold text-[#F0EDE8]">Мои вопросы</h1>
        <p className="text-sm text-[#A8A5A0] mt-1">
          Вопросы преподавателю и куратору. Задать новый вопрос можно прямо под занятием или задачей.
        </p>
      </header>

      {loading ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-28 w-full" />)}</div>
      ) : error ? (
        <EmptyState title="Не удалось загрузить вопросы" subtitle="Попробуйте обновить страницу." />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" strokeLinecap="round" strokeLinejoin="round" /></svg>}
          title="Вопросов пока нет"
          subtitle="Откройте занятие или задачу и нажмите «Задать вопрос», чтобы получить помощь преподавателя."
        />
      ) : (
        <div className="space-y-3">
          {items.map((q) => {
            const answered = q.status === 'answered' || !!q.answer || !!q.answered_at;
            const ctx = contextLabel(q);
            return (
              <Card key={q.id}>
                <div className="flex items-center justify-between gap-3 mb-2">
                  {ctx ? <span className="text-xs text-[#6A6860]">{ctx}</span> : <span />}
                  <Badge color={answered ? 'success' : 'warning'}>{answered ? 'Отвечено' : 'Ожидает ответа'}</Badge>
                </div>
                <p className="text-sm text-[#F0EDE8] whitespace-pre-wrap">{q.text}</p>
                {answered && q.answer && (
                  <div className="mt-3 rounded-lg bg-[#152035] border border-[#1E2D4A] p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#4ECDD4] mb-1.5">Ответ преподавателя</p>
                    <div className="text-sm text-[#D7D3CC]"><MarkdownRenderer content={q.answer} /></div>
                  </div>
                )}
                {q.created_at && (
                  <p className="text-xs text-[#6A6860] mt-2">{new Date(q.created_at).toLocaleString('ru-RU')}</p>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
