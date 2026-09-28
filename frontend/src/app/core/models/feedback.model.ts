export interface Feedback {
  _id: string;
  bookingId: string;
  studentId: string;
  mentorId: string;
  technicalRating: number;
  communicationRating: number;
  confidenceRating: number;
  strengths: string;
  weaknesses: string;
  overallFeedback: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateFeedbackRequest {
  bookingId: string;
  technicalRating: number;
  communicationRating: number;
  confidenceRating: number;
  strengths: string;
  weaknesses: string;
  overallFeedback: string;
}

export interface FeedbackResponse {
  message: string;
  feedback: Feedback;
}
