'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useAuth } from '@/lib/auth';
import { lessons as lessonsAPI, homework as hwAPI } from '@/lib/api';
import MarkdownRenderer from '@/components/MarkdownRenderer';

const MathField = dynamic(() => import('@/components/MathField'), { ssr: false });

interface ProblemOption {
  id: number;
  text: string;
  order: number;
}

interface Problem {
  id: number;
  statement: string;
  answer_type: 'text' | 'choice_single' | 'choice_multiple' | 'number' | 'formula';
  max_score: number;
  hint: string;
  options: ProblemOption[];
  order: number;
  attachments?: { id: number; file_url: string }[];
}

interface HomeworkData {
  id: number;
  title: string;
  problems: Problem[];
}

interface Submission {
  id: number;
  answer: any;
  score: number | null;
  is_correct: boolean | null;
  is_auto_checked: boolean;
  admin_comment: string;
  submitted_at: string;
}

function ProblemComponent({ problem, token }: { problem: Problem; token: string }) {
  const [answer, setAnswer] = useState<any>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [result, setResult] = useState<{ is_correct: boolean | null; score: number | null } | null>(null);

  useEffect(() => {
    hwAPI.mySubmissions(token, problem.id).then((data: any) => {
      setSubmissions(data || []);
    }).catch(() => {});
  }, [token, problem.id]);

  const handleSubmit = async () => {
    if (!answer) return;
    setSubmitting(true);
    try {
      const res = await hwAPI.submit(token, problem.id, answer);
      setResult({ is_correct: res.is_correct, score: res.score });
      setSubmissions(prev => [res, ...prev]);
    } catch {
      alert('Ошибка отправки');
    } finally {
      setSubmitting(false);
    }
  };

  const lastSubmission = submissions[0];

  return (
    <div className="bg-[#0D1525] border border-[#1E2D4A] rounded-xl mb-4 overflow-hidden">
      {/* Collapsed header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-[#152035] text-left transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-[#6A6860]">Задача {problem.order}</span>
          <span className="text-sm text-[#A8A5A0] line-clamp-1">
            {problem.statement.replace(/[#*_`\[\]]/g, '').slice(0, 80)}...
          </span>
        </div>
        <div className="flex items-center gap-2">
          {lastSubmission && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              lastSubmission.is_correct === true ? 'bg-[rgba(91,214,138,0.12)] text-[#5BD68A]' :
              lastSubmission.is_correct === false ? 'bg-[rgba(255,123,109,0.12)] text-[#FF7B6D]' :
              'bg-[rgba(168,165,160,0.12)] text-[#A8A5A0]'
            }`}>
              {lastSubmission.is_correct === true ? `${lastSubmission.score}/${problem.max_score}` :
               lastSubmission.is_correct === false ? `${lastSubmission.score}/${problem.max_score}` :
               'На проверке'}
            </span>
          )}
          <svg className={`w-4 h-4 text-[#6A6860] transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="p-4 pt-0 border-t border-[#1E2D4A]">
          <div className="mb-4 mt-4 prose-dark">
            <MarkdownRenderer content={problem.statement} />
          </div>

          {/* Problem attachments (images) */}
          {problem.attachments && problem.attachments.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {problem.attachments.map((att) => (
                <a key={att.id} href={att.file_url} target="_blank" rel="noopener noreferrer">
                  <img src={att.file_url} alt="Приложение" className="max-h-48 rounded-lg border border-[#1E2D4A]" />
                </a>
              ))}
            </div>
          )}

          {/* Answer input based on type */}
          {problem.answer_type === 'text' && (
            <textarea
              className="w-full bg-[#152035] border border-[#1E2D4A] rounded-lg p-3 text-sm text-[#F0EDE8] focus:outline-none focus:ring-2 focus:ring-[#4ECDD4] focus:border-transparent placeholder-[#6A6860]"
              rows={4}
              placeholder="Введите ответ..."
              onChange={(e) => setAnswer({ text: e.target.value })}
            />
          )}

          {problem.answer_type === 'choice_single' && (
            <div className="space-y-2">
              {problem.options?.map((opt) => (
                <label key={opt.id} className="flex items-center gap-2 p-3 border border-[#1E2D4A] rounded-lg hover:bg-[#152035] cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name={`problem-${problem.id}`}
                    onChange={() => setAnswer({ option_id: opt.id })}
                    className="accent-[#4ECDD4]"
                  />
                  <span className="text-[#F0EDE8] text-sm"><MarkdownRenderer content={opt.text} /></span>
                </label>
              ))}
            </div>
          )}

          {problem.answer_type === 'choice_multiple' && (
            <div className="space-y-2">
              {problem.options?.map((opt) => (
                <label key={opt.id} className="flex items-center gap-2 p-3 border border-[#1E2D4A] rounded-lg hover:bg-[#152035] cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      setAnswer((prev: any) => {
                        const ids = new Set(prev?.option_ids || []);
                        e.target.checked ? ids.add(opt.id) : ids.delete(opt.id);
                        return { option_ids: Array.from(ids) };
                      });
                    }}
                    className="accent-[#4ECDD4]"
                  />
                  <span className="text-[#F0EDE8] text-sm"><MarkdownRenderer content={opt.text} /></span>
                </label>
              ))}
            </div>
          )}

          {problem.answer_type === 'number' && (
            <input
              type="number"
              step="any"
              className="w-full bg-[#152035] border border-[#1E2D4A] rounded-lg p-3 text-sm text-[#F0EDE8] focus:outline-none focus:ring-2 focus:ring-[#4ECDD4] focus:border-transparent placeholder-[#6A6860]"
              placeholder="Введите число..."
              onChange={(e) => setAnswer({ value: e.target.value })}
            />
          )}

          {problem.answer_type === 'formula' && (
            <MathField
              value=""
              onChange={(latex: string) => setAnswer({ latex })}
              placeholder="Введите формулу..."
            />
          )}

          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={handleSubmit}
              disabled={submitting || !answer}
              className="px-4 py-2 bg-[#D9A441] text-[#0A0E1A] text-sm font-medium rounded-lg hover:bg-[#F4B860] disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Отправка...' : 'Сдать на проверку'}
            </button>
            {problem.hint && (
              <button
                onClick={() => setShowHint(!showHint)}
                className="text-sm text-[#6A6860] hover:text-[#A8A5A0] transition-colors"
              >
                {showHint ? 'Скрыть подсказку' : 'Подсказка'}
              </button>
            )}
          </div>

          {showHint && problem.hint && (
            <div className="mt-3 p-3 bg-[rgba(217,164,65,0.08)] border border-[rgba(217,164,65,0.2)] rounded-lg text-sm prose-dark">
              <MarkdownRenderer content={problem.hint} />
            </div>
          )}

          {/* Result */}
          {result && (
            <div className={`mt-3 p-3 rounded-lg text-sm ${
              result.is_correct === true ? 'bg-[rgba(91,214,138,0.12)] text-[#5BD68A]' :
              result.is_correct === false ? 'bg-[rgba(255,123,109,0.12)] text-[#FF7B6D]' :
              'bg-[rgba(168,165,160,0.12)] text-[#A8A5A0]'
            }`}>
              {result.is_correct === true && `Верно! Баллы: ${result.score}/${problem.max_score}`}
              {result.is_correct === false && `Неверно. Баллы: ${result.score}/${problem.max_score}`}
              {result.is_correct === null && 'Ответ отправлен на проверку преподавателю.'}
            </div>
          )}

          {/* Previous submissions */}
          {submissions.length > 0 && (
            <details className="mt-3">
              <summary className="text-xs text-[#6A6860] cursor-pointer hover:text-[#A8A5A0] transition-colors">
                Предыдущие попытки ({submissions.length})
              </summary>
              <div className="mt-2 space-y-2">
                {submissions.map((s) => (
                  <div key={s.id} className="text-xs p-2 bg-[#152035] rounded-lg">
                    <div className="flex justify-between">
                      <span className="text-[#6A6860]">{new Date(s.submitted_at).toLocaleString('ru-RU')}</span>
                      <span className={
                        s.is_correct === true ? 'text-[#5BD68A]' :
                        s.is_correct === false ? 'text-[#FF7B6D]' : 'text-[#6A6860]'
                      }>
                        {s.score !== null ? `${s.score}/${problem.max_score}` : 'На проверке'}
                      </span>
                    </div>
                    {s.admin_comment && (
                      <p className="mt-1 text-[#A8A5A0]">Комментарий: {s.admin_comment}</p>
                    )}
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

export default function HomeworkPage() {
  const { id, lessonId } = useParams();
  const { token } = useAuth();
  const [hw, setHw] = useState<HomeworkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lessonTitle, setLessonTitle] = useState('');

  useEffect(() => {
    if (!token || !lessonId) return;

    lessonsAPI.detail(token, Number(lessonId)).then((data: any) => {
      setLessonTitle(data.title || '');
    }).catch(() => {});

    lessonsAPI.homework(token, Number(lessonId)).then((data: any) => {
      setHw(data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [token, lessonId]);

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D9A441]"></div>
    </div>
  );

  return (
    <div>
      <div className="mb-4">
        <Link href={`/app/courses/${id}/lessons/${lessonId}`} className="text-sm text-[#4ECDD4] hover:text-[#6EE8EE] transition-colors">
          ← Назад к занятию
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-2 text-[#F0EDE8]">
        {hw?.title || `Домашнее задание`}
      </h1>
      {lessonTitle && (
        <p className="text-sm text-[#6A6860] mb-6">К занятию: {lessonTitle}</p>
      )}

      {!hw ? (
        <p className="text-[#6A6860]">Домашнее задание не назначено для этого занятия.</p>
      ) : (
        <div>
          {hw.problems?.sort((a, b) => a.order - b.order).map((p) => (
            <ProblemComponent key={p.id} problem={p} token={token!} />
          ))}

          {/* Total score summary */}
          <div className="mt-6 p-4 bg-[#0D1525] border border-[#1E2D4A] rounded-xl">
            <h3 className="font-semibold text-sm text-[#A8A5A0]">
              Максимальный балл за задание: <span className="text-[#D9A441]">{hw.problems?.reduce((sum, p) => sum + p.max_score, 0) || 0}</span>
            </h3>
          </div>
        </div>
      )}
    </div>
  );
}
