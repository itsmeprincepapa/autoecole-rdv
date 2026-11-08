import { Outlet } from 'react-router-dom';
import AppShell from '../../components/AppShell';
import type { NavItem } from '../../components/AppShell';

const NAV: NavItem[] = [
  { to: '/student', label: 'Tableau de bord', end: true },
  { to: '/student/book', label: 'Réserver' },
  { to: '/student/lessons', label: 'Mes leçons' },
  { to: '/student/progress', label: 'Ma progression' },
];

// Cadre de toutes les pages de l'espace élève
export default function StudentLayout() {
  return (
    <AppShell nav={NAV} spaceLabel="Espace élève">
      <Outlet />
    </AppShell>
  );
}