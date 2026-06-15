'use client';

import type { ProblemOption } from '@/lib/api';

/**
 * Renders the correct answer-entry UI for a problem's answer_type and emits a
 * submit-ready answer object:
 *   text            -> { text }
 *   number          -> { value }
 *   formula         -> { latex }
 *   choice_single   -> { option_id }
 *   choice_multiple -> { option_ids: number[] }
 */
export default function AnswerInput({
  answerType,
  options = [],
  value,
  onChange,
  disabled = false,
}: {
  answerType: string;
  options?: ProblemOption[];
  value: any;
  onChange: (v: any) => void;
  disabled?: boolean;
}) {
  const base =
    'w-full rounded-lg bg-[#070C18] border border-[#1E2D4A] px-3 py-2 text-sm text-[#F0EDE8] placeholder-[#6A6860] focus:outline-none focus:border-[#4ECDD4] disabled:opacity-60';

  if (answerType === 'text') {
    return (
      <textarea
        rows={4}
        disabled={disabled}
        className={base}
        placeholder="Ваш ответ…"
        value={value?.text ?? ''}
        onChange={(e) => onChange({ text: e.target.value })}
      />
    );
  }

  if (answerType === 'number') {
    return (
      <input
        type="text"
        inputMode="decimal"
        disabled={disabled}
        className={base}
        placeholder="Например: 1.52"
        value={value?.value ?? ''}
        onChange={(e) => onChange({ value: e.target.value })}
      />
    );
  }

  if (answerType === 'formula') {
    return (
      <div>
        <input
          type="text"
          disabled={disabled}
          className={base}
          placeholder="Формула в LaTeX, напр. T^2 = \\frac{4\\pi^2 a^3}{G M}"
          value={value?.latex ?? ''}
          onChange={(e) => onChange({ latex: e.target.value })}
        />
        <p className="mt-1 text-xs text-[#6A6860]">Введите формулу в формате LaTeX.</p>
      </div>
    );
  }

  if (answerType === 'choice_single') {
    const selected = value?.option_id;
    return (
      <div className="space-y-2">
        {options.map((opt) => (
          <label
            key={opt.id}
            className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 cursor-pointer transition-colors ${
              selected === opt.id
                ? 'border-[#4ECDD4] bg-[#152035]'
                : 'border-[#1E2D4A] hover:bg-[#152035]'
            } ${disabled ? 'opacity-60 pointer-events-none' : ''}`}
          >
            <input
              type="radio"
              className="accent-[#4ECDD4]"
              checked={selected === opt.id}
              onChange={() => onChange({ option_id: opt.id })}
            />
            <span className="text-sm text-[#F0EDE8]">{opt.text}</span>
          </label>
        ))}
      </div>
    );
  }

  if (answerType === 'choice_multiple') {
    const ids: number[] = value?.option_ids ?? [];
    const toggle = (id: number) => {
      const next = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
      onChange({ option_ids: next });
    };
    return (
      <div className="space-y-2">
        {options.map((opt) => (
          <label
            key={opt.id}
            className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 cursor-pointer transition-colors ${
              ids.includes(opt.id)
                ? 'border-[#4ECDD4] bg-[#152035]'
                : 'border-[#1E2D4A] hover:bg-[#152035]'
            } ${disabled ? 'opacity-60 pointer-events-none' : ''}`}
          >
            <input
              type="checkbox"
              className="accent-[#4ECDD4]"
              checked={ids.includes(opt.id)}
              onChange={() => toggle(opt.id)}
            />
            <span className="text-sm text-[#F0EDE8]">{opt.text}</span>
          </label>
        ))}
      </div>
    );
  }

  return <p className="text-sm text-[#6A6860]">Неизвестный тип задания.</p>;
}
