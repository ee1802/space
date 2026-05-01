import Link from 'next/link';

const TRIBUTE_URL = 'https://t.me/tribute/app?startapp=ep_8xeoN2RlU2ufG5EqgKmpMeTus6sW9nlnx3AqsHsHR6z2ipqmyx';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#070C18] text-[#F0EDE8]">
      {/* Header */}
      <header className="border-b border-[#1E2D4A] bg-[#0D1525]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
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
            <span className="font-serif text-2xl font-semibold tracking-tight">apeks</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-[#A8A5A0]">
            <a href="#about" className="hover:text-[#F0EDE8] transition-colors">О курсе</a>
            <a href="#price" className="hover:text-[#F0EDE8] transition-colors">Стоимость</a>
            <a href="#benefits" className="hover:text-[#F0EDE8] transition-colors">Льготы</a>
            <a href="#signup" className="hover:text-[#F0EDE8] transition-colors">Как записаться</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="px-4 py-2 border border-[#1E2D4A] rounded-lg text-[#A8A5A0] hover:bg-[#152035] hover:text-[#F0EDE8] transition-colors text-sm">
              Войти
            </Link>
            <a
              href={TRIBUTE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-[#D9A441] text-[#0A0E1A] rounded-lg hover:bg-[#F4B860] transition-colors text-sm font-medium"
            >
              Купить курс
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-1/4 w-2 h-2 bg-[#4ECDD4] rounded-full animate-pulse"></div>
          <div className="absolute top-40 right-1/3 w-1.5 h-1.5 bg-[#D9A441] rounded-full animate-pulse delay-300"></div>
          <div className="absolute bottom-20 left-1/3 w-1 h-1 bg-[#8B6DD4] rounded-full animate-pulse delay-700"></div>
          <div className="absolute top-1/3 right-1/4 w-1.5 h-1.5 bg-white rounded-full animate-pulse delay-500"></div>
        </div>
        <div className="max-w-4xl mx-auto px-4 text-center relative">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 font-serif">Всерос с Апексом</h1>
          <p className="text-xl text-[#A8A5A0] mb-8 max-w-2xl mx-auto">
            Годовой курс подготовки к Всероссийской олимпиаде школьников и международным олимпиадам по астрономии.
            Авторская программа Евгения Бойцова.
          </p>
          <a
            href={TRIBUTE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-8 py-4 bg-[#D9A441] text-[#0A0E1A] text-lg font-medium rounded-lg hover:bg-[#F4B860] transition-colors shadow-[0_0_30px_rgba(217,164,65,0.3)]"
          >
            Купить курс
          </a>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center font-serif">О курсе</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 bg-[#0D1525] border border-[#1E2D4A] rounded-xl">
              <h3 className="text-lg font-semibold mb-2 text-[#D9A441]">Формат</h3>
              <p className="text-[#A8A5A0]">
                12 пар в неделю. Занятия проходят онлайн в формате живых лекций с записью.
                Каждое занятие сопровождается конспектом, рабочей тетрадью и домашним заданием.
              </p>
            </div>
            <div className="p-6 bg-[#0D1525] border border-[#1E2D4A] rounded-xl">
              <h3 className="text-lg font-semibold mb-2 text-[#4ECDD4]">Направления</h3>
              <ul className="text-[#A8A5A0] space-y-1">
                <li>• Астрономия (старший поток)</li>
                <li>• Астрономия (младший поток)</li>
                <li>• Физика для астрономов</li>
                <li>• Математика для астрономов</li>
                <li>• Звёздное небо</li>
              </ul>
            </div>
            <div className="p-6 bg-[#0D1525] border border-[#1E2D4A] rounded-xl">
              <h3 className="text-lg font-semibold mb-2 text-[#8B6DD4]">Для кого</h3>
              <p className="text-[#A8A5A0]">
                Для школьников, готовящихся к ВсОШ по астрономии, а также к международным олимпиадам (IAO, IOAA).
                Подходит для учеников с базовым уровнем знаний физики и математики.
              </p>
            </div>
            <div className="p-6 bg-[#0D1525] border border-[#1E2D4A] rounded-xl">
              <h3 className="text-lg font-semibold mb-2 text-[#5BD68A]">Что входит</h3>
              <ul className="text-[#A8A5A0] space-y-1">
                <li>• Видеозаписи всех занятий</li>
                <li>• Конспекты и рабочие тетради (PDF)</li>
                <li>• Домашние задания с автопроверкой</li>
                <li>• Календарь олимпиад</li>
                <li>• Доступ к тренажёру звёздного неба</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Price */}
      <section id="price" className="py-16 bg-[#0D1525]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-8 font-serif">Стоимость</h2>
          <div className="inline-block p-8 bg-[#152035] border border-[#1E2D4A] rounded-xl">
            <div className="text-5xl font-bold text-[#D9A441] mb-2">12 500 ₽</div>
            <div className="text-[#6A6860] mb-4">в месяц</div>
            <p className="text-[#A8A5A0] mb-6">Ежемесячная подписка. Отмена в любой момент.</p>
            <a
              href={TRIBUTE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-8 py-3 bg-[#D9A441] text-[#0A0E1A] font-medium rounded-lg hover:bg-[#F4B860] transition-colors"
            >
              Оформить подписку
            </a>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="benefits" className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center font-serif">Льготы</h2>
          <div className="space-y-6">
            <div className="p-6 bg-[#0D1525] border border-[#1E2D4A] rounded-xl">
              <h3 className="text-lg font-semibold mb-2 text-[#D9A441]">Льгота по доходу</h3>
              <p className="text-[#A8A5A0]">
                Если стоимость курса превышает 10% от месячного дохода семьи, делённого на число детей,
                цена опускается до этой отметки. Для получения льготы свяжитесь с преподавателем.
              </p>
            </div>
            <div className="p-6 bg-[#0D1525] border border-[#1E2D4A] rounded-xl">
              <h3 className="text-lg font-semibold mb-2 text-[#4ECDD4]">Фиксация цены</h3>
              <p className="text-[#A8A5A0]">
                Пока ученик непрерывно учится на курсах, при последующих повышениях цен для него действуют
                тарифы, актуальные на момент присоединения.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How to sign up */}
      <section id="signup" className="py-16 bg-[#0D1525]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-8 font-serif">Как записаться</h2>
          <div className="space-y-4 text-lg text-[#A8A5A0]">
            <p>
              1. Оформите подписку через{' '}
              <a href={TRIBUTE_URL} target="_blank" rel="noopener noreferrer" className="text-[#D9A441] hover:text-[#F4B860] transition-colors">
                Tribute
              </a>
            </p>
            <p>
              2. Зарегистрируйтесь на платформе и дождитесь подтверждения доступа
            </p>
            <p>
              3. По вопросам пишите преподавателю в Telegram:{' '}
              <a href="https://t.me/eugene_boitsov" target="_blank" rel="noopener noreferrer" className="text-[#4ECDD4] hover:text-[#6EE8EE] transition-colors">
                @eugene_boitsov
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-[#1E2D4A]">
        <div className="max-w-4xl mx-auto px-4 text-center text-[#6A6860] text-sm">
          <p className="mb-2">Онлайн-школа «Апекс» — подготовка к олимпиадам по астрономии</p>
          <div className="flex justify-center gap-4">
            <a href="https://t.me/eugene_boitsov" target="_blank" rel="noopener noreferrer" className="hover:text-[#A8A5A0] transition-colors">
              Telegram
            </a>
            <a href="https://apeks.space" target="_blank" rel="noopener noreferrer" className="hover:text-[#A8A5A0] transition-colors">
              apeks.space
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
