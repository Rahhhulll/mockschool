import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { Router, RouterLink } from '@angular/router';
import { finalize, filter, switchMap } from 'rxjs';

import { Booking, BookingMentor, BookingSlot, BookingStatus } from '../../../../core/models/booking.model';
import { BookingService } from '../../../../core/services/booking.service';
import { ConfirmationDialogComponent, ConfirmationDialogData } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../../shared/components/error-state/error-state.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { NotificationService } from '../../../../shared/services/notification.service';

type BookingFilter = 'all' | 'upcoming' | 'completed' | 'cancelled';

@Component({
  selector: 'app-bookings',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDialogModule,
    MatIconModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatTableModule,
    EmptyStateComponent,
    ErrorStateComponent,
    PageHeaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './bookings.component.html',
  styleUrls: ['./bookings.component.scss'],
})
export class BookingsComponent {
  private readonly bookingService = inject(BookingService);
  private readonly dialog = inject(MatDialog);
  private readonly notification = inject(NotificationService);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly allBookings = signal<Booking[]>([]);
  readonly activeFilter = signal<BookingFilter>('all');
  readonly searchTerm = signal('');
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly cancellingId = signal<string | null>(null);
  readonly displayedColumns = ['mentor', 'date', 'time', 'amount', 'payment', 'status', 'actions'];
  readonly filterOptions: ReadonlyArray<{ value: BookingFilter; label: string }> = [
    { value: 'all', label: 'All' },
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  readonly filteredBookings = computed(() => {
    const filter = this.activeFilter();
    const term = this.searchTerm().trim().toLowerCase();
    return this.allBookings().filter((booking) => {
      const matchesFilter = filter === 'all'
        || (filter === 'upcoming' && this.isUpcoming(booking))
        || booking.status === filter;
      if (!matchesFilter) return false;
      if (!term) return true;
      return `${this.mentorName(booking)} ${booking._id} ${booking.status} ${booking.paymentStatus}`.toLowerCase().includes(term);
    });
  });

  readonly pagedBookings = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.filteredBookings().slice(start, start + this.pageSize());
  });

  constructor() {
    this.loadBookings();
  }

  loadBookings(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.bookingService.getMyBookings().pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (bookings) => this.allBookings.set(bookings),
      error: () => this.errorMessage.set('Please try again in a moment.'),
    });
  }

  setFilter(filter: BookingFilter): void {
    this.activeFilter.set(filter);
    this.pageIndex.set(0);
  }

  setSearch(term: string): void {
    this.searchTerm.set(term);
    this.pageIndex.set(0);
  }

  clearSearch(): void {
    this.setSearch('');
  }

  pageChanged(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  countFor(filter: BookingFilter): number {
    return this.allBookings().filter((booking) => filter === 'all' || (filter === 'upcoming' && this.isUpcoming(booking)) || booking.status === filter).length;
  }

  emptyTitle(): string {
    if (this.searchTerm()) return 'No matching bookings';
    if (!this.allBookings().length) return 'No bookings yet';
    if (this.activeFilter() === 'upcoming') return 'No upcoming interviews';
    if (this.activeFilter() === 'completed') return 'No completed interviews yet';
    if (this.activeFilter() === 'cancelled') return 'No cancelled bookings';
    return 'No bookings found';
  }

  emptyDescription(): string {
    if (this.searchTerm()) return 'Try a different mentor name, booking ID or status.';
    if (!this.allBookings().length) return 'Book your first mock interview with a verified mentor.';
    return 'There are no bookings in this view.';
  }

  mentorName(booking: Booking): string {
    if (!this.isMentor(booking.mentorId)) return 'Mentor';
    const user = booking.mentorId.userId;
    return typeof user === 'object' && user.name ? user.name : 'Mentor';
  }

  mentorExpertise(booking: Booking): string {
    return this.isMentor(booking.mentorId) ? booking.mentorId.expertise?.join(', ') ?? '' : '';
  }

  slot(booking: Booking): BookingSlot | null {
    return this.isSlot(booking.slotId) ? booking.slotId : null;
  }

  timeRange(booking: Booking): string {
    const bookingSlot = this.slot(booking);
    return bookingSlot ? `${this.formatTime(bookingSlot.startTime)} - ${this.formatTime(bookingSlot.endTime)}` : 'N/A';
  }

  amount(booking: Booking): string {
    return booking.amount === undefined ? 'N/A' : `₹${booking.amount}`;
  }

  statusLabel(status: string): string {
    return status.replace(/[-_]/g, ' ');
  }

  statusTone(status: string): string {
    if (status === 'paid' || status === 'confirmed' || status === 'completed') return 'success';
    if (status === 'pending') return 'warning';
    if (status === 'cancelled') return 'error';
    return 'neutral';
  }

  canCancel(booking: Booking): boolean {
    return booking.status === 'confirmed' && this.isUpcoming(booking);
  }

  confirmCancellation(booking: Booking): void {
    const data: ConfirmationDialogData = {
      title: 'Cancel Interview?',
      message: 'Are you sure you want to cancel this booking?',
      confirmLabel: 'Cancel Booking',
      cancelLabel: 'Keep Booking',
      destructive: true,
    };
    this.dialog.open<ConfirmationDialogComponent, ConfirmationDialogData, boolean>(ConfirmationDialogComponent, { data }).afterClosed().pipe(
      filter((confirmed): confirmed is true => confirmed === true),
      switchMap(() => {
        this.cancellingId.set(booking._id);
        return this.bookingService.cancelBooking(booking._id).pipe(finalize(() => this.cancellingId.set(null)));
      }),
    ).subscribe({
      next: () => {
        this.allBookings.update((bookings) => bookings.map((item) => item._id === booking._id ? { ...item, status: 'cancelled' as BookingStatus } : item));
        this.notification.success('Booking cancelled successfully.');
      },
      error: () => this.notification.error('Unable to cancel this booking. Please try again.'),
    });
  }

  goToMentors(): void {
    void this.router.navigate(['/mentors']);
  }

  trackBooking(_: number, booking: Booking): string {
    return booking._id;
  }

  private isUpcoming(booking: Booking): boolean {
    const bookingSlot = this.slot(booking);
    if (booking.status === 'cancelled' || !bookingSlot) return false;
    const date = bookingSlot.date.slice(0, 10);
    return Date.parse(`${date}T${bookingSlot.startTime}:00Z`) > Date.now();
  }

  private formatTime(value: string): string {
    const [hours, minutes] = value.split(':').map(Number);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return value;
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours % 12 || 12;
    return `${displayHour}:${String(minutes).padStart(2, '0')} ${period}`;
  }

  private isMentor(value: Booking['mentorId']): value is BookingMentor {
    return typeof value === 'object' && value !== null;
  }

  private isSlot(value: Booking['slotId']): value is BookingSlot {
    return typeof value === 'object' && value !== null;
  }
}
