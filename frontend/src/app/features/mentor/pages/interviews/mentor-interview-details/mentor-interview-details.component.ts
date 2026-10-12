import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { filter, finalize, switchMap } from 'rxjs';

import { Booking, BookingSlot } from '../../../../../core/models/booking.model';
import { Feedback } from '../../../../../core/models/feedback.model';
import { BookingService } from '../../../../../core/services/booking.service';
import { FeedbackService } from '../../../../../core/services/feedback.service';
import { ConfirmationDialogComponent, ConfirmationDialogData } from '../../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { ErrorStateComponent } from '../../../../../shared/components/error-state/error-state.component';
import { LoadingSpinnerComponent } from '../../../../../shared/components/loading-spinner/loading-spinner.component';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../../../shared/components/status-badge/status-badge.component';
import { NotificationService } from '../../../../../shared/services/notification.service';

@Component({
  selector: 'app-mentor-interview-details',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDialogModule,
    MatIconModule,
    ErrorStateComponent,
    LoadingSpinnerComponent,
    PageHeaderComponent,
    StatusBadgeComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mentor-interview-details.component.html',
  styleUrl: './mentor-interview-details.component.scss',
})
export class MentorInterviewDetailsComponent {
  private readonly bookingService = inject(BookingService);
  private readonly feedbackService = inject(FeedbackService);
  private readonly dialog = inject(MatDialog);
  private readonly notification = inject(NotificationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly booking = signal<Booking | null>(null);
  readonly feedback = signal<Feedback | null>(null);
  readonly showFeedback = signal(false);
  readonly completing = signal(false);

  constructor() {
    this.loadBooking();
  }

  loadBooking(): void {
    const bookingId = this.route.snapshot.paramMap.get('id');
    if (!bookingId) {
      this.loading.set(false);
      this.errorMessage.set('This interview could not be found.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);
    this.showFeedback.set(false);
    this.bookingService.getMentorBookings().pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (bookings) => {
        const currentBooking = bookings.find((booking) => booking._id === bookingId) ?? null;
        this.booking.set(currentBooking);

        if (currentBooking?.status === 'completed') {
          this.loadFeedback(bookingId);
        } else {
          this.feedback.set(null);
        }
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(this.loadErrorMessage(error));
      },
    });
  }

  studentName(booking: Booking): string {
    if (typeof booking.studentId === 'object' && booking.studentId !== null && typeof booking.studentId.name === 'string') {
      return booking.studentId.name;
    }
    return 'Student';
  }

  studentEmail(booking: Booking): string {
    if (typeof booking.studentId === 'object' && booking.studentId !== null && typeof booking.studentId.email === 'string') {
      return booking.studentId.email;
    }
    return 'Email unavailable';
  }

  slot(booking: Booking): BookingSlot | null {
    return typeof booking.slotId === 'object' && booking.slotId !== null ? booking.slotId : null;
  }

  formatDate(booking: Booking): string {
    const currentSlot = this.slot(booking);
    if (!currentSlot) return 'N/A';
    const [year, month, day] = currentSlot.date.slice(0, 10).split('-').map(Number);
    return new Intl.DateTimeFormat(undefined, { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(year, month - 1, day));
  }

  timeRange(booking: Booking): string {
    const currentSlot = this.slot(booking);
    if (!currentSlot) return 'N/A';
    return `${this.formatTime(currentSlot.startTime)} - ${this.formatTime(currentSlot.endTime)}`;
  }

  amountDisplay(booking: Booking): string {
    return `₹${(booking.amount ?? 0).toLocaleString('en-IN')}`;
  }

  canComplete(booking: Booking): boolean {
    return booking.status === 'confirmed' && !this.completing();
  }

  confirmCompletion(): void {
    const currentBooking = this.booking();
    if (!currentBooking || !this.canComplete(currentBooking)) return;

    const data: ConfirmationDialogData = {
      title: 'Complete Interview?',
      message: 'Are you sure you want to mark this interview as completed?',
      confirmLabel: 'Complete Interview',
      cancelLabel: 'Cancel',
    };

    this.dialog.open<ConfirmationDialogComponent, ConfirmationDialogData, boolean>(ConfirmationDialogComponent, { data }).afterClosed().pipe(
      filter((confirmed): confirmed is true => confirmed === true),
      switchMap(() => {
        this.completing.set(true);
        return this.bookingService.completeBooking(currentBooking._id).pipe(
          switchMap(() => this.bookingService.getMentorBookings()),
          finalize(() => this.completing.set(false)),
        );
      }),
    ).subscribe({
      next: (bookings) => {
        const refreshedBooking = bookings.find((booking) => booking._id === currentBooking._id) ?? null;
        this.booking.set(refreshedBooking ?? { ...currentBooking, status: 'completed' });
        this.notification.success('Interview marked as completed.');
        this.loadFeedback(currentBooking._id);
      },
      error: (error: HttpErrorResponse) => {
        const serverMessage = typeof error.error?.message === 'string' ? error.error.message : '';
        const lowerMessage = serverMessage.toLowerCase();

        if (lowerMessage.includes('already completed')) {
          this.notification.error('This interview has already been completed.');
          this.loadBooking();
          return;
        }

        if (lowerMessage.includes('cancelled')) {
          this.notification.error('This interview was cancelled.');
          this.loadBooking();
          return;
        }

        this.notification.error('Unable to complete the interview. Please try again.');
      },
    });
  }

  goToInterviews(): void {
    void this.router.navigate(['/mentor/interviews']);
  }

  goToDashboard(): void {
    void this.router.navigate(['/mentor/dashboard']);
  }

  private loadFeedback(bookingId: string): void {
    this.feedbackService.getFeedbackByBooking(bookingId).subscribe({
      next: (response) => this.feedback.set(response.feedback),
      error: (error: HttpErrorResponse) => {
        if (error.status !== 404) {
          this.notification.error('Unable to load feedback for this interview.');
        }
        this.feedback.set(null);
      },
    });
  }

  private formatTime(value: string): string {
    const [hours, minutes] = value.split(':').map(Number);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return value;
    const displayHour = hours % 12 || 12;
    const suffix = hours >= 12 ? 'PM' : 'AM';
    return `${displayHour}:${String(minutes).padStart(2, '0')} ${suffix}`;
  }

  private loadErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 403) return 'You do not have permission to view this interview.';
    if (error.status === 404) return 'This interview could not be found.';
    return 'Unable to load your interviews.';
  }
}
