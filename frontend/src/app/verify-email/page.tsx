'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/api';

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
    <div className="bg-white p-8 rounded-lg border text-center">
      {status === 'loading' && <p>Подтверждение...</p>}
      {status === 'success' && <p className="text-green-600 mb-4">{message}</p>}
      {status === 'error' && <p className="text-red-600 mb-4">{message}</p>}
      <Link href="/app" className="text-blue-600 hover:underline">Перейти в кабинет</Link>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold">Апекс</Link>
          <h1 className="text-xl mt-4">Подтверждение email</h1>
        </div>
        <Suspense fallback={<div>Загрузка...</div>}>
          <VerifyEmailContent />
        </Suspense>
      </div>
    </div>
  );
}
