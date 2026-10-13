import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink } from '@angular/router';
import { filter, finalize, switchMap } from 'rxjs';

import { Slot } from '../../../../../core/models/slot.model';
import { SlotService } from '../../../../../core/services/slot.service';
import { ConfirmationDialogComponent, ConfirmationDialogData } from '../../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { EmptyStateComponent } from '../../../../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../../../shared/components/error-state/error-state.component';
import { LoadingSpinnerComponent } from '../../../../../shared/components/loading-spinner/loading-spinner.component';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { NotificationService } from '../../../../../shared/services/notification.service';

type SlotFilter = 'all' | 'available' | 'booked';

@Component({
  selector: 'app-my-slots',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatButtonToggleModule, MatChipsModule, MatDialogModule, MatIconModule, MatPaginatorModule, MatTableModule, MatTooltipModule, EmptyStateComponent, ErrorStateComponent, LoadingSpinnerComponent, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './my-slots.component.html',
  styleUrl: './my-slots.component.scss',
})
export class MySlotsComponent {
  private readonly slotService = inject(SlotService);
  private readonly dialog = inject(MatDialog);
  private readonly notification = inject(NotificationService);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly errorMessage = signal('');
  readonly slots = signal<Slot[]>([]);
  readonly filter = signal<SlotFilter>('all');
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly deletingIds = signal<ReadonlySet<string>>(new Set());
  readonly displayedColumns = ['date', 'startTime', 'endTime', 'duration', 'status', 'actions'];
  readonly visibleSlots = computed(() => {
    const filter = this.filter();
    return this.slots().filter((slot) => filter === 'all' || (filter === 'booked' ? slot.isBooked : !slot.isBooked));
  });
  readonly pagedSlots = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.visibleSlots().slice(start, start + this.pageSize());
  });

  constructor() {
    this.loadSlots();
  }

  loadSlots(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.slotService.getMySlots().pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (slots) => this.slots.set([...slots].sort((a, b) => this.slotSortKey(a).localeCompare(this.slotSortKey(b)))),
      error: (error: HttpErrorResponse) => this.errorMessage.set(error.status === 403 ? 'Only mentors can view their interview slots.' : 'Unable to load your slots.'),
    });
  }

  setFilter(value: SlotFilter): void {
    this.filter.set(value);
    this.pageIndex.set(0);
  }

  pageChanged(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  navigateToCreate(): void {
    void this.router.navigate(['/mentor/slots/create']);
  }

  count(filter: SlotFilter): number {
    return this.slots().filter((slot) => filter === 'all' || (filter === 'booked' ? slot.isBooked : !slot.isBooked)).length;
  }

  formatDate(value: string): string {
    const [year, month, day] = value.slice(0, 10).split('-').map(Number);
    return new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(year, month - 1, day));
  }

  formatTime(value: string): string {
    const [hours, minutes] = value.split(':').map(Number);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return value;
    return `${hours % 12 || 12}:${String(minutes).padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`;
  }

  duration(slot: Slot): number {
    const [startHour, startMinute] = slot.startTime.split(':').map(Number);
    const [endHour, endMinute] = slot.endTime.split(':').map(Number);
    return endHour * 60 + endMinute - startHour * 60 - startMinute;
  }

  confirmDelete(slot: Slot): void {
    if (this.deletingIds().has(slot._id)) return;

    const data: ConfirmationDialogData = {
      title: 'Delete Slot?',
      message: `Delete the interview slot on ${this.formatDate(slot.date)} from ${this.formatTime(slot.startTime)} to ${this.formatTime(slot.endTime)}? Booked slots cannot be deleted.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      destructive: true,
    };
    this.dialog.open<ConfirmationDialogComponent, ConfirmationDialogData, boolean>(ConfirmationDialogComponent, {
      data,
      role: 'alertdialog',
      ariaLabelledBy: 'confirmation-dialog-title',
      ariaDescribedBy: 'confirmation-dialog-message',
    }).afterClosed().pipe(
      filter((confirmed): confirmed is true => confirmed === true && !this.deletingIds().has(slot._id)),
      switchMap(() => {
        this.deletingIds.update((ids) => new Set(ids).add(slot._id));
        return this.slotService.deleteSlot(slot._id).pipe(finalize(() => {
          this.deletingIds.update((ids) => {
            const next = new Set(ids);
            next.delete(slot._id);
            return next;
          });
        }));
      }),
    ).subscribe({
      next: () => {
        this.notification.success('Slot deleted successfully.');
        this.loadSlots();
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 404) {
          this.notification.error('This slot has already been booked and cannot be deleted.');
          this.loadSlots();
        } else if (error.status === 401) {
          return;
        } else if (error.status === 403) {
          this.notification.error('Only mentors can delete interview slots.');
        } else {
          this.notification.error('Unable to delete this slot. Please try again.');
        }
      },
    });
  }

  private slotSortKey(slot: Slot): string {
    return `${slot.date.slice(0, 10)}T${slot.startTime}`;
  }
}