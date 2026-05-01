'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push('/app');
    } catch (err: any) {
      setError(err?.non_field_errors?.[0] || err?.detail || 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#070C18] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <svg width="28" height="28" viewBox="0 0 100 100" fill="none">
              <circle cx="36" cy="22" r="3.5" fill="#D9A441" opacity="0.95"/>
              <circle cx="72" cy="18" r="2.5" fill="#D9A441" opacity="0.95"/>
              <circle cx="40" cy="50" r="1.8" fill="#D9A441" opacity="0.95"/>
              <circle cx="52" cy="52" r="2.2" fill="#D9A441" opacity="0.95"/>
              <circle cx="64" cy="49" r="1.8" fill="#D9A441" opacity="0.95"/>
              <circle cx="38" cy="82" r="2" fill="#D9A441" opacity="0.95"/>
              <circle cx="74" cy="80" r="3.2" fill="#D9A441" opacity="0.95"/>
              <line x1="36" y1="22" x2="40" y2="50" stroke="#D9A441" strokeWidth="0.6" opacity="0.4"/>
              <line x1="72" y1="18" x2="64" y2="49" stroke="#D9A441" strokeWidth="0.6" opacity="0.4"/>
              <line x1="40" y1="50" x2="52" y2="52" stroke="#D9A441" strokeWidth="0.6" opacity="0.4"/>
              <line x1="52" y1="52" x2="64" y2="49" stroke="#D9A441" strokeWidth="0.6" opacity="0.4"/>
              <line x1="40" y1="50" x2="38" y2="82" stroke="#D9A441" strokeWidth="0.6" opacity="0.4"/>
              <line x1="64" y1="49" x2="74" y2="80" stroke="#D9A441" strokeWidth="0.6" opacity="0.4"/>
            </svg>
            <span className="font-serif text-2xl font-semibold text-[#F0EDE8] tracking-tight">apeks</span>
          </Link>
          <h1 className="text-xl mt-4 text-[#F0EDE8]">Вход в личный кабинет</h1>
        </div>
        <form onSubmit={handleSubmit} className="bg-[#0D1525] border border-[#1E2D4A] p-8 rounded-xl space-y-4">
          {error && <div className="p-3 bg-[rgba(255,123,109,0.12)] text-[#FF7B6D] rounded-lg text-sm">{error}</div>}
          <div>
            <label className="block text-sm font-medium mb-1 text-[#A8A5A0]">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 bg-[#152035] border border-[#1E2D4A] rounded-lg text-[#F0EDE8] focus:outline-none focus:ring-2 focus:ring-[#4ECDD4] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-[#A8A5A0]">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 bg-[#152035] border border-[#1E2D4A] rounded-lg text-[#F0EDE8] focus:outline-none focus:ring-2 focus:ring-[#4ECDD4] focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#D9A441] text-[#0A0E1A] font-medium rounded-lg hover:bg-[#F4B860] disabled:opacity-50 transition-colors"
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>
          <div className="text-center text-sm space-y-2">
            <Link href="/forgot-password" className="text-[#4ECDD4] hover:text-[#6EE8EE] transition-colors block">
              Забыли пароль?
            </Link>
            <p className="text-[#6A6860]">
              Нет аккаунта?{' '}
              <Link href="/register" className="text-[#D9A441] hover:text-[#F4B860] transition-colors">
                Зарегистрироваться
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
