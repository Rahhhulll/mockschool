import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { finalize } from 'rxjs';

import { AdminDashboardData, DashboardChartItem } from '../../models/admin-dashboard.model';
import { AdminService } from '../../services/admin.service';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../../shared/components/error-state/error-state.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';

interface StatCard {
  label: string;
  value: string;
  icon: string;
  accent: 'primary' | 'success' | 'warning' | 'info' | 'neutral';
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    EmptyStateComponent,
    ErrorStateComponent,
    LoadingSpinnerComponent,
    PageHeaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
})
export class AdminDashboardComponent {
  private readonly adminService = inject(AdminService);

  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly dashboard = signal<AdminDashboardData | null>(null);

  readonly stats = computed(() => this.dashboard()?.stats ?? null);
  readonly bookingStatistics = computed(() => this.dashboard()?.bookingStatistics ?? []);
  readonly userStatistics = computed(() => this.dashboard()?.userStatistics ?? []);
  readonly revenueOverview = computed(() => this.dashboard()?.revenueOverview ?? []);

  constructor() {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.adminService.getDashboard().pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (dashboard) => this.dashboard.set(dashboard),
      error: (error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.errorMessage.set('Your session has expired. Please sign in again.');
          return;
        }
        if (error.status === 403) {
          this.errorMessage.set('Admin access is required to view this dashboard.');
          return;
        }
        this.errorMessage.set('Unable to load the admin dashboard.');
      },
    });
  }

  statCards(): StatCard[] {
    const stats = this.stats();
    if (!stats) return [];

    return [
      { label: 'Total Users', value: this.formatNumber(stats.totalUsers), icon: 'group', accent: 'primary' },
      { label: 'Students', value: this.formatNumber(stats.totalStudents), icon: 'school', accent: 'info' },
      { label: 'Mentors', value: this.formatNumber(stats.totalMentors), icon: 'person', accent: 'neutral' },
      { label: 'Verified Mentors', value: this.formatNumber(stats.verifiedMentors), icon: 'verified', accent: 'success' },
      { label: 'Total Bookings', value: this.formatNumber(stats.totalBookings), icon: 'event', accent: 'primary' },
      { label: 'Completed Interviews', value: this.formatNumber(stats.completedInterviews), icon: 'check_circle', accent: 'success' },
      { label: 'Cancelled Bookings', value: this.formatNumber(stats.cancelledBookings), icon: 'cancel', accent: 'warning' },
      { label: 'Revenue', value: this.formatCurrency(stats.revenue), icon: 'payments', accent: 'warning' },
      { label: 'Feedback', value: this.formatNumber(stats.totalFeedback), icon: 'rate_review', accent: 'neutral' },
    ];
  }

  chartMax(items: DashboardChartItem[]): number {
    if (!items.length) return 1;
    return Math.max(...items.map((item) => item.value), 1);
  }

  chartWidth(value: number, max: number): string {
    if (!max) return '0%';
    return `${Math.max((value / max) * 100, value > 0 ? 8 : 0)}%`;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(Number.isFinite(value) ? value : 0);
  }

  formatNumber(value: number): string {
    return new Intl.NumberFormat('en-IN').format(Number.isFinite(value) ? value : 0);
  }
}
