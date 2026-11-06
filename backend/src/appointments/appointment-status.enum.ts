export enum AppointmentStatus {
  CONFIRMED = 'confirmed', // réservé
  CANCELLED = 'cancelled', // annulé (libère le créneau)
  COMPLETED = 'completed', // leçon effectuée
  NO_SHOW = 'no_show', // élève absent
}