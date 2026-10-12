import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { AdminBooking, AdminBookingListResponse, AdminDashboardData, AdminDashboardResponse, AdminListResponse, AdminMentor, AdminMentorDetailResponse, AdminUser, AdminUserDetailResponse } from '../models/admin-dashboard.model';

const emptyDashboard: AdminDashboardData = {
  stats: {
    totalUsers: 0,
    totalStudents: 0,
    totalMentors: 0,
    verifiedMentors: 0,
    totalBookings: 0,
    completedInterviews: 0,
    cancelledBookings: 0,
    revenue: 0,
    totalFeedback: 0,
  },
  bookingStatistics: [],
  userStatistics: [],
  revenueOverview: [],
};

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);

  getDashboard(): Observable<AdminDashboardData> {
    return this.http
      .get<AdminDashboardResponse>(`${environment.apiUrl}/admin/dashboard`)
      .pipe(map((response) => response.data ?? response.dashboard ?? emptyDashboard));
  }

  getUsers(params?: { page?: number; limit?: number; search?: string; role?: string }): Observable<AdminListResponse<AdminUser>> {
    const queryParams = new HttpParams({ fromObject: { ...params, page: params?.page ?? 1, limit: params?.limit ?? 10 } });
    return this.http.get<AdminListResponse<AdminUser>>(`${environment.apiUrl}/admin/users`, { params: queryParams });
  }

  getUserById(id: string): Observable<AdminUserDetailResponse> {
    return this.http.get<AdminUserDetailResponse>(`${environment.apiUrl}/admin/users/${id}`);
  }

  deleteUser(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${environment.apiUrl}/admin/users/${id}`);
  }

  getMentors(params?: { page?: number; limit?: number; search?: string; verificationStatus?: string }): Observable<AdminListResponse<AdminMentor>> {
    const queryParams = new HttpParams({ fromObject: { ...params, page: params?.page ?? 1, limit: params?.limit ?? 10 } });
    return this.http.get<AdminListResponse<AdminMentor>>(`${environment.apiUrl}/admin/mentors`, { params: queryParams });
  }

  verifyMentor(id: string, isVerified: boolean): Observable<AdminMentorDetailResponse> {
    return this.http.patch<AdminMentorDetailResponse>(`${environment.apiUrl}/admin/mentors/${id}/verify`, { isVerified });
  }

  getBookings(params?: { page?: number; limit?: number; search?: string; status?: string; paymentStatus?: string }): Observable<AdminBookingListResponse> {
    const queryParams = new HttpParams({ fromObject: { ...params, page: params?.page ?? 1, limit: params?.limit ?? 10 } });
    return this.http.get<AdminBookingListResponse>(`${environment.apiUrl}/admin/bookings`, { params: queryParams });
  }
}
