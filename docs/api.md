# API Documentation

Базовый URL: `http://localhost:8000/api`

Все защищённые эндпоинты требуют заголовок:
```
Authorization: Bearer <access_token>
```

## Аутентификация

| Метод | URL | Описание | Доступ |
|-------|-----|----------|--------|
| POST | `/auth/send-code` | Отправить 6-значный код на email | Публичный |
| POST | `/auth/register` | Регистрация (с проверкой кода) | Публичный |
| POST | `/auth/login` | Вход | Публичный |
| POST | `/auth/logout` | Выход (блокировка refresh-токена) | Авторизованный |
| GET | `/auth/verify-email?token=...` | Подтверждение email | Публичный |
| POST | `/auth/forgot-password` | Запрос сброса пароля | Публичный |
| POST | `/auth/reset-password` | Сброс пароля | Публичный |
| GET | `/auth/me` | Текущий пользователь | Авторизованный |
| POST | `/auth/token/refresh` | Обновление токена | Публичный |

### POST /auth/send-code

Отправляет 6-значный код подтверждения на email. Поле `type` указывает сценарий (например, `register`).

```json
{
  "email": "user@example.com",
  "type": "register"
}
```

### POST /auth/register

Проверяет ранее отправленный 6-значный `code`.

```json
{
  "email": "user@example.com",
  "password": "password123",
  "password_confirm": "password123",
  "code": "123456",
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

### POST /auth/logout

Принимает `refresh`-токен и заносит его в чёрный список (token blacklist), делая дальнейшее обновление невозможным.

```json
{ "refresh": "..." }
```

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
| GET | `/me/materials` | Библиотека PDF-материалов |

### GET /me/courses

Ответ: список курсов с полями `progress` (0-100 или null), `lessons_total`, `lessons_completed`, `next_lesson`.

### GET /courses/{id}

Ответ: курс с вложенной иерархией `blocks → topics → lessons`. Каждое занятие содержит `lesson_type` (`theory|practice|hard|test|mock`), `is_watched`, `homework_status`.

### GET /lessons/{id}

Ответ включает: `title`, `video_url`, `description`, `notes_file`, `workbook_file`, `is_watched`, `prev_lesson_id`, `next_lesson_id`, `pdf_files`, `lesson_type`, `materials[]`.

### GET /me/materials

Агрегированный список скачиваемых PDF-материалов по всем доступным курсам.

Параметры: `?q=` (поиск по названию), `?kind=` (тип материала).

## Домашние задания (для ученика)

| Метод | URL | Описание |
|-------|-----|----------|
| GET | `/lessons/{id}/homework` | Получить ДЗ к занятию |
| POST | `/problems/{id}/submit` | Отправить ответ |
| GET | `/me/submissions/{problem_id}` | История сдач по задаче |
| GET | `/problems/bank` | Банк задач |
| GET | `/me/mistakes` | Работа над ошибками |
| GET | `/me/homework` | Дашборд домашних заданий |
| GET | `/tags` | Список тем (тегов) задач |

### POST /problems/{id}/submit

Формат `answer` зависит от типа задачи:

- **text**: `{"text": "Развёрнутый ответ..."}`
- **choice_single**: `{"option_id": "123"}`
- **choice_multiple**: `{"option_ids": ["123", "456"]}`
- **number**: `{"value": 42.5}`
- **formula**: `{"latex": "\\frac{1}{2}"}`

Ответ: объект `Submission` с результатом проверки.

Задачи дополнительно содержат поля: `level` (`school|municipal|regional|final`), `tags`, `source`, `in_bank`, а также `solution` (разбор) — открывается после хотя бы одной сдачи.

### GET /problems/bank

Банк задач по уровням сложности с фильтрами.

Параметры:
- `?level=` — уровень: `school`, `municipal`, `regional`, `final`
- `?tag=` — тема (тег)
- `?answer_type=` — тип ответа (`text|choice_single|choice_multiple|number|formula`)
- `?q=` — поиск по тексту
- `?status=` — статус сдачи ученика

### GET /me/mistakes

Все задачи, на которые ученик дал неверный ответ, вместе с разбором (`solution`).

### GET /me/homework

Дашборд ДЗ со статусами: `сдано`, `не сделано`, `на проверке`, `ошибка`.

### GET /tags

Список доступных тем (тегов), используемых для фильтрации банка задач.

## Пробные олимпиады (на время)

| Метод | URL | Описание |
|-------|-----|----------|
| GET | `/olympiads` | Список доступных пробников |
| GET | `/olympiads/{id}` | Детали пробника |
| POST | `/olympiads/{id}/start` | Начать попытку |
| GET | `/olympiads/attempts/{id}` | Состояние попытки |
| POST | `/olympiads/attempts/{id}/answer` | Сохранить ответ на задачу |
| POST | `/olympiads/attempts/{id}/finish` | Завершить попытку |
| GET | `/me/olympiad-attempts` | Мои попытки |

Таймер контролируется сервером: у попытки есть `deadline`. Результаты и решения задач раскрываются только после завершения попытки (вручную через `finish` или по истечении времени).

### POST /olympiads/{id}/start

Создаёт новую попытку и возвращает её состояние с `deadline`.

### POST /olympiads/attempts/{id}/answer

Сохраняет ответ на задачу попытки (формат `answer` как в `/problems/{id}/submit`).

### POST /olympiads/attempts/{id}/finish

Завершает попытку, фиксирует результат и раскрывает решения.

## Аналитика

| Метод | URL | Описание |
|-------|-----|----------|
| GET | `/me/stats` | Статистика ученика |
| GET | `/me/recommendations` | Рекомендации по обучению |
| GET | `/search?q=...` | Единый поиск |

### GET /me/stats

Ответ: сильные/слабые темы, точность (accuracy), разбивка по уровням и типам задач, активность за последние 30 дней.

### GET /me/recommendations

Персональные рекомендации по обучению. Базовый алгоритм — эвристический; при заданной переменной окружения `ANTHROPIC_API_KEY` рекомендации обогащаются ИИ (модель `claude-fable-5`).

### GET /search

Единый поиск по занятиям, задачам и материалам.

Параметры: `?q=` — поисковый запрос.

## Вовлечённость

| Метод | URL | Описание |
|-------|-----|----------|
| GET | `/me/favorites` | Избранное |
| POST | `/me/favorites/toggle` | Добавить/убрать из избранного |
| POST | `/lessons/{id}/rate` | Оценить занятие |
| GET | `/lessons/{id}/rating` | Рейтинг занятия |
| POST | `/questions` | Задать вопрос |
| GET | `/me/questions` | Мои вопросы |
| GET | `/questions?lesson={id}` | Вопросы по занятию |

### POST /me/favorites/toggle

```json
{ "lesson_id": 12 }
```
или
```json
{ "problem_id": 34 }
```

### POST /lessons/{id}/rate

```json
{ "rating": 5, "comment": "Очень понятно!" }
```

### POST /questions

```json
{ "lesson_id": 12, "text": "Не понял вывод формулы..." }
```
Вместо `lesson_id` можно указать `problem_id`. Оба поля опциональны.

## Календарь олимпиад

| Метод | URL | Описание |
|-------|-----|----------|
| GET | `/calendar/events` | Все события (фильтр: `?start_date=YYYY-MM-DD`) |
| GET | `/calendar/event-types` | Типы событий |
| GET | `/me/schedule` | Единое расписание |

### GET /me/schedule

Объединённое расписание: события олимпиад + дедлайны домашних заданий + ближайшие занятия.

Параметры: `?from=YYYY-MM-DD`, `?to=YYYY-MM-DD`, `?kind=` (тип элемента расписания).

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

### Вопросы учеников

| Метод | URL | Описание |
|-------|-----|----------|
| GET | `/admin/questions` | Список вопросов учеников |
| POST | `/admin/questions/{id}/answer` | Ответить на вопрос |

#### POST /admin/questions/{id}/answer

```json
{ "answer": "Текст ответа преподавателя..." }
```
