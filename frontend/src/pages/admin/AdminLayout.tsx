import { Outlet } from 'react-router-dom';
import AppShell from '../../components/AppShell';
import type { NavItem } from '../../components/AppShell';

const NAV: NavItem[] = [
  { to: '/admin', label: 'Tableau de bord', end: true },
  { to: '/admin/users', label: 'Utilisateurs' },
  { to: '/admin/vehicles', label: 'Véhicules' },
  { to: '/admin/appointments', label: 'Rendez-vous' },
];

// Cadre de toutes les pages de l'espace gérant
export default function AdminLayout() {
  return (
    <AppShell nav={NAV} spaceLabel="Espace gérant">
      <Outlet />
    </AppShell>
  );
}