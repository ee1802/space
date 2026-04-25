'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/api';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await auth.resetPassword(token, password);
      setDone(true);
    } catch (err: any) {
      setError(err?.detail || 'Ошибка');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="bg-white p-8 rounded-lg border text-center">
        <p className="text-green-600 mb-4">Пароль успешно изменён!</p>
        <Link href="/login" className="text-blue-600 hover:underline">Войти</Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg border space-y-4">
      {error && <div className="p-3 bg-red-50 text-red-600 rounded text-sm">{error}</div>}
      <div>
        <label className="block text-sm font-medium mb-1">Новый пароль</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8}
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <button type="submit" disabled={loading}
        className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
        {loading ? 'Сохранение...' : 'Сохранить пароль'}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold">Апекс</Link>
          <h1 className="text-xl mt-4">Новый пароль</h1>
        </div>
        <Suspense fallback={<div>Загрузка...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
