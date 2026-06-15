# Апекс — Образовательная платформа для подготовки к олимпиадам по астрономии

Веб-платформа онлайн-школы **Апекс** (apeks.space) для подготовки к Всероссийской олимпиаде школьников и международным олимпиадам по астрономии.

## Стек технологий

| Компонент | Технология |
|-----------|-----------|
| Backend | Django 5 + Django REST Framework |
| Frontend | Next.js 14 + TypeScript + Tailwind CSS |
| База данных | PostgreSQL 16 |
| Аутентификация | JWT (SimpleJWT) |
| Формулы | MathLive (ввод) + KaTeX (рендер) + SymPy (проверка) |
| Контейнеризация | Docker + Docker Compose |
| Веб-сервер | Nginx |

## Функциональность

### Публичная часть
- Лендинг с информацией о курсе, стоимости и льготах



### Личный кабинет ученика
- Регистрация с подтверждением по 6-значному коду (email) и авторизация (email + пароль)
- Выход с блокировкой refresh-токена (token blacklist), сброс пароля
- Дашборд с курсами, прогрессом и ближайшими олимпиадами
- Просмотр курсов (блоки → темы → занятия) с прогрессом и переходом к следующему занятию
- Типы занятий: теория, практика, повышенная сложность, тест, пробник (`theory|practice|hard|test|mock`)
- Страница занятия: видео (YouTube embed), конспект с формулами, PDF-материалы, статус ДЗ
- Агрегированная библиотека материалов (PDF) с поиском и фильтром по типу
- Домашние задания с 5 типами ответов:
  - Текстовый ответ (ручная проверка)
  - Одиночный выбор (автопроверка)
  - Множественный выбор (автопроверка)
  - Числовой ответ с допуском (автопроверка)
  - Формула с клавиатурой MathLive (автопроверка через SymPy)
- Банк задач по уровням (школьный, муниципальный, региональный, заключительный) с фильтрами по теме (тегу), типу ответа и статусу
- Разбор (решение) задачи, открывающийся после сдачи; работа над ошибками (все неверно решённые задачи)
- Дашборд домашних заданий со статусами: сдано, не сделано, на проверке, ошибка
- Пробные олимпиады на время: серверный таймер (дедлайн), попытки, автоматическое раскрытие результатов и решений после завершения
- Аналитика: сильные/слабые темы, точность, статистика по уровням и типам, активность за 30 дней
- Персональные рекомендации по обучению (эвристика + опциональное обогащение ИИ)
- Единый поиск по занятиям, задачам и материалам
- Вовлечённость: избранное, оценки и комментарии к занятиям, вопросы преподавателю
- Единое расписание: события олимпиад + дедлайны ДЗ + ближайшие занятия
- Календарь олимпиад с фильтрацией по типам
- Тренажёр звёздного неба (ссылка на внешний https://apex-skychart.ru)
- Профиль с редактированием и сменой пароля

### Админ-панель
- Django Admin для управления контентом
- REST API для CRUD всех сущностей
- Ручная проверка текстовых ответов
- Управление пользователями и доступами

## Быстрый старт

### Предварительные требования
- Docker и Docker Compose
- Git

### Запуск

```bash
# Клонировать репозиторий
git clone https://github.com/ee1802/space.git
cd space

# Скопировать переменные окружения
cp .env.example .env

# Запустить все сервисы
docker compose up -d --build

# Выполнить миграции и создать тестовые данные
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py seed_data
```

Платформа будет доступна:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/api/
- **Django Admin**: http://localhost:8000/admin/
- **Nginx (prod)**: http://localhost:80

### Тестовые аккаунты

| Роль | Email | Пароль |
|------|-------|--------|
| Администратор | admin@apeks.space | admin123 |
| Ученик 1 | student1@test.com | student123 |
| Ученик 2 | student2@test.com | student123 |

## Локальная разработка (без Docker)

### Backend

```bash
cd backend
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Настроить переменные окружения (или использовать SQLite по умолчанию)
export DJANGO_DEBUG=True
export DJANGO_SECRET_KEY=dev-secret  # обязателен, если DJANGO_DEBUG=False
# export ANTHROPIC_API_KEY=sk-ant-...  # опционально: ИИ-обогащение рекомендаций

python manage.py migrate
python manage.py seed_data
python manage.py runserver
```

### Frontend

```bash
cd frontend
pnpm install
NEXT_PUBLIC_API_URL=http://localhost:8000/api pnpm dev
```

## Структура проекта

```
space/
├── backend/
│   ├── config/          # Django settings, urls, wsgi
│   ├── core/            # User model, auth views (email-код), permissions, throttles
│   ├── courses/         # Courses, blocks, topics, lessons, materials
│   ├── homework/        # Homework, problems, problem bank, submissions, formula checker
│   ├── olympiads/       # Timed mock olympiads (попытки, серверный таймер)
│   ├── analytics/       # Stats, recommendations (ИИ-обогащение), unified search
│   ├── engagement/      # Favorites, ratings, questions to teacher
│   ├── calendar_app/    # Olympiad events, types, unified schedule
│   ├── manage.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/         # Next.js App Router pages
│   │   ├── components/  # Reusable components (MathField, MarkdownRenderer)
│   │   └── lib/         # API client, auth context, design-tokens
│   ├── package.json
│   └── Dockerfile
├── design-archive/      # Original design prototypes and visual assets
│   ├── apeks-components.jsx  # Design system components
│   ├── apeks-lms-pages.jsx   # LMS page compositions
│   ├── apeks-landing.jsx     # Landing page design
│   ├── Apeks LMS.html        # Interactive prototype
│   └── uploads/              # Reference images
├── docs/
│   ├── architecture.md  # System architecture
│   ├── api.md           # API documentation
│   └── admin-guide.md   # Admin user guide
├── scripts/
│   └── backup.sh        # Database backup script
├── nginx/
│   ├── nginx.conf       # Development config
│   └── nginx.prod.conf  # Production config with SSL
├── docker-compose.yml       # Development setup
├── docker-compose.prod.yml  # Production setup
├── .env.example
└── README.md
```

## API Endpoints

### Аутентификация
| Метод | URL | Описание |
|-------|-----|----------|
| POST | `/api/auth/send-code` | Отправить 6-значный код на email |
| POST | `/api/auth/register` | Регистрация (с проверкой кода) |
| POST | `/api/auth/login` | Вход |
| POST | `/api/auth/logout` | Выход (блокировка refresh-токена) |
| GET | `/api/auth/me` | Текущий пользователь |
| POST | `/api/auth/token/refresh` | Обновление JWT |
| GET | `/api/auth/verify-email` | Подтверждение email |
| POST | `/api/auth/forgot-password` | Запрос сброса пароля |
| POST | `/api/auth/reset-password` | Сброс пароля |

### Курсы (ученик)
| Метод | URL | Описание |
|-------|-----|----------|
| GET | `/api/me/courses` | Мои курсы (прогресс, кол-во занятий, следующее занятие) |
| GET | `/api/courses/{id}` | Детали курса (типы занятий, статус ДЗ) |
| GET | `/api/lessons/{id}` | Детали занятия (тип, материалы) |
| POST | `/api/lessons/{id}/watch` | Отметить просмотренным |
| GET | `/api/me/materials` | Библиотека PDF-материалов (фильтры `?q=&kind=`) |

### Домашние задания и банк задач
| Метод | URL | Описание |
|-------|-----|----------|
| GET | `/api/lessons/{id}/homework` | ДЗ занятия |
| POST | `/api/problems/{id}/submit` | Отправить ответ |
| GET | `/api/me/submissions/{problem_id}` | Мои попытки |
| GET | `/api/problems/bank` | Банк задач (фильтры `?level=&tag=&answer_type=&q=&status=`) |
| GET | `/api/me/mistakes` | Работа над ошибками (с разбором) |
| GET | `/api/me/homework` | Дашборд ДЗ со статусами |
| GET | `/api/tags` | Темы (теги) задач |

### Пробные олимпиады
| Метод | URL | Описание |
|-------|-----|----------|
| GET | `/api/olympiads` | Список пробников |
| GET | `/api/olympiads/{id}` | Детали пробника |
| POST | `/api/olympiads/{id}/start` | Начать попытку |
| GET | `/api/olympiads/attempts/{id}` | Состояние попытки |
| POST | `/api/olympiads/attempts/{id}/answer` | Сохранить ответ |
| POST | `/api/olympiads/attempts/{id}/finish` | Завершить (результат + решения) |
| GET | `/api/me/olympiad-attempts` | Мои попытки |

### Аналитика
| Метод | URL | Описание |
|-------|-----|----------|
| GET | `/api/me/stats` | Статистика (темы, точность, активность за 30 дней) |
| GET | `/api/me/recommendations` | Рекомендации по обучению (опц. ИИ) |
| GET | `/api/search` | Единый поиск (`?q=`) по занятиям/задачам/материалам |

### Вовлечённость
| Метод | URL | Описание |
|-------|-----|----------|
| GET | `/api/me/favorites` | Избранное |
| POST | `/api/me/favorites/toggle` | Добавить/убрать из избранного |
| POST | `/api/lessons/{id}/rate` | Оценить занятие |
| GET | `/api/lessons/{id}/rating` | Рейтинг занятия |
| POST | `/api/questions` | Задать вопрос |
| GET | `/api/me/questions` | Мои вопросы |
| GET | `/api/questions` | Вопросы (фильтр `?lesson={id}`) |

### Календарь и расписание
| Метод | URL | Описание |
|-------|-----|----------|
| GET | `/api/calendar/events` | Список событий |
| GET | `/api/calendar/event-types` | Типы событий |
| GET | `/api/me/schedule` | Единое расписание (фильтры `?from=&to=&kind=`) |

### Админ API
Все CRUD-эндпоинты доступны по `/api/admin/*` для пользователей с `is_admin=True`.
Дополнительно: `GET /api/admin/questions` (вопросы учеников) и `POST /api/admin/questions/{id}/answer` (ответ на вопрос).

## Переменные окружения

Все переменные описаны в `.env.example`.

## Лицензия

Проприетарный проект. Все права защищены.
