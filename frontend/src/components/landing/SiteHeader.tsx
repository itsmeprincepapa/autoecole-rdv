import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SITE } from '../../lib/site';
import Logo from '../Logo';

// Menu transparent sur la photo, puis blanc quand on descend dans la page
export default function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-30 transition-colors duration-300 ${
        scrolled ? 'bg-white/95 text-asphalt shadow-sm backdrop-blur' : 'text-white'
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5 font-display text-lg font-bold">
          <Logo />
          <span className="hidden sm:inline">{SITE.name}</span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-semibold md:flex">
          <a href="#etapes" className="opacity-90 hover:opacity-100">
            Comment ça marche
          </a>
          <a href="#essai" className="opacity-90 hover:opacity-100">
            Essayer
          </a>
          <a href="#tarifs" className="opacity-90 hover:opacity-100">
            Tarifs
          </a>
          <a href="#contact" className="opacity-90 hover:opacity-100">
            Contact
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className={`rounded-lg px-3 py-2 text-sm font-semibold ${
              scrolled ? 'hover:bg-mist' : 'hover:bg-white/15'
            }`}
          >
            Connexion
          </Link>
          <Link
            to="/register"
            className="rounded-lg bg-line px-3.5 py-2 text-sm font-bold text-asphalt hover:brightness-95"
          >
            Créer un compte
          </Link>
        </div>
      </div>
    </header>
  );
}