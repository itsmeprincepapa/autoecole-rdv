import { useRef } from 'react';
import type { ClipboardEvent, KeyboardEvent } from 'react';

interface CodeInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  label?: string;
}

// Code de vérification affiché en une case par chiffre
export default function CodeInput({
  value,
  onChange,
  length = 6,
  label = 'Code de vérification',
}: CodeInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  const focusAt = (index: number) => {
    refs.current[Math.max(0, Math.min(length - 1, index))]?.focus();
  };

  function handleChange(index: number, raw: string) {
    let digits = raw.replace(/\D/g, '');
    if (!digits) return;
    // La case contient déjà un chiffre : on ne garde que le nouveau
    if (value[index] && digits.length > 1) digits = digits.replace(value[index], '');

    const next = value.split('');
    let pos = index;
    for (const digit of digits) {
      if (pos >= length) break;
      next[pos] = digit;
      pos += 1;
    }
    onChange(next.join('').slice(0, length));
    focusAt(pos);
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Backspace') {
      event.preventDefault();
      if (value[index]) {
        onChange(value.slice(0, index) + value.slice(index + 1));
      } else if (index > 0) {
        onChange(value.slice(0, index - 1) + value.slice(index));
        focusAt(index - 1);
      }
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      focusAt(index - 1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      focusAt(index + 1);
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const digits = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!digits) return;
    onChange(digits);
    focusAt(digits.length);
  }

  return (
    <div role="group" aria-label={label} className="flex justify-center gap-2 sm:gap-3">
      {Array.from({ length }, (_, index) => (
        <input
          key={index}
          ref={(el) => {
            refs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoFocus={index === 0}
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          aria-label={`Chiffre ${index + 1} sur ${length}`}
          value={value[index] ?? ''}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={(e) => {
            // On ne laisse pas de trou : le focus va à la première case vide
            if (index > value.length) focusAt(value.length);
            else e.target.select();
          }}
          className={`h-14 w-11 rounded-xl border-2 text-center font-display text-2xl font-bold text-navy transition focus:border-navy focus:bg-white focus:outline-none focus:ring-4 focus:ring-navy/10 sm:h-16 sm:w-14 ${
            value[index] ? 'border-navy bg-white' : 'border-slate-300 bg-slate-50'
          }`}
        />
      ))}
    </div>
  );
}