export interface Slot {
  _id: string;
  mentorId: string | { _id?: string; name?: string };
  date: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
}

export interface SlotInput {
  date: string;
  startTime: string;
  endTime: string;
}

export interface SlotsResponse {
  message: string;
  count: number;
  slots: Slot[];
}

export interface SlotResponse {
  message: string;
  slot: Slot;
}
