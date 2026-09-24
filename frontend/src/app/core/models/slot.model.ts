export interface Slot {
  _id: string;
  mentorId: string | { _id?: string; name?: string };
  date: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
}
