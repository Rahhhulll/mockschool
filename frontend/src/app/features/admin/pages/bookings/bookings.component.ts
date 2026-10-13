import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { debounceTime, finalize, Subject, switchMap } from 'rxjs';

import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../../shared/components/error-state/error-state.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { SkeletonLoaderComponent } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';
import { AdminBooking, AdminBookingListResponse } from '../../models/admin-dashboard.model';
import { AdminService } from '../../services/admin.service';

type BookingStatusFilter = 'all' | 'confirmed' | 'completed' | 'cancelled';
type PaymentStatusFilter = 'all' | 'pending' | 'paid';

@Component({
  selector: 'app-admin-bookings',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatSelectModule,
    MatTableModule,
    EmptyStateComponent,
    ErrorStateComponent,
    PageHeaderComponent,
    SkeletonLoaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './bookings.component.html',
  styleUrl: './bookings.component.scss',
})
export class BookingsComponent {
  private readonly adminService = inject(AdminService);

  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly bookings = signal<AdminBooking[]>([]);
  readonly totalItems = signal(0);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly searchTerm = signal('');
  readonly bookingStatus = signal<BookingStatusFilter>('all');
  readonly paymentStatus = signal<PaymentStatusFilter>('all');
  readonly selectedBooking = signal<AdminBooking | null>(null);

  readonly displayedColumns = ['bookingId', 'student', 'mentor', 'date', 'time', 'amount', 'payment', 'bookingStatus', 'actions'];
  readonly bookingStatusOptions: ReadonlyArray<{ value: BookingStatusFilter; label: string }> = [
    { value: 'all', label: 'All statuses' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];
  readonly paymentStatusOptions: ReadonlyArray<{ value: PaymentStatusFilter; label: string }> = [
    { value: 'all', label: 'All payments' },
    { value: 'pending', label: 'Pending' },
    { value: 'paid', label: 'Paid' },
  ];

  private readonly reload$ = new Subject<void>();

  constructor() {
    this.reload$.pipe(
      debounceTime(300),
      switchMap(() => {
        this.loading.set(true);
        this.errorMessage.set(null);

        return this.adminService.getBookings({
          page: this.pageIndex() + 1,
          limit: this.pageSize(),
          search: this.searchTerm().trim(),
          status: this.bookingStatus(),
          paymentStatus: this.paymentStatus(),
        }).pipe(finalize(() => this.loading.set(false)));
      }),
    ).subscribe({
      next: (response: AdminBookingListResponse) => {
        const result = response.data ?? response.bookings ?? [];
        this.bookings.set(result);
        this.totalItems.set(response.pagination?.totalItems ?? response.count ?? result.length);
      },
      error: () => {
        this.bookings.set([]);
        this.totalItems.set(0);
        this.errorMessage.set('Unable to load bookings. Please try again.');
      },
    });

    this.reload$.next();
  }

  reload(): void {
    this.reload$.next();
  }

  updateSearch(value: string): void {
    this.searchTerm.set(value);
    this.pageIndex.set(0);
    this.reload();
  }

  updateStatus(value: BookingStatusFilter): void {
    this.bookingStatus.set(value);
    this.pageIndex.set(0);
    this.reload();
  }

  updatePaymentStatus(value: PaymentStatusFilter): void {
    this.paymentStatus.set(value);
    this.pageIndex.set(0);
    this.reload();
  }

  changePage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.reload();
  }

  viewDetails(booking: AdminBooking): void {
    this.selectedBooking.set(booking);
  }

  studentName(booking: AdminBooking): string {
    const student = booking.studentId;
    if (typeof student === 'object' && student && 'name' in student) {
      return student.name ?? 'Unknown student';
    }
    return 'Unknown student';
  }

  mentorName(booking: AdminBooking): string {
    const mentor = booking.mentorId;
    if (typeof mentor === 'object' && mentor && 'userId' in mentor) {
      return mentor.userId?.name ?? 'Unknown mentor';
    }
    return 'Unknown mentor';
  }

  bookingIdLabel(booking: AdminBooking): string {
    return booking._id?.slice(0, 8) ?? 'N/A';
  }

  slotDate(booking: AdminBooking): string {
    const slot = typeof booking.slotId === 'object' && booking.slotId ? booking.slotId : null;
    const dateValue = slot && 'date' in slot ? slot.date : undefined;
    if (!dateValue) return 'N/A';
    return new Date(dateValue).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  timeValue(booking: AdminBooking): string {
    const slot = typeof booking.slotId === 'object' && booking.slotId ? booking.slotId : null;
    if (slot && 'startTime' in slot && 'endTime' in slot) {
      return `${slot.startTime ?? 'N/A'} - ${slot.endTime ?? 'N/A'}`;
    }
    return 'N/A';
  }

  bookingStatusLabel(status?: string): string {
    if (!status) return 'Unknown';
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  paymentStatusLabel(status?: string): string {
    if (!status) return 'Unknown';
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  formatCurrency(value?: number): string {
    if (value === undefined || value === null || Number.isNaN(value)) {
      return '₹0';
    }
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  }
}
