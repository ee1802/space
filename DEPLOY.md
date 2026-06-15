# Деплой новой версии на сервер

Эта инструкция обновляет уже работающий прод (с существующей базой) до новой
версии. Все шаги выполняются **на сервере** под вашим пользователем. Новые
миграции **неразрушающие** (добавляют столбцы со значениями по умолчанию,
делают `Problem.homework` необязательным и создают новые таблицы), но перед
миграцией всё равно делаем резервную копию БД.

> Стек: `docker-compose.prod.yml` (db / backend / frontend / nginx / certbot / backup).
> Переменные берутся из `.env` в корне проекта (см. `.env.example`).

## 0. Подключение

```bash
ssh root@45.130.42.165
cd /path/to/space   # каталог, где уже лежит проект и поднят docker compose
```

## 1. Резервная копия БД (обязательно)

```bash
# Имя контейнера БД может отличаться — проверьте: docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml exec -T db \
  sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' | gzip > backup_before_upgrade_$(date +%Y%m%d_%H%M%S).sql.gz
ls -lh backup_before_upgrade_*.sql.gz   # убедитесь, что файл не пустой
```

## 2. Забрать новый код

```bash
git fetch origin
git checkout main
git pull origin main      # после слияния ветки feature/platform-upgrade в main (см. README про PR)
```

## 3. Проверить .env

Добавьте при необходимости новую необязательную переменную (см. `.env.example`):

```
# ANTHROPIC_API_KEY=sk-ant-...   # включает ИИ-обогащение рекомендаций (необязательно)
```

`DJANGO_SECRET_KEY` теперь обязателен при `DJANGO_DEBUG=False` — он у вас уже задан в `.env`.

## 4. Пересобрать и поднять

```bash
docker compose -f docker-compose.prod.yml build backend frontend
docker compose -f docker-compose.prod.yml up -d
```

## 5. Миграции и статика (на существующей БД, данные сохраняются)

```bash
docker compose -f docker-compose.prod.yml exec backend python manage.py migrate
docker compose -f docker-compose.prod.yml exec backend python manage.py collectstatic --noinput
```

> **Не запускайте** `seed_data` на проде — он добавляет демо-контент. Он нужен
> только для локальной/тестовой среды.

## 6. Проверка

```bash
docker compose -f docker-compose.prod.yml ps          # все сервисы healthy/Up
curl -s http://localhost/api/calendar/event-types -o /dev/null -w "%{http_code}\n"  # ожидаем 401 (нужна авторизация)
```

Откройте сайт в браузере, войдите существующим аккаунтом и проверьте новые
разделы: Банк задач, Пробные олимпиады, Статистика, Ошибки, Расписание,
Материалы, Избранное, Вопросы.

## Откат

```bash
git checkout <предыдущий-коммит>
docker compose -f docker-compose.prod.yml build backend frontend
docker compose -f docker-compose.prod.yml up -d
# при необходимости восстановить БД:
gunzip -c backup_before_upgrade_*.sql.gz | \
  docker compose -f docker-compose.prod.yml exec -T db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
```
