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
