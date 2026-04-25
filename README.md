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
- Кнопка покупки через Tribute

### Личный кабинет ученика
- Регистрация и авторизация (email + пароль)
- Подтверждение email, сброс пароля
- Дашборд с курсами и ближайшими олимпиадами
- Просмотр курсов (блоки → темы → занятия)
- Страница занятия: видео (YouTube embed), конспект с формулами, PDF-файлы
- Домашние задания с 5 типами ответов:
  - Текстовый ответ (ручная проверка)
  - Одиночный выбор (автопроверка)
  - Множественный выбор (автопроверка)
  - Числовой ответ с допуском (автопроверка)
  - Формула с клавиатурой MathLive (автопроверка через SymPy)
- Календарь олимпиад с фильтрацией по типам
- Тренажёр звёздного неба (викторина по созвездиям)
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
export DJANGO_SECRET_KEY=dev-secret

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
│   ├── core/            # User model, auth views, permissions
│   ├── courses/         # Courses, blocks, topics, lessons
│   ├── homework/        # Homework, problems, submissions, formula checker
│   ├── calendar_app/    # Olympiad events and types
│   ├── manage.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/         # Next.js App Router pages
│   │   ├── components/  # Reusable components (MathField, MarkdownRenderer)
│   │   └── lib/         # API client, auth context
│   ├── package.json
│   └── Dockerfile
├── nginx/
│   └── nginx.conf
├── docker-compose.yml
├── .env.example
└── README.md
```

## API Endpoints

### Аутентификация
| Метод | URL | Описание |
|-------|-----|----------|
| POST | `/api/auth/register` | Регистрация |
| POST | `/api/auth/login` | Вход |
| POST | `/api/auth/logout` | Выход |
| GET | `/api/auth/me` | Текущий пользователь |
| POST | `/api/auth/token/refresh` | Обновление JWT |
| GET | `/api/auth/verify-email` | Подтверждение email |
| POST | `/api/auth/forgot-password` | Запрос сброса пароля |
| POST | `/api/auth/reset-password` | Сброс пароля |

### Курсы (ученик)
| Метод | URL | Описание |
|-------|-----|----------|
| GET | `/api/me/courses` | Мои курсы |
| GET | `/api/courses/{id}` | Детали курса |
| GET | `/api/lessons/{id}` | Детали занятия |
| POST | `/api/lessons/{id}/watch` | Отметить просмотренным |

### Домашние задания
| Метод | URL | Описание |
|-------|-----|----------|
| GET | `/api/lessons/{id}/homework` | ДЗ занятия |
| POST | `/api/problems/{id}/submit` | Отправить ответ |
| GET | `/api/me/submissions/{problem_id}` | Мои попытки |

### Календарь
| Метод | URL | Описание |
|-------|-----|----------|
| GET | `/api/calendar/events` | Список событий |
| GET | `/api/calendar/event-types` | Типы событий |

### Админ API
Все CRUD-эндпоинты доступны по `/api/admin/*` для пользователей с `is_admin=True`.

## Переменные окружения

Все переменные описаны в `.env.example`.

## Лицензия

Проприетарный проект. Все права защищены.
