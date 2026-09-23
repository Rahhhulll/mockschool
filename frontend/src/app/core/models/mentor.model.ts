import { User } from './user.model';

export interface Mentor {
  _id: string;
  userId: User | string;
  expertise: string[];
  experience: number;
  bio?: string;
  hourlyRate: number;
  isVerified: boolean;
  rating: number;
}
