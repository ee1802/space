'use client';

import Link from 'next/link';

const TRIBUTE_URL = 'https://t.me/tribute/app?startapp=ep_8xeoN2RlU2ufG5EqgKmpMeTus6sW9nlnx3AqsHsHR6z2ipqmyx';

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold">Апекс</div>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#about" className="hover:underline">О курсе</a>
            <a href="#price" className="hover:underline">Стоимость</a>
            <a href="#benefits" className="hover:underline">Льготы</a>
            <a href="#signup" className="hover:underline">Как записаться</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="px-4 py-2 border rounded hover:bg-gray-50">
              Войти
            </Link>
            <a
              href={TRIBUTE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Купить курс
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Всерос с Апексом</h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Годовой курс подготовки к Всероссийской олимпиаде школьников и международным олимпиадам по астрономии.
            Авторская программа Евгения Бойцова.
          </p>
          <a
            href={TRIBUTE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-8 py-4 bg-blue-600 text-white text-lg rounded-lg hover:bg-blue-700"
          >
            Купить курс
          </a>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center">О курсе</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-6 border rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Формат</h3>
              <p className="text-gray-600">
                12 пар в неделю. Занятия проходят онлайн в формате живых лекций с записью.
                Каждое занятие сопровождается конспектом, рабочей тетрадью и домашним заданием.
              </p>
            </div>
            <div className="p-6 border rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Направления</h3>
              <ul className="text-gray-600 space-y-1">
                <li>• Астрономия (старший поток)</li>
                <li>• Астрономия (младший поток)</li>
                <li>• Физика для астрономов</li>
                <li>• Математика для астрономов</li>
                <li>• Звёздное небо</li>
              </ul>
            </div>
            <div className="p-6 border rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Для кого</h3>
              <p className="text-gray-600">
                Для школьников, готовящихся к ВсОШ по астрономии, а также к международным олимпиадам (IAO, IOAA).
                Подходит для учеников с базовым уровнем знаний физики и математики.
              </p>
            </div>
            <div className="p-6 border rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Что входит</h3>
              <ul className="text-gray-600 space-y-1">
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
      <section id="price" className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-8">Стоимость</h2>
          <div className="inline-block p-8 bg-white border rounded-lg shadow-sm">
            <div className="text-5xl font-bold text-blue-600 mb-2">12 500 ₽</div>
            <div className="text-gray-500 mb-4">в месяц</div>
            <p className="text-gray-600 mb-6">Ежемесячная подписка. Отмена в любой момент.</p>
            <a
              href={TRIBUTE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Оформить подписку
            </a>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="benefits" className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center">Льготы</h2>
          <div className="space-y-6">
            <div className="p-6 border rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Льгота по доходу</h3>
              <p className="text-gray-600">
                Если стоимость курса превышает 10% от месячного дохода семьи, делённого на число детей,
                цена опускается до этой отметки. Для получения льготы свяжитесь с преподавателем.
              </p>
            </div>
            <div className="p-6 border rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Фиксация цены</h3>
              <p className="text-gray-600">
                Пока ученик непрерывно учится на курсах, при последующих повышениях цен для него действуют
                тарифы, актуальные на момент присоединения.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How to sign up */}
      <section id="signup" className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-8">Как записаться</h2>
          <div className="space-y-4 text-lg text-gray-600">
            <p>
              1. Оформите подписку через{' '}
              <a href={TRIBUTE_URL} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                Tribute
              </a>
            </p>
            <p>
              2. Зарегистрируйтесь на платформе и дождитесь подтверждения доступа
            </p>
            <p>
              3. По вопросам пишите преподавателю в Telegram:{' '}
              <a href="https://t.me/eugene_boitsov" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                @eugene_boitsov
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="max-w-4xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p className="mb-2">Онлайн-школа «Апекс» — подготовка к олимпиадам по астрономии</p>
          <div className="flex justify-center gap-4">
            <a href="https://t.me/eugene_boitsov" target="_blank" rel="noopener noreferrer" className="hover:text-gray-700">
              Telegram
            </a>
            <a href="https://apeks.space" target="_blank" rel="noopener noreferrer" className="hover:text-gray-700">
              apeks.space
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
