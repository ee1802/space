import Link from 'next/link';
import { Brand, StarLogo } from '@/components/brand';

const TRIBUTE_URL =
  'https://t.me/tribute/app?startapp=ep_8xeoN2RlU2ufG5EqgKmpMeTus6sW9nlnx3AqsHsHR6z2ipqmyx';
const TELEGRAM_URL = 'https://t.me/eugene_boitsov';

/* Deterministic pseudo-random starfield (stable on server + client, no hydration drift). */
const STARS = Array.from({ length: 64 }, (_, i) => {
  const r = (n: number) => {
    const x = Math.sin(i * 9301 + n * 49297) * 233280;
    return x - Math.floor(x);
  };
  return {
    left: r(1) * 100,
    top: r(2) * 100,
    size: 1 + r(3) * 1.9,
    op: 0.18 + r(4) * 0.7,
    twinkle: r(5) > 0.62,
    delay: r(6) * 4,
  };
});

function Starfield() {
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none">
      {STARS.map((s, i) => (
        <span
          key={i}
          className={`absolute rounded-full bg-white ${s.twinkle ? 'animate-twinkle' : ''}`}
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            opacity: s.op,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

function FeatureIcon({ d, className = '' }: { d: string; className?: string }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

const NAV = [
  { href: '#about', label: 'О курсе' },
  { href: '#features', label: 'Платформа' },
  { href: '#price', label: 'Стоимость' },
  { href: '#benefits', label: 'Льготы' },
  { href: '#signup', label: 'Как записаться' },
];

const PLATFORM_FEATURES = [
  {
    d: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z',
    title: 'Курсы и уроки',
    text: 'Теория, практика, сложные задачи, тесты и пробники — с прогрессом и кнопкой «Продолжить».',
    color: '#D9A441',
  },
  {
    d: 'M4 7h16M4 12h16M4 17h16M7 4v16',
    title: 'Банк задач по этапам',
    text: 'Школьный, муниципальный, региональный и заключительный уровни — с подробными разборами.',
    color: '#4ECDD4',
  },
  {
    d: 'M12 2l2.4 7.4H22l-6 4.5 2.3 7.1L12 16.6 5.7 21l2.3-7.1-6-4.5h7.6z',
    title: 'Пробники на время',
    text: 'Формат реального тура с таймером и итоговым результатом, чтобы привыкнуть к олимпиаде.',
    color: '#8B6DD4',
  },
  {
    d: 'M5 3v4M3 5h4M6 17v4M4 19h4M13 3l2.5 6.5L22 12l-6.5 2.5L13 21l-2.5-6.5L4 12l6.5-2.5z',
    title: 'ИИ-рекомендации',
    text: 'Персональные советы: что повторить, какой урок пройти дальше и где ваши слабые места.',
    color: '#C77DFF',
  },
  {
    d: 'M3 3v18h18M7 16l4-5 3 3 5-7',
    title: 'Статистика и ошибки',
    text: 'Сильные и слабые темы, решённые задачи и раздел «Ошибки» для точечного повторения.',
    color: '#5BD68A',
  },
  {
    d: 'M4 4h10l6 6v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zM14 4v6h6',
    title: 'Материалы и расписание',
    text: 'PDF-конспекты, формулы и карты неба, календарь олимпиад, дедлайны и избранное.',
    color: '#7AB6F5',
  },
];

const ABOUT_CARDS = [
  {
    d: 'M9 11l3 3 8-8M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11',
    title: 'Формат',
    color: '#D9A441',
    body: (
      <>
        12 пар в неделю. Занятия проходят онлайн в формате живых лекций с записью. Каждое занятие
        сопровождается конспектом, рабочей тетрадью и домашним заданием.
      </>
    ),
  },
  {
    d: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
    title: 'Направления',
    color: '#4ECDD4',
    body: (
      <ul className="space-y-1.5">
        {[
          'Астрономия (старший поток)',
          'Астрономия (младший поток)',
          'Физика для астрономов',
          'Математика для астрономов',
          'Звёздное небо',
        ].map((t) => (
          <li key={t} className="flex items-start gap-2">
            <span className="mt-2 h-1 w-1 flex-shrink-0 rounded-full bg-[#4ECDD4]" />
            {t}
          </li>
        ))}
      </ul>
    ),
  },
  {
    d: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
    title: 'Для кого',
    color: '#8B6DD4',
    body: (
      <>
        Для школьников, готовящихся к ВсОШ по астрономии, а также к международным олимпиадам (IAO,
        IOAA). Подходит для учеников с базовым уровнем знаний физики и математики.
      </>
    ),
  },
  {
    d: 'M20 6L9 17l-5-5',
    title: 'Что входит',
    color: '#5BD68A',
    body: (
      <ul className="space-y-1.5">
        {[
          'Видеозаписи всех занятий',
          'Конспекты и рабочие тетради (PDF)',
          'Домашние задания с автопроверкой',
          'Календарь олимпиад',
          'Доступ к тренажёру звёздного неба',
        ].map((t) => (
          <li key={t} className="flex items-start gap-2">
            <span className="mt-2 h-1 w-1 flex-shrink-0 rounded-full bg-[#5BD68A]" />
            {t}
          </li>
        ))}
      </ul>
    ),
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#070C18] text-[#F0EDE8]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0A0E1A]/70 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between gap-3">
          <Brand href="/" size="md" gradient glow />
          <nav aria-label="Основная навигация" className="hidden md:flex items-center gap-6 text-sm text-[#A8A5A0]">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="apex-focus px-1 py-1 hover:text-[#F0EDE8] transition-colors">
                {n.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2.5">
            <Link
              href="/login"
              className="px-4 py-2 rounded-lg border border-white/10 text-[#D7D3CC] hover:bg-white/5 hover:text-[#F0EDE8] transition-colors text-sm"
            >
              Войти
            </Link>
            <a
              href={TRIBUTE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-lg text-[#1A1206] text-sm font-semibold bg-gradient-to-b from-[#FFE066] to-[#F4B015] hover:from-[#FFE885] hover:to-[#FFB01F] transition-colors shadow-[0_4px_20px_-4px_rgba(244,176,21,0.5)]"
            >
              Купить курс
            </a>
          </div>
        </div>
        {/* Mobile nav strip */}
        <div className="md:hidden border-t border-white/5 overflow-x-auto no-scrollbar">
          <nav aria-label="Разделы страницы" className="flex items-center gap-1 px-3 py-1.5 text-sm text-[#A8A5A0] whitespace-nowrap">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="apex-focus inline-flex items-center min-h-[40px] px-3 py-2 rounded-full hover:bg-white/5 hover:text-[#F0EDE8] transition-colors">
                {n.label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative apex-cosmic overflow-hidden">
        <Starfield />
        <div className="relative max-w-4xl mx-auto px-4 pt-20 pb-24 text-center">
          <div className="flex justify-center mb-8">
            <StarLogo size={108} className="apex-glow-lg animate-floaty" title="Эмблема Апекс" />
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-[#D7D3CC] mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-[#5BD68A]" />
            Авторская программа Евгения Бойцова
          </span>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.05] mb-6">
            Всерос с <span className="apex-text-gold">Апексом</span>
          </h1>
          <p className="text-lg sm:text-xl text-[#B9B6C8] mb-9 max-w-2xl mx-auto leading-relaxed">
            Годовой курс подготовки к Всероссийской олимпиаде школьников и международным олимпиадам по
            астрономии — с уроками, банком задач, пробниками на время и ИИ-рекомендациями.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href={TRIBUTE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-[#1A1206] text-base font-semibold bg-gradient-to-b from-[#FFE066] to-[#F4B015] hover:from-[#FFE885] hover:to-[#FFB01F] transition-colors shadow-[0_8px_30px_-6px_rgba(244,176,21,0.55)]"
            >
              Купить курс
            </a>
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-base font-semibold border border-white/15 bg-white/5 text-[#F0EDE8] hover:bg-white/10 transition-colors"
            >
              Войти в кабинет
            </Link>
          </div>
          <div className="mt-12 grid grid-cols-3 gap-3 max-w-xl mx-auto">
            {[
              { v: '12', l: 'пар в неделю' },
              { v: 'ВсОШ', l: 'IAO · IOAA' },
              { v: 'ИИ', l: 'персональный план' },
            ].map((s) => (
              <div key={s.l} className="apex-glass rounded-xl px-3 py-4">
                <div className="font-display text-2xl font-bold apex-text-gold leading-none">{s.v}</div>
                <div className="mt-1.5 text-xs text-[#A8A5A0]">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-20">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-3 text-center">О курсе</h2>
          <p className="text-center text-[#A8A5A0] mb-12 max-w-2xl mx-auto">
            Системная годовая подготовка по астрономии — от теории до олимпиадных туров.
          </p>
          <div className="grid md:grid-cols-2 gap-5">
            {ABOUT_CARDS.map((c) => (
              <div key={c.title} className="apex-glass apex-glass-hover rounded-2xl p-6 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ color: c.color, background: `${c.color}1f`, border: `1px solid ${c.color}3a` }}
                  >
                    <FeatureIcon d={c.d} />
                  </span>
                  <h3 className="font-display text-lg font-semibold" style={{ color: c.color }}>
                    {c.title}
                  </h3>
                </div>
                <div className="text-[#B9B6C8] leading-relaxed">{c.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform features */}
      <section id="features" className="relative apex-cosmic overflow-hidden py-20 border-y border-white/5">
        <Starfield />
        <div className="relative max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#8B6DD4]/30 bg-[#8B6DD4]/10 px-4 py-1.5 text-xs font-medium text-[#C9B6FF] mb-4">
              <StarLogo size={16} />
              Личный кабинет ученика
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">
              Не просто курс, а <span className="apex-text-aurora">платформа</span>
            </h2>
            <p className="text-[#A8A5A0] max-w-2xl mx-auto">
              Всё для подготовки в одном месте — с прогрессом, аналитикой и персональными
              рекомендациями от ИИ.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {PLATFORM_FEATURES.map((f) => (
              <div key={f.title} className="apex-glass apex-glass-hover rounded-2xl p-6 transition-colors">
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-xl mb-4"
                  style={{ color: f.color, background: `${f.color}1f`, border: `1px solid ${f.color}3a` }}
                >
                  <FeatureIcon d={f.d} />
                </span>
                <h3 className="font-semibold text-[#F0EDE8] mb-1.5">{f.title}</h3>
                <p className="text-sm text-[#A8A5A0] leading-relaxed">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Price */}
      <section id="price" className="py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-10">Стоимость</h2>
          <div className="relative inline-block w-full max-w-md">
            <div className="apex-glass rounded-3xl p-8 sm:p-10">
              <div className="font-display text-5xl sm:text-6xl font-bold apex-text-gold leading-none mb-2">
                12 500 ₽
              </div>
              <div className="text-[#A8A5A0] mb-5">в месяц</div>
              <p className="text-[#B9B6C8] mb-7">Ежемесячная подписка. Отмена в любой момент.</p>
              <a
                href={TRIBUTE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block w-full px-8 py-3.5 rounded-xl text-[#1A1206] font-semibold bg-gradient-to-b from-[#FFE066] to-[#F4B015] hover:from-[#FFE885] hover:to-[#FFB01F] transition-colors shadow-[0_8px_30px_-6px_rgba(244,176,21,0.5)]"
              >
                Оформить подписку
              </a>
              <p className="mt-4 text-xs text-[#A8A5A0]">
                Есть льготы по доходу и фиксация цены —{' '}
                <a href="#benefits" className="text-[#4ECDD4] hover:text-[#6EE8EE]">
                  подробнее ниже
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="benefits" className="py-20 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-10 text-center">Льготы</h2>
          <div className="grid md:grid-cols-2 gap-5">
            <div className="apex-glass rounded-2xl p-6">
              <h3 className="font-display text-lg font-semibold mb-2 text-[#D9A441]">Льгота по доходу</h3>
              <p className="text-[#B9B6C8] leading-relaxed">
                Если стоимость курса превышает 10% от месячного дохода семьи, делённого на число детей,
                цена опускается до этой отметки. Для получения льготы свяжитесь с преподавателем.
              </p>
            </div>
            <div className="apex-glass rounded-2xl p-6">
              <h3 className="font-display text-lg font-semibold mb-2 text-[#4ECDD4]">Фиксация цены</h3>
              <p className="text-[#B9B6C8] leading-relaxed">
                Пока ученик непрерывно учится на курсах, при последующих повышениях цен для него
                действуют тарифы, актуальные на момент присоединения.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How to sign up */}
      <section id="signup" className="relative apex-cosmic overflow-hidden py-20 border-y border-white/5">
        <Starfield />
        <div className="relative max-w-3xl mx-auto px-4">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-10 text-center">Как записаться</h2>
          <ol className="space-y-4">
            {[
              <>
                Оформите подписку через{' '}
                <a href={TRIBUTE_URL} target="_blank" rel="noopener noreferrer" className="text-[#D9A441] hover:text-[#F4B860]">
                  Tribute
                </a>
              </>,
              <>
                <Link href="/register" className="text-[#4ECDD4] hover:text-[#6EE8EE] underline-offset-2 hover:underline">
                  Зарегистрируйтесь на платформе
                </Link>{' '}
                и дождитесь подтверждения доступа
              </>,
              <>
                По вопросам пишите преподавателю в Telegram:{' '}
                <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer" className="text-[#4ECDD4] hover:text-[#6EE8EE]">
                  @eugene_boitsov
                </a>
              </>,
            ].map((step, i) => (
              <li key={i} className="apex-glass rounded-2xl p-5 flex items-start gap-4">
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full font-display font-bold text-[#1A1206] bg-gradient-to-b from-[#FFE066] to-[#F4B015]">
                  {i + 1}
                </span>
                <p className="text-[#D7D3CC] pt-1.5 leading-relaxed">{step}</p>
              </li>
            ))}
          </ol>
          <div className="mt-8 text-center">
            <Link
              href="/register"
              className="inline-block px-8 py-3.5 rounded-xl font-semibold border border-white/15 bg-white/5 text-[#F0EDE8] hover:bg-white/10 transition-colors"
            >
              Создать аккаунт
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex flex-col items-center sm:items-start gap-3">
              <Brand size="sm" gradient />
              <p className="text-sm text-[#A8A5A0] text-center sm:text-left max-w-xs">
                Онлайн-школа «Апекс» — подготовка к олимпиадам по астрономии.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-[#A8A5A0]">
              <Link href="/login" className="apex-focus inline-flex items-center py-1 hover:text-[#F0EDE8] transition-colors">Войти</Link>
              <Link href="/register" className="apex-focus inline-flex items-center py-1 hover:text-[#F0EDE8] transition-colors">Регистрация</Link>
              <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer" className="apex-focus inline-flex items-center py-1 hover:text-[#F0EDE8] transition-colors">
                Telegram
              </a>
              <a href="https://apeks.space" target="_blank" rel="noopener noreferrer" className="apex-focus inline-flex items-center py-1 hover:text-[#F0EDE8] transition-colors">
                apeks.space
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
