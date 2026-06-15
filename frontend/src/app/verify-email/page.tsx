'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/api';
import { Brand } from '@/components/brand';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Токен не указан.');
      return;
    }
    auth.verifyEmail(token)
      .then(() => {
        setStatus('success');
        setMessage('Email успешно подтверждён!');
      })
      .catch((err: any) => {
        setStatus('error');
        setMessage(err?.detail || 'Ошибка подтверждения.');
      });
  }, [token]);

  return (
    <div className="bg-[#0D1525] border border-[#1E2D4A] p-8 rounded-xl text-center">
      {status === 'loading' && <p className="text-[#A8A5A0]">Подтверждение...</p>}
      {status === 'success' && <p className="text-[#5BD68A] mb-4">{message}</p>}
      {status === 'error' && <p className="text-[#FF7B6D] mb-4">{message}</p>}
      <Link href="/app" className="text-[#4ECDD4] hover:text-[#6EE8EE] transition-colors">Перейти в кабинет</Link>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#070C18] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Brand href="/" size="md" gradient glow className="justify-center" />
          <h1 className="text-xl mt-4 text-[#F0EDE8]">Подтверждение email</h1>
        </div>
        <Suspense fallback={<div className="text-[#6A6860] text-center">Загрузка...</div>}>
          <VerifyEmailContent />
        </Suspense>
      </div>
    </div>
  );
}
