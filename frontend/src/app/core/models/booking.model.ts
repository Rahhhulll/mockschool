export type BookingStatus = 'confirmed' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid';

export interface BookingUserSummary {
  _id?: string;
  name?: string;
  email?: string;
}

export interface BookingMentor {
  _id: string;
  userId: string | BookingUserSummary;
  expertise?: string[];
  experience?: number;
  rating?: number;
  isVerified?: boolean;
}

export interface BookingSlot {
  _id: string;
  date: string;
  startTime: string;
  endTime: string;
}

export interface Booking {
  _id: string;
  studentId: string | BookingUserSummary;
  mentorId: string | BookingMentor;
  slotId: string | BookingSlot;
  status: BookingStatus;
  amount?: number;
  paymentStatus: PaymentStatus;
  paymentId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MyBookingsResponse {
  message: string;
  count: number;
  bookings: Booking[];
}

export interface BookingResponse {
  message: string;
  booking: Booking;
}
