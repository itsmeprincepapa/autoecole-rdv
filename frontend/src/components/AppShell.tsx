import type { ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { SITE } from '../lib/site';
import Logo from './Logo';

export interface NavItem {
  to: string;
  label: string;
  // true : le lien n'est actif que sur cette adresse exacte
  end?: boolean;
}

// Coquille commune des espaces connectés : barre du haut, menu, déconnexion
export default function AppShell({
  nav,
  spaceLabel,
  children,
}: {
  nav: NavItem[];
  spaceLabel: string;
  children: ReactNode;
}) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-mist">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5 font-display text-lg font-bold">
            <Logo />
            <span className="hidden sm:inline">{SITE.name}</span>
          </Link>

          <nav aria-label="Navigation principale" className="hidden items-center gap-1 md:flex">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `rounded-lg px-3.5 py-2 text-sm font-semibold ${
                    isActive ? 'bg-navy text-white' : 'text-slate-700 hover:bg-mist'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden text-right leading-tight sm:block">
              <p className="text-sm font-semibold">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-slate-500">{spaceLabel}</p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold hover:bg-mist"
            >
              Déconnexion
            </button>
          </div>
        </div>

        {/* Menu défilant sur mobile */}
        <nav
          aria-label="Navigation principale"
          className="flex gap-1 overflow-x-auto border-t border-slate-100 px-4 py-2 md:hidden"
        >
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-semibold ${
                  isActive ? 'bg-navy text-white' : 'text-slate-700'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">{children}</main>
    </div>
  );
}