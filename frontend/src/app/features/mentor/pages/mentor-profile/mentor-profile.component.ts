import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';

import { Mentor } from '../../../../core/models/mentor.model';
import { Slot } from '../../../../core/models/slot.model';
import { AuthService } from '../../../../core/services/auth.service';
import { MentorService } from '../../../../core/services/mentor.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../../shared/components/error-state/error-state.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { RatingComponent } from '../../../../shared/components/rating/rating.component';

interface GroupedSlotDay {
  label: string;
  key: string;
  slots: Slot[];
}

@Component({
  selector: 'app-mentor-profile',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    EmptyStateComponent,
    ErrorStateComponent,
    LoadingSpinnerComponent,
    RatingComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="mentor-profile-shell app-shell">
      @if (loading()) {
        <app-loading-spinner message="Loading mentor profile..." />
      } @else if (errorMessage()) {
        <section class="state-panel">
          <app-error-state
            title="Unable to load mentor details."
            [message]="errorMessage() ?? 'Please try again.'"
            [retryLabel]="isNotFound() ? 'Back to Mentors' : 'Retry'"
            (retry)="isNotFound() ? goToMentors() : reload()"
          />
        </section>
      } @else if (mentor(); as mentorData) {
        <div class="page-actions">
          <button mat-stroked-button type="button" routerLink="/mentors">Back to Mentors</button>
        </div>

        <div class="profile-layout">
          <section class="primary-column">
            <mat-card class="profile-card">
              <div class="profile-header">
                <div class="avatar" aria-hidden="true">
                  {{ mentorInitials(mentorData) }}
                </div>
                <div class="profile-copy">
                  <div class="title-row">
                    <h1>{{ mentorName(mentorData) }}</h1>
                    @if (mentorData.isVerified) {
                      <span class="verified-badge">
                        <mat-icon>check_circle</mat-icon>
                        Verified Mentor
                      </span>
                    }
                  </div>

                  <div class="tag-list">
                    @for (skill of mentorSkills(mentorData); track skill) {
                      <span class="expertise-tag">{{ skill }}</span>
                    }
                  </div>

                  <div class="stats-row">
                    <span><mat-icon>workspace_premium</mat-icon> {{ experienceLabel(mentorData) }}</span>
                    <span class="rating-inline"><mat-icon>star</mat-icon> <app-rating [rating]="mentorData.rating" [showValue]="true"></app-rating></span>
                    <span><mat-icon>payments</mat-icon> {{ formatPrice(mentorData.hourlyRate) }} / Mock Interview</span>
                  </div>
                </div>
              </div>

              <div class="cta-row">
                <button
                  mat-flat-button
                  color="primary"
                  type="button"
                  [disabled]="!selectedSlot()"
                  (click)="bookInterview()"
                >
                  Book Interview
                </button>
              </div>
            </mat-card>

            <mat-card class="content-card">
              <div class="section-heading">
                <h2>About Mentor</h2>
              </div>

              <p class="bio-text">{{ mentorBio(mentorData) }}</p>

              <div class="detail-grid">
                <div class="detail-item">
                  <span class="label">Expertise</span>
                  <div class="chip-wrap">
                    @for (skill of mentorSkills(mentorData); track skill) {
                      <span class="chip">{{ skill }}</span>
                    }
                  </div>
                </div>

                <div class="detail-item">
                  <span class="label">Experience</span>
                  <strong>{{ experienceLabel(mentorData) }}</strong>
                </div>

                <div class="detail-item">
                  <span class="label">Rating</span>
                  <app-rating [rating]="mentorData.rating" [showValue]="true"></app-rating>
                </div>

                <div class="detail-item">
                  <span class="label">Pricing</span>
                  <strong>{{ formatPrice(mentorData.hourlyRate) }} per mock interview</strong>
                </div>
              </div>
            </mat-card>
          </section>

          <aside class="secondary-column">
            <mat-card class="booking-card">
              <div class="section-heading booking-heading">
                <h2>Available Slots</h2>
              </div>

              @if (availableSlots().length) {
                <div class="slot-groups">
                  @for (group of groupedSlots(); track group.key) {
                    <div class="slot-group">
                      <h3>{{ group.label }}</h3>
                      <div class="slot-list">
                        @for (slot of group.slots; track slot._id) {
                          <button
                            type="button"
                            class="slot-button"
                            [class.selected]="selectedSlotId() === slot._id"
                            (click)="selectSlot(slot)"
                            [attr.aria-pressed]="selectedSlotId() === slot._id"
                          >
                            {{ formatTimeRange(slot) }}
                          </button>
                        }
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <app-empty-state
                  icon="event_busy"
                  title="No available slots at the moment."
                  description="Check back later for the next mock interview openings."
                />
              }
            </mat-card>
          </aside>
        </div>
      }
    </main>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .mentor-profile-shell {
        padding: var(--space-xl) 0 var(--space-4xl);
      }

      .page-actions {
        margin-bottom: var(--space-lg);
      }

      .profile-layout {
        display: grid;
        grid-template-columns: minmax(0, 1.7fr) minmax(300px, 0.9fr);
        gap: var(--space-xl);
        align-items: start;
      }

      .primary-column,
      .secondary-column {
        display: flex;
        flex-direction: column;
        gap: var(--space-xl);
      }

      .profile-card,
      .content-card,
      .booking-card {
        padding: var(--space-xl);
      }

      .profile-header {
        display: flex;
        gap: var(--space-xl);
        align-items: center;
      }

      .avatar {
        display: grid;
        place-items: center;
        width: 88px;
        height: 88px;
        border-radius: 50%;
        background: linear-gradient(135deg, var(--color-primary-600), var(--color-primary-300));
        color: white;
        font-size: var(--font-size-2xl);
        font-weight: var(--font-weight-bold);
        box-shadow: var(--shadow-sm);
      }

      .profile-copy {
        flex: 1;
        min-width: 0;
      }

      .title-row {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: var(--space-md);
        margin-bottom: var(--space-md);
      }

      h1 {
        margin: 0;
        font-size: clamp(2rem, 3vw, 2.6rem);
      }

      .verified-badge {
        display: inline-flex;
        align-items: center;
        gap: var(--space-xs);
        padding: 6px 12px;
        border-radius: 999px;
        background: var(--color-success-light);
        color: var(--color-success);
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-semibold);
      }

      .verified-badge mat-icon {
        width: 18px;
        height: 18px;
        font-size: 18px;
      }

      .tag-list,
      .chip-wrap {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-sm);
      }

      .expertise-tag,
      .chip {
        display: inline-flex;
        align-items: center;
        padding: 7px 12px;
        border-radius: 999px;
        background: var(--color-primary-light);
        color: var(--color-primary-700);
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-medium);
      }

      .stats-row {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-lg);
        margin-top: var(--space-lg);
        color: var(--color-text-secondary);
        font-size: var(--font-size-sm);
      }

      .stats-row span {
        display: inline-flex;
        align-items: center;
        gap: var(--space-xs);
      }

      .stats-row mat-icon {
        width: 18px;
        height: 18px;
        font-size: 18px;
      }

      .cta-row {
        margin-top: var(--space-xl);
      }

      .section-heading {
        margin-bottom: var(--space-lg);
      }

      .section-heading h2 {
        font-size: var(--font-size-2xl);
      }

      .bio-text {
        margin-bottom: var(--space-xl);
        font-size: var(--font-size-md);
        line-height: 1.7;
      }

      .detail-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: var(--space-lg);
      }

      .detail-item {
        display: flex;
        flex-direction: column;
        gap: var(--space-sm);
        padding: var(--space-lg);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-lg);
        background: var(--color-surface);
      }

      .label {
        color: var(--color-text-muted);
        font-size: var(--font-size-sm);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .booking-heading {
        margin-bottom: var(--space-lg);
      }

      .slot-groups {
        display: flex;
        flex-direction: column;
        gap: var(--space-lg);
      }

      .slot-group h3 {
        margin: 0 0 var(--space-sm);
        font-size: var(--font-size-lg);
      }

      .slot-list {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-sm);
      }

      .slot-button {
        min-height: 46px;
        padding: 0.75rem 1rem;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        background: var(--color-surface);
        color: var(--color-text-primary);
        font-weight: var(--font-weight-medium);
        cursor: pointer;
        transition: all 160ms ease;
      }

      .slot-button:hover,
      .slot-button:focus-visible {
        border-color: var(--color-primary);
        box-shadow: 0 0 0 3px rgb(79 70 229 / 0.12);
      }

      .slot-button.selected {
        border-color: var(--color-primary);
        background: var(--color-primary-light);
        color: var(--color-primary-700);
      }

      .state-panel {
        padding: var(--space-xl) 0;
      }

      @media (max-width: 959px) {
        .profile-layout {
          grid-template-columns: 1fr;
        }

        .profile-header {
          flex-direction: column;
          align-items: flex-start;
        }
      }

      @media (max-width: 599px) {
        .mentor-profile-shell {
          padding: var(--space-lg) 0 var(--space-3xl);
        }

        .profile-card,
        .content-card,
        .booking-card {
          padding: var(--space-lg);
        }

        .detail-grid {
          grid-template-columns: 1fr;
        }

        .stats-row {
          flex-direction: column;
          align-items: flex-start;
          gap: var(--space-sm);
        }
      }
    `,
  ],
})
export class MentorProfileComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly mentorService = inject(MentorService);
  private readonly authService = inject(AuthService);
  private readonly notification = inject(NotificationService);

  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly isNotFound = signal(false);
  readonly mentor = signal<Mentor | null>(null);
  readonly slots = signal<Slot[]>([]);
  readonly selectedSlotId = signal<string | null>(null);

  readonly selectedSlot = computed(() => this.slots().find((slot) => slot._id === this.selectedSlotId()) ?? null);
  readonly availableSlots = computed(() => this.slots());
  readonly groupedSlots = computed<GroupedSlotDay[]>(() => {
    const groups = new Map<string, GroupedSlotDay>();
    for (const slot of this.availableSlots()) {
      const dateKey = slot.date;
      const label = this.formatDateLabel(dateKey);
      const group = groups.get(dateKey) ?? { key: dateKey, label, slots: [] };
      group.slots.push(slot);
      groups.set(dateKey, group);
    }

    return Array.from(groups.values()).sort((a, b) => a.key.localeCompare(b.key));
  });

  ngOnInit(): void {
    this.loadMentorProfile();
  }

  reload(): void {
    this.loadMentorProfile();
  }

  bookInterview(): void {
    const slot = this.selectedSlot();
    if (!slot) {
      this.notification.error('Please select an available slot first.');
      return;
    }

    const user = this.authService.getCurrentUser();
    if (!user) {
      void this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    if (user.role !== 'student') {
      this.notification.error('Only students can book mock interviews.');
      return;
    }

    this.notification.success('Booking flow is ready for the next phase.');
  }

  goToMentors(): void {
    void this.router.navigate(['/mentors']);
  }

  selectSlot(slot: Slot): void {
    this.selectedSlotId.set(slot._id);
  }

  mentorName(mentor: Mentor): string {
    const user = typeof mentor.userId === 'object' && mentor.userId ? mentor.userId : null;
    return user?.name || 'Mentor';
  }

  mentorInitials(mentor: Mentor): string {
    const name = this.mentorName(mentor);
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }

  mentorSkills(mentor: Mentor): string[] {
    return Array.isArray(mentor.expertise) ? mentor.expertise : [];
  }

  mentorBio(mentor: Mentor): string {
    return mentor.bio?.trim() ? mentor.bio : 'This mentor has not added a bio yet.';
  }

  experienceLabel(mentor: Mentor): string {
    if (typeof mentor.experience !== 'number' || Number.isNaN(mentor.experience)) {
      return 'Not available';
    }
    return `${mentor.experience} ${mentor.experience === 1 ? 'Year' : 'Years'} Experience`;
  }

  ratingLabel(mentor: Mentor): string {
    if (typeof mentor.rating !== 'number' || Number.isNaN(mentor.rating)) {
      return 'Not available';
    }
    return `${mentor.rating.toFixed(1)} Rating`;
  }

  formatPrice(value: number | undefined | null): string {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return 'Not available';
    }

    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  }

  formatTimeRange(slot: Slot): string {
    return `${this.formatTime(slot.startTime)} - ${this.formatTime(slot.endTime)}`;
  }

  formatDateLabel(dateString: string): string {
    const date = new Date(`${dateString}T00:00:00`);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const sameDay = date.toDateString() === today.toDateString();
    const sameTomorrow = date.toDateString() === tomorrow.toDateString();

    if (sameDay) return 'Today';
    if (sameTomorrow) return 'Tomorrow';

    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      weekday: 'short',
    }).format(date);
  }

  private formatTime(value: string): string {
    if (!value) return 'Not available';

    const [hours, minutes] = value.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);

    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  }

  private loadMentorProfile(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.isNotFound.set(true);
      this.errorMessage.set('Mentor not found.');
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);
    this.isNotFound.set(false);
    this.selectedSlotId.set(null);

    forkJoin({
      mentor: this.mentorService.getMentorById(id),
      slots: this.mentorService.getAvailableSlots(),
    }).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: ({ mentor, slots }) => {
        const mentorRecord = mentor.mentor;
        this.mentor.set(mentorRecord);

        const mentorSlots = slots.slots.filter((slot) => {
          const slotMentorId = typeof slot.mentorId === 'string' ? slot.mentorId : slot.mentorId?._id;
          return slotMentorId === mentorRecord._id;
        });

        this.slots.set(mentorSlots);
      },
      error: (error: HttpErrorResponse) => {
        const message = this.resolveError(error);
        this.errorMessage.set(message);
        this.isNotFound.set(error.status === 404);
      },
    });
  }

  private resolveError(error: HttpErrorResponse): string {
    if (!error.status) {
      return 'Unable to connect to the server. Please try again.';
    }

    if (error.status === 404) {
      return 'Mentor not found.';
    }

    return 'Unable to load mentor details.';
  }
}
