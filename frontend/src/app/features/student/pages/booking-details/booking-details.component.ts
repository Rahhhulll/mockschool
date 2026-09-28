import { CommonModule, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { filter, finalize, switchMap } from 'rxjs';

import { Booking, BookingMentor, BookingSlot } from '../../../../core/models/booking.model';
import { BookingService } from '../../../../core/services/booking.service';
import { ConfirmationDialogComponent, ConfirmationDialogData } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { ErrorStateComponent } from '../../../../shared/components/error-state/error-state.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { NotificationService } from '../../../../shared/services/notification.service';

@Component({
  selector: 'app-booking-details',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink, MatButtonModule, MatCardModule, MatChipsModule, MatDialogModule, MatIconModule, ErrorStateComponent, LoadingSpinnerComponent, PageHeaderComponent, StatusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './booking-details.component.html',
  styleUrls: ['./booking-details.component.scss'],
})
export class BookingDetailsComponent {
  private readonly bookingService = inject(BookingService);
  private readonly dialog = inject(MatDialog);
  private readonly notification = inject(NotificationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly booking = signal<Booking | null>(null);
  readonly cancelling = signal(false);

  constructor() {
    this.loadBooking();
  }

  loadBooking(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.loading.set(false);
      this.errorMessage.set('This booking could not be found.');
      return;
    }
    this.loading.set(true);
    this.errorMessage.set(null);
    this.bookingService.getBookingById(id).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (booking) => this.booking.set(booking),
      error: (error: HttpErrorResponse) => this.errorMessage.set(this.loadErrorMessage(error)),
    });
  }

  studentName(booking: Booking): string {
    return this.userField(booking.studentId, 'name') || 'Student';
  }

  studentEmail(booking: Booking): string {
    return this.userField(booking.studentId, 'email') || 'Not available';
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
    const bookingSlot = this.slot(booking);
    return bookingSlot ? `${this.formatTime(bookingSlot.startTime)} - ${this.formatTime(bookingSlot.endTime)}` : 'N/A';
  }

  mentorExpertise(booking: Booking): string {
    return this.isMentor(booking.mentorId) ? booking.mentorId.expertise?.join(', ') || 'Not available' : 'Not available';
  }

  mentorExperience(booking: Booking): string {
    if (!this.isMentor(booking.mentorId) || booking.mentorId.experience === undefined) return 'Not available';
    return `${booking.mentorId.experience}+ years`;
  }

  mentorRating(booking: Booking): string {
    if (!this.isMentor(booking.mentorId) || booking.mentorId.rating === undefined) return 'Not available';
    return booking.mentorId.rating.toFixed(1);
  }

  isVerified(booking: Booking): boolean {
    return this.isMentor(booking.mentorId) && booking.mentorId.isVerified === true;
  }

  canCancel(booking: Booking): boolean {
    return booking.status === 'confirmed';
  }

  statusLabel(status: string): string {
    return status.replace(/[-_]/g, ' ');
  }

  goToBookings(): void {
    void this.router.navigate(['/student/bookings']);
  }

  confirmCancellation(): void {
    const currentBooking = this.booking();
    if (!currentBooking || !this.canCancel(currentBooking) || this.cancelling()) return;

    const data: ConfirmationDialogData = {
      title: 'Cancel Interview?',
      message: 'Are you sure you want to cancel this mock interview? Your slot will become available again after cancellation.',
      confirmLabel: 'Cancel Booking',
      cancelLabel: 'Keep Booking',
      destructive: true,
    };

    this.dialog.open<ConfirmationDialogComponent, ConfirmationDialogData, boolean>(ConfirmationDialogComponent, { data }).afterClosed().pipe(
      filter((confirmed): confirmed is true => confirmed === true),
      switchMap(() => {
        this.cancelling.set(true);
        const bookingId = currentBooking._id;
        return this.bookingService.cancelBooking(bookingId).pipe(
          switchMap(() => this.bookingService.getBookingById(bookingId)),
          finalize(() => this.cancelling.set(false)),
        );
      }),
    ).subscribe({
      next: (booking) => {
        this.booking.set(booking);
        this.notification.success('Booking cancelled successfully.');
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 400) this.loadBooking();
        this.notification.error('Unable to cancel booking. Please try again.');
      },
    });
  }

  private formatTime(value: string): string {
    const [hours, minutes] = value.split(':').map(Number);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return value;
    return `${hours % 12 || 12}:${String(minutes).padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`;
  }

  private userField(value: Booking['studentId'], field: 'name' | 'email'): string {
    return typeof value === 'object' && value !== null && typeof value[field] === 'string' ? value[field] : '';
  }

  private loadErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 404) return 'Booking not found.';
    if (error.status === 403) return 'You do not have permission to view this booking.';
    return 'Unable to load booking details.';
  }

  private isMentor(value: Booking['mentorId']): value is BookingMentor {
    return typeof value === 'object' && value !== null;
  }

  private isSlot(value: Booking['slotId']): value is BookingSlot {
    return typeof value === 'object' && value !== null;
  }
}
