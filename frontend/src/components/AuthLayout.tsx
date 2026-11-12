import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { SITE } from '../lib/site';
import Logo from './Logo';

// Cadre commun des pages publiques : connexion, inscription, etc.
export default function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-navy px-4 py-10">
      {/* Photo de fond + voile bleu marine pour la lisibilité */}
      <img
        src="/images/slide-2.jpg"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-br from-navy/90 via-navy/70 to-navy/90"
      />

      <div className="relative w-full max-w-md">
        <div className="overflow-hidden rounded-3xl bg-white shadow-2xl shadow-black/40">
          <div className="bg-navy px-8 py-5">
            <Link
              to="/"
              className="flex items-center gap-2.5 font-display text-lg font-bold text-white"
            >
              <Logo />
              {SITE.name}
            </Link>
          </div>

          <div className="p-8">
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-navy">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{subtitle}</p>
            )}
            <div className="mt-6">{children}</div>
          </div>
        </div>

        <p className="mt-6 text-center text-sm">
          <Link to="/" className="text-white/80 transition hover:text-white hover:underline">
            ← Retour au site
          </Link>
        </p>
      </div>
    </div>
  );
}