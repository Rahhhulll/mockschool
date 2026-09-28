import { CommonModule, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';

import { Booking, BookingMentor, BookingSlot } from '../../../../core/models/booking.model';
import { Feedback } from '../../../../core/models/feedback.model';
import { BookingService } from '../../../../core/services/booking.service';
import { FeedbackService } from '../../../../core/services/feedback.service';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../../shared/components/error-state/error-state.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { RatingComponent } from '../../../../shared/components/rating/rating.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-feedback-view',
  standalone: true,
  imports: [CommonModule, DatePipe, MatButtonModule, MatCardModule, MatIconModule, EmptyStateComponent, ErrorStateComponent, LoadingSpinnerComponent, PageHeaderComponent, RatingComponent, StatusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './feedback-view.component.html',
  styleUrls: ['./feedback-view.component.scss'],
})
export class FeedbackViewComponent {
  private readonly bookingService = inject(BookingService);
  private readonly feedbackService = inject(FeedbackService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly booking = signal<Booking | null>(null);
  readonly feedback = signal<Feedback | null>(null);
  readonly noFeedback = signal(false);

  constructor() {
    this.loadFeedback();
  }

  loadFeedback(): void {
    const bookingId = this.route.snapshot.paramMap.get('bookingId');
    if (!bookingId) {
      this.loading.set(false);
      this.errorMessage.set('Booking not found.');
      return;
    }
    this.loading.set(true);
    this.errorMessage.set(null);
    this.noFeedback.set(false);
    forkJoin({
      booking: this.bookingService.getBookingById(bookingId),
      feedback: this.feedbackService.getFeedbackByBooking(bookingId),
    }).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: ({ booking, feedback }) => {
        this.booking.set(booking);
        this.feedback.set(feedback.feedback);
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 404 && error.error?.message === 'Feedback not found') {
          this.noFeedback.set(true);
          return;
        }
        if (error.status === 404) this.errorMessage.set('Booking not found.');
        else if (error.status === 403) this.errorMessage.set('You do not have permission to view this feedback.');
        else this.errorMessage.set('Unable to load feedback.');
      },
    });
  }

  mentorName(booking: Booking): string {
    if (!this.isMentor(booking.mentorId)) return 'Mentor';
    const user = booking.mentorId.userId;
    return typeof user === 'object' && user.name ? user.name : 'Mentor';
  }

  slot(booking: Booking): BookingSlot | null {
    return this.isSlot(booking.slotId) ? booking.slotId : null;
  }

  timeRange(booking: Booking): string {
    const currentSlot = this.slot(booking);
    return currentSlot ? `${this.formatTime(currentSlot.startTime)} - ${this.formatTime(currentSlot.endTime)}` : 'N/A';
  }

  goToBooking(): void {
    const bookingId = this.route.snapshot.paramMap.get('bookingId');
    if (bookingId) void this.router.navigate(['/student/bookings', bookingId]);
  }

  private formatTime(value: string): string {
    const [hours, minutes] = value.split(':').map(Number);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return value;
    return `${hours % 12 || 12}:${String(minutes).padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`;
  }

  private isMentor(value: Booking['mentorId']): value is BookingMentor {
    return typeof value === 'object' && value !== null;
  }

  private isSlot(value: Booking['slotId']): value is BookingSlot {
    return typeof value === 'object' && value !== null;
  }
}
