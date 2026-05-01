'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { auth as authAPI } from '@/lib/api';

const Logo = () => (
  <Link href="/" className="inline-flex items-center gap-2 justify-center">
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
);

const inputClass = "w-full px-3 py-2 bg-[#152035] border border-[#1E2D4A] rounded-lg text-[#F0EDE8] focus:outline-none focus:ring-2 focus:ring-[#4ECDD4] focus:border-transparent placeholder-[#6A6860]";

export default function RegisterPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [telegram, setTelegram] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  const { register } = useAuth();
  const router = useRouter();

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authAPI.sendCode(email, 'register');
      setCodeSent(true);
      setStep(2);
    } catch (err: any) {
      setError(err?.error || err?.detail || 'Ошибка отправки кода');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== passwordConfirm) {
      setError('Пароли не совпадают');
      return;
    }
    setLoading(true);
    try {
      await register({ email, password, password_confirm: passwordConfirm, code, telegram_username: telegram });
      router.push('/app');
    } catch (err: any) {
      const msg = err?.code?.[0] || err?.email?.[0] || err?.password?.[0] || err?.non_field_errors?.[0] || err?.detail || 'Ошибка регистрации';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#070C18] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Logo />
          <h1 className="text-xl mt-4 text-[#F0EDE8]">Регистрация</h1>
          <div className="flex items-center justify-center gap-2 mt-3">
            <div className={`w-8 h-1 rounded-full transition-colors ${step >= 1 ? 'bg-[#D9A441]' : 'bg-[#1E2D4A]'}`} />
            <div className={`w-8 h-1 rounded-full transition-colors ${step >= 2 ? 'bg-[#D9A441]' : 'bg-[#1E2D4A]'}`} />
          </div>
        </div>

        <div className="bg-[#0D1525] border border-[#1E2D4A] p-8 rounded-xl space-y-4">
          {error && <div className="p-3 bg-[rgba(255,123,109,0.12)] text-[#FF7B6D] rounded-lg text-sm">{error}</div>}

          {step === 1 && (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-[#A8A5A0]">Email *</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoFocus
                  className={inputClass}
                  placeholder="your@email.com"
                />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-2.5 bg-[#D9A441] text-[#0A0E1A] font-medium rounded-lg hover:bg-[#F4B860] disabled:opacity-50 transition-colors">
                {loading ? 'Отправляем...' : 'Получить код'}
              </button>
              <p className="text-center text-sm text-[#6A6860]">
                Уже есть аккаунт?{' '}
                <Link href="/login" className="text-[#4ECDD4] hover:text-[#6EE8EE] transition-colors">Войти</Link>
              </p>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="p-3 bg-[rgba(78,205,212,0.08)] border border-[#4ECDD433] rounded-lg text-sm text-[#4ECDD4]">
                Код отправлен на <strong>{email}</strong>
                <button type="button" onClick={() => { setStep(1); setError(''); }}
                  className="ml-2 text-[#6A6860] hover:text-[#A8A5A0] underline text-xs">изменить</button>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[#A8A5A0]">Код из письма *</label>
                <input
                  type="text"
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  required
                  autoFocus
                  maxLength={4}
                  placeholder="0000"
                  className={inputClass + " text-center text-xl tracking-[0.5em] font-mono"}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[#A8A5A0]">Пароль *</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  required minLength={8} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[#A8A5A0]">Подтверждение пароля *</label>
                <input type="password" value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)}
                  required className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[#A8A5A0]">Telegram <span className="text-[#6A6860] font-normal">(необязательно)</span></label>
                <input type="text" value={telegram} onChange={e => setTelegram(e.target.value)}
                  placeholder="@username" className={inputClass} />
              </div>
              <button type="submit" disabled={loading || code.length < 4}
                className="w-full py-2.5 bg-[#D9A441] text-[#0A0E1A] font-medium rounded-lg hover:bg-[#F4B860] disabled:opacity-50 transition-colors">
                {loading ? 'Регистрация...' : 'Зарегистрироваться'}
              </button>
              <p className="text-center text-xs text-[#6A6860]">
                Не пришёл код?{' '}
                <button type="button" onClick={handleSendCode}
                  className="text-[#4ECDD4] hover:text-[#6EE8EE] transition-colors">
                  Отправить повторно
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
