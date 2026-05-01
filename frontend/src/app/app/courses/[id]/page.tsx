'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { courses as coursesAPI } from '@/lib/api';

interface Lesson {
  id: number;
  title: string;
  lesson_date: string;
  order: number;
  is_watched: boolean;
}

interface Topic {
  id: number;
  title: string;
  order: number;
  lessons: Lesson[];
}

interface Block {
  id: number;
  title: string;
  order: number;
  topics: Topic[];
}

interface CourseDetail {
  id: number;
  title: string;
  description: string;
  blocks: Block[];
}

export default function CourseDetailPage() {
  const { id } = useParams();
  const { token } = useAuth();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [openBlocks, setOpenBlocks] = useState<Set<number>>(new Set());
  const [openTopics, setOpenTopics] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!token || !id) return;
    coursesAPI.detail(token, Number(id)).then((data: any) => {
      setCourse(data);
      if (data.blocks) {
        setOpenBlocks(new Set(data.blocks.map((b: Block) => b.id)));
        const topicIds: number[] = [];
        data.blocks.forEach((b: Block) => b.topics?.forEach((t: Topic) => topicIds.push(t.id)));
        setOpenTopics(new Set(topicIds));
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [token, id]);

  const toggleBlock = (blockId: number) => {
    setOpenBlocks(prev => {
      const next = new Set(prev);
      next.has(blockId) ? next.delete(blockId) : next.add(blockId);
      return next;
    });
  };

  const toggleTopic = (topicId: number) => {
    setOpenTopics(prev => {
      const next = new Set(prev);
      next.has(topicId) ? next.delete(topicId) : next.add(topicId);
      return next;
    });
  };

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D9A441]"></div>
    </div>
  );
  if (!course) return <div className="text-center py-12 text-[#6A6860]">Курс не найден.</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2 text-[#F0EDE8]">{course.title}</h1>
      <p className="text-[#A8A5A0] mb-6">{course.description}</p>

      <div className="space-y-3">
        {course.blocks?.map((block) => (
          <div key={block.id} className="bg-[#0D1525] border border-[#1E2D4A] rounded-xl overflow-hidden">
            <button
              onClick={() => toggleBlock(block.id)}
              className="w-full flex items-center justify-between p-4 hover:bg-[#152035] text-left transition-colors"
            >
              <span className="font-semibold text-[#F0EDE8]">{block.title}</span>
              <svg className={`w-4 h-4 text-[#6A6860] transition-transform ${openBlocks.has(block.id) ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {openBlocks.has(block.id) && (
              <div className="border-t border-[#1E2D4A]">
                {block.topics?.map((topic) => (
                  <div key={topic.id}>
                    <button
                      onClick={() => toggleTopic(topic.id)}
                      className="w-full flex items-center justify-between px-6 py-3 hover:bg-[#152035] text-left transition-colors"
                    >
                      <span className="text-sm font-medium text-[#A8A5A0]">{topic.title}</span>
                      <svg className={`w-3.5 h-3.5 text-[#6A6860] transition-transform ${openTopics.has(topic.id) ? 'rotate-180' : ''}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {openTopics.has(topic.id) && (
                      <div className="pl-8 pr-4 pb-2">
                        {topic.lessons?.map((lesson) => (
                          <Link
                            key={lesson.id}
                            href={`/app/courses/${course.id}/lessons/${lesson.id}`}
                            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#152035] text-sm transition-colors"
                          >
                            <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs flex-shrink-0 ${
                              lesson.is_watched
                                ? 'bg-[#5BD68A] border-[#5BD68A] text-[#0A0E1A]'
                                : 'border-[#1E2D4A]'
                            }`}>
                              {lesson.is_watched ? '✓' : ''}
                            </span>
                            <span className="flex-1 text-[#F0EDE8]">{lesson.title}</span>
                            <span className="text-xs text-[#6A6860]">
                              {lesson.lesson_date ? new Date(lesson.lesson_date).toLocaleDateString('ru-RU') : ''}
                            </span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
