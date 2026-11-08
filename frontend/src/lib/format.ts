// Les heures sont affichées dans le fuseau horaire de l'auto-école
const TIME_ZONE: string = import.meta.env.VITE_TIMEZONE ?? 'Africa/Dakar';

const dateTime = new Intl.DateTimeFormat('fr-FR', {
  timeZone: TIME_ZONE,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
});

const shortDate = new Intl.DateTimeFormat('fr-FR', {
  timeZone: TIME_ZONE,
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

// "lundi 14 décembre à 09:00"
export function formatDateTime(iso: string): string {
  return dateTime.format(new Date(iso)).replace(' à ', ' à ');
}

// "14 déc. 2026"
export function formatShortDate(iso: string): string {
  return shortDate.format(new Date(iso));
}