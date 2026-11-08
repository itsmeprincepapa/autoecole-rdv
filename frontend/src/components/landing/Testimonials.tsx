import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { SITE } from '../../lib/site';

const items = SITE.testimonials;

// Avis d'élèves : un avis à la fois, qui change toutes les 6 secondes
export default function Testimonials() {
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || reduced) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % items.length), 6000);
    return () => clearInterval(timer);
  }, [paused, reduced]);

  const item = items[index];
  const initials = item.name
    .split(' ')
    .map((part) => part[0])
    .join('');

  return (
    <div
      onMouseEnter={() => setPaused(false)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(false)}
      onBlur={() => setPaused(false)}
    >
      <div className="min-h-[15rem] sm:min-h-[13rem]">
        <AnimatePresence mode="wait">
          <motion.figure
            key={index}
            initial={reduced ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <blockquote className="max-w-3xl text-balance font-display text-2xl font-bold leading-snug sm:text-3xl">
              « {item.text} »
            </blockquote>
            <figcaption className="mt-6 flex items-center gap-3">
              <span
                className="flex h-11 w-11 items-center justify-center rounded-full bg-navy text-sm font-bold text-line"
                aria-hidden="true"
              >
                {initials}
              </span>
              <span>
                <span className="block font-semibold">{item.name}</span>
                <span className="block text-sm text-slate-600">{item.detail}</span>
              </span>
            </figcaption>
          </motion.figure>
        </AnimatePresence>
      </div>

      <div className="mt-6 flex gap-2" role="group" aria-label="Choisir un avis">
        {items.map((it, i) => (
          <button
            key={it.name}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Avis de ${it.name}`}
            aria-current={i === index}
            className="py-2"
          >
            <span
              className={`block h-2 rounded-full transition-all ${
                i === index ? 'w-8 bg-navy' : 'w-2 bg-slate-300'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}