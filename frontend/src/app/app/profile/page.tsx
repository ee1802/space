'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { profile as profileAPI } from '@/lib/api';

export default function ProfilePage() {
  const { user, token, refreshUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    telegram_username: user?.telegram_username || '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Password change
  const [pwForm, setPwForm] = useState({ old_password: '', new_password: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMessage, setPwMessage] = useState('');

  const handleSaveProfile = async () => {
    if (!token) return;
    setSaving(true);
    setMessage('');
    try {
      await profileAPI.update(token, form);
      await refreshUser();
      setEditing(false);
      setMessage('Профиль обновлён.');
    } catch (err: any) {
      setMessage(err?.detail || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setPwSaving(true);
    setPwMessage('');
    try {
      await profileAPI.changePassword(token, pwForm);
      setPwMessage('Пароль изменён.');
      setPwForm({ old_password: '', new_password: '' });
    } catch (err: any) {
      setPwMessage(err?.old_password?.[0] || err?.detail || 'Ошибка');
    } finally {
      setPwSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-6">Профиль</h1>

      <div className="bg-white border rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Личные данные</h2>
          {!editing && (
            <button onClick={() => setEditing(true)} className="text-sm text-blue-600 hover:underline">
              Редактировать
            </button>
          )}
        </div>

        {message && (
          <div className={`p-3 rounded text-sm mb-4 ${message.includes('Ошибка') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
            {message}
          </div>
        )}

        {editing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">ФИО</label>
              <input
                type="text"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Telegram</label>
              <input
                type="text"
                value={form.telegram_username}
                onChange={(e) => setForm({ ...form, telegram_username: e.target.value })}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
              <button
                onClick={() => setEditing(false)}
                className="px-4 py-2 border text-sm rounded hover:bg-gray-50"
              >
                Отмена
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <span className="text-sm text-gray-500">Email:</span>
              <span className="ml-2">{user.email}</span>
              {user.is_email_verified ? (
                <span className="ml-2 text-xs text-green-600">подтверждён</span>
              ) : (
                <span className="ml-2 text-xs text-orange-600">не подтверждён</span>
              )}
            </div>
            <div>
              <span className="text-sm text-gray-500">ФИО:</span>
              <span className="ml-2">{user.full_name || '—'}</span>
            </div>
            <div>
              <span className="text-sm text-gray-500">Telegram:</span>
              <span className="ml-2">{user.telegram_username || '—'}</span>
            </div>
            <div>
              <span className="text-sm text-gray-500">Роль:</span>
              <span className="ml-2">{user.is_admin ? 'Администратор' : 'Ученик'}</span>
            </div>
            <div>
              <span className="text-sm text-gray-500">Дата регистрации:</span>
              <span className="ml-2">{new Date(user.created_at).toLocaleDateString('ru-RU')}</span>
            </div>
          </div>
        )}
      </div>

      {/* Change password */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="font-semibold mb-4">Сменить пароль</h2>
        {pwMessage && (
          <div className={`p-3 rounded text-sm mb-4 ${pwMessage.includes('Ошибка') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
            {pwMessage}
          </div>
        )}
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Текущий пароль</label>
            <input
              type="password"
              value={pwForm.old_password}
              onChange={(e) => setPwForm({ ...pwForm, old_password: e.target.value })}
              required
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Новый пароль</label>
            <input
              type="password"
              value={pwForm.new_password}
              onChange={(e) => setPwForm({ ...pwForm, new_password: e.target.value })}
              required
              minLength={8}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={pwSaving}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {pwSaving ? 'Сохранение...' : 'Сменить пароль'}
          </button>
        </form>
      </div>
    </div>
  );
}
