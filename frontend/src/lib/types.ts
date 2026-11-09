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

export interface Instructor {
  id: string;
  firstName: string;
  lastName: string;
}

export interface Slot {
  startsAt: string;
  endsAt: string;
}

export interface SlotsResponse {
  timeZone: string;
  slots: Slot[];
}


export interface LogbookSkill {
  id: string;
  name: string;
  // 0 = pas encore évalué, de 1 (à découvrir) à 4 (maîtrisé)
  level: number;
}

export interface LogbookResponse {
  skills: LogbookSkill[];
  lessons: { id: string; startsAt: string; notes: string | null }[];
}


export interface ScheduleAppointment {
  id: string;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
  student: { id: string; firstName: string; lastName: string };
  vehicle: { plateNumber: string; model: string };
}

export interface ScheduleResponse {
  timeZone: string;
  appointments: ScheduleAppointment[];
}


export interface Skill {
  id: string;
  name: string;
  position: number;
}


export interface AvailabilityRange {
  id: string;
  // 0 = dimanche, 1 = lundi ... 6 = samedi
  dayOfWeek: number;
  startTime: string; // "08:00:00"
  endTime: string;
}


export interface AdminStats {
  period: { from: string; to: string; days: number };
  byStatus: Record<AppointmentStatus, number>;
  lessonsPerInstructor: { instructorId: string; name: string; lessons: number }[];
  offeredSlots: number;
  bookedSlots: number;
  fillRate: number;
}

export interface AdminAppointment {
  id: string;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
  cancelledAt: string | null;
  student: { id: string; firstName: string; lastName: string };
  instructor: { id: string; firstName: string; lastName: string };
  vehicle: { plateNumber: string; model: string };
}

export interface AdminAppointmentsResponse {
  total: number;
  page: number;
  limit: number;
  items: AdminAppointment[];
}