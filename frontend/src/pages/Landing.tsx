import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import Logo from '../components/Logo';
import CountUp from '../components/landing/CountUp';
import HeroCarousel from '../components/landing/HeroCarousel';
import Reveal from '../components/landing/Reveal';
import SiteHeader from '../components/landing/SiteHeader';
import SlotPicker from '../components/landing/SlotPicker';
import Testimonials from '../components/landing/Testimonials';
import { SITE } from '../lib/site';
import ErrorBoundary from '../components/ErrorBoundary';
const MARQUEE_WORDS = [
  'Code de la route',
  'Conduite',
  'Ronds-points',
  'Créneaux',
  'Examen',
  'Permis B',
];

const STEPS = [
  {
    title: 'Créez votre compte',
    text: 'Saisissez votre email, puis le code à 6 chiffres que vous recevez.',
  },
  {
    title: 'Faites créditer vos heures',
    text: "Réglez votre forfait à l'agence : vos heures apparaissent sur votre compte.",
  },
  {
    title: 'Réservez un créneau',
    text: 'Choisissez un moniteur et une heure libre. Un véhicule vous est attribué.',
  },
  {
    title: 'Conduisez et progressez',
    text: 'Après chaque leçon, votre moniteur note ce que vous avez travaillé.',
  },
];

const FEATURES = [
  {
    title: 'Votre solde en temps réel',
    text: "Chaque réservation retire une heure, chaque annulation à temps la rend. L'historique reste consultable.",
  },
  {
    title: "Annulation gratuite jusqu'à 24 heures avant",
    text: "Passé ce délai, l'heure est décomptée. La règle est la même pour tous les élèves.",
  },
  {
    title: 'Aucun créneau en double',
    text: "Dès qu'un élève réserve, le créneau disparaît de la liste. Moniteur et véhicule sont réservés ensemble.",
  },
  {
    title: 'Un email à chaque étape',
    text: 'Confirmation de réservation, annulation, changement de mot de passe : tout arrive dans votre boîte mail.',
  },
];

const SKILLS = [
  { name: 'Démarrer et s’arrêter', level: 4 },
  { name: 'Changements de vitesse', level: 4 },
  { name: 'Conduite en ville', level: 3 },
  { name: 'Ronds-points', level: 2 },
  { name: 'Créneaux', level: 1 },
];

// Bande de mots qui défile en continu
function Marquee() {
  const row = MARQUEE_WORDS.map((w) => (
    <span key={w} className="flex items-center gap-8 pr-8">
      {w}
      <span className="h-2.5 w-2.5 rotate-45 bg-navy" />
    </span>
  ));
  return (
    <div className="overflow-hidden bg-line py-4 text-asphalt" aria-hidden="true">
      <div className="flex w-max animate-marquee whitespace-nowrap font-display text-xl font-extrabold sm:text-2xl">
        <div className="flex">{row}</div>
        <div className="flex">{row}</div>
      </div>
    </div>
  );
}

const formatPrice = (value: number) => value.toLocaleString('fr-FR');

export default function Landing() {
  const reduced = useReducedMotion();

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main>
               {/* Si le carrousel plante, un en-tête simple prend sa place */}
        <ErrorBoundary
          fallback={
            <section className="bg-navy px-4 pb-20 pt-32 text-white sm:px-6">
              <div className="mx-auto max-w-6xl">
                <h1 className="font-display text-5xl font-extrabold">{SITE.slides[0].title}</h1>
                <p className="mt-4 text-lg text-white/90">{SITE.slides[0].text}</p>
                <Link
                  to="/register"
                  className="mt-8 inline-block rounded-lg bg-line px-7 py-3.5 font-bold text-asphalt"
                >
                  Créer mon compte
                </Link>
              </div>
            </section>
          }
        >
          <HeroCarousel />
        </ErrorBoundary>
        <Marquee />

        {/* Parcours de l'élève : une vraie suite d'étapes */}
        <section id="etapes" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6 lg:py-28">
          <Reveal>
            <h2 className="max-w-2xl text-balance font-display text-3xl font-extrabold tracking-tight sm:text-5xl">
              De l'inscription à la première leçon
            </h2>
          </Reveal>

          <ol className="mt-14 lg:grid lg:grid-cols-4">
            {STEPS.map((step, index) => (
              <motion.li
                key={step.title}
                initial={reduced ? false : { opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.6, delay: index * 0.14, ease: 'easeOut' }}
                className="relative border-l-2 border-dashed border-slate-300 pb-10 pl-8 last:pb-0 lg:border-l-0 lg:border-t-2 lg:pb-0 lg:pl-0 lg:pr-8 lg:pt-8"
              >
                <span
                  className="absolute -left-[19px] top-0 flex h-9 w-9 items-center justify-center rounded-full bg-navy text-base font-bold text-line lg:-top-[19px] lg:left-0"
                  aria-hidden="true"
                >
                  {index + 1}
                </span>
                <h3 className="font-display text-xl font-bold">{step.title}</h3>
                <p className="mt-2 leading-relaxed text-slate-600">{step.text}</p>
              </motion.li>
            ))}
          </ol>
        </section>

        {/* Chiffres clés */}
        <section className="bg-navy text-white">
          <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-y-10 px-4 py-16 sm:px-6 lg:grid-cols-4">
            {SITE.stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <dt className="order-2 mt-2 text-white/80">{stat.label}</dt>
                <dd className="font-display text-5xl font-extrabold text-line sm:text-6xl">
                  <CountUp to={stat.value} suffix={stat.suffix} />
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Essai de la réservation */}
        <section id="essai" className="scroll-mt-20 bg-mist">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-28">
            <Reveal>
              <h2 className="text-balance font-display text-3xl font-extrabold tracking-tight sm:text-5xl">
                Essayez la réservation
              </h2>
              <p className="mt-5 max-w-lg text-lg leading-relaxed text-slate-600">
                Choisissez un jour, une heure, et voyez votre solde d'heures évoluer. C'est
                exactement ce que vous ferez une fois votre compte créé.
              </p>
              <Link
                to="/register"
                className="mt-8 inline-block rounded-lg bg-signal px-7 py-3.5 font-bold text-white hover:bg-signal-dark"
              >
                Créer mon compte
              </Link>
            </Reveal>
            <Reveal delay={0.15}>
              <SlotPicker />
            </Reveal>
          </div>
        </section>

        {/* Avantages, avec un exemple de carnet de progression */}
        <section className="mx-auto grid max-w-6xl gap-14 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-start lg:py-28">
          <Reveal>
            <h2 className="text-balance font-display text-3xl font-extrabold tracking-tight sm:text-5xl">
              Vous gardez la main sur vos heures
            </h2>
            <dl className="mt-10 divide-y divide-slate-200 border-y border-slate-200">
              {FEATURES.map((feature) => (
                <div key={feature.title} className="py-5">
                  <dt className="font-display text-lg font-bold">{feature.title}</dt>
                  <dd className="mt-1 leading-relaxed text-slate-600">{feature.text}</dd>
                </div>
              ))}
            </dl>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="rounded-3xl bg-navy p-7 text-white sm:p-9">
              <h3 className="font-display text-2xl font-bold">Votre carnet de progression</h3>
              <p className="mt-1 text-sm text-white/70">
                Votre moniteur évalue chaque compétence de 1 à 4 après la leçon.
              </p>
              <ul className="mt-6 divide-y divide-white/10">
                {SKILLS.map((skill) => (
                  <li key={skill.name} className="flex items-center justify-between gap-4 py-3.5">
                    <span className="font-medium">{skill.name}</span>
                    <div className="flex gap-1" role="img" aria-label={`Niveau ${skill.level} sur 4`}>
                      {[1, 2, 3, 4].map((n) => (
                        <span
                          key={n}
                          className={`h-2 w-7 rounded-full ${n <= skill.level ? 'bg-line' : 'bg-white/20'}`}
                        />
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-white/60">Exemple de carnet.</p>
            </div>
          </Reveal>
        </section>

        {/* Avis */}
        <section className="bg-line/20">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-24">
            <Reveal>
              <h2 className="mb-10 font-display text-3xl font-extrabold tracking-tight sm:text-5xl">
                Ils ont réservé en ligne
              </h2>
              <Testimonials />
            </Reveal>
          </div>
        </section>

        {/* Forfaits */}
        <section id="tarifs" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6 lg:py-28">
          <Reveal className="max-w-2xl">
            <h2 className="text-balance font-display text-3xl font-extrabold tracking-tight sm:text-5xl">
              Des forfaits d'heures, réglés à l'agence
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-slate-600">
              L'auto-école crédite vos heures sur votre compte après le règlement. Vous
              réservez ensuite quand vous voulez.
            </p>
          </Reveal>

          <ul className="mt-12 grid gap-6 lg:grid-cols-3">
            {SITE.packages.map((pack, index) => {
              const featured = index === 1;
              return (
                <li
                  key={pack.hours}
                  className={`relative flex flex-col rounded-3xl p-8 motion-safe:transition-transform motion-safe:duration-300 motion-safe:hover:-translate-y-2 ${
                    featured
                      ? 'bg-navy text-white shadow-2xl shadow-navy/30'
                      : 'border border-slate-200 bg-white'
                  }`}
                >
                  {featured && (
                    <span className="absolute -top-3 left-8 rounded-full bg-line px-3 py-1 text-xs font-bold text-asphalt">
                      Le plus choisi
                    </span>
                  )}
                  <h3 className="font-display text-4xl font-extrabold">{pack.hours} heures</h3>
                  <p className={`mt-2 ${featured ? 'text-white/80' : 'text-slate-600'}`}>
                    {pack.description}
                  </p>
                  <p className="mt-8 font-display text-3xl font-extrabold">
                    {formatPrice(pack.price)} FCFA
                  </p>
                  <p className={`text-sm ${featured ? 'text-white/70' : 'text-slate-500'}`}>
                    soit {formatPrice(Math.round(pack.price / pack.hours))} FCFA l'heure
                  </p>
                  <Link
                    to="/register"
                    className={`mt-8 rounded-lg py-3 text-center font-bold ${
                      featured
                        ? 'bg-line text-asphalt hover:brightness-95'
                        : 'bg-signal text-white hover:bg-signal-dark'
                    }`}
                  >
                    Créer mon compte
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      </main>

      {/* Appel final et coordonnées */}
      <div className="on-dark bg-navy text-white">
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-line/20 blur-3xl" />
          <div className="relative mx-auto flex max-w-6xl flex-col gap-8 px-4 py-20 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:py-24">
            <h2 className="max-w-2xl text-balance font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
              Créez votre compte, votre première leçon se réserve en une minute
            </h2>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/register"
                className="rounded-lg bg-line px-7 py-3.5 font-bold text-asphalt hover:brightness-95"
              >
                Créer mon compte
              </Link>
              <Link
                to="/login"
                className="rounded-lg border border-white/40 px-7 py-3.5 font-semibold hover:bg-white/10"
              >
                Se connecter
              </Link>
            </div>
          </div>
        </section>

        <footer id="contact" className="scroll-mt-20 border-t border-white/10">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 text-sm sm:px-6 md:grid-cols-3">
            <p className="flex items-center gap-2.5 font-display text-lg font-bold">
              <Logo />
              {SITE.name}
            </p>
            <div className="space-y-1 text-slate-300">
              <p className="font-semibold text-white">Nous trouver</p>
              <p>{SITE.address}</p>
              <p>{SITE.hours}</p>
            </div>
            <div className="space-y-1 text-slate-300">
              <p className="font-semibold text-white">Nous joindre</p>
              <p>{SITE.phone}</p>
              <p>{SITE.email}</p>
            </div>
          </div>
          <p className="border-t border-white/10 px-4 py-4 text-center text-xs text-slate-400">
            © {new Date().getFullYear()} {SITE.name}
          </p>
        </footer>
      </div>
    </div>
  );
}