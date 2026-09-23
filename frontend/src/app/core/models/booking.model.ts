export type BookingStatus = 'confirmed' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid';

export interface Booking {
  _id: string;
  studentId: string;
  mentorId: string;
  slotId: string;
  status: BookingStatus;
  amount: number;
  paymentStatus: PaymentStatus;
  paymentId?: string;
}
