'use client';

import { useState } from 'react';

const CONSTELLATIONS = [
  { name: 'Орион', latin: 'Orion', stars: ['Бетельгейзе', 'Ригель', 'Беллатрикс', 'Минтака', 'Альнилам', 'Альнитак'] },
  { name: 'Большая Медведица', latin: 'Ursa Major', stars: ['Дубхе', 'Мерак', 'Фекда', 'Мегрец', 'Алиот', 'Мицар', 'Бенетнаш'] },
  { name: 'Лев', latin: 'Leo', stars: ['Регул', 'Денебола', 'Альгиеба', 'Зосма'] },
  { name: 'Скорпион', latin: 'Scorpius', stars: ['Антарес', 'Шаула', 'Саргас', 'Дшубба'] },
  { name: 'Лебедь', latin: 'Cygnus', stars: ['Денеб', 'Альбирео', 'Садр', 'Гиенах'] },
  { name: 'Лира', latin: 'Lyra', stars: ['Вега', 'Шелиак', 'Сулафат'] },
  { name: 'Орёл', latin: 'Aquila', stars: ['Альтаир', 'Таразед', 'Альшаин'] },
  { name: 'Кассиопея', latin: 'Cassiopeia', stars: ['Шедар', 'Каф', 'Нави', 'Рукба', 'Сегин'] },
  { name: 'Персей', latin: 'Perseus', stars: ['Мирфак', 'Алголь', 'Менкиб'] },
  { name: 'Близнецы', latin: 'Gemini', stars: ['Кастор', 'Поллукс', 'Альхена', 'Мебсута'] },
  { name: 'Телец', latin: 'Taurus', stars: ['Альдебаран', 'Эль-Нат', 'Альциона'] },
  { name: 'Волопас', latin: 'Bootes', stars: ['Арктур', 'Изар', 'Муфрид'] },
];

interface QuizState {
  questionIndex: number;
  score: number;
  total: number;
  currentQuestion: { type: string; question: string; answer: string; options: string[] } | null;
  userAnswer: string | null;
  showResult: boolean;
  finished: boolean;
}

function generateQuestion(constellations: typeof CONSTELLATIONS): QuizState['currentQuestion'] {
  const types = ['star_to_constellation', 'constellation_to_stars', 'latin_name'];
  const type = types[Math.floor(Math.random() * types.length)];
  const c = constellations[Math.floor(Math.random() * constellations.length)];

  if (type === 'star_to_constellation') {
    const star = c.stars[Math.floor(Math.random() * c.stars.length)];
    const options = [c.name];
    while (options.length < 4) {
      const other = constellations[Math.floor(Math.random() * constellations.length)].name;
      if (!options.includes(other)) options.push(other);
    }
    return {
      type,
      question: `В каком созвездии находится звезда ${star}?`,
      answer: c.name,
      options: options.sort(() => Math.random() - 0.5),
    };
  } else if (type === 'constellation_to_stars') {
    const correctStar = c.stars[Math.floor(Math.random() * c.stars.length)];
    const options = [correctStar];
    while (options.length < 4) {
      const otherC = constellations[Math.floor(Math.random() * constellations.length)];
      const otherStar = otherC.stars[Math.floor(Math.random() * otherC.stars.length)];
      if (!options.includes(otherStar)) options.push(otherStar);
    }
    return {
      type,
      question: `Какая из звёзд принадлежит созвездию ${c.name}?`,
      answer: correctStar,
      options: options.sort(() => Math.random() - 0.5),
    };
  } else {
    const options = [c.latin];
    while (options.length < 4) {
      const other = constellations[Math.floor(Math.random() * constellations.length)].latin;
      if (!options.includes(other)) options.push(other);
    }
    return {
      type,
      question: `Как по-латыни называется созвездие ${c.name}?`,
      answer: c.latin,
      options: options.sort(() => Math.random() - 0.5),
    };
  }
}

export default function TrainerPage() {
  const [quiz, setQuiz] = useState<QuizState>({
    questionIndex: 0,
    score: 0,
    total: 10,
    currentQuestion: null,
    userAnswer: null,
    showResult: false,
    finished: false,
  });
  const [started, setStarted] = useState(false);

  const startQuiz = () => {
    setStarted(true);
    setQuiz({
      questionIndex: 0,
      score: 0,
      total: 10,
      currentQuestion: generateQuestion(CONSTELLATIONS),
      userAnswer: null,
      showResult: false,
      finished: false,
    });
  };

  const handleAnswer = (answer: string) => {
    if (quiz.showResult) return;
    const isCorrect = answer === quiz.currentQuestion?.answer;
    setQuiz(prev => ({
      ...prev,
      userAnswer: answer,
      showResult: true,
      score: isCorrect ? prev.score + 1 : prev.score,
    }));
  };

  const nextQuestion = () => {
    if (quiz.questionIndex + 1 >= quiz.total) {
      setQuiz(prev => ({ ...prev, finished: true }));
      return;
    }
    setQuiz(prev => ({
      ...prev,
      questionIndex: prev.questionIndex + 1,
      currentQuestion: generateQuestion(CONSTELLATIONS),
      userAnswer: null,
      showResult: false,
    }));
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Тренажёр звёздного неба</h1>

      {!started ? (
        <div className="max-w-lg">
          <p className="text-gray-600 mb-4">
            Проверьте свои знания созвездий и ярких звёзд. Тренажёр задаст вам 10 вопросов
            о созвездиях, их звёздах и латинских названиях.
          </p>
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Доступные созвездия:</h3>
            <div className="flex flex-wrap gap-2">
              {CONSTELLATIONS.map(c => (
                <span key={c.name} className="px-2 py-1 bg-blue-50 text-blue-700 text-sm rounded">
                  {c.name}
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={startQuiz}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Начать тренировку
          </button>
        </div>
      ) : quiz.finished ? (
        <div className="max-w-lg text-center">
          <h2 className="text-3xl font-bold mb-4">Результат</h2>
          <div className="text-6xl font-bold mb-4">
            {quiz.score}/{quiz.total}
          </div>
          <p className="text-gray-600 mb-6">
            {quiz.score >= 9 ? 'Отлично! Вы прекрасно знаете звёздное небо!' :
             quiz.score >= 7 ? 'Хороший результат! Продолжайте тренироваться.' :
             quiz.score >= 5 ? 'Неплохо, но есть над чем поработать.' :
             'Стоит повторить материал о созвездиях.'}
          </p>
          <button
            onClick={startQuiz}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Попробовать снова
          </button>
        </div>
      ) : (
        <div className="max-w-lg">
          <div className="flex justify-between items-center mb-6">
            <span className="text-sm text-gray-500">
              Вопрос {quiz.questionIndex + 1} из {quiz.total}
            </span>
            <span className="text-sm font-medium">
              Счёт: {quiz.score}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${((quiz.questionIndex + (quiz.showResult ? 1 : 0)) / quiz.total) * 100}%` }}
            />
          </div>
          <h2 className="text-lg font-semibold mb-4">{quiz.currentQuestion?.question}</h2>
          <div className="space-y-3">
            {quiz.currentQuestion?.options.map((opt) => {
              let className = 'w-full text-left p-3 border rounded-lg text-sm transition-colors ';
              if (quiz.showResult) {
                if (opt === quiz.currentQuestion?.answer) {
                  className += 'bg-green-50 border-green-500 text-green-700';
                } else if (opt === quiz.userAnswer) {
                  className += 'bg-red-50 border-red-500 text-red-700';
                } else {
                  className += 'opacity-50';
                }
              } else {
                className += 'hover:bg-blue-50 hover:border-blue-300';
              }
              return (
                <button
                  key={opt}
                  onClick={() => handleAnswer(opt)}
                  className={className}
                  disabled={quiz.showResult}
                >
                  {opt}
                </button>
              );
            })}
          </div>
          {quiz.showResult && (
            <button
              onClick={nextQuestion}
              className="mt-6 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {quiz.questionIndex + 1 >= quiz.total ? 'Завершить' : 'Следующий вопрос'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
