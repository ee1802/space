'use client';

/**
 * Shared UI kit for Apeks. Dark "space" theme.
 * Import from '@/components/ui'.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

/* ------------------------------------------------------------------ *
 * Theme tokens
 * ------------------------------------------------------------------ */
export const DARK_THEME = {
  bg: '#070C18',
  surface: '#0D1525',
  surface2: '#152035',
  border: '#1E2D4A',
  text: '#F0EDE8',
  secondary: '#A8A5A0',
  muted: '#6A6860',
  gold: '#D9A441',
  cyan: '#4ECDD4',
  purple: '#8B6DD4',
  success: '#5BD68A',
  error: '#FF7B6D',
  warning: '#FFB547',
  info: '#7AB6F5',
} as const;

type ThemeColor =
  | 'gold'
  | 'cyan'
  | 'purple'
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
  | 'muted';

const COLOR_HEX: Record<ThemeColor, string> = {
  gold: DARK_THEME.gold,
  cyan: DARK_THEME.cyan,
  purple: DARK_THEME.purple,
  success: DARK_THEME.success,
  error: DARK_THEME.error,
  warning: DARK_THEME.warning,
  info: DARK_THEME.info,
  muted: DARK_THEME.muted,
};

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

/* ------------------------------------------------------------------ *
 * Card / CardHeader
 * ------------------------------------------------------------------ */
export function Card({
  children,
  className,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx(
        'bg-[#0D1525] border border-[#1E2D4A] rounded-xl p-5',
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cx('flex items-start justify-between gap-3 mb-4', className)}>
      <div className="min-w-0">
        <h3 className="font-serif text-lg font-semibold text-[#F0EDE8] truncate">
          {title}
        </h3>
        {subtitle && (
          <p className="text-sm text-[#A8A5A0] mt-0.5">{subtitle}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Spinner
 * ------------------------------------------------------------------ */
export function Spinner({
  size = 24,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span
      role="status"
      aria-label="Загрузка"
      className={cx('inline-block animate-spin rounded-full border-2 border-[#1E2D4A] border-t-[#D9A441]', className)}
      style={{ width: size, height: size }}
    />
  );
}

/* ------------------------------------------------------------------ *
 * Skeleton
 * ------------------------------------------------------------------ */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cx('bg-[#152035] animate-pulse rounded', className)}
    />
  );
}

/* ------------------------------------------------------------------ *
 * EmptyState
 * ------------------------------------------------------------------ */
export function EmptyState({
  icon,
  title,
  subtitle,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        'flex flex-col items-center justify-center text-center py-12 px-4',
        className
      )}
    >
      {icon && (
        <div className="mb-3 text-[#6A6860] opacity-80" aria-hidden="true">
          {icon}
        </div>
      )}
      <p className="font-serif text-lg font-medium text-[#F0EDE8]">{title}</p>
      {subtitle && (
        <p className="mt-1.5 text-sm text-[#A8A5A0] max-w-sm">{subtitle}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * ProgressRing
 * ------------------------------------------------------------------ */
export function ProgressRing({
  value,
  size = 64,
  strokeWidth,
  color = DARK_THEME.cyan,
  showLabel = true,
  className,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  showLabel?: boolean;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const sw = strokeWidth ?? Math.max(4, Math.round(size / 11));
  const radius = (size - sw) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div
      className={cx('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Прогресс ${pct}%`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={DARK_THEME.border}
          strokeWidth={sw}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      {showLabel && (
        <span
          className="absolute font-semibold text-[#F0EDE8]"
          style={{ fontSize: Math.max(10, size / 4.5) }}
        >
          {pct}%
        </span>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * ProgressBar
 * ------------------------------------------------------------------ */
export function ProgressBar({
  value,
  color = DARK_THEME.cyan,
  className,
}: {
  value: number;
  color?: string;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      className={cx('w-full h-2 rounded-full bg-[#1E2D4A] overflow-hidden', className)}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full"
        style={{ width: `${pct}%`, backgroundColor: color, transition: 'width 0.4s ease' }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Badge
 * ------------------------------------------------------------------ */
export function Badge({
  color = 'muted',
  children,
  className,
}: {
  color?: ThemeColor;
  children: React.ReactNode;
  className?: string;
}) {
  const hex = COLOR_HEX[color];
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
        className
      )}
      style={{
        color: hex,
        backgroundColor: hexToRgba(hex, 0.12),
        border: `1px solid ${hexToRgba(hex, 0.3)}`,
      }}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ *
 * LevelBadge
 * ------------------------------------------------------------------ */
export function LevelBadge({
  level,
  className,
}: {
  level: string;
  className?: string;
}) {
  const map: Record<string, { label: string; color: ThemeColor }> = {
    school: { label: 'Школьный', color: 'info' },
    municipal: { label: 'Муниципальный', color: 'cyan' },
    regional: { label: 'Региональный', color: 'purple' },
    final: { label: 'Заключительный', color: 'gold' },
  };
  const cfg = map[level];
  if (!cfg) return null;
  return (
    <Badge color={cfg.color} className={className}>
      {cfg.label}
    </Badge>
  );
}

/* ------------------------------------------------------------------ *
 * LessonTypeBadge
 * ------------------------------------------------------------------ */
export function LessonTypeBadge({
  type,
  className,
}: {
  type: string;
  className?: string;
}) {
  const map: Record<string, { label: string; color: ThemeColor }> = {
    theory: { label: 'Теория', color: 'info' },
    practice: { label: 'Практика', color: 'cyan' },
    hard: { label: 'Сложные задачи', color: 'purple' },
    test: { label: 'Тест', color: 'warning' },
    mock: { label: 'Пробник', color: 'gold' },
  };
  const cfg = map[type];
  if (!cfg) return null;
  return (
    <Badge color={cfg.color} className={className}>
      {cfg.label}
    </Badge>
  );
}

/* ------------------------------------------------------------------ *
 * Status badges
 * ------------------------------------------------------------------ */
const STATUS_MAP: Record<string, { label: string; color: ThemeColor }> = {
  not_started: { label: 'Не сделано', color: 'muted' },
  in_progress: { label: 'В процессе', color: 'info' },
  pending: { label: 'На проверке', color: 'warning' },
  done: { label: 'Сдано', color: 'success' },
  correct: { label: 'Сдано', color: 'success' },
  wrong: { label: 'Ошибка', color: 'error' },
  partial: { label: 'Частично', color: 'warning' },
};

export function HomeworkStatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  if (!status || status === 'none') return null;
  const cfg = STATUS_MAP[status];
  if (!cfg) return null;
  return (
    <Badge color={cfg.color} className={className}>
      {cfg.label}
    </Badge>
  );
}

export function ProblemStatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  if (!status || status === 'none') return null;
  const cfg = STATUS_MAP[status];
  if (!cfg) return null;
  return (
    <Badge color={cfg.color} className={className}>
      {cfg.label}
    </Badge>
  );
}

/* ------------------------------------------------------------------ *
 * StarRating
 * ------------------------------------------------------------------ */
export function StarRating({
  value,
  onChange,
  readOnly = false,
  size = 22,
  className,
}: {
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  size?: number;
  className?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const interactive = !readOnly && !!onChange;
  const display = hover ?? value;

  return (
    <div
      className={cx('inline-flex items-center gap-0.5', className)}
      role={interactive ? 'radiogroup' : 'img'}
      aria-label={`Оценка ${value} из 5`}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= display;
        const StarSvg = (
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill={filled ? DARK_THEME.gold : 'none'}
            stroke={filled ? DARK_THEME.gold : DARK_THEME.muted}
            strokeWidth={1.5}
            strokeLinejoin="round"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        );
        if (!interactive) {
          return (
            <span key={star} className="leading-none">
              {StarSvg}
            </span>
          );
        }
        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={star === value}
            aria-label={`${star} ${star === 1 ? 'звезда' : star < 5 ? 'звезды' : 'звёзд'}`}
            className="leading-none transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D9A441] rounded"
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(null)}
            onClick={() => onChange?.(star)}
          >
            {StarSvg}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Toast
 * ------------------------------------------------------------------ */
type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  show: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// Module-level event bus so useToast() works even without a provider wrapper.
type Listener = (toast: Toast) => void;
const listeners = new Set<Listener>();
let toastSeq = 0;

function emitToast(message: string, type: ToastType) {
  const toast: Toast = { id: ++toastSeq, message, type };
  listeners.forEach((l) => l(toast));
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  // Fall back to the module-level bus if no provider is mounted.
  const show = useCallback(
    (message: string, type: ToastType = 'success') => {
      if (ctx) ctx.show(message, type);
      else emitToast(message, type);
    },
    [ctx]
  );
  return { show };
}

const TOAST_STYLES: Record<ToastType, { color: string; icon: React.ReactNode }> = {
  success: {
    color: DARK_THEME.success,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6L9 17l-5-5" />
      </svg>
    ),
  },
  error: {
    color: DARK_THEME.error,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M15 9l-6 6M9 9l6 6" />
      </svg>
    ),
  },
  info: {
    color: DARK_THEME.info,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4M12 8h.01" />
      </svg>
    ),
  },
};

export function ToastHost() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const listener: Listener = (toast) => {
      setToasts((prev) => [...prev, toast]);
      window.setTimeout(() => remove(toast.id), 3200);
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, [remove]);

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => {
        const s = TOAST_STYLES[t.type];
        return (
          <div
            key={t.id}
            role="status"
            className="pointer-events-auto flex items-center gap-2.5 rounded-xl border bg-[#0D1525] px-4 py-3 shadow-lg shadow-black/40 animate-[toastIn_0.2s_ease]"
            style={{ borderColor: hexToRgba(s.color, 0.4), minWidth: 220, maxWidth: 360 }}
          >
            <span style={{ color: s.color }} className="flex-shrink-0">
              {s.icon}
            </span>
            <span className="text-sm text-[#F0EDE8]">{t.message}</span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Optional provider. Not required (useToast falls back to a module bus), but
 * available if a page prefers explicit context. Render <ToastHost/> once.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const show = useCallback((message: string, type: ToastType = 'success') => {
    emitToast(message, type);
  }, []);
  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <ToastHost />
    </ToastContext.Provider>
  );
}
