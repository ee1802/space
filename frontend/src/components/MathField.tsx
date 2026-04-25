'use client';

import { useEffect, useRef } from 'react';

interface MathFieldProps {
  value: string;
  onChange: (latex: string) => void;
  placeholder?: string;
}

export default function MathField({ value, onChange, placeholder }: MathFieldProps) {
  const ref = useRef<any>(null);

  useEffect(() => {
    // Dynamically import mathlive to avoid SSR issues
    import('mathlive').then(() => {
      if (ref.current) {
        ref.current.value = value;
      }
    });
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handler = (evt: any) => {
      onChange(evt.target.value);
    };

    el.addEventListener('input', handler);
    return () => el.removeEventListener('input', handler);
  }, [onChange]);

  return (
    <div className="border rounded p-2 bg-white">
      {/* @ts-ignore */}
      <math-field
        ref={ref}
        style={{ width: '100%', minHeight: '40px', fontSize: '18px' }}
        placeholder={placeholder || 'Введите формулу...'}
      />
    </div>
  );
}
