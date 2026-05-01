'use client';

import { useEffect, useState, useCallback, useMemo, Suspense } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useAuth } from '@/lib/auth';
import { lessons as lessonsAPI, homework as hwAPI } from '@/lib/api';
import MarkdownRenderer from '@/components/MarkdownRenderer';

const MathField = dynamic(() => import('@/components/MathField'), { ssr: false });

interface LessonDetail {
  id: number;
  title: string;
  lesson_date: string;
  video_url: string;
  description: string;
  is_watched: boolean;
  notes_file_url: string | null;
  workbook_file_url: string | null;
  prev_lesson_id: number | null;
  next_lesson_id: number | null;
}

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

function getYoutubeEmbedUrl(url: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

function ProblemComponent({ problem, token }: { problem: Problem; token: string }) {
  const [answer, setAnswer] = useState<any>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showHint, setShowHint] = useState(false);
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
    <div className="border rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-500">Задача {problem.order}</span>
        <span className="text-xs text-gray-400">Макс. баллов: {problem.max_score}</span>
      </div>
      <div className="mb-4">
        <MarkdownRenderer content={problem.statement} />
      </div>

      {/* Problem attachments (images) */}
      {problem.attachments && problem.attachments.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {problem.attachments.map((att) => (
            <a key={att.id} href={att.file_url} target="_blank" rel="noopener noreferrer">
              <img src={att.file_url} alt="Приложение" className="max-h-48 rounded border" />
            </a>
          ))}
        </div>
      )}

      {/* Answer input based on type */}
      {problem.answer_type === 'text' && (
        <textarea
          className="w-full border rounded p-2 text-sm"
          rows={4}
          placeholder="Введите ответ..."
          onChange={(e) => setAnswer({ text: e.target.value })}
        />
      )}

      {problem.answer_type === 'choice_single' && (
        <div className="space-y-2">
          {problem.options?.map((opt) => (
            <label key={opt.id} className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50 cursor-pointer">
              <input
                type="radio"
                name={`problem-${problem.id}`}
                onChange={() => setAnswer({ option_id: opt.id })}
              />
              <MarkdownRenderer content={opt.text} />
            </label>
          ))}
        </div>
      )}

      {problem.answer_type === 'choice_multiple' && (
        <div className="space-y-2">
          {problem.options?.map((opt) => (
            <label key={opt.id} className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                onChange={(e) => {
                  setAnswer((prev: any) => {
                    const ids = new Set(prev?.option_ids || []);
                    e.target.checked ? ids.add(opt.id) : ids.delete(opt.id);
                    return { option_ids: Array.from(ids) };
                  });
                }}
              />
              <MarkdownRenderer content={opt.text} />
            </label>
          ))}
        </div>
      )}

      {problem.answer_type === 'number' && (
        <input
          type="number"
          step="any"
          className="w-full border rounded p-2 text-sm"
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
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'Отправка...' : 'Отправить'}
        </button>
        {problem.hint && (
          <button
            onClick={() => setShowHint(!showHint)}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            {showHint ? 'Скрыть подсказку' : 'Подсказка'}
          </button>
        )}
      </div>

      {showHint && problem.hint && (
        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
          <MarkdownRenderer content={problem.hint} />
        </div>
      )}

      {/* Result */}
      {result && (
        <div className={`mt-3 p-3 rounded text-sm ${
          result.is_correct === true ? 'bg-green-50 text-green-700' :
          result.is_correct === false ? 'bg-red-50 text-red-700' :
          'bg-gray-50 text-gray-700'
        }`}>
          {result.is_correct === true && `Верно! Баллы: ${result.score}/${problem.max_score}`}
          {result.is_correct === false && `Неверно. Баллы: ${result.score}/${problem.max_score}`}
          {result.is_correct === null && 'Ответ отправлен на проверку преподавателю.'}
        </div>
      )}

      {/* Previous submissions */}
      {submissions.length > 0 && (
        <details className="mt-3">
          <summary className="text-xs text-gray-400 cursor-pointer">
            Предыдущие попытки ({submissions.length})
          </summary>
          <div className="mt-2 space-y-2">
            {submissions.map((s) => (
              <div key={s.id} className="text-xs p-2 bg-gray-50 rounded">
                <div className="flex justify-between">
                  <span>{new Date(s.submitted_at).toLocaleString('ru-RU')}</span>
                  <span className={
                    s.is_correct === true ? 'text-green-600' :
                    s.is_correct === false ? 'text-red-600' : 'text-gray-500'
                  }>
                    {s.score !== null ? `${s.score}/${problem.max_score}` : 'На проверке'}
                  </span>
                </div>
                {s.admin_comment && (
                  <p className="mt-1 text-gray-600">Комментарий: {s.admin_comment}</p>
                )}
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

export default function LessonDetailPage() {
  const { id, lessonId } = useParams();
  const { token } = useAuth();
  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [hw, setHw] = useState<HomeworkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'content' | 'homework'>('content');

  useEffect(() => {
    if (!token || !lessonId) return;
    lessonsAPI.detail(token, Number(lessonId)).then((data: any) => {
      setLesson(data);
    }).catch(() => {}).finally(() => setLoading(false));

    lessonsAPI.homework(token, Number(lessonId)).then((data: any) => {
      setHw(data);
    }).catch(() => {});
  }, [token, lessonId]);

  const handleToggleWatched = async () => {
    if (!token || !lesson) return;
    const res = await lessonsAPI.markWatched(token, lesson.id);
    setLesson({ ...lesson, is_watched: res.is_watched });
  };

  const embedUrl = lesson?.video_url ? getYoutubeEmbedUrl(lesson.video_url) : null;

  if (loading) return <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D9A441]"></div></div>;
  if (!lesson) return <div className="text-center py-12 text-[#6A6860]">Занятие не найдено.</div>;

  return (
    <div>
      <div className="mb-4">
        <Link href={`/app/courses/${id}`} className="text-sm text-[#4ECDD4] hover:text-[#6EE8EE] transition-colors">
          ← Назад к курсу
        </Link>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-[#F0EDE8]">{lesson.title}</h1>
        <button
          onClick={handleToggleWatched}
          className={`px-3 py-1 text-sm rounded-lg border transition-colors ${
            lesson.is_watched ? 'bg-[rgba(91,214,138,0.12)] border-[#5BD68A] text-[#5BD68A]' : 'border-[#1E2D4A] text-[#A8A5A0] hover:bg-[#152035]'
          }`}
        >
          {lesson.is_watched ? '✓ Просмотрено' : 'Отметить просмотренным'}
        </button>
      </div>

      {lesson.lesson_date && (
        <p className="text-sm text-[#6A6860] mb-4">
          Дата: {new Date(lesson.lesson_date).toLocaleDateString('ru-RU')}
        </p>
      )}

      {/* Video */}
      {embedUrl && (
        <div className="mb-6 aspect-video">
          <iframe
            src={embedUrl}
            className="w-full h-full rounded-lg"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-[#1E2D4A] mb-6">
        <button
          onClick={() => setTab('content')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'content' ? 'border-[#4ECDD4] text-[#4ECDD4]' : 'border-transparent text-[#6A6860] hover:text-[#A8A5A0]'
          }`}
        >
          Конспект
        </button>
        <button
          onClick={() => setTab('homework')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'homework' ? 'border-[#4ECDD4] text-[#4ECDD4]' : 'border-transparent text-[#6A6860] hover:text-[#A8A5A0]'
          }`}
        >
          Домашнее задание {hw ? `(${hw.problems?.length || 0})` : ''}
        </button>
      </div>

      {tab === 'content' && (
        <div>
          <MarkdownRenderer content={lesson.description || ''} />

          {/* Files section */}
          {(lesson.notes_file_url || lesson.workbook_file_url) && (
            <div className="mt-6 p-4 bg-[#0D1525] border border-[#1E2D4A] rounded-xl">
              <h3 className="font-semibold mb-3 text-[#F0EDE8]">Материалы</h3>
              <div className="space-y-2">
                {lesson.notes_file_url && (
                  <a href={lesson.notes_file_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-[#4ECDD4] hover:text-[#6EE8EE] text-sm transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Конспект (PDF)
                  </a>
                )}
                {lesson.workbook_file_url && (
                  <a href={lesson.workbook_file_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-[#4ECDD4] hover:text-[#6EE8EE] text-sm transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    Рабочая тетрадь (PDF)
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'homework' && (
        <div>
          {!hw ? (
            <p className="text-[#6A6860]">Домашнее задание не назначено.</p>
          ) : (
            <div>
              <h2 className="text-lg font-semibold mb-4 text-[#F0EDE8]">{hw.title}</h2>
              <Link
                href={`/app/courses/${id}/lessons/${lessonId}/homework`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#D9A441] text-[#0A0E1A] text-sm font-medium rounded-lg hover:bg-[#F4B860] mb-6 transition-colors"
              >
                Открыть домашнее задание ({hw.problems?.length || 0} задач)
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              {hw.problems?.sort((a, b) => a.order - b.order).map((p) => (
                <ProblemComponent key={p.id} problem={p} token={token!} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Prev / Next lesson navigation */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-[#1E2D4A]">
        {lesson.prev_lesson_id ? (
          <Link
            href={`/app/courses/${id}/lessons/${lesson.prev_lesson_id}`}
            className="flex items-center gap-2 px-4 py-2 text-sm border border-[#1E2D4A] rounded-lg text-[#A8A5A0] hover:bg-[#152035] hover:text-[#F0EDE8] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Предыдущее занятие
          </Link>
        ) : <div />}
        {lesson.next_lesson_id ? (
          <Link
            href={`/app/courses/${id}/lessons/${lesson.next_lesson_id}`}
            className="flex items-center gap-2 px-4 py-2 text-sm border border-[#1E2D4A] rounded-lg text-[#A8A5A0] hover:bg-[#152035] hover:text-[#F0EDE8] transition-colors"
          >
            Следующее занятие
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ) : <div />}
      </div>
    </div>
  );
}
