import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, finalize, Subject } from 'rxjs';

import { Booking, BookingSlot } from '../../../../../core/models/booking.model';
import { BookingService } from '../../../../../core/services/booking.service';
import { EmptyStateComponent } from '../../../../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../../../shared/components/error-state/error-state.component';
import { LoadingSpinnerComponent } from '../../../../../shared/components/loading-spinner/loading-spinner.component';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../../../shared/components/status-badge/status-badge.component';

type InterviewFilter = 'all' | 'upcoming' | 'completed' | 'cancelled';

@Component({
  selector: 'app-mentor-interviews',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatButtonToggleModule,
    MatChipsModule,
    MatIconModule,
    MatPaginatorModule,
    MatTableModule,
    EmptyStateComponent,
    ErrorStateComponent,
    LoadingSpinnerComponent,
    PageHeaderComponent,
    StatusBadgeComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mentor-interviews.component.html',
  styleUrl: './mentor-interviews.component.scss',
})
export class MentorInterviewsComponent {
  private readonly bookingService = inject(BookingService);
  private readonly searchSubject = new Subject<string>();

  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly allBookings = signal<Booking[]>([]);
  readonly activeFilter = signal<InterviewFilter>('all');
  readonly searchTerm = signal('');
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly displayedColumns = ['student', 'date', 'time', 'status', 'payment', 'actions'];

  readonly filteredBookings = computed(() => {
    const filter = this.activeFilter();
    const term = this.searchTerm().trim().toLowerCase();

    return this.allBookings().filter((booking) => {
      const matchesFilter =
        filter === 'all' ||
        (filter === 'upcoming' && this.isUpcoming(booking)) ||
        booking.status === filter;

      if (!matchesFilter) return false;
      if (!term) return true;

      return `${this.studentName(booking)} ${booking._id} ${booking.status} ${booking.paymentStatus}`
        .toLowerCase()
        .includes(term);
    });
  });

  readonly pagedBookings = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.filteredBookings().slice(start, start + this.pageSize());
  });

  constructor() {
    this.searchSubject.pipe(debounceTime(200), distinctUntilChanged()).subscribe((term) => this.searchTerm.set(term));
    this.loadBookings();
  }

  loadBookings(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.bookingService.getMentorBookings().pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (bookings) => this.allBookings.set(bookings),
      error: (error: HttpErrorResponse) => {
        const message = error.status === 403 ? 'Only mentors can view interview bookings.' : 'Unable to load your interviews.';
        this.errorMessage.set(message);
      },
    });
  }

  setFilter(filter: InterviewFilter): void {
    this.activeFilter.set(filter);
    this.pageIndex.set(0);
  }

  setSearch(term: string): void {
    this.searchSubject.next(term.trim());
    this.pageIndex.set(0);
  }

  pageChanged(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  count(filter: InterviewFilter): number {
    return this.allBookings().filter((booking) => {
      if (filter === 'all') return true;
      if (filter === 'upcoming') return this.isUpcoming(booking);
      return booking.status === filter;
    }).length;
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

  formatDate(booking: Booking): string {
    const slot = this.slot(booking);
    if (!slot) return 'N/A';
    const [year, month, day] = slot.date.slice(0, 10).split('-').map(Number);
    return new Intl.DateTimeFormat(undefined, { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(year, month - 1, day));
  }

  timeRange(booking: Booking): string {
    const slot = this.slot(booking);
    if (!slot) return 'N/A';
    return `${this.formatTime(slot.startTime)} - ${this.formatTime(slot.endTime)}`;
  }

  emptyTitle(): string {
    if (this.searchTerm()) return 'No interviews match your search.';
    if (!this.allBookings().length) return 'No interviews yet.';
    if (this.activeFilter() === 'upcoming') return 'No upcoming interviews.';
    if (this.activeFilter() === 'completed') return 'No completed interviews.';
    if (this.activeFilter() === 'cancelled') return 'No cancelled interviews.';
    return 'No interviews found.';
  }

  emptyDescription(): string {
    if (this.searchTerm()) return 'Try a different student name, booking ID or status.';
    if (!this.allBookings().length) return 'Your booked interviews will appear here.';
    return 'No interviews are available in this view.';
  }

  private isUpcoming(booking: Booking): boolean {
    const slot = this.slot(booking);
    if (booking.status === 'cancelled' || booking.status === 'completed' || !slot) return false;

    const [year, month, day] = slot.date.slice(0, 10).split('-').map(Number);
    const [hours, minutes] = slot.startTime.split(':').map(Number);
    const start = new Date(year, month - 1, day, hours, minutes);
    return start.getTime() > Date.now();
  }

  private slot(booking: Booking): BookingSlot | null {
    return typeof booking.slotId === 'object' && booking.slotId !== null ? booking.slotId : null;
  }

  private formatTime(value: string): string {
    const [hours, minutes] = value.split(':').map(Number);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return value;
    const displayHour = hours % 12 || 12;
    const suffix = hours >= 12 ? 'PM' : 'AM';
    return `${displayHour}:${String(minutes).padStart(2, '0')} ${suffix}`;
  }
}
