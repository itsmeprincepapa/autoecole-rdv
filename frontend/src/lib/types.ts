// Formes des données renvoyées par le backend

export type AppointmentStatus = 'confirmed' | 'cancelled' | 'completed' | 'no_show';

export interface Appointment {
  id: string;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
  notes: string | null;
  instructor: { id: string; firstName: string; lastName: string };
  vehicle: { plateNumber: string; model: string };
}

export type HoursMovementType = 'credit' | 'adjustment' | 'booking' | 'refund';

export interface HoursMovement {
  id: string;
  type: HoursMovementType;
  amount: number;
  balanceAfter: number;
  reason: string | null;
  createdAt: string;
}

export interface HoursResponse {
  hoursBalance: number;
  history: HoursMovement[];
}