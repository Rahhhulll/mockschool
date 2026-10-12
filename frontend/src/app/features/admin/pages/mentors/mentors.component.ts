import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { debounceTime, finalize, Subject, switchMap } from 'rxjs';

import { ConfirmationDialogComponent, ConfirmationDialogData } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../../shared/components/error-state/error-state.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { NotificationService } from '../../../../shared/services/notification.service';
import { AdminService } from '../../services/admin.service';
import { AdminMentor } from '../../models/admin-dashboard.model';

type MentorVerificationFilter = 'all' | 'verified' | 'pending';

@Component({
  selector: 'app-admin-mentors',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatChipsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTableModule,
    EmptyStateComponent,
    ErrorStateComponent,
    LoadingSpinnerComponent,
    PageHeaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mentors.component.html',
  styleUrl: './mentors.component.scss',
})
export class MentorsComponent {
  private readonly adminService = inject(AdminService);
  private readonly dialog = inject(MatDialog);
  private readonly notification = inject(NotificationService);

  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly mentors = signal<AdminMentor[]>([]);
  readonly totalItems = signal(0);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly searchTerm = signal('');
  readonly filter = signal<MentorVerificationFilter>('all');
  readonly selectedMentor = signal<AdminMentor | null>(null);
  readonly updatingId = signal<string | null>(null);
  readonly detailsLoading = signal(false);

  readonly displayedColumns = ['mentor', 'email', 'expertise', 'experience', 'hourlyRate', 'rating', 'status', 'actions'];
  readonly filterOptions: ReadonlyArray<{ value: MentorVerificationFilter; label: string }> = [
    { value: 'all', label: 'All mentors' },
    { value: 'verified', label: 'Verified' },
    { value: 'pending', label: 'Pending' },
  ];

  private readonly reload$ = new Subject<void>();

  constructor() {
    this.reload$.pipe(
      debounceTime(300),
      switchMap(() => {
        this.loading.set(true);
        this.errorMessage.set(null);

        return this.adminService.getMentors({
          page: this.pageIndex() + 1,
          limit: this.pageSize(),
          search: this.searchTerm().trim(),
          verificationStatus: this.filter(),
        }).pipe(finalize(() => this.loading.set(false)));
      }),
    ).subscribe({
      next: (response) => {
        const result = response.data ?? response.mentors ?? [];
        this.mentors.set(result);
        this.totalItems.set(response.pagination?.totalItems ?? response.count ?? result.length);
      },
      error: () => {
        this.mentors.set([]);
        this.totalItems.set(0);
        this.errorMessage.set('Unable to load mentors. Please try again.');
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

  updateFilter(value: MentorVerificationFilter): void {
    this.filter.set(value);
    this.pageIndex.set(0);
    this.reload();
  }

  pageChanged(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.reload();
  }

  viewMentor(mentor: AdminMentor): void {
    const mentorId = mentor._id;
    this.detailsLoading.set(true);
    this.adminService.getMentors({ page: 1, limit: 1, search: '', verificationStatus: 'all' }).pipe(finalize(() => this.detailsLoading.set(false))).subscribe({
      next: () => {
        this.selectedMentor.set(mentor);
      },
      error: () => this.selectedMentor.set(mentor),
    });
  }

  verifyMentor(mentor: AdminMentor, nextState: boolean): void {
    const mentorId = mentor._id;
    const actionLabel = nextState ? 'Verify Mentor' : 'Unverify Mentor';

    const data: ConfirmationDialogData = {
      title: actionLabel,
      message: nextState
        ? 'This mentor will be marked as verified and may become eligible for the public verified listing.'
        : 'This mentor will be marked as pending and may be removed from the public verified listing.',
      confirmLabel: actionLabel,
      cancelLabel: 'Cancel',
    };

    this.dialog.open<ConfirmationDialogComponent, ConfirmationDialogData, boolean>(ConfirmationDialogComponent, { data }).afterClosed().subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }

      this.updatingId.set(mentorId);
      this.adminService.verifyMentor(mentorId, nextState).pipe(finalize(() => this.updatingId.set(null))).subscribe({
        next: (response) => {
          const updatedMentor = response.data ?? response.mentor ?? mentor;
          this.mentors.update((items) => items.map((item) => item._id === updatedMentor._id ? { ...item, ...updatedMentor, isVerified: nextState } : item));
          this.selectedMentor.set(updatedMentor);
          this.notification.success(nextState ? 'Mentor verified successfully.' : 'Mentor unverified successfully.');
        },
        error: (error) => {
          const message = error?.error?.message ?? 'Unable to update mentor verification.';
          this.notification.error(message);
        },
      });
    });
  }

  mentorStatusLabel(value?: boolean): string {
    return value ? 'Verified' : 'Pending Verification';
  }

  mentorName(mentor: AdminMentor): string {
    return mentor.userId?.name ?? 'Unknown mentor';
  }

  mentorEmail(mentor: AdminMentor): string {
    return mentor.userId?.email ?? 'N/A';
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

  formatExperience(value?: number): string {
    return value === undefined || value === null ? 'N/A' : `${value} years`;
  }

  formatDate(value?: string): string {
    if (!value) {
      return 'N/A';
    }
    return new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
