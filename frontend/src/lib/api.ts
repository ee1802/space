const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface FetchOptions extends RequestInit {
  token?: string;
}

async function fetchAPI(endpoint: string, options: FetchOptions = {}) {
  const { token, ...fetchOpts } = options;
  const headers: Record<string, string> = {
    ...(fetchOpts.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!(fetchOpts.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...fetchOpts,
    headers,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Ошибка сервера' }));
    throw { status: res.status, ...error };
  }

  if (res.status === 204) return null;
  return res.json();
}

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

// Build a query string from a params object, dropping null/undefined/'' values.
function qs(params?: Record<string, any>): string {
  if (!params) return '';
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') sp.append(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : '';
}

/**
 * Unwrap a DRF-style paginated envelope into a plain array.
 * - {count, results} -> results
 * - already an array  -> itself
 * - null/undefined    -> []
 * Use this for endpoints documented as returning a FLAT ARRAY
 * (myHomework, tags, materials, myCourses lists, etc.).
 */
export function unwrap<T = any>(data: any): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && Array.isArray(data.results)) return data.results as T[];
  return [];
}

/* ------------------------------------------------------------------ *
 * TypeScript interfaces for the main response objects
 * ------------------------------------------------------------------ */

export type LessonType = 'theory' | 'practice' | 'hard' | 'test' | 'mock';
export type HomeworkStatus =
  | 'not_started'
  | 'in_progress'
  | 'pending'
  | 'done'
  | 'wrong'
  | 'partial'
  | 'none';
export type ProblemStatus =
  | 'not_started'
  | 'in_progress'
  | 'pending'
  | 'correct'
  | 'wrong'
  | 'partial'
  | 'none';
export type OlympiadLevel = 'school' | 'municipal' | 'regional' | 'final';
export type MaterialKind = 'pdf' | 'video' | 'doc' | 'link' | 'image' | string;
export type AnswerType = 'number' | 'text' | 'formula' | 'choice' | string;

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface NextLesson {
  id: number;
  title: string;
}

export interface Course {
  id: number;
  title: string;
  slug: string;
  description?: string;
  cover_url?: string | null;
  progress?: number;
  lessons_total?: number;
  lessons_completed?: number;
  next_lesson?: NextLesson | null;
  blocks?: CourseBlock[];
}

export interface CourseBlock {
  id: number;
  title: string;
  order?: number;
  topics: CourseTopic[];
}

export interface CourseTopic {
  id: number;
  title: string;
  order?: number;
  lessons: Lesson[];
}

export interface LessonMaterial {
  id: number;
  title: string;
  kind: MaterialKind;
  file_url: string | null;
}

export interface Lesson {
  id: number;
  title: string;
  slug?: string;
  order?: number;
  lesson_type: LessonType;
  is_watched?: boolean;
  homework_status?: HomeworkStatus;
  video_url?: string | null;
  content?: string;
  duration?: number | null;
  materials?: LessonMaterial[];
}

export interface ProblemOption {
  id: number;
  text: string;
}

export interface Problem {
  id: number;
  title?: string;
  statement: string;
  level?: OlympiadLevel;
  answer_type?: AnswerType;
  tags?: Tag[];
  options?: ProblemOption[];
  status?: ProblemStatus;
  max_score?: number;
  solution?: string;
  correct_answer?: string;
  your_answer?: string;
  is_correct?: boolean;
  score?: number;
}

export interface Submission {
  id: number;
  problem: number | Problem;
  answer: string;
  status: ProblemStatus;
  is_correct?: boolean;
  score?: number | null;
  max_score?: number | null;
  admin_comment?: string | null;
  created_at: string;
}

export interface Mistake {
  problem: Problem;
  submission: Submission;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
  problem_count?: number;
}

export interface Material {
  id: number;
  title: string;
  kind: MaterialKind;
  file_url: string | null;
  lesson_id?: number | null;
  lesson_title?: string | null;
  course_title?: string | null;
}

export interface TopicStat {
  tag: string;
  slug: string;
  attempted: number;
  correct: number;
  accuracy: number;
}

export interface LevelStat {
  level: string;
  label: string;
  attempted: number;
  correct: number;
  accuracy: number;
}

export interface AnswerTypeStat {
  answer_type: string;
  attempted: number;
  correct: number;
}

export interface RecentActivityDay {
  date: string;
  count: number;
}

export interface Stats {
  total_submissions: number;
  solved_problems: number;
  total_attempted: number;
  accuracy: number;
  lessons_watched: number;
  lessons_total: number;
  by_topic: TopicStat[];
  by_level: LevelStat[];
  by_answer_type: AnswerTypeStat[];
  recent_activity: RecentActivityDay[];
  mock_attempts: number;
  best_mock_percent: number;
  strengths: string[];
  weaknesses: string[];
  [key: string]: any;
}

export interface Recommendation {
  type: string;
  title: string;
  reason: string;
  action_url: string;
  priority: number | string;
  tag?: string;
}

export interface StudyPlanStep {
  step: number;
  focus: string;
  detail: string;
  action_url: string;
}

export interface RecommendationResponse {
  generated_by: string;
  summary?: string;
  items: Recommendation[];
  study_plan?: StudyPlanStep[];
}

export interface MockOlympiad {
  id: number;
  title: string;
  description?: string;
  level?: OlympiadLevel;
  duration_minutes: number;
  problem_count?: number;
  max_score?: number;
  starts_at?: string | null;
  ends_at?: string | null;
  my_attempt?: { id: number; status: string; percent?: number } | null;
}

export interface AttemptProblemResult {
  id: number;
  statement: string;
  your_answer: string;
  is_correct: boolean;
  score: number;
  max_score: number;
  correct_answer: string;
  solution: string;
}

export interface Attempt {
  attempt_id?: number;
  id?: number;
  olympiad?: MockOlympiad | number;
  status?: 'in_progress' | 'completed';
  server_now?: string;
  deadline?: string;
  duration_minutes?: number;
  problems?: Problem[];
  my_answers?: Record<string, string>;
  score?: number;
  max_score?: number;
  percent?: number;
  results?: AttemptProblemResult[];
}

export interface AttemptResult {
  score: number;
  max_score: number;
  percent: number;
  problems: AttemptProblemResult[];
}

export interface ScheduleItem {
  id: number | string;
  kind: 'olympiad' | 'homework' | 'lesson';
  date: string;
  title: string;
  course_title?: string | null;
  action_url?: string | null;
  status?: string;
  [key: string]: any;
}

export interface CalendarEvent {
  id: number;
  title: string;
  description?: string;
  start_date: string;
  end_date?: string | null;
  event_type?: { id: number; name: string; color?: string } | null;
  url?: string | null;
  level?: OlympiadLevel;
}

export interface Favorite {
  lessons: Lesson[];
  problems: Problem[];
}

export interface Question {
  id: number;
  text: string;
  lesson?: number | { id: number; title: string } | null;
  problem?: number | { id: number; statement: string } | null;
  answer?: string | null;
  status?: 'pending' | 'answered';
  created_at: string;
  answered_at?: string | null;
}

export interface SearchResults {
  lessons: Lesson[];
  problems: Problem[];
  materials: Material[];
}

/* ------------------------------------------------------------------ *
 * Auth
 * ------------------------------------------------------------------ */
export const auth = {
  sendCode: (email: string, type: string) =>
    fetchAPI('/auth/send-code', { method: 'POST', body: JSON.stringify({ email, type }) }),

  register: (data: { email: string; password: string; password_confirm: string; code: string; telegram_username?: string }) =>
    fetchAPI('/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  login: (data: { email: string; password: string }) =>
    fetchAPI('/auth/login', { method: 'POST', body: JSON.stringify(data) }),

  logout: (token: string, refresh: string) =>
    fetchAPI('/auth/logout', { method: 'POST', token, body: JSON.stringify({ refresh }) }),

  me: (token: string) =>
    fetchAPI('/auth/me', { token }),

  verifyEmail: (verifyToken: string) =>
    fetchAPI(`/auth/verify-email?token=${verifyToken}`),

  forgotPassword: (email: string) =>
    fetchAPI('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),

  resetPassword: (resetToken: string, new_password: string) =>
    fetchAPI('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token: resetToken, new_password }) }),

  refreshToken: (refresh: string) =>
    fetchAPI('/auth/token/refresh', { method: 'POST', body: JSON.stringify({ refresh }) }),
};

/* ------------------------------------------------------------------ *
 * Profile
 * ------------------------------------------------------------------ */
export const profile = {
  get: (token: string) => fetchAPI('/auth/me', { token }),

  update: (token: string, data: { full_name?: string; telegram_username?: string }) =>
    fetchAPI('/me/profile', { method: 'PATCH', token, body: JSON.stringify(data) }),

  changePassword: (token: string, data: { old_password: string; new_password: string }) =>
    fetchAPI('/me/change-password', { method: 'POST', token, body: JSON.stringify(data) }),
};

/* ------------------------------------------------------------------ *
 * Courses
 * myCourses -> GET /me/courses  (items include progress, lessons_total,
 *              lessons_completed, next_lesson). Returns an array (or
 *              {results} envelope — unwrap on the page with unwrap()).
 * detail    -> GET /courses/{id} (blocks>topics>lessons).
 * materials -> GET /me/materials?q=&kind=  -> FLAT ARRAY.
 * ------------------------------------------------------------------ */
export const courses = {
  myCourses: (token: string) =>
    fetchAPI('/me/courses', { token }) as Promise<Course[] | Paginated<Course>>,

  detail: (token: string, id: number) =>
    fetchAPI(`/courses/${id}`, { token }) as Promise<Course>,

  materials: (token: string, params?: { q?: string; kind?: string }) =>
    fetchAPI(`/me/materials${qs(params)}`, { token }) as Promise<Material[]>,
};

/* ------------------------------------------------------------------ *
 * Lessons
 * ------------------------------------------------------------------ */
export const lessons = {
  detail: (token: string, id: number) =>
    fetchAPI(`/lessons/${id}`, { token }) as Promise<Lesson>,

  markWatched: (token: string, id: number) =>
    fetchAPI(`/lessons/${id}/watch`, { method: 'POST', token }),

  homework: (token: string, lessonId: number) =>
    fetchAPI(`/lessons/${lessonId}/homework`, { token }),
};

/* ------------------------------------------------------------------ *
 * Homework
 * bank      -> paginated {count,next,previous,results}
 * mistakes  -> paginated; each result {problem, submission}
 * myHomework-> FLAT ARRAY
 * tags      -> FLAT ARRAY [{id,name,slug,problem_count}]
 * ------------------------------------------------------------------ */
export const homework = {
  submit: (token: string, problemId: number, answer: any) =>
    fetchAPI(`/problems/${problemId}/submit`, { method: 'POST', token, body: JSON.stringify({ answer }) }),

  mySubmissions: (token: string, problemId: number) =>
    fetchAPI(`/me/submissions/${problemId}`, { token }) as Promise<Submission[]>,

  bank: (token: string, params?: { level?: string; tag?: string; answer_type?: string; q?: string; status?: string; page?: number }) =>
    fetchAPI(`/problems/bank${qs(params)}`, { token }) as Promise<Paginated<Problem>>,

  mistakes: (token: string, params?: { level?: string; tag?: string; page?: number }) =>
    fetchAPI(`/me/mistakes${qs(params)}`, { token }) as Promise<Paginated<Mistake>>,

  myHomework: (token: string) =>
    fetchAPI('/me/homework', { token }) as Promise<any[]>,

  tags: (token: string) =>
    fetchAPI('/tags', { token }) as Promise<Tag[]>,
};

/* ------------------------------------------------------------------ *
 * Olympiads (mock olympiads / contests)
 * list/myAttempts -> paginated
 * ------------------------------------------------------------------ */
export const olympiads = {
  list: (token: string) =>
    fetchAPI('/olympiads', { token }) as Promise<Paginated<MockOlympiad>>,

  detail: (token: string, id: number) =>
    fetchAPI(`/olympiads/${id}`, { token }) as Promise<MockOlympiad>,

  start: (token: string, id: number) =>
    fetchAPI(`/olympiads/${id}/start`, { method: 'POST', token }) as Promise<Attempt>,

  attempt: (token: string, attemptId: number) =>
    fetchAPI(`/olympiads/attempts/${attemptId}`, { token }) as Promise<Attempt>,

  answer: (token: string, attemptId: number, problemId: number, answer: any) =>
    fetchAPI(`/olympiads/attempts/${attemptId}/answer`, {
      method: 'POST',
      token,
      body: JSON.stringify({ problem_id: problemId, answer }),
    }) as Promise<{ saved: boolean }>,

  finish: (token: string, attemptId: number) =>
    fetchAPI(`/olympiads/attempts/${attemptId}/finish`, { method: 'POST', token }) as Promise<AttemptResult>,

  myAttempts: (token: string) =>
    fetchAPI('/me/olympiad-attempts', { token }) as Promise<Paginated<Attempt>>,
};

/* ------------------------------------------------------------------ *
 * Analytics
 * ------------------------------------------------------------------ */
export const analytics = {
  stats: (token: string) =>
    fetchAPI('/me/stats', { token }) as Promise<Stats>,

  recommendations: (token: string) =>
    fetchAPI('/me/recommendations', { token }) as Promise<RecommendationResponse>,

  search: (token: string, q: string) =>
    fetchAPI(`/search${qs({ q })}`, { token }) as Promise<SearchResults>,
};

/* ------------------------------------------------------------------ *
 * Engagement (favorites, ratings, questions)
 * ------------------------------------------------------------------ */
export const engagement = {
  favorites: (token: string) =>
    fetchAPI('/me/favorites', { token }) as Promise<Favorite>,

  toggleFavorite: (token: string, body: { lesson_id?: number; problem_id?: number }) =>
    fetchAPI('/me/favorites/toggle', { method: 'POST', token, body: JSON.stringify(body) }) as Promise<{ favorited: boolean; id?: number }>,

  rateLesson: (token: string, lessonId: number, body: { rating: number; comment?: string }) =>
    fetchAPI(`/lessons/${lessonId}/rate`, { method: 'POST', token, body: JSON.stringify(body) }),

  lessonRating: (token: string, lessonId: number) =>
    fetchAPI(`/lessons/${lessonId}/rating`, { token }) as Promise<{ my_rating: { rating: number; comment?: string } | null; average: number; count: number }>,

  createQuestion: (token: string, body: { lesson_id?: number; problem_id?: number; text: string }) =>
    fetchAPI('/questions', { method: 'POST', token, body: JSON.stringify(body) }) as Promise<Question>,

  myQuestions: (token: string) =>
    fetchAPI('/me/questions', { token }) as Promise<Paginated<Question>>,

  lessonQuestions: (token: string, lessonId: number) =>
    fetchAPI(`/questions${qs({ lesson: lessonId })}`, { token }) as Promise<Paginated<Question>>,
};

/* ------------------------------------------------------------------ *
 * Calendar / schedule
 * events     -> /calendar/events
 * eventTypes -> /calendar/event-types
 * schedule   -> /me/schedule?from=&to=&kind=  (paginated; items have kind)
 * ------------------------------------------------------------------ */
export const calendar = {
  events: (token: string, params?: { start_date?: string; end_date?: string; from?: string; to?: string }) =>
    fetchAPI(`/calendar/events${qs(params)}`, { token }) as Promise<CalendarEvent[] | Paginated<CalendarEvent>>,

  eventTypes: (token: string) =>
    fetchAPI('/calendar/event-types', { token }),

  schedule: (token: string, params?: { from?: string; to?: string; kind?: string }) =>
    fetchAPI(`/me/schedule${qs(params)}`, { token }) as Promise<Paginated<ScheduleItem>>,
};

/* ------------------------------------------------------------------ *
 * Admin API
 * ------------------------------------------------------------------ */
export const admin = {
  // Users
  users: (token: string) => fetchAPI('/admin/users', { token }),
  userDetail: (token: string, id: number) => fetchAPI(`/admin/users/${id}`, { token }),
  updateUser: (token: string, id: number, data: any) =>
    fetchAPI(`/admin/users/${id}`, { method: 'PATCH', token, body: JSON.stringify(data) }),
  enrollUser: (token: string, userId: number, courseId: number) =>
    fetchAPI(`/admin/users/${userId}/enroll`, { method: 'POST', token, body: JSON.stringify({ course_id: courseId }) }),
  unenrollUser: (token: string, userId: number, courseId: number) =>
    fetchAPI(`/admin/users/${userId}/enroll/${courseId}`, { method: 'DELETE', token }),

  // Courses
  courses: (token: string) => fetchAPI('/admin/courses', { token }),
  createCourse: (token: string, data: any) =>
    fetchAPI('/admin/courses', { method: 'POST', token, body: JSON.stringify(data) }),
  updateCourse: (token: string, id: number, data: any) =>
    fetchAPI(`/admin/courses/${id}`, { method: 'PATCH', token, body: JSON.stringify(data) }),
  deleteCourse: (token: string, id: number) =>
    fetchAPI(`/admin/courses/${id}`, { method: 'DELETE', token }),

  // Blocks
  blocks: (token: string, courseId?: number) =>
    fetchAPI(`/admin/blocks${courseId ? `?course=${courseId}` : ''}`, { token }),
  createBlock: (token: string, data: any) =>
    fetchAPI('/admin/blocks', { method: 'POST', token, body: JSON.stringify(data) }),
  updateBlock: (token: string, id: number, data: any) =>
    fetchAPI(`/admin/blocks/${id}`, { method: 'PATCH', token, body: JSON.stringify(data) }),
  deleteBlock: (token: string, id: number) =>
    fetchAPI(`/admin/blocks/${id}`, { method: 'DELETE', token }),

  // Topics
  topics: (token: string, blockId?: number) =>
    fetchAPI(`/admin/topics${blockId ? `?block=${blockId}` : ''}`, { token }),
  createTopic: (token: string, data: any) =>
    fetchAPI('/admin/topics', { method: 'POST', token, body: JSON.stringify(data) }),
  updateTopic: (token: string, id: number, data: any) =>
    fetchAPI(`/admin/topics/${id}`, { method: 'PATCH', token, body: JSON.stringify(data) }),
  deleteTopic: (token: string, id: number) =>
    fetchAPI(`/admin/topics/${id}`, { method: 'DELETE', token }),

  // Lessons
  lessons: (token: string, topicId?: number) =>
    fetchAPI(`/admin/lessons${topicId ? `?topic=${topicId}` : ''}`, { token }),
  createLesson: (token: string, data: any) =>
    fetchAPI('/admin/lessons', { method: 'POST', token, body: JSON.stringify(data) }),
  updateLesson: (token: string, id: number, data: any) =>
    fetchAPI(`/admin/lessons/${id}`, { method: 'PATCH', token, body: JSON.stringify(data) }),
  deleteLesson: (token: string, id: number) =>
    fetchAPI(`/admin/lessons/${id}`, { method: 'DELETE', token }),

  // Homeworks
  homeworks: (token: string) => fetchAPI('/admin/homeworks', { token }),
  createHomework: (token: string, data: any) =>
    fetchAPI('/admin/homeworks', { method: 'POST', token, body: JSON.stringify(data) }),
  updateHomework: (token: string, id: number, data: any) =>
    fetchAPI(`/admin/homeworks/${id}`, { method: 'PATCH', token, body: JSON.stringify(data) }),
  deleteHomework: (token: string, id: number) =>
    fetchAPI(`/admin/homeworks/${id}`, { method: 'DELETE', token }),

  // Problems
  problems: (token: string, homeworkId?: number) =>
    fetchAPI(`/admin/problems${homeworkId ? `?homework=${homeworkId}` : ''}`, { token }),
  createProblem: (token: string, data: any) =>
    fetchAPI('/admin/problems', { method: 'POST', token, body: JSON.stringify(data) }),
  updateProblem: (token: string, id: number, data: any) =>
    fetchAPI(`/admin/problems/${id}`, { method: 'PATCH', token, body: JSON.stringify(data) }),
  deleteProblem: (token: string, id: number) =>
    fetchAPI(`/admin/problems/${id}`, { method: 'DELETE', token }),

  // Problem options
  createOption: (token: string, data: any) =>
    fetchAPI('/admin/problem-options', { method: 'POST', token, body: JSON.stringify(data) }),
  updateOption: (token: string, id: number, data: any) =>
    fetchAPI(`/admin/problem-options/${id}`, { method: 'PATCH', token, body: JSON.stringify(data) }),
  deleteOption: (token: string, id: number) =>
    fetchAPI(`/admin/problem-options/${id}`, { method: 'DELETE', token }),

  // Submissions
  submissions: (token: string, statusFilter?: string) =>
    fetchAPI(`/admin/submissions${statusFilter ? `?status=${statusFilter}` : ''}`, { token }),
  gradeSubmission: (token: string, id: number, data: { score: number; admin_comment?: string; is_correct?: boolean }) =>
    fetchAPI(`/admin/submissions/${id}/grade`, { method: 'POST', token, body: JSON.stringify(data) }),

  // Events
  events: (token: string) => fetchAPI('/admin/events', { token }),
  createEvent: (token: string, data: any) =>
    fetchAPI('/admin/events', { method: 'POST', token, body: JSON.stringify(data) }),
  updateEvent: (token: string, id: number, data: any) =>
    fetchAPI(`/admin/events/${id}`, { method: 'PATCH', token, body: JSON.stringify(data) }),
  deleteEvent: (token: string, id: number) =>
    fetchAPI(`/admin/events/${id}`, { method: 'DELETE', token }),

  // Event types
  eventTypes: (token: string) => fetchAPI('/admin/event-types', { token }),
  createEventType: (token: string, data: any) =>
    fetchAPI('/admin/event-types', { method: 'POST', token, body: JSON.stringify(data) }),
  updateEventType: (token: string, id: number, data: any) =>
    fetchAPI(`/admin/event-types/${id}`, { method: 'PATCH', token, body: JSON.stringify(data) }),
  deleteEventType: (token: string, id: number) =>
    fetchAPI(`/admin/event-types/${id}`, { method: 'DELETE', token }),

  // Enrollments
  enrollments: (token: string) => fetchAPI('/admin/enrollments', { token }),
  updateEnrollment: (token: string, id: number, data: any) =>
    fetchAPI(`/admin/enrollments/${id}`, { method: 'PATCH', token, body: JSON.stringify(data) }),
};
