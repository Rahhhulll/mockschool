export interface Feedback {
  _id: string;
  bookingId: string;
  studentId: string;
  mentorId: string;
  technicalRating: number;
  communicationRating: number;
  confidenceRating: number;
  strengths?: string;
  weaknesses?: string;
  overallFeedback?: string;
}
