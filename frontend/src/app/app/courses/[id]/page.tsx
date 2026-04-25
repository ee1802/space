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
      // Open all blocks by default
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

  if (loading) return <div>Загрузка...</div>;
  if (!course) return <div>Курс не найден.</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">{course.title}</h1>
      <p className="text-gray-600 mb-6">{course.description}</p>

      <div className="space-y-4">
        {course.blocks?.map((block) => (
          <div key={block.id} className="border rounded-lg">
            <button
              onClick={() => toggleBlock(block.id)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 text-left"
            >
              <span className="font-semibold">{block.title}</span>
              <span className="text-gray-400">{openBlocks.has(block.id) ? '▼' : '▶'}</span>
            </button>
            {openBlocks.has(block.id) && (
              <div className="border-t">
                {block.topics?.map((topic) => (
                  <div key={topic.id}>
                    <button
                      onClick={() => toggleTopic(topic.id)}
                      className="w-full flex items-center justify-between px-6 py-3 hover:bg-gray-50 text-left"
                    >
                      <span className="text-sm font-medium text-gray-700">{topic.title}</span>
                      <span className="text-gray-400 text-xs">{openTopics.has(topic.id) ? '▼' : '▶'}</span>
                    </button>
                    {openTopics.has(topic.id) && (
                      <div className="pl-8 pr-4 pb-2">
                        {topic.lessons?.map((lesson) => (
                          <Link
                            key={lesson.id}
                            href={`/app/courses/${course.id}/lessons/${lesson.id}`}
                            className="flex items-center gap-3 px-3 py-2 rounded hover:bg-blue-50 text-sm"
                          >
                            <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs ${
                              lesson.is_watched ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'
                            }`}>
                              {lesson.is_watched ? '✓' : ''}
                            </span>
                            <span className="flex-1">{lesson.title}</span>
                            <span className="text-xs text-gray-400">
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
