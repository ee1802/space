'use client';

import { useState } from 'react';
import Link from 'next/link';
import { auth } from '@/lib/api';
import { Brand } from '@/components/brand';

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
    <div className="min-h-screen flex items-center justify-center bg-[#070C18] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Brand href="/" size="md" gradient glow className="justify-center" />
          <h1 className="text-xl mt-4 text-[#F0EDE8]">Восстановление пароля</h1>
        </div>
        {sent ? (
          <div className="bg-[#0D1525] border border-[#1E2D4A] p-8 rounded-xl text-center">
            <p className="text-[#5BD68A] mb-4">Если email зарегистрирован, на него отправлена ссылка для сброса пароля.</p>
            <Link href="/login" className="text-[#4ECDD4] hover:text-[#6EE8EE] transition-colors">Вернуться к входу</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-[#0D1525] border border-[#1E2D4A] p-8 rounded-xl space-y-4">
            {error && <div className="p-3 bg-[rgba(255,123,109,0.12)] text-[#FF7B6D] rounded-lg text-sm">{error}</div>}
            <div>
              <label className="block text-sm font-medium mb-1 text-[#A8A5A0]">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="w-full px-3 py-2 bg-[#152035] border border-[#1E2D4A] rounded-lg text-[#F0EDE8] focus:outline-none focus:ring-2 focus:ring-[#4ECDD4] focus:border-transparent" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-[#D9A441] text-[#0A0E1A] font-medium rounded-lg hover:bg-[#F4B860] disabled:opacity-50 transition-colors">
              {loading ? 'Отправка...' : 'Отправить ссылку'}
            </button>
            <p className="text-center text-sm">
              <Link href="/login" className="text-[#4ECDD4] hover:text-[#6EE8EE] transition-colors">Вернуться к входу</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
