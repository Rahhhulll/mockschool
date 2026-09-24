import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { StudentDashboardData } from '../../../core/models/dashboard.model';
import { AuthService } from '../../../core/services/auth.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { RatingComponent } from '../../../shared/components/rating/rating.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

interface DashboardCard {
  label: string;
  value: number;
  icon: string;
  accent: 'primary' | 'info' | 'success' | 'warning';
}

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    EmptyStateComponent,
    ErrorStateComponent,
    PageHeaderComponent,
    RatingComponent,
    StatusBadgeComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="student-dashboard">
      <app-page-header title="Student Dashboard" subtitle="Track your mock interviews, feedback and progress.">
        <span class="welcome-badge">Welcome back, {{ userName() }}</span>
      </app-page-header>

      @if (loading()) {
        <section class="loading-grid" aria-live="polite" aria-label="Loading dashboard">
          @for (item of [1,2,3,4]; track item) {
            <mat-card class="stat-card skeleton-card">
              <div class="skeleton-line short"></div>
              <div class="skeleton-line medium"></div>
            </mat-card>
          }
        </section>
      } @else if (error()) {
        <app-error-state
          title="Unable to load your dashboard."
          [message]="error() ?? 'Please try again.'"
          retryLabel="Try Again"
          (retry)="loadDashboard()"
        />
      } @else if (dashboard(); as data) {
        <section class="stats-grid">
          @for (card of statsCards(data); track card.label) {
            <mat-card class="stat-card" [class]="card.accent">
              <div class="card-top">
                <div class="icon-wrap">
                  <mat-icon>{{ card.icon }}</mat-icon>
                </div>
                <span class="card-label">{{ card.label }}</span>
              </div>
              <strong class="card-value">{{ card.value }}</strong>
            </mat-card>
          }
        </section>

        <section class="content-grid">
          <mat-card class="panel">
            <div class="panel-header">
              <h2>Feedback Summary</h2>
            </div>

            @if (hasFeedback(data.feedbackSummary)) {
              <div class="feedback-grid">
                <div class="metric-block">
                  <span>Technical</span>
                  <div class="metric-row">
                    <app-rating [rating]="data.feedbackSummary.averageTechnicalRating" [showValue]="true"></app-rating>
                  </div>
                </div>
                <div class="metric-block">
                  <span>Communication</span>
                  <div class="metric-row">
                    <app-rating [rating]="data.feedbackSummary.averageCommunicationRating" [showValue]="true"></app-rating>
                  </div>
                </div>
                <div class="metric-block">
                  <span>Confidence</span>
                  <div class="metric-row">
                    <app-rating [rating]="data.feedbackSummary.averageConfidenceRating" [showValue]="true"></app-rating>
                  </div>
                </div>
              </div>
            } @else {
              <app-empty-state
                icon="feedback"
                title="No feedback yet"
                description="Complete your first mock interview to receive feedback."
              />
            }
          </mat-card>

          <mat-card class="panel">
            <div class="panel-header">
              <h2>Upcoming Interview</h2>
            </div>

            @if (data.upcomingBookings > 0) {
              <div class="upcoming-wrap">
                <div class="status-row">
                  <app-status-badge status="confirmed"></app-status-badge>
                  <span>{{ data.upcomingBookings }} upcoming interview(s)</span>
                </div>
                <p>Keep preparing for your next mock session with your mentor.</p>
                <button mat-stroked-button type="button" routerLink="/mentors">Find a Mentor</button>
              </div>
            } @else {
              <app-empty-state
                icon="schedule"
                title="No upcoming interviews"
                description="Your upcoming mock sessions will appear here."
                actionLabel="Find a Mentor"
                (action)="goToMentors()"
              />
            }
          </mat-card>
        </section>

        <section class="content-grid">
          <mat-card class="panel">
            <div class="panel-header">
              <h2>Recent Bookings</h2>
            </div>

            @if (data.totalBookings === 0) {
              <app-empty-state
                icon="event_available"
                title="No bookings yet"
                description="Book your first mock interview with a mentor."
                actionLabel="Find a Mentor"
                (action)="goToMentors()"
              />
            } @else {
              <div class="summary-list">
                <div class="summary-row">
                  <span>Total bookings</span>
                  <strong>{{ data.totalBookings }}</strong>
                </div>
                <div class="summary-row">
                  <span>Completed</span>
                  <strong>{{ data.completedInterviews }}</strong>
                </div>
                <div class="summary-row">
                  <span>Cancelled</span>
                  <strong>{{ data.cancelledBookings }}</strong>
                </div>
              </div>
            }
          </mat-card>

          <mat-card class="panel quick-book-panel">
            <div class="panel-header">
              <h2>Quick Book Interview</h2>
            </div>
            <div class="cta-content">
              <p>Ready for your next interview?</p>
              <strong>Practice with a verified mentor and improve your interview skills.</strong>
              <button mat-flat-button type="button" routerLink="/mentors">Book a Mock Interview</button>
            </div>
          </mat-card>
        </section>
      }
    </main>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .student-dashboard {
        display: flex;
        flex-direction: column;
        gap: var(--space-2xl);
        padding: var(--space-xl);
      }

      .welcome-badge {
        display: inline-flex;
        align-items: center;
        padding: 8px 12px;
        border-radius: 999px;
        background: var(--color-primary-light);
        color: var(--color-primary-700);
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-semibold);
      }

      .stats-grid,
      .loading-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: var(--space-lg);
      }

      .stat-card {
        padding: var(--space-xl);
      }

      .card-top {
        display: flex;
        align-items: center;
        gap: var(--space-md);
        margin-bottom: var(--space-xl);
      }

      .icon-wrap {
        display: grid;
        place-items: center;
        width: 44px;
        height: 44px;
        border-radius: 12px;
        background: var(--color-primary-light);
        color: var(--color-primary-700);
      }

      .stat-card.primary .icon-wrap { background: var(--color-primary-light); color: var(--color-primary-700); }
      .stat-card.info .icon-wrap { background: var(--color-info-light); color: var(--color-info); }
      .stat-card.success .icon-wrap { background: var(--color-success-light); color: var(--color-success); }
      .stat-card.warning .icon-wrap { background: var(--color-warning-light); color: var(--color-warning); }

      .card-label {
        color: var(--color-text-secondary);
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-medium);
      }

      .card-value {
        font-size: clamp(1.75rem, 2vw, 2.5rem);
        line-height: 1.1;
      }

      .content-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: var(--space-lg);
      }

      .panel {
        padding: var(--space-xl);
      }

      .panel-header {
        margin-bottom: var(--space-xl);
      }

      .feedback-grid {
        display: grid;
        gap: var(--space-lg);
      }

      .metric-block {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-md);
        padding: var(--space-lg);
        background: var(--color-section);
        border-radius: var(--radius-lg);
      }

      .metric-row {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
      }

      .upcoming-wrap {
        display: flex;
        flex-direction: column;
        gap: var(--space-lg);
      }

      .status-row {
        display: flex;
        align-items: center;
        gap: var(--space-md);
      }

      .summary-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-md);
      }

      .summary-row {
        display: flex;
        justify-content: space-between;
        gap: var(--space-lg);
        padding: var(--space-lg);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-lg);
      }

      .quick-book-panel .cta-content {
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: var(--space-lg);
        height: 100%;
      }

      .skeleton-card {
        min-height: 140px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: var(--space-md);
        background: linear-gradient(90deg, rgb(148 163 184 / 0.12), rgb(148 163 184 / 0.2), rgb(148 163 184 / 0.12));
        background-size: 200% 100%;
        animation: shimmer 1.4s infinite ease-in-out;
      }

      .skeleton-line {
        height: 12px;
        border-radius: 999px;
        background: rgb(148 163 184 / 0.25);
      }

      .skeleton-line.short { width: 40%; }
      .skeleton-line.medium { width: 70%; }

      @keyframes shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }

      @media (max-width: 1279px) {
        .stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      }

      @media (max-width: 959px) {
        .content-grid { grid-template-columns: 1fr; }
      }

      @media (max-width: 599px) {
        .student-dashboard { padding: var(--space-lg); }
        .stats-grid, .loading-grid { grid-template-columns: 1fr; }
        .panel, .stat-card { padding: var(--space-lg); }
        .metric-block { align-items: flex-start; flex-direction: column; }
      }
    `,
  ],
})
export class StudentDashboardComponent {
  private readonly dashboardService = inject(DashboardService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly dashboard = signal<StudentDashboardData | null>(null);

  readonly userName = computed(() => this.authService.getCurrentUser()?.name ?? 'Student');

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading.set(true);
    this.error.set(null);

    this.dashboardService
      .getStudentDashboard()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => this.dashboard.set(response.dashboard),
        error: (error: HttpErrorResponse) => {
          this.error.set(this.mapError(error));
        },
      });
  }

  goToMentors(): void {
    void this.router.navigate(['/mentors']);
  }

  statsCards(data: StudentDashboardData): DashboardCard[] {
    return [
      { label: 'Total Bookings', value: data.totalBookings, icon: 'event', accent: 'primary' },
      { label: 'Upcoming Interviews', value: data.upcomingBookings, icon: 'schedule', accent: 'info' },
      { label: 'Completed Interviews', value: data.completedInterviews, icon: 'check_circle', accent: 'success' },
      { label: 'Cancelled Bookings', value: data.cancelledBookings, icon: 'cancel', accent: 'warning' },
    ];
  }

  hasFeedback(summary: StudentDashboardData['feedbackSummary']): boolean {
    return [
      summary.averageTechnicalRating,
      summary.averageCommunicationRating,
      summary.averageConfidenceRating,
    ].some((value) => Number(value) > 0);
  }

  private mapError(error: HttpErrorResponse): string {
    if (!error.status) return 'Unable to connect to the server. Please try again.';
    if (error.status === 401) return 'Your session has expired. Please log in again.';
    if (error.status === 403) return 'You do not have access to this dashboard.';
    if (error.status === 500) return 'Unable to load your dashboard. Please try again.';
    return 'Unable to load your dashboard. Please try again.';
  }
}
