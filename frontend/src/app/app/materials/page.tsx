'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { courses as coursesAPI, Material } from '@/lib/api';
import { Badge, Card, EmptyState, Skeleton } from '@/components/ui';

/* ------------------------------------------------------------------ *
 * Material kind config — label, theme color, icon.
 * The backend `kind` values can be either domain kinds (note/formulas/
 * skymap/problemset) or raw file kinds (pdf/doc/image/link/...). We map
 * both onto a small, friendly set of Russian categories.
 * ------------------------------------------------------------------ */
type KindKey = 'note' | 'formulas' | 'skymap' | 'problemset' | 'other';

const KIND_CONFIG: Record<
  KindKey,
  { label: string; color: 'cyan' | 'gold' | 'purple' | 'info' | 'muted'; icon: string }
> = {
  // Конспект — document
  note: {
    label: 'Конспект',
    color: 'info',
    icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8',
  },
  // Формулы — function/sigma
  formulas: {
    label: 'Формулы',
    color: 'gold',
    icon: 'M4 4h12M4 4l6 8-6 8h12M9 12h7',
  },
  // Карта неба — star map / sphere
  skymap: {
    label: 'Карта неба',
    color: 'purple',
    icon: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM2 12h20M12 2c2.5 2.7 4 6.3 4 10s-1.5 7.3-4 10c-2.5-2.7-4-6.3-4-10s1.5-7.3 4-10z',
  },
  // Подборка задач — list / checklist
  problemset: {
    label: 'Подборка задач',
    color: 'cyan',
    icon: 'M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11',
  },
  // Другое — generic file
  other: {
    label: 'Другое',
    color: 'muted',
    icon: 'M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM13 2v7h7',
  },
};

// Order in which filter chips appear.
const KIND_ORDER: KindKey[] = ['note', 'formulas', 'skymap', 'problemset', 'other'];

/** Normalize a raw backend `kind` string onto one of our KindKey buckets. */
function normalizeKind(raw: string | undefined | null): KindKey {
  const k = (raw || '').toLowerCase();
  if (['note', 'notes', 'конспект', 'doc', 'document', 'pdf', 'text', 'lecture'].includes(k)) {
    return 'note';
  }
  if (['formula', 'formulas', 'формулы', 'cheatsheet', 'reference'].includes(k)) {
    return 'formulas';
  }
  if (['skymap', 'sky_map', 'map', 'карта', 'starmap', 'chart'].includes(k)) {
    return 'skymap';
  }
  if (['problemset', 'problem_set', 'problems', 'tasks', 'задачи', 'подборка'].includes(k)) {
    return 'problemset';
  }
  // image/link/video/other → "Другое"
  return 'other';
}

function KindIcon({ kind, size = 20 }: { kind: KindKey; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={KIND_CONFIG[kind].icon} />
    </svg>
  );
}

const DownloadIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.75}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
  </svg>
);

const ExternalIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.75}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
  </svg>
);

const SearchIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.75}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35" />
  </svg>
);

const LibraryIcon = ({ size = 56 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.25}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M4 4h10l6 6v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zM14 4v6h6" />
  </svg>
);

/** A link is treated as "external/open" rather than "download" when it has no
 *  obvious downloadable file extension (i.e. it's a URL to a page). */
function isExternalLink(material: Material, kind: KindKey): boolean {
  if (!material.file_url) return false;
  const url = material.file_url;
  const rawKind = (material.kind || '').toLowerCase();
  if (rawKind === 'link' || rawKind === 'url' || rawKind === 'video') return true;
  // Has a file extension at the end of the path → downloadable.
  const path = url.split('?')[0].split('#')[0];
  const hasExt = /\.[a-z0-9]{2,5}$/i.test(path);
  return !hasExt;
}

/* ------------------------------------------------------------------ *
 * Material card
 * ------------------------------------------------------------------ */
function MaterialCard({ material }: { material: Material }) {
  const kind = normalizeKind(material.kind);
  const cfg = KIND_CONFIG[kind];
  const hasFile = !!material.file_url;
  const external = isExternalLink(material, kind);

  const context = [material.course_title, material.lesson_title]
    .filter(Boolean)
    .join(' · ');

  return (
    <Card className="group flex flex-col h-full transition-colors hover:border-[#253558]">
      <div className="flex items-start gap-3">
        {/* Kind icon tile */}
        <div
          className="flex-shrink-0 w-11 h-11 rounded-lg flex items-center justify-center border"
          style={{
            color: `var(--material-icon-color)`,
            backgroundColor: 'rgba(255,255,255,0.02)',
            borderColor: '#1E2D4A',
          }}
        >
          <span style={{ color: ICON_HEX[cfg.color] }}>
            <KindIcon kind={kind} />
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <Badge color={cfg.color}>{cfg.label}</Badge>
          <h3 className="mt-2 font-medium text-[#F0EDE8] leading-snug break-words">
            {material.title || 'Без названия'}
          </h3>
        </div>
      </div>

      {context && (
        <p className="mt-3 text-xs text-[#6A6860] leading-relaxed break-words">
          {context}
        </p>
      )}

      <div className="mt-auto pt-4">
        {hasFile ? (
          <a
            href={material.file_url as string}
            {...(external
              ? { target: '_blank', rel: 'noopener noreferrer' }
              : { download: true })}
            className="inline-flex items-center justify-center gap-2 w-full px-4 py-2 rounded-lg bg-[#152035] border border-[#1E2D4A] text-sm font-medium text-[#F0EDE8] transition-colors hover:bg-[#1E2D4A] hover:border-[#4ECDD4] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4ECDD4]"
          >
            {external ? <ExternalIcon /> : <DownloadIcon />}
            {external ? 'Открыть' : 'Скачать'}
          </a>
        ) : (
          <span className="inline-flex items-center justify-center w-full px-4 py-2 rounded-lg border border-[#1E2D4A] text-sm text-[#6A6860]">
            Файл недоступен
          </span>
        )}
      </div>
    </Card>
  );
}

// Hex values for icon coloring (mirror DARK_THEME used by Badge).
const ICON_HEX: Record<string, string> = {
  cyan: '#4ECDD4',
  gold: '#D9A441',
  purple: '#8B6DD4',
  info: '#7AB6F5',
  muted: '#A8A5A0',
};

/* ------------------------------------------------------------------ *
 * Page
 * ------------------------------------------------------------------ */
export default function MaterialsPage() {
  const { token } = useAuth();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [query, setQuery] = useState('');
  const [activeKind, setActiveKind] = useState<KindKey | 'all'>('all');

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLoading(true);
    setError(false);
    coursesAPI
      .materials(token)
      .then((data) => {
        if (cancelled) return;
        // materials() is documented to return a FLAT ARRAY.
        setMaterials(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  // Count materials per kind (across the whole library, ignoring search/kind
  // filter) so chip counts stay stable and informative.
  const kindCounts = useMemo(() => {
    const counts: Record<KindKey, number> = {
      note: 0,
      formulas: 0,
      skymap: 0,
      problemset: 0,
      other: 0,
    };
    materials.forEach((m) => {
      counts[normalizeKind(m.kind)] += 1;
    });
    return counts;
  }, [materials]);

  // Apply search + kind filters.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return materials.filter((m) => {
      if (activeKind !== 'all' && normalizeKind(m.kind) !== activeKind) return false;
      if (!q) return true;
      const haystack = [m.title, m.course_title, m.lesson_title]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [materials, query, activeKind]);

  // Group filtered materials by course (clearer for "download before the
  // olympiad" — students think in terms of which course a sheet came from).
  const groups = useMemo(() => {
    const map = new Map<string, Material[]>();
    filtered.forEach((m) => {
      const key = m.course_title || 'Прочие материалы';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    });
    // Sort groups alphabetically, with "Прочие материалы" last.
    return Array.from(map.entries()).sort(([a], [b]) => {
      if (a === 'Прочие материалы') return 1;
      if (b === 'Прочие материалы') return -1;
      return a.localeCompare(b, 'ru');
    });
  }, [filtered]);

  /* ----------------------------- Chips ----------------------------- */
  const chipBase =
    'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4ECDD4]';

  const renderChip = (
    key: KindKey | 'all',
    label: string,
    count: number,
    color?: string
  ) => {
    const active = activeKind === key;
    return (
      <button
        key={key}
        type="button"
        onClick={() => setActiveKind(key)}
        aria-pressed={active}
        className={`${chipBase} ${
          active
            ? 'bg-[#152035] text-[#F0EDE8] border-[#4ECDD4]'
            : 'bg-transparent text-[#A8A5A0] border-[#1E2D4A] hover:text-[#F0EDE8] hover:border-[#253558]'
        }`}
      >
        {color && (
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: color }}
            aria-hidden="true"
          />
        )}
        {label}
        <span
          className={`text-xs ${active ? 'text-[#A8A5A0]' : 'text-[#6A6860]'}`}
        >
          {count}
        </span>
      </button>
    );
  };

  /* --------------------------- Rendering --------------------------- */
  return (
    <div className="max-w-6xl">
      {/* Header */}
      <header className="mb-6">
        <h1 className="font-serif text-2xl md:text-3xl font-semibold text-[#F0EDE8]">
          Материалы
        </h1>
        <p className="mt-1.5 text-sm text-[#A8A5A0] max-w-2xl">
          Конспекты, формулы, карты неба и подборки задач из ваших курсов.
          Скачайте и повторите перед олимпиадой.
        </p>
      </header>

      {/* Search */}
      <div className="relative mb-4 max-w-md">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6A6860] pointer-events-none">
          <SearchIcon />
        </span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск по названию или курсу…"
          aria-label="Поиск материалов"
          className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-[#152035] border border-[#1E2D4A] text-sm text-[#F0EDE8] placeholder-[#6A6860] focus:outline-none focus:border-[#4ECDD4] focus:ring-1 focus:ring-[#4ECDD4] transition-colors"
        />
      </div>

      {/* Kind filter chips */}
      <div className="flex flex-wrap gap-2 mb-7" role="group" aria-label="Фильтр по типу материала">
        {renderChip('all', 'Все', materials.length)}
        {KIND_ORDER.map((k) =>
          renderChip(k, KIND_CONFIG[k].label, kindCounts[k], ICON_HEX[KIND_CONFIG[k].color])
        )}
      </div>

      {/* States: loading / error / empty / content */}
      {loading ? (
        <LoadingGrid />
      ) : error ? (
        <Card>
          <EmptyState
            icon={<LibraryIcon />}
            title="Не удалось загрузить материалы"
            subtitle="Попробуйте обновить страницу чуть позже."
          />
        </Card>
      ) : materials.length === 0 ? (
        <Card>
          <EmptyState
            icon={<LibraryIcon />}
            title="Пока нет материалов"
            subtitle="Здесь появятся конспекты, формулы и подборки задач, как только они будут добавлены в ваши курсы."
          />
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<SearchIcon size={48} />}
            title="Ничего не найдено"
            subtitle="Попробуйте изменить запрос или выбрать другой тип материала."
            action={
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setActiveKind('all');
                }}
                className="px-4 py-2 rounded-lg bg-[#152035] border border-[#1E2D4A] text-sm font-medium text-[#F0EDE8] transition-colors hover:border-[#4ECDD4]"
              >
                Сбросить фильтры
              </button>
            }
          />
        </Card>
      ) : (
        <div className="space-y-8">
          {groups.map(([courseTitle, items]) => (
            <section key={courseTitle}>
              <div className="flex items-baseline gap-2 mb-3">
                <h2 className="font-serif text-lg font-semibold text-[#F0EDE8]">
                  {courseTitle}
                </h2>
                <span className="text-xs text-[#6A6860]">
                  {items.length}{' '}
                  {pluralMaterials(items.length)}
                </span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((m) => (
                  <MaterialCard key={`${m.id}-${m.title}`} material={m} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */
function pluralMaterials(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'материал';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'материала';
  return 'материалов';
}

function LoadingGrid() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Загрузка материалов">
      {[0, 1].map((g) => (
        <section key={g}>
          <Skeleton className="h-6 w-48 mb-3" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="flex flex-col">
                <div className="flex items-start gap-3">
                  <Skeleton className="w-11 h-11 rounded-lg flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <Skeleton className="h-5 w-20 rounded-full" />
                    <Skeleton className="h-4 w-full mt-3" />
                    <Skeleton className="h-4 w-2/3 mt-2" />
                  </div>
                </div>
                <Skeleton className="h-9 w-full mt-6 rounded-lg" />
              </Card>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
