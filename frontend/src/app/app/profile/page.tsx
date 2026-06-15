'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { profile as profileAPI, analytics, type Stats } from '@/lib/api';
import {
  Card,
  CardHeader,
  Badge,
  Skeleton,
  useToast,
} from '@/components/ui';

/* ------------------------------------------------------------------ *
 * Shared field styles
 * ------------------------------------------------------------------ */
const inputCls =
  'w-full px-3 py-2 bg-[#152035] border border-[#1E2D4A] rounded-lg text-[#F0EDE8] placeholder:text-[#6A6860] focus:outline-none focus:ring-2 focus:ring-[#4ECDD4] focus:border-transparent transition-shadow';
const labelCls = 'block text-sm font-medium mb-1.5 text-[#A8A5A0]';
const primaryBtn =
  'px-4 py-2 bg-[#D9A441] text-[#070C18] text-sm font-medium rounded-lg hover:bg-[#F4B860] disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D9A441] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D1525]';
const ghostBtn =
  'px-4 py-2 border border-[#1E2D4A] text-sm text-[#A8A5A0] rounded-lg hover:bg-[#152035] hover:text-[#F0EDE8] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4ECDD4]';

/* ------------------------------------------------------------------ *
 * Account info row
 * ------------------------------------------------------------------ */
function InfoRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-3 py-2.5 border-b border-[#1E2D4A]/60 last:border-b-0">
      <span className="text-sm text-[#6A6860] sm:w-44 sm:flex-shrink-0">
        {label}
      </span>
      <span className="text-sm text-[#F0EDE8] flex items-center gap-2 flex-wrap">
        {children}
      </span>
    </div>
  );
}

export default function ProfilePage() {
  const { user, token, refreshUser } = useAuth();
  const { show } = useToast();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    telegram_username: user?.telegram_username || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Password change
  const [pwForm, setPwForm] = useState({ old_password: '', new_password: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState('');

  // Stats teaser
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(false);

  useEffect(() => {
    if (!token) return;
    let active = true;
    setStatsLoading(true);
    setStatsError(false);
    analytics
      .stats(token)
      .then((data) => {
        if (active) setStats(data);
      })
      .catch(() => {
        if (active) setStatsError(true);
      })
      .finally(() => {
        if (active) setStatsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token]);

  const startEditing = () => {
    // Reset the form to the latest user values when entering edit mode.
    setForm({
      full_name: user?.full_name || '',
      telegram_username: user?.telegram_username || '',
    });
    setError('');
    setEditing(true);
  };

  const handleSaveProfile = async () => {
    if (!token) return;
    setSaving(true);
    setError('');
    try {
      await profileAPI.update(token, form);
      await refreshUser();
      setEditing(false);
      show('Сохранено', 'success');
    } catch (err: any) {
      const msg = err?.detail || 'Не удалось сохранить профиль';
      setError(msg);
      show(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setPwSaving(true);
    setPwError('');
    try {
      await profileAPI.changePassword(token, pwForm);
      setPwForm({ old_password: '', new_password: '' });
      show('Пароль изменён', 'success');
    } catch (err: any) {
      const msg = err?.old_password?.[0] || err?.detail || 'Не удалось сменить пароль';
      setPwError(msg);
      show(msg, 'error');
    } finally {
      setPwSaving(false);
    }
  };

  if (!user) return null;

  const initials =
    (user.full_name || user.email || '?')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0])
      .join('')
      .toUpperCase() || '?';

  const accuracyPct =
    typeof stats?.accuracy === 'number'
      ? Math.round(stats.accuracy <= 1 ? stats.accuracy * 100 : stats.accuracy)
      : null;
  const solved = stats?.problems_solved ?? stats?.problems_correct ?? null;

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div
          className="flex-shrink-0 grid place-items-center w-14 h-14 rounded-full bg-[#152035] border border-[#1E2D4A] font-serif text-xl font-semibold text-[#D9A441]"
          aria-hidden="true"
        >
          {initials}
        </div>
        <div className="min-w-0">
          <h1 className="font-serif text-2xl font-bold text-[#F0EDE8] truncate">
            {user.full_name || 'Профиль'}
          </h1>
          <p className="text-sm text-[#A8A5A0] truncate">{user.email}</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Personal data */}
        <Card>
          <CardHeader
            title="Личные данные"
            action={
              !editing ? (
                <button
                  onClick={startEditing}
                  className="text-sm text-[#4ECDD4] hover:text-[#6EE8EE] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4ECDD4] rounded px-1"
                >
                  Редактировать
                </button>
              ) : undefined
            }
          />

          {error && (
            <div className="p-3 rounded-lg text-sm mb-4 bg-[rgba(255,123,109,0.12)] text-[#FF7B6D] border border-[rgba(255,123,109,0.3)]">
              {error}
            </div>
          )}

          {editing ? (
            <div className="space-y-4">
              <div>
                <label htmlFor="full_name" className={labelCls}>
                  ФИО
                </label>
                <input
                  id="full_name"
                  type="text"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  placeholder="Иван Иванов"
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="telegram_username" className={labelCls}>
                  Telegram
                </label>
                <input
                  id="telegram_username"
                  type="text"
                  value={form.telegram_username}
                  onChange={(e) =>
                    setForm({ ...form, telegram_username: e.target.value })
                  }
                  placeholder="@username"
                  className={inputCls}
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className={primaryBtn}
                >
                  {saving ? 'Сохранение…' : 'Сохранить'}
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setError('');
                  }}
                  disabled={saving}
                  className={ghostBtn}
                >
                  Отмена
                </button>
              </div>
            </div>
          ) : (
            <div>
              <InfoRow label="Email">
                <span className="truncate">{user.email}</span>
                {user.is_email_verified ? (
                  <Badge color="success">Подтверждён</Badge>
                ) : (
                  <Badge color="warning">Не подтверждён</Badge>
                )}
              </InfoRow>
              <InfoRow label="ФИО">
                {user.full_name || <span className="text-[#6A6860]">—</span>}
              </InfoRow>
              <InfoRow label="Telegram">
                {user.telegram_username || (
                  <span className="text-[#6A6860]">—</span>
                )}
              </InfoRow>
              <InfoRow label="Роль">
                <Badge color={user.is_admin ? 'gold' : 'info'}>
                  {user.is_admin ? 'Администратор' : 'Ученик'}
                </Badge>
              </InfoRow>
              <InfoRow label="Дата регистрации">
                {new Date(user.created_at).toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </InfoRow>
            </div>
          )}
        </Card>

        {/* Stats teaser */}
        <Card>
          <CardHeader
            title="Моя статистика"
            action={
              <Link
                href="/app/stats"
                className="text-sm text-[#4ECDD4] hover:text-[#6EE8EE] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4ECDD4] rounded px-1"
              >
                Подробнее →
              </Link>
            }
          />

          {statsLoading ? (
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
          ) : statsError ? (
            <p className="text-sm text-[#A8A5A0] py-2">
              Не удалось загрузить статистику.{' '}
              <Link
                href="/app/stats"
                className="text-[#4ECDD4] hover:text-[#6EE8EE]"
              >
                Открыть страницу статистики
              </Link>
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/app/stats"
                className="group rounded-xl bg-[#152035] border border-[#1E2D4A] p-4 hover:border-[#4ECDD4]/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4ECDD4]"
              >
                <div className="text-xs text-[#A8A5A0] mb-1">Решено задач</div>
                <div className="font-serif text-3xl font-bold text-[#4ECDD4]">
                  {solved ?? 0}
                </div>
              </Link>
              <Link
                href="/app/stats"
                className="group rounded-xl bg-[#152035] border border-[#1E2D4A] p-4 hover:border-[#D9A441]/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D9A441]"
              >
                <div className="text-xs text-[#A8A5A0] mb-1">Точность</div>
                <div className="font-serif text-3xl font-bold text-[#D9A441]">
                  {accuracyPct !== null ? `${accuracyPct}%` : '—'}
                </div>
              </Link>
            </div>
          )}
        </Card>

        {/* Change password */}
        <Card>
          <CardHeader title="Сменить пароль" />
          {pwError && (
            <div className="p-3 rounded-lg text-sm mb-4 bg-[rgba(255,123,109,0.12)] text-[#FF7B6D] border border-[rgba(255,123,109,0.3)]">
              {pwError}
            </div>
          )}
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label htmlFor="old_password" className={labelCls}>
                Текущий пароль
              </label>
              <input
                id="old_password"
                type="password"
                autoComplete="current-password"
                value={pwForm.old_password}
                onChange={(e) =>
                  setPwForm({ ...pwForm, old_password: e.target.value })
                }
                required
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="new_password" className={labelCls}>
                Новый пароль
              </label>
              <input
                id="new_password"
                type="password"
                autoComplete="new-password"
                value={pwForm.new_password}
                onChange={(e) =>
                  setPwForm({ ...pwForm, new_password: e.target.value })
                }
                required
                minLength={8}
                className={inputCls}
              />
              <p className="mt-1.5 text-xs text-[#6A6860]">Минимум 8 символов.</p>
            </div>
            <button type="submit" disabled={pwSaving} className={primaryBtn}>
              {pwSaving ? 'Сохранение…' : 'Сменить пароль'}
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
}
