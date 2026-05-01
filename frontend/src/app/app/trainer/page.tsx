'use client';

export default function TrainerPage() {
  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-6 text-[#F0EDE8]">Тренажёр звёздного неба</h1>
      <p className="text-[#A8A5A0] mb-6">
        Интерактивный тренажёр для изучения звёздного неба. Вы можете практиковаться
        в определении созвездий, ярких звёзд и их расположения на небесной сфере.
        Тренажёр работает на отдельном сайте и откроется в новой вкладке.
      </p>
      <a
        href="https://apex-skychart.ru/"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-6 py-3 bg-[#D9A441] text-[#0A0E1A] rounded-lg hover:bg-[#F4B860] text-lg font-medium transition-colors"
      >
        Открыть тренажёр
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
    </div>
  );
}
