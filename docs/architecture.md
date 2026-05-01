# Архитектура платформы Апекс

## Общая схема

Платформа состоит из трёх основных компонентов:

| Компонент | Технология | Порт |
|-----------|-----------|------|
| Фронтенд | Next.js 14 (React, TypeScript, Tailwind CSS) | 3000 |
| Бэкенд | Django 5 + Django REST Framework + PostgreSQL | 8000 |
| Прокси | Nginx | 80 |

## Структура проекта

```
/
├── backend/           # Django-приложение
│   ├── config/        # Настройки Django (settings, urls, wsgi)
│   ├── core/          # Пользователи, аутентификация, профиль
│   ├── courses/       # Курсы, блоки, темы, занятия, прогресс
│   ├── homework/      # Домашние задания, задачи, сдачи
│   ├── calendar_app/  # Календарь олимпиад
│   └── manage.py
├── frontend/          # Next.js-приложение
│   ├── src/
│   │   ├── app/       # Страницы (App Router)
│   │   ├── components/# Переиспользуемые компоненты
│   │   └── lib/       # API-клиент, контекст авторизации
│   └── package.json
├── nginx/             # Конфигурация Nginx
├── docs/              # Документация
├── design/            # Дизайн-макеты (JSX-прототипы)
├── docker-compose.yml # Для разработки
├── docker-compose.prod.yml # Для продакшена
└── .env.example       # Переменные окружения
```

## Аутентификация

Используется JWT (JSON Web Tokens) через библиотеку `djangorestframework-simplejwt`:

- Access token: срок жизни 12 часов
- Refresh token: срок жизни 30 дней
- Токены хранятся в `localStorage` на клиенте
- Все защищённые API-эндпоинты требуют заголовок `Authorization: Bearer <access_token>`

## База данных

PostgreSQL 16. Основные таблицы:

- `users` — пользователи (email, пароль, роль)
- `courses` — курсы
- `enrollments` — связь ученик↔курс
- `blocks` → `topics` → `lessons` — иерархия контента
- `lesson_progress` — отметки просмотра
- `homeworks` → `problems` — домашние задания
- `problem_options` — варианты ответов (для choice)
- `problem_attachments` — картинки к задачам
- `submissions` — попытки сдачи
- `olympiad_events` / `olympiad_event_types` — календарь

## Проверка ответов

| Тип | Метод проверки |
|-----|---------------|
| `text` | Ручная проверка админом |
| `choice_single` / `choice_multiple` | Сравнение выбранных вариантов |
| `number` | Проверка с допуском (абсолютная/относительная погрешность) |
| `formula` | SymPy (символьная эквивалентность), fallback — строковое сравнение |

## Формульный ввод

Используется библиотека **MathLive** (`mathlive`) для ввода формул с виртуальной клавиатурой. Формулы передаются на бэкенд в формате LaTeX.

## Файловое хранилище

- PDF-конспекты, рабочие тетради, картинки к задачам хранятся в `/app/media/`
- В Docker — volume `backend_media`
- Nginx отдаёт файлы по пути `/media/`
- Лимит загрузки: 50 МБ

## Видео

В MVP используется только YouTube (iframe embed). Поле `video_provider` в модели `Lesson` подготовлено для будущего переключения на VK Video или Яндекс Диск.

## Безопасность

- Пароли хэшируются через PBKDF2 (Django default) / bcrypt
- Rate limiting на login/register/forgot-password (5 попыток за 15 минут)
- CORS настроен через `django-cors-headers`
- CSRF-защита (для cookie-based сессий)
- XSS-защита: markdown рендерится через безопасный рендерер
- В продакшене: HTTPS, HSTS, secure cookies

## Деплой

Два режима:

1. **Разработка**: `docker-compose up` — все сервисы поднимаются локально
2. **Продакшен**: `docker-compose -f docker-compose.prod.yml up -d` — с оптимизациями, SSL, бэкапами
