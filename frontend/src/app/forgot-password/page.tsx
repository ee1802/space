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
              <line x1="36" y1="22" x2="52" y2="52" stroke="#D9A441" strokeWidth="0.6" opacity="0.4"/>
              <line x1="72" y1="18" x2="52" y2="52" stroke="#D9A441" strokeWidth="0.6" opacity="0.4"/>
              <line x1="52" y1="52" x2="38" y2="82" stroke="#D9A441" strokeWidth="0.6" opacity="0.4"/>
              <line x1="52" y1="52" x2="74" y2="80" stroke="#D9A441" strokeWidth="0.6" opacity="0.4"/>
            </svg>
            <span className="font-serif text-2xl font-semibold text-[#F0EDE8] tracking-tight">apeks</span>
          </Link>
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
