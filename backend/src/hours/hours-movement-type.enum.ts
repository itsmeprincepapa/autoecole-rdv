export enum HoursMovementType {
  CREDIT = 'credit', // heures ajoutées par le gérant
  ADJUSTMENT = 'adjustment', // correction par le gérant
  BOOKING = 'booking', // heure débitée à la réservation
  REFUND = 'refund', // heure rendue après une annulation
}