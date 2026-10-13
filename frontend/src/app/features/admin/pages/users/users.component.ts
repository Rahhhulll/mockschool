import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
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

import { AuthService } from '../../../../core/services/auth.service';
import { ConfirmationDialogComponent, ConfirmationDialogData } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../../shared/components/error-state/error-state.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { SkeletonLoaderComponent } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';
import { NotificationService } from '../../../../shared/services/notification.service';
import { AdminService } from '../../services/admin.service';
import { AdminUser } from '../../models/admin-dashboard.model';

type UserRoleFilter = 'all' | 'student' | 'mentor' | 'admin';

@Component({
  selector: 'app-admin-users',
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
    SkeletonLoaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
})
export class UsersComponent {
  private readonly adminService = inject(AdminService);
  private readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly notification = inject(NotificationService);

  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly users = signal<AdminUser[]>([]);
  readonly totalItems = signal(0);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly searchTerm = signal('');
  readonly roleFilter = signal<UserRoleFilter>('all');
  readonly deletingIds = signal<ReadonlySet<string>>(new Set());
  readonly selectedUser = signal<AdminUser | null>(null);
  readonly detailsLoading = signal(false);

  readonly displayedColumns = ['name', 'email', 'role', 'joined', 'actions'];
  readonly roleOptions: ReadonlyArray<{ value: UserRoleFilter; label: string }> = [
    { value: 'all', label: 'All roles' },
    { value: 'student', label: 'Students' },
    { value: 'mentor', label: 'Mentors' },
    { value: 'admin', label: 'Admins' },
  ];

  private readonly reload$ = new Subject<void>();

  constructor() {
    this.reload$.pipe(
      debounceTime(300),
      switchMap(() => {
        this.loading.set(true);
        this.errorMessage.set(null);

        return this.adminService.getUsers({
          page: this.pageIndex() + 1,
          limit: this.pageSize(),
          search: this.searchTerm().trim(),
          role: this.roleFilter(),
        }).pipe(finalize(() => this.loading.set(false)));
      }),
    ).subscribe({
      next: (response) => {
        const result = response.data ?? response.users ?? [];
        this.users.set(result);
        this.totalItems.set(response.pagination?.totalItems ?? response.count ?? result.length);
      },
      error: () => {
        this.users.set([]);
        this.totalItems.set(0);
        this.errorMessage.set('Unable to load users. Please try again.');
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

  updateRole(value: UserRoleFilter): void {
    this.roleFilter.set(value);
    this.pageIndex.set(0);
    this.reload();
  }

  changePage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.reload();
  }

  viewUser(user: AdminUser): void {
    const userId = user._id ?? user.id ?? '';
    if (!userId) {
      return;
    }

    this.detailsLoading.set(true);
    this.adminService.getUserById(userId).pipe(finalize(() => this.detailsLoading.set(false))).subscribe({
      next: (response) => {
        this.selectedUser.set(response.data ?? response.user ?? user);
      },
      error: () => this.selectedUser.set(user),
    });
  }

  canDeleteUser(user: AdminUser): boolean {
    const currentUser = this.authService.getCurrentUser();
    const currentUserId = currentUser?.id ?? null;
    const targetUserId = user._id ?? user.id ?? null;
    return currentUserId !== null && targetUserId !== null && currentUserId !== targetUserId;
  }

  deleteUser(user: AdminUser): void {
    const userId = user._id ?? user.id ?? '';
    if (!userId || this.deletingIds().has(userId)) {
      return;
    }
    if (!this.canDeleteUser(user)) {
      this.notification.error('You cannot delete your own account.');
      return;
    }

    const data: ConfirmationDialogData = {
      title: 'Delete user?',
      message: `This will permanently remove ${user.name} from the system. This action cannot be undone.`,
      confirmLabel: 'Delete User',
      cancelLabel: 'Cancel',
      destructive: true,
    };

    this.dialog.open<ConfirmationDialogComponent, ConfirmationDialogData, boolean>(ConfirmationDialogComponent, {
      data,
      role: 'alertdialog',
      ariaLabelledBy: 'confirmation-dialog-title',
      ariaDescribedBy: 'confirmation-dialog-message',
    })
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed || this.deletingIds().has(userId)) {
          return;
        }

        this.deletingIds.update((ids) => new Set(ids).add(userId));
        this.adminService.deleteUser(userId).pipe(finalize(() => {
          this.deletingIds.update((ids) => {
            const next = new Set(ids);
            next.delete(userId);
            return next;
          });
        })).subscribe({
          next: () => {
            this.notification.success('User deleted successfully.');
            this.selectedUser.set(null);
            this.reload();
          },
          error: (error: HttpErrorResponse) => {
            if (error.status !== 401) {
              this.notification.error(error.status === 409
                ? 'A protection rule prevents deletion. The account may be the last admin or have related records.'
                : 'Unable to delete this user. Please try again.');
            }
          },
        });
      });
  }

  roleLabel(role: string): string {
    return role.charAt(0).toUpperCase() + role.slice(1);
  }

  dateValue(value?: string): string {
    if (!value) {
      return 'N/A';
    }
    return new Date(value).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }
}
