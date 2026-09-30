import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { Booking, BookingSlot } from '../../../../core/models/booking.model';
import { MentorDashboardData } from '../../../../core/models/dashboard.model';
import { DashboardService } from '../../../../core/services/dashboard.service';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../../shared/components/error-state/error-state.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { RatingComponent } from '../../../../shared/components/rating/rating.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';

interface SummaryCard {
  label: string;
  value: string;
  icon: string;
  accent: 'primary' | 'info' | 'success' | 'warning' | 'neutral';
}

@Component({
  selector: 'app-mentor-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatCardModule, MatChipsModule, MatIconModule, EmptyStateComponent, ErrorStateComponent, LoadingSpinnerComponent, PageHeaderComponent, RatingComponent, StatusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mentor-dashboard.component.html',
  styleUrls: ['./mentor-dashboard.component.scss'],
})
export class MentorDashboardComponent {
  private readonly dashboardService = inject(DashboardService);

  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly dashboard = signal<MentorDashboardData | null>(null);

  constructor() {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.dashboardService.getMentorDashboard().pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (response) => this.dashboard.set(response.dashboard),
      error: (error: HttpErrorResponse) => this.errorMessage.set(error.status === 403 ? 'You do not have access to this dashboard.' : 'Unable to load your dashboard.'),
    });
  }

  summaryCards(data: MentorDashboardData): SummaryCard[] {
    return [
      { label: 'Total Interviews', value: this.numberValue(data.totalInterviews), icon: 'event', accent: 'primary' },
      { label: 'Upcoming Interviews', value: this.numberValue(data.upcomingInterviews), icon: 'schedule', accent: 'info' },
      { label: 'Completed Interviews', value: this.numberValue(data.completedInterviews), icon: 'check_circle', accent: 'success' },
      { label: 'Total Earnings', value: this.currencyValue(data.totalEarnings), icon: 'payments', accent: 'warning' },
      { label: 'Average Rating', value: this.ratingValue(data.averageRating), icon: 'star', accent: 'neutral' },
    ];
  }

  rating(data: MentorDashboardData): number {
    return Number.isFinite(data.averageRating) ? data.averageRating : 0;
  }

  currencyValue(value: number): string {
    return Number.isFinite(value) ? `₹${value.toLocaleString('en-IN')}` : '₹0';
  }

  numberValue(value: number): string {
    return Number.isFinite(value) ? String(value) : '0';
  }

  ratingValue(value: number): string {
    return Number.isFinite(value) ? `${value.toFixed(1)} / 5` : '0.0 / 5';
  }

  studentName(booking: Booking): string {
    return typeof booking.studentId === 'object' && booking.studentId?.name ? booking.studentId.name : 'Student';
  }

  slot(booking: Booking): BookingSlot | null {
    return typeof booking.slotId === 'object' && booking.slotId !== null ? booking.slotId : null;
  }

  timeRange(booking: Booking): string {
    const bookingSlot = this.slot(booking);
    return bookingSlot ? `${this.formatTime(bookingSlot.startTime)} - ${this.formatTime(bookingSlot.endTime)}` : 'N/A';
  }

  private formatTime(value: string): string {
    const [hours, minutes] = value.split(':').map(Number);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return value;
    return `${hours % 12 || 12}:${String(minutes).padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`;
  }
}