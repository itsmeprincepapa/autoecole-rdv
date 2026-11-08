import { Outlet } from 'react-router-dom';
import AppShell from '../../components/AppShell';
import type { NavItem } from '../../components/AppShell';

const NAV: NavItem[] = [
  { to: '/instructor', label: 'Planning', end: true },
  { to: '/instructor/availability', label: 'Mes disponibilités' },
];

// Cadre de toutes les pages de l'espace moniteur
export default function InstructorLayout() {
  return (
    <AppShell nav={NAV} spaceLabel="Espace moniteur">
      <Outlet />
    </AppShell>
  );
}