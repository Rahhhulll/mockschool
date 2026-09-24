import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { Mentor } from '../../core/models/mentor.model';
import { MentorService } from '../../core/services/mentor.service';

@Component({
  selector: 'app-mentors',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatCardModule, MatChipsModule, MatIconModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="mentors app-shell">
      <header class="page-header">
        <div>
          <p class="eyebrow">Mentor matches</p>
          <h1>Find a Mentor</h1>
        </div>
        <a mat-stroked-button routerLink="/home">Back to Home</a>
      </header>

      @if (loading()) {
        <div class="loading-state">
          <mat-icon>hourglass_empty</mat-icon>
          <p>Loading mentors...</p>
        </div>
      } @else if (mentors().length) {
        <section class="mentor-grid">
          @for (mentor of mentors(); track mentor._id) {
            <mat-card class="mentor-card">
              <div class="header-row">
                <div class="avatar" aria-hidden="true">{{ initials(mentor) }}</div>
                <div class="meta">
                  <h2>{{ mentorName(mentor) }}</h2>
                  @if (mentor.isVerified) {
                    <span class="verified"><mat-icon>check_circle</mat-icon> Verified</span>
                  }
                </div>
              </div>

              <div class="chip-list">
                @for (skill of mentor.expertise; track skill) {
                  <span class="chip">{{ skill }}</span>
                }
              </div>

              <div class="details">
                <span><mat-icon>workspace_premium</mat-icon> {{ mentor.experience }}+ years</span>
                <span><mat-icon>star</mat-icon> {{ mentor.rating.toFixed(1) }}</span>
                <span><mat-icon>payments</mat-icon> ₹{{ mentor.hourlyRate }}</span>
              </div>

              <a mat-flat-button [routerLink]="['/mentors', mentor._id]">View Profile</a>
            </mat-card>
          }
        </section>
      } @else {
        <div class="empty-state">
          <mat-icon>groups</mat-icon>
          <h2>No mentors available yet.</h2>
          <p>Check back later for verified mentors.</p>
        </div>
      }
    </main>
  `,
  styles: [`
    .mentors { display: flex; flex-direction: column; gap: var(--space-2xl); padding: var(--space-2xl) 0 var(--space-4xl); }
    .page-header { display: flex; justify-content: space-between; align-items: center; gap: var(--space-lg); }
    .eyebrow { margin: 0 0 var(--space-sm); color: var(--color-primary-700); font-size: var(--font-size-sm); letter-spacing: .08em; font-weight: var(--font-weight-bold); text-transform: uppercase; }
    h1 { margin: 0; }
    .mentor-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--space-lg); }
    .mentor-card { padding: var(--space-xl); }
    .header-row { display: flex; align-items: center; gap: var(--space-md); margin-bottom: var(--space-lg); }
    .avatar { width: 56px; height: 56px; display: grid; place-items: center; border-radius: 50%; background: var(--color-primary-light); color: var(--color-primary-700); font-weight: var(--font-weight-bold); }
    .meta { flex: 1; }
    .meta h2 { margin: 0; font-size: var(--font-size-xl); }
    .verified { display: inline-flex; align-items: center; gap: 4px; margin-top: var(--space-xs); color: var(--color-success); font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold); }
    .verified mat-icon { width: 16px; height: 16px; font-size: 16px; }
    .chip-list { display: flex; flex-wrap: wrap; gap: var(--space-xs); margin-bottom: var(--space-lg); }
    .chip { display: inline-flex; padding: 6px 10px; border-radius: 999px; background: var(--color-primary-light); color: var(--color-primary-700); font-size: var(--font-size-xs); }
    .details { display: flex; flex-direction: column; gap: var(--space-sm); margin-bottom: var(--space-lg); color: var(--color-text-secondary); }
    .details span { display: inline-flex; align-items: center; gap: var(--space-xs); }
    .details mat-icon { width: 18px; height: 18px; font-size: 18px; }
    .loading-state, .empty-state { display: grid; place-items: center; gap: var(--space-md); min-height: 300px; text-align: center; }
    .loading-state mat-icon, .empty-state mat-icon { width: 56px; height: 56px; font-size: 56px; color: var(--color-primary); }
    @media (max-width: 599px) { .page-header { flex-direction: column; align-items: flex-start; } }
  `],
})
export class MentorsComponent {
  private readonly mentorService = inject(MentorService);
  readonly mentors = signal<Mentor[]>([]);
  readonly loading = signal(true);

  ngOnInit(): void {
    this.mentorService.getVerifiedMentors().pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (response) => this.mentors.set(response.mentors),
      error: () => this.mentors.set([]),
    });
  }

  mentorName(mentor: Mentor): string {
    const user = typeof mentor.userId === 'object' && mentor.userId ? mentor.userId : null;
    return user?.name || 'Mentor';
  }

  initials(mentor: Mentor): string {
    const name = this.mentorName(mentor);
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }
}
