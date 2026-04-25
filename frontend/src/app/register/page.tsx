'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';

export default function RegisterPage() {
  const [form, setForm] = useState({
    email: '', password: '', password_confirm: '', full_name: '', telegram_username: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.password_confirm) {
      setError('Пароли не совпадают');
      return;
    }
    setLoading(true);
    try {
      await register(form);
      router.push('/app');
    } catch (err: any) {
      const msg = err?.email?.[0] || err?.password?.[0] || err?.non_field_errors?.[0] || err?.detail || 'Ошибка регистрации';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold">Апекс</Link>
          <h1 className="text-xl mt-4">Регистрация</h1>
        </div>
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg border space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-600 rounded text-sm">{error}</div>}
          <div>
            <label className="block text-sm font-medium mb-1">Email *</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} required
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Пароль *</label>
            <input type="password" name="password" value={form.password} onChange={handleChange} required minLength={8}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Подтверждение пароля *</label>
            <input type="password" name="password_confirm" value={form.password_confirm} onChange={handleChange} required
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">ФИО</label>
            <input type="text" name="full_name" value={form.full_name} onChange={handleChange}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Telegram</label>
            <input type="text" name="telegram_username" value={form.telegram_username} onChange={handleChange}
              placeholder="@username"
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
          <p className="text-center text-sm">
            Уже есть аккаунт?{' '}
            <Link href="/login" className="text-blue-600 hover:underline">Войти</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
