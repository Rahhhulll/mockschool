import { CommonModule, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { Booking, BookingMentor, BookingSlot } from '../../../../core/models/booking.model';
import { FeedbackService } from '../../../../core/services/feedback.service';
import { BookingService } from '../../../../core/services/booking.service';
import { ErrorStateComponent } from '../../../../shared/components/error-state/error-state.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { RatingComponent } from '../../../../shared/components/rating/rating.component';
import { NotificationService } from '../../../../shared/services/notification.service';

@Component({
  selector: 'app-feedback-form',
  standalone: true,
  imports: [CommonModule, DatePipe, ReactiveFormsModule, RouterLink, MatButtonModule, MatCardModule, MatIconModule, ErrorStateComponent, LoadingSpinnerComponent, PageHeaderComponent, RatingComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './feedback-form.component.html',
  styleUrls: ['./feedback-form.component.scss'],
})
export class FeedbackFormComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly bookingService = inject(BookingService);
  private readonly feedbackService = inject(FeedbackService);
  private readonly notification = inject(NotificationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly booking = signal<Booking | null>(null);
  readonly feedbackForm = this.formBuilder.nonNullable.group({
    technicalRating: [0, [Validators.required, Validators.min(1), Validators.max(5)]],
    communicationRating: [0, [Validators.required, Validators.min(1), Validators.max(5)]],
    confidenceRating: [0, [Validators.required, Validators.min(1), Validators.max(5)]],
    strengths: ['', [Validators.required, Validators.minLength(2)]],
    weaknesses: ['', [Validators.required, Validators.minLength(2)]],
    overallFeedback: ['', [Validators.required, Validators.minLength(2)]],
  });

  constructor() {
    this.loadContext();
  }

  loadContext(): void {
    const bookingId = this.route.snapshot.paramMap.get('bookingId');
    if (!bookingId) {
      this.loading.set(false);
      this.errorMessage.set('Booking not found.');
      return;
    }
    this.loading.set(true);
    this.errorMessage.set(null);
    this.bookingService.getBookingById(bookingId).pipe(
      finalize(() => this.loading.set(false)),
    ).subscribe({
      next: (booking) => {
        this.booking.set(booking);
        if (booking.status !== 'completed') return;
        this.feedbackService.getFeedbackByBooking(bookingId).subscribe({
          next: () => void this.router.navigate(['/student/bookings', bookingId, 'feedback', 'view']),
          error: (error: HttpErrorResponse) => {
            if (error.status !== 404) this.errorMessage.set('Unable to check existing feedback.');
          },
        });
      },
      error: (error: HttpErrorResponse) => this.errorMessage.set(error.status === 404 ? 'Booking not found.' : 'Unable to load booking details.'),
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

  setRating(field: 'technicalRating' | 'communicationRating' | 'confidenceRating', value: number): void {
    this.feedbackForm.controls[field].setValue(value);
    this.feedbackForm.controls[field].markAsTouched();
  }

  isInvalid(field: keyof typeof this.feedbackForm.controls): boolean {
    const control = this.feedbackForm.controls[field];
    return control.invalid && (control.touched || this.submitting());
  }

  submit(): void {
    const bookingId = this.route.snapshot.paramMap.get('bookingId');
    if (!bookingId || this.submitting()) return;
    this.feedbackForm.markAllAsTouched();
    if (this.feedbackForm.invalid || this.booking()?.status !== 'completed') return;

    this.submitting.set(true);
    this.feedbackService.createFeedback({ bookingId, ...this.feedbackForm.getRawValue() }).pipe(finalize(() => this.submitting.set(false))).subscribe({
      next: () => {
        this.notification.success('Feedback submitted successfully.');
        void this.router.navigate(['/student/bookings', bookingId, 'feedback', 'view']);
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 409) {
          void this.router.navigate(['/student/bookings', bookingId, 'feedback', 'view']);
          return;
        }
        this.notification.error(error.status === 400 ? 'Please check your feedback and try again.' : 'Unable to submit feedback. Please try again.');
      },
    });
  }

  goToBookings(): void {
    void this.router.navigate(['/student/bookings']);
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
