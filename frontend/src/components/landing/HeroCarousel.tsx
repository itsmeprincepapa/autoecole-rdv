import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type { Variants } from 'motion/react';
import { SITE } from '../../lib/site';

const SLIDE_MS = 6500;
const FADE_MS = 1400;
const slides = SITE.slides;

// Les mots du titre montent l'un après l'autre
const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const word: Variants = {
  hidden: { y: '110%' },
  show: { y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, delay: 0.4, ease: 'easeOut' } },
};

export default function HeroCarousel() {
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  // Photo qui s'efface en fondu : seules 2 photos sont chargées à la fois
  const [prev, setPrev] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  // Photos introuvables : on affiche le dégradé de secours
  const [failed, setFailed] = useState<Set<number>>(new Set());

  const indexRef = useRef(0);
  const elapsed = useRef(0);
  const bars = useRef<(HTMLSpanElement | null)[]>([]);

  const goTo = useCallback((next: number) => {
    const target = (next + slides.length) % slides.length;
    if (target === indexRef.current) return;
    elapsed.current = 0;
    setPrev(indexRef.current);
    indexRef.current = target;
    setIndex(target);
  }, []);

  // La photo précédente est retirée de la page une fois le fondu terminé
  useEffect(() => {
    if (prev === null) return;
    const timer = setTimeout(() => setPrev(null), FADE_MS + 100);
    return () => clearTimeout(timer);
  }, [prev]);

  // Préchargement de la photo suivante, pour qu'elle apparaisse sans à-coup
  useEffect(() => {
    const image = new Image();
    image.decoding = 'async';
    image.src = slides[(index + 1) % slides.length].image;
    image.decode?.().catch(() => {});
  }, [index]);

  // État des barres de progression : pleines avant la photo, vides après
  useEffect(() => {
    bars.current.forEach((bar, i) => {
      if (!bar) return;
      bar.style.transform = `scaleX(${i < index || (i === index && reduced) ? 1 : 0})`;
    });
  }, [index, reduced]);

  // Défilement automatique : la barre active est animée sans refaire l'affichage
  useEffect(() => {
    if (paused || reduced) return;
    let frame = 0;
    let last = performance.now();

    const tick = (now: number) => {
      elapsed.current += now - last;
      last = now;
      if (elapsed.current >= SLIDE_MS) {
        goTo(indexRef.current + 1);
      } else {
        const bar = bars.current[indexRef.current];
        if (bar) bar.style.transform = `scaleX(${elapsed.current / SLIDE_MS})`;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [paused, reduced, goTo]);

  const slide = slides[index];

  return (
    <section
      className="relative min-h-[100svh] overflow-hidden bg-navy text-white"
      aria-roledescription="carrousel"
      aria-label="Présentation de l'auto-école"
    >
      {/* Photos : fondu enchaîné et zoom lent. Seules la photo affichée et celle
          qui s'efface sont présentes dans la page. */}
      {slides.map((s, i) => {
        const active = i === index;
        const mounted = active || i === prev;
        return (
          <div
            key={s.image}
            aria-hidden="true"
            className={`absolute inset-0 transition-opacity ${
              active ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ background: s.fallback, transitionDuration: `${FADE_MS}ms` }}
          >
            {mounted && !failed.has(i) && (
              <img
                src={s.image}
                alt=""
                decoding="async"
                onError={() => setFailed((current) => new Set(current).add(i))}
                className={`h-full w-full object-cover ${
                  active && !reduced ? 'animate-kenburns' : ''
                }`}
                style={!active && !reduced ? { transform: 'scale(1.1)' } : undefined}
              />
            )}
          </div>
        );
      })}

      {/* Voile sombre pour garder le texte lisible */}
      <div className="absolute inset-0 bg-gradient-to-r from-navy/85 via-navy/50 to-navy/10" />
      <div className="absolute inset-0 bg-gradient-to-t from-navy/70 via-transparent to-navy/40" />

      <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-center px-4 pb-32 pt-28 sm:px-6">
        <div className="max-w-3xl" aria-live={paused ? 'polite' : 'off'}>
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              variants={container}
              initial={reduced ? false : 'hidden'}
              animate="show"
              exit={{ opacity: 0, transition: { duration: 0.25 } }}
            >
              <h1 className="text-balance font-display text-5xl font-extrabold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
                {slide.title.split(' ').map((w, i) => (
                  <Fragment key={i}>
                    <span className="inline-block overflow-hidden pb-[0.12em] align-bottom">
                      <motion.span variants={word} className="inline-block">
                        {w}
                      </motion.span>
                    </span>{' '}
                  </Fragment>
                ))}
              </h1>
              <motion.p
                variants={fadeUp}
                className="mt-6 max-w-xl text-lg leading-relaxed text-white/90 sm:text-xl"
              >
                {slide.text}
              </motion.p>
            </motion.div>
          </AnimatePresence>

          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              to="/register"
              className="rounded-lg bg-line px-7 py-3.5 font-bold text-asphalt shadow-lg hover:brightness-95"
            >
              Créer mon compte
            </Link>
            <Link
              to="/login"
              className="rounded-lg border border-white/50 px-7 py-3.5 font-semibold backdrop-blur-sm hover:bg-white/10"
            >
              Se connecter
            </Link>
          </div>
        </div>
      </div>

      {/* Commandes : progression, précédent, pause, suivant */}
      <div className="absolute inset-x-0 bottom-0 z-10">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 pb-8 sm:px-6">
          <div className="flex flex-1 gap-2" role="group" aria-label="Choisir une photo">
            {slides.map((s, i) => (
              <button
                key={s.title}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Photo ${i + 1} sur ${slides.length} : ${s.title}`}
                aria-current={i === index}
                className="flex-1 py-3"
              >
                <span className="block h-1 overflow-hidden rounded-full bg-white/30">
                  <span
                    ref={(el) => {
                      bars.current[i] = el;
                    }}
                    className="block h-full origin-left bg-line"
                    style={{ transform: 'scaleX(0)' }}
                  />
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              aria-label="Photo précédente"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/40 hover:bg-white/15"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {!reduced && (
              <button
                type="button"
                onClick={() => setPaused((p) => !p)}
                aria-label={paused ? 'Reprendre le défilement' : 'Mettre en pause le défilement'}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/40 hover:bg-white/15"
              >
                {paused ? (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                    <path d="M7 4.5v15l13-7.5z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                    <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
                  </svg>
                )}
              </button>
            )}
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              aria-label="Photo suivante"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/40 hover:bg-white/15"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}