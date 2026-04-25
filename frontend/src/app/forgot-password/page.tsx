'use client';

import { useState } from 'react';
import Link from 'next/link';
import { auth } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await auth.forgotPassword(email);
      setSent(true);
    } catch (err: any) {
      setError(err?.detail || 'Ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold">Апекс</Link>
          <h1 className="text-xl mt-4">Восстановление пароля</h1>
        </div>
        {sent ? (
          <div className="bg-white p-8 rounded-lg border text-center">
            <p className="text-green-600 mb-4">Если email зарегистрирован, на него отправлена ссылка для сброса пароля.</p>
            <Link href="/login" className="text-blue-600 hover:underline">Вернуться к входу</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg border space-y-4">
            {error && <div className="p-3 bg-red-50 text-red-600 rounded text-sm">{error}</div>}
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Отправка...' : 'Отправить ссылку'}
            </button>
            <p className="text-center text-sm">
              <Link href="/login" className="text-blue-600 hover:underline">Вернуться к входу</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
