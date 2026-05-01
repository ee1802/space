# API Documentation

Базовый URL: `http://localhost:8000/api`

Все защищённые эндпоинты требуют заголовок:
```
Authorization: Bearer <access_token>
```

## Аутентификация

| Метод | URL | Описание | Доступ |
|-------|-----|----------|--------|
| POST | `/auth/register` | Регистрация | Публичный |
| POST | `/auth/login` | Вход | Публичный |
| POST | `/auth/logout` | Выход | Авторизованный |
| GET | `/auth/verify-email?token=...` | Подтверждение email | Публичный |
| POST | `/auth/forgot-password` | Запрос сброса пароля | Публичный |
| POST | `/auth/reset-password` | Сброс пароля | Публичный |
| GET | `/auth/me` | Текущий пользователь | Авторизованный |
| POST | `/auth/token/refresh` | Обновление токена | Публичный |

### POST /auth/register

```json
{
  "email": "user@example.com",
  "password": "password123",
  "password_confirm": "password123",
  "full_name": "Иван Иванов",
  "telegram_username": "@ivan"
}
```

Ответ: `201 Created`
```json
{
  "user": { "id": 1, "email": "...", "full_name": "...", ... },
  "tokens": { "access": "...", "refresh": "..." }
}
```

### POST /auth/login

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Ответ: `200 OK` — аналогично register.

### POST /auth/forgot-password

```json
{ "email": "user@example.com" }
```

### POST /auth/reset-password

```json
{ "token": "abc123", "new_password": "newpassword123" }
```

## Профиль

| Метод | URL | Описание |
|-------|-----|----------|
| GET/PATCH | `/me/profile` | Просмотр/редактирование профиля |
| POST | `/me/change-password` | Смена пароля |

### POST /me/change-password

```json
{ "old_password": "...", "new_password": "..." }
```

## Курсы (для ученика)

| Метод | URL | Описание |
|-------|-----|----------|
| GET | `/me/courses` | Мои курсы (с прогрессом) |
| GET | `/courses/{id}` | Детали курса (блоки/темы/занятия) |
| GET | `/lessons/{id}` | Детали занятия |
| POST | `/lessons/{id}/watch` | Отметить просмотренным (toggle) |

### GET /me/courses

Ответ: список курсов с полем `progress` (0-100 или null).

### GET /courses/{id}

Ответ: курс с вложенной иерархией `blocks → topics → lessons`.

### GET /lessons/{id}

Ответ включает: `title`, `video_url`, `description`, `notes_file`, `workbook_file`, `is_watched`, `prev_lesson_id`, `next_lesson_id`, `pdf_files`.

## Домашние задания (для ученика)

| Метод | URL | Описание |
|-------|-----|----------|
| GET | `/lessons/{id}/homework` | Получить ДЗ к занятию |
| POST | `/problems/{id}/submit` | Отправить ответ |
| GET | `/me/submissions/{problem_id}` | История сдач по задаче |

### POST /problems/{id}/submit

Формат `answer` зависит от типа задачи:

- **text**: `{"text": "Развёрнутый ответ..."}`
- **choice_single**: `{"option_id": "123"}`
- **choice_multiple**: `{"option_ids": ["123", "456"]}`
- **number**: `{"value": 42.5}`
- **formula**: `{"latex": "\\frac{1}{2}"}`

Ответ: объект `Submission` с результатом проверки.

## Календарь олимпиад

| Метод | URL | Описание |
|-------|-----|----------|
| GET | `/calendar/events` | Все события (фильтр: `?start_date=YYYY-MM-DD`) |
| GET | `/calendar/event-types` | Типы событий |

## Админ API

Все эндпоинты ниже требуют `is_admin = true`.

### Пользователи

| Метод | URL | Описание |
|-------|-----|----------|
| GET | `/admin/users` | Список пользователей (поиск: `?search=...`) |
| GET/PATCH | `/admin/users/{id}` | Детали/редактирование пользователя |
| POST | `/admin/users/{user_id}/enroll` | Выдать доступ к курсу |
| DELETE | `/admin/users/{user_id}/enroll/{course_id}` | Отозвать доступ |

### Курсы

| Метод | URL | Описание |
|-------|-----|----------|
| GET/POST | `/admin/courses` | Список/создание курсов |
| GET/PATCH/DELETE | `/admin/courses/{id}` | CRUD курса |
| GET/POST | `/admin/blocks` | Блоки (фильтр: `?course=...`) |
| GET/PATCH/DELETE | `/admin/blocks/{id}` | CRUD блока |
| GET/POST | `/admin/topics` | Темы (фильтр: `?block=...`) |
| GET/PATCH/DELETE | `/admin/topics/{id}` | CRUD темы |
| GET/POST | `/admin/lessons` | Занятия (фильтр: `?topic=...`) |
| GET/PATCH/DELETE | `/admin/lessons/{id}` | CRUD занятия |

### Домашние задания

| Метод | URL | Описание |
|-------|-----|----------|
| GET/POST | `/admin/homeworks` | Список/создание ДЗ |
| GET/PATCH/DELETE | `/admin/homeworks/{id}` | CRUD ДЗ |
| GET/POST | `/admin/problems` | Задачи (фильтр: `?homework=...`) |
| GET/PATCH/DELETE | `/admin/problems/{id}` | CRUD задачи |
| GET/POST | `/admin/problem-options` | Варианты ответов |
| GET/PATCH/DELETE | `/admin/problem-options/{id}` | CRUD варианта |
| GET/POST | `/admin/problem-attachments` | Вложения к задачам |
| GET/PATCH/DELETE | `/admin/problem-attachments/{id}` | CRUD вложения |

### Проверка сдач

| Метод | URL | Описание |
|-------|-----|----------|
| GET | `/admin/submissions` | Все сдачи (фильтр: `?status=pending`) |
| POST | `/admin/submissions/{id}/grade` | Оценить сдачу |

#### POST /admin/submissions/{id}/grade

```json
{
  "score": 3,
  "is_correct": true,
  "admin_comment": "Отличное решение!"
}
```

### Календарь

| Метод | URL | Описание |
|-------|-----|----------|
| GET/POST | `/admin/events` | События |
| GET/PATCH/DELETE | `/admin/events/{id}` | CRUD события |
| GET/POST | `/admin/event-types` | Типы событий |
| GET/PATCH/DELETE | `/admin/event-types/{id}` | CRUD типа |

### Записи (enrollments)

| Метод | URL | Описание |
|-------|-----|----------|
| GET | `/admin/enrollments` | Все записи |
| GET/PATCH/DELETE | `/admin/enrollments/{id}` | CRUD записи (включая manual_progress_override) |
