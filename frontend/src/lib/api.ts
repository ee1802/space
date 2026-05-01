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

// Auth
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

// Profile
export const profile = {
  get: (token: string) => fetchAPI('/auth/me', { token }),

  update: (token: string, data: { full_name?: string; telegram_username?: string }) =>
    fetchAPI('/me/profile', { method: 'PATCH', token, body: JSON.stringify(data) }),

  changePassword: (token: string, data: { old_password: string; new_password: string }) =>
    fetchAPI('/me/change-password', { method: 'POST', token, body: JSON.stringify(data) }),
};

// Courses
export const courses = {
  myCourses: (token: string) =>
    fetchAPI('/me/courses', { token }),

  detail: (token: string, id: number) =>
    fetchAPI(`/courses/${id}`, { token }),
};

// Lessons
export const lessons = {
  detail: (token: string, id: number) =>
    fetchAPI(`/lessons/${id}`, { token }),

  markWatched: (token: string, id: number) =>
    fetchAPI(`/lessons/${id}/watch`, { method: 'POST', token }),

  homework: (token: string, lessonId: number) =>
    fetchAPI(`/lessons/${lessonId}/homework`, { token }),
};

// Homework
export const homework = {
  submit: (token: string, problemId: number, answer: any) =>
    fetchAPI(`/problems/${problemId}/submit`, { method: 'POST', token, body: JSON.stringify({ answer }) }),

  mySubmissions: (token: string, problemId: number) =>
    fetchAPI(`/me/submissions/${problemId}`, { token }),
};

// Calendar
export const calendar = {
  events: (token: string, params?: { start_date?: string; end_date?: string }) => {
    const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return fetchAPI(`/calendar/events${query}`, { token });
  },

  eventTypes: (token: string) =>
    fetchAPI('/calendar/event-types', { token }),
};

// Admin API
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
