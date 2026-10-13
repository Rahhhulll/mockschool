import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
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
import { AdminFeedback, AdminFeedbackResponse, AdminFeedbackSummary } from '../../models/admin-dashboard.model';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-admin-feedback',
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
    MatSelectModule,
    MatTableModule,
    EmptyStateComponent,
    ErrorStateComponent,
    PageHeaderComponent,
    SkeletonLoaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './feedback.component.html',
  styleUrl: './feedback.component.scss',
})
export class FeedbackComponent {
  private readonly adminService = inject(AdminService);
  private readonly dialog = inject(MatDialog);

  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly feedback = signal<AdminFeedback[]>([]);
  readonly summary = signal<AdminFeedbackSummary>({
    totalFeedback: 0,
    averageTechnicalRating: null,
    averageCommunicationRating: null,
    averageConfidenceRating: null,
    overallAverageRating: null,
  });
  readonly totalItems = signal(0);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly searchTerm = signal('');
  readonly ratingFilter = signal<string>('all');
  readonly detailsLoading = signal(false);
  readonly selectedFeedback = signal<AdminFeedback | null>(null);

  readonly displayedColumns = ['student', 'mentor', 'technical', 'communication', 'confidence', 'feedback', 'date', 'actions'];
  readonly ratingOptions: ReadonlyArray<{ value: string; label: string }> = [
    { value: 'all', label: 'All ratings' },
    { value: '1', label: '1 / 5' },
    { value: '2', label: '2 / 5' },
    { value: '3', label: '3 / 5' },
    { value: '4', label: '4 / 5' },
    { value: '5', label: '5 / 5' },
  ];

  private readonly reload$ = new Subject<void>();

  constructor() {
    this.reload$.pipe(
      debounceTime(300),
      switchMap(() => {
        this.loading.set(true);
        this.errorMessage.set(null);
        return this.adminService.getFeedback({
          page: this.pageIndex() + 1,
          limit: this.pageSize(),
          search: this.searchTerm().trim(),
          rating: this.ratingFilter(),
        }).pipe(finalize(() => this.loading.set(false)));
      }),
    ).subscribe({
      next: (response: AdminFeedbackResponse) => {
        const result = response.data ?? [];
        this.feedback.set(result);
        this.totalItems.set(response.pagination?.totalItems ?? result.length);
        this.summary.set(response.summary ?? {
          totalFeedback: 0,
          averageTechnicalRating: null,
          averageCommunicationRating: null,
          averageConfidenceRating: null,
          overallAverageRating: null,
        });
      },
      error: () => {
        this.feedback.set([]);
        this.totalItems.set(0);
        this.errorMessage.set('Unable to load feedback. Please try again.');
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

  updateRating(value: string): void {
    this.ratingFilter.set(value);
    this.pageIndex.set(0);
    this.reload();
  }

  pageChanged(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.reload();
  }

  openDetails(item: AdminFeedback): void {
    this.selectedFeedback.set(item);
  }

  studentName(item: AdminFeedback): string {
    const student = typeof item.studentId === 'object' && item.studentId ? item.studentId : null;
    return student?.name ?? 'Unknown student';
  }

  mentorName(item: AdminFeedback): string {
    const mentor = typeof item.mentorId === 'object' && item.mentorId ? item.mentorId : null;
    return mentor?.userId?.name ?? 'Unknown mentor';
  }

  bookingId(item: AdminFeedback): string {
    if (typeof item.bookingId === 'object' && item.bookingId && item.bookingId._id) {
      return item.bookingId._id;
    }
    return typeof item.bookingId === 'string' ? item.bookingId : 'N/A';
  }

  summaryCard(label: string, value: number | null): string {
    return value === null ? 'N/A' : `${value.toFixed(1)} / 5`;
  }

  formatDate(value?: string): string {
    if (!value) {
      return 'N/A';
    }
    return new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  truncate(text?: string): string {
    if (!text) {
      return 'N/A';
    }
    return text.length > 120 ? `${text.slice(0, 120)}…` : text;
  }
}
