import { useAuth } from '../auth/useAuth';

// Espace provisoire : remplacé par le vrai tableau de bord de chaque rôle
export default function Dashboard({ title }: { title: string }) {
  const { user, logout } = useAuth();

  return (
    <div className="mx-auto max-w-3xl p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-blue-700">{title}</h1>
        <button
          onClick={logout}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
        >
          Se déconnecter
        </button>
      </div>
      <p className="mt-4 text-slate-700">
        Bonjour {user?.firstName} {user?.lastName}.
      </p>
      <p className="mt-1 text-sm text-slate-500">
        {user?.email} ({user?.role})
      </p>
    </div>
  );
}