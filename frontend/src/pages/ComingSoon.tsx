// Page provisoire, remplacée au fil des tâches
export default function ComingSoon({ title }: { title: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
      <h1 className="font-display text-2xl font-bold">{title}</h1>
      <p className="mt-2 text-slate-600">Cette page sera disponible très bientôt.</p>
    </div>
  );
}