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

const time = new Intl.DateTimeFormat('fr-FR', {
  timeZone: TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
});

// "lundi 14 décembre à 09:00"
export function formatDateTime(iso: string): string {
  return dateTime.format(new Date(iso));
}

// "14 déc. 2026"
export function formatShortDate(iso: string): string {
  return shortDate.format(new Date(iso));
}

// "09:00"
export function formatTime(iso: string): string {
  return time.format(new Date(iso));
}

export interface DayOption {
  date: string; // AAAA-MM-JJ, tel que le backend l'attend
  weekday: string;
  day: number;
  month: string;
}

// Les prochains jours à partir d'aujourd'hui, dans le fuseau de l'auto-école
export function nextDays(count: number): DayOption[] {
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  const [y, m, d] = today.split('-').map(Number);

  const weekdayFormat = new Intl.DateTimeFormat('fr-FR', { timeZone: 'UTC', weekday: 'short' });
  const monthFormat = new Intl.DateTimeFormat('fr-FR', { timeZone: 'UTC', month: 'short' });

  return Array.from({ length: count }, (_, i) => {
    // Midi UTC : évite tout décalage de jour
    const day = new Date(Date.UTC(y, m - 1, d + i, 12));
    return {
      date: day.toISOString().slice(0, 10),
      weekday: weekdayFormat.format(day).replace('.', ''),
      day: day.getUTCDate(),
      month: monthFormat.format(day).replace('.', ''),
    };
  });
}


const localDateFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

// Date locale de l'auto-école (AAAA-MM-JJ) d'un instant donné
export function toLocalDate(iso: string): string {
  return localDateFormat.format(new Date(iso));
}

export interface WeekDay extends DayOption {
  weekdayLong: string;
  monthLong: string;
  isToday: boolean;
}

// Les 7 jours (lundi à dimanche) d'une semaine : 0 = cette semaine, -1 = la précédente...
export function weekDays(offsetWeeks: number): WeekDay[] {
  const today = localDateFormat.format(new Date());
  const [y, m, d] = today.split('-').map(Number);
  const todayUtc = new Date(Date.UTC(y, m - 1, d, 12));
  const sinceMonday = (todayUtc.getUTCDay() + 6) % 7;

  const short = new Intl.DateTimeFormat('fr-FR', { timeZone: 'UTC', weekday: 'short' });
  const long = new Intl.DateTimeFormat('fr-FR', { timeZone: 'UTC', weekday: 'long' });
  const monthShort = new Intl.DateTimeFormat('fr-FR', { timeZone: 'UTC', month: 'short' });
  const monthLong = new Intl.DateTimeFormat('fr-FR', { timeZone: 'UTC', month: 'long' });

  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(Date.UTC(y, m - 1, d - sinceMonday + offsetWeeks * 7 + i, 12));
    const date = day.toISOString().slice(0, 10);
    return {
      date,
      weekday: short.format(day).replace('.', ''),
      day: day.getUTCDate(),
      month: monthShort.format(day).replace('.', ''),
      weekdayLong: long.format(day),
      monthLong: monthLong.format(day),
      isToday: date === today,
    };
  });
}