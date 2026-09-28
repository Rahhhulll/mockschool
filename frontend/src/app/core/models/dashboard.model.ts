import { Booking } from './booking.model';

export interface StudentDashboardFeedbackSummary {
  totalFeedback: number;
  averageTechnicalRating: number;
  averageCommunicationRating: number;
  averageConfidenceRating: number;
}

export interface StudentDashboardData {
  totalBookings: number;
  upcomingBookings: number;
  completedInterviews: number;
  cancelledBookings: number;
  feedbackSummary: StudentDashboardFeedbackSummary;
}

export interface StudentDashboardResponse {
  message: string;
  dashboard: StudentDashboardData;
}

export interface MentorDashboardData {
  totalInterviews: number;
  upcomingInterviews: number;
  completedInterviews: number;
  totalEarnings: number;
  averageRating: number;
  upcomingBookings?: Booking[];
  recentBookings?: Booking[];
  performanceSummary?: MentorPerformanceSummary | null;
}

export interface MentorPerformanceSummary {
  technicalRating: number;
  communicationRating: number;
  confidenceRating: number;
}

export interface MentorDashboardResponse {
  message: string;
  dashboard: MentorDashboardData;
}
