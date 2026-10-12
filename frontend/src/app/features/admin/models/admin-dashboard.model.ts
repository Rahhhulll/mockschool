export interface AdminDashboardStats {
  totalUsers: number;
  totalStudents: number;
  totalMentors: number;
  verifiedMentors: number;
  totalBookings: number;
  completedInterviews: number;
  cancelledBookings: number;
  revenue: number;
  totalFeedback: number;
}

export interface DashboardChartItem {
  label: string;
  value: number;
}

export interface AdminDashboardData {
  stats: AdminDashboardStats;
  bookingStatistics: DashboardChartItem[];
  userStatistics: DashboardChartItem[];
  revenueOverview: DashboardChartItem[];
}

export interface AdminDashboardResponse {
  success?: boolean;
  message?: string;
  data?: AdminDashboardData;
  dashboard?: AdminDashboardData;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface AdminUser {
  _id: string;
  id?: string;
  name: string;
  email: string;
  role: 'student' | 'mentor' | 'admin';
  createdAt?: string;
  updatedAt?: string;
  mentorProfile?: {
    _id: string;
    expertise?: string[];
    experience?: number;
    bio?: string;
    hourlyRate?: number;
    isVerified?: boolean;
    rating?: number;
    createdAt?: string;
    updatedAt?: string;
  } | null;
}

export interface AdminMentor {
  _id: string;
  userId?: {
    _id?: string;
    name?: string;
    email?: string;
    role?: string;
  };
  expertise?: string[];
  experience?: number;
  bio?: string;
  hourlyRate?: number;
  isVerified?: boolean;
  rating?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminBooking {
  _id: string;
  studentId?: {
    _id?: string;
    name?: string;
    email?: string;
  } | string | null;
  mentorId?: {
    _id?: string;
    userId?: {
      _id?: string;
      name?: string;
      email?: string;
    };
    expertise?: string[];
    hourlyRate?: number;
  } | string | null;
  slotId?: {
    _id?: string;
    date?: string;
    startTime?: string;
    endTime?: string;
  } | string | null;
  status?: 'confirmed' | 'completed' | 'cancelled';
  paymentStatus?: 'pending' | 'paid';
  amount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminListResponse<T> {
  success?: boolean;
  message?: string;
  data?: T[];
  count?: number;
  users?: T[];
  mentors?: T[];
  bookings?: T[];
  pagination?: PaginationMeta;
}

export interface AdminUserDetailResponse {
  success?: boolean;
  message?: string;
  data?: AdminUser;
  user?: AdminUser;
}

export interface AdminMentorDetailResponse {
  success?: boolean;
  message?: string;
  data?: AdminMentor;
  mentor?: AdminMentor;
}

export interface AdminBookingListResponse extends AdminListResponse<AdminBooking> {
  data?: AdminBooking[];
}
