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
      <div className="bg-[#0D1525] border border-[#1E2D4A] p-8 rounded-xl text-center">
        <p className="text-[#5BD68A] mb-4">Пароль успешно изменён!</p>
        <Link href="/login" className="text-[#4ECDD4] hover:text-[#6EE8EE] transition-colors">Войти</Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-[#0D1525] border border-[#1E2D4A] p-8 rounded-xl space-y-4">
      {error && <div className="p-3 bg-[rgba(255,123,109,0.12)] text-[#FF7B6D] rounded-lg text-sm">{error}</div>}
      <div>
        <label className="block text-sm font-medium mb-1 text-[#A8A5A0]">Новый пароль</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8}
          className="w-full px-3 py-2 bg-[#152035] border border-[#1E2D4A] rounded-lg text-[#F0EDE8] focus:outline-none focus:ring-2 focus:ring-[#4ECDD4] focus:border-transparent" />
      </div>
      <button type="submit" disabled={loading}
        className="w-full py-2.5 bg-[#D9A441] text-[#0A0E1A] font-medium rounded-lg hover:bg-[#F4B860] disabled:opacity-50 transition-colors">
        {loading ? 'Сохранение...' : 'Сохранить пароль'}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#070C18] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 justify-center">
            <svg width="28" height="28" viewBox="0 0 100 100" fill="none">
              <circle cx="36" cy="22" r="3.5" fill="#D9A441" opacity="0.95"/>
              <circle cx="72" cy="18" r="2.5" fill="#D9A441" opacity="0.95"/>
              <circle cx="52" cy="52" r="2.2" fill="#D9A441" opacity="0.95"/>
              <circle cx="38" cy="82" r="2" fill="#D9A441" opacity="0.95"/>
              <circle cx="74" cy="80" r="3.2" fill="#D9A441" opacity="0.95"/>
            </svg>
            <span className="font-serif text-2xl font-semibold text-[#F0EDE8] tracking-tight">apeks</span>
          </Link>
          <h1 className="text-xl mt-4 text-[#F0EDE8]">Новый пароль</h1>
        </div>
        <Suspense fallback={<div className="text-[#6A6860] text-center">Загрузка...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
