import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

import { FooterComponent } from '../../shared/components/footer/footer.component';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { MentorService } from '../../core/services/mentor.service';
import { Mentor } from '../../core/models/mentor.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [MatButtonModule, MatCardModule, MatChipsModule, MatExpansionModule, MatIconModule, RouterLink, NavbarComponent, FooterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-navbar [publicNavigation]="true"></app-navbar>
    <main>
      <section class="hero app-shell">
        <div class="hero-copy">
          <p class="eyebrow">MockSchool</p>
          <h1>Practice Before You Face the Interview</h1>
          <p class="lead">Practice live mock interviews with verified professionals and get actionable feedback before your real interview.</p>
          <div class="actions">
            <a mat-flat-button routerLink="/mentors">Find a Mentor</a>
            <a mat-stroked-button routerLink="/register">Become a Mentor</a>
          </div>
        </div>
        <mat-card class="interview-visual" aria-label="Mock interview journey">
          <div class="visual-header"><mat-icon>videocam</mat-icon><span>Mock interview session</span><span class="live">Ready</span></div>
          @for (step of journey; track step.title; let last = $last) {
            <div class="journey-step"><span class="step-icon"><mat-icon>{{ step.icon }}</mat-icon></span><span>{{ step.title }}</span>@if (!last) { <mat-icon class="connector">arrow_downward</mat-icon> }</div>
          }
        </mat-card>
      </section>

      <section class="section app-shell" id="how-it-works">
        <div class="section-heading"><p class="eyebrow">A simple path to confidence</p><h2>How MockSchool Works</h2></div>
        <div class="step-grid">
          @for (step of howItWorks; track step.title) { <mat-card class="info-card"><mat-icon>{{ step.icon }}</mat-icon><h3>{{ step.title }}</h3><p>{{ step.description }}</p></mat-card> }
        </div>
      </section>

      <section class="section tinted">
        <div class="app-shell">
          <div class="section-heading"><p class="eyebrow">Built for progress</p><h2>Why Students Choose MockSchool</h2></div>
          <div class="benefit-grid">
            @for (benefit of studentBenefits; track benefit.title) { <div class="benefit"><mat-icon>{{ benefit.icon }}</mat-icon><div><h3>{{ benefit.title }}</h3><p>{{ benefit.description }}</p></div></div> }
          </div>
        </div>
      </section>

      <section class="section mentor-section app-shell">
        <div><p class="eyebrow">Make an impact</p><h2>Share Your Experience. Help Someone Grow.</h2><p>Use your professional experience to help candidates practice deliberately and build confidence.</p><a mat-flat-button routerLink="/register">Become a Mentor</a></div>
        <div class="mentor-benefits">@for (item of mentorBenefits; track item) { <div><mat-icon>check_circle</mat-icon><span>{{ item }}</span></div> }</div>
      </section>

      <section class="section app-shell">
        <div class="section-heading"><p class="eyebrow">Prepare with purpose</p><h2>Popular Interview Skills</h2></div>
        <mat-chip-listbox aria-label="Popular interview skills">@for (skill of skills; track skill) { <mat-chip-option [routerLink]="['/mentors']" [queryParams]="{ skill }">{{ skill }}</mat-chip-option> }</mat-chip-listbox>
      </section>

      <section class="section tinted">
        <div class="app-shell">
          <div class="section-heading"><p class="eyebrow">Explore the community</p><h2>Featured Mentors</h2><p>Verified mentor profiles will appear here as they become available.</p></div>
          @if (mentorLoading()) { <div class="mentor-state"><mat-icon>hourglass_empty</mat-icon><p>Loading verified mentors...</p></div> }
          @else if (mentorError()) { <div class="mentor-state"><mat-icon>error_outline</mat-icon><p>Verified mentors are temporarily unavailable.</p><a mat-stroked-button routerLink="/mentors">Try Mentor Search</a></div> }
          @else if (mentors().length) { <div class="mentor-cards">@for (mentor of mentors(); track mentor._id) { <mat-card class="mentor-card"><mat-icon>person</mat-icon><h3>{{ mentorName(mentor) }}</h3><p>{{ mentor.expertise.join(', ') }}</p><a mat-stroked-button routerLink="/mentors">View Mentor</a></mat-card> }</div> }
          @else { <div class="mentor-state"><mat-icon>groups</mat-icon><p>Browse mentors to find the right match for your next practice session.</p><a mat-stroked-button routerLink="/mentors">View All Mentors</a></div> }
        </div>
      </section>

      <section class="section app-shell">
        <div class="section-heading"><p class="eyebrow">Flexible practice</p><h2>Simple, Affordable Mock Interviews</h2><p>Indicative packages are easy to change as the platform evolves.</p></div>
        <div class="pricing-grid">@for (plan of pricing; track plan.name) { <mat-card class="price-card"><h3>{{ plan.name }}</h3><div class="price">{{ plan.price }}</div><p>{{ plan.description }}</p><a mat-stroked-button routerLink="/mentors">Find a Mentor</a></mat-card> }</div>
      </section>

      <section class="section faq-section tinted">
        <div class="app-shell"><div class="section-heading"><p class="eyebrow">Questions, answered</p><h2>FAQ</h2></div><mat-accordion>@for (item of faqs; track item.question) { <mat-expansion-panel><mat-expansion-panel-header><mat-panel-title>{{ item.question }}</mat-panel-title></mat-expansion-panel-header><p>{{ item.answer }}</p></mat-expansion-panel> }</mat-accordion></div>
      </section>

      <section class="final-cta app-shell"><h2>Ready to Practice Your Next Interview?</h2><p>Don't wait for the real interview to discover what you need to improve.</p><div class="actions"><a mat-flat-button routerLink="/mentors">Find a Mentor</a><a mat-stroked-button routerLink="/register">Become a Mentor</a></div></section>
    </main>
    <app-footer><nav footer-links aria-label="Footer navigation"><a routerLink="/home">Home</a><a routerLink="/mentors">Mentors</a><a href="#how-it-works">How It Works</a><a routerLink="/register">Become a Mentor</a><a routerLink="/login">Login</a></nav></app-footer>
  `,
  styles: [`
    :host { display: block; color: var(--color-text-primary); }
    .hero { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(280px, .9fr); align-items: center; gap: var(--space-6xl); min-height: 650px; padding-block: var(--space-6xl); }
    .eyebrow { margin-bottom: var(--space-md); color: var(--color-primary-700); font-size: var(--font-size-sm); font-weight: var(--font-weight-bold); letter-spacing: .08em; text-transform: uppercase; }
    h1 { max-width: 680px; font-size: clamp(2.4rem, 5vw, 4.25rem); letter-spacing: -.04em; }
    .lead { max-width: 620px; margin-top: var(--space-xl); font-size: var(--font-size-lg); }
    .actions { display: flex; flex-wrap: wrap; gap: var(--space-md); margin-top: var(--space-2xl); }
    .actions a { min-height: 46px; }
    .interview-visual { padding: var(--space-xl); border-radius: var(--radius-xl); border-left: 4px solid var(--color-primary); }
    .visual-header, .journey-step, .mentor-benefits div { display: flex; align-items: center; gap: var(--space-md); }
    .visual-header { padding-bottom: var(--space-lg); border-bottom: 1px solid var(--color-border); font-weight: var(--font-weight-semibold); }
    .live { margin-inline-start: auto; color: var(--color-success); font-size: var(--font-size-sm); }
    .journey-step { position: relative; min-height: 62px; }
    .step-icon { display: grid; width: 38px; height: 38px; place-items: center; color: var(--color-primary); background: var(--color-primary-light); border-radius: 50%; }
    .step-icon mat-icon { font-size: 20px; }
    .connector { position: absolute; top: 43px; left: 7px; color: var(--color-border); font-size: 18px; }
    .section { padding-block: var(--space-6xl); }
    .tinted { background: var(--color-section); }
    .section-heading { margin-bottom: var(--space-3xl); }
    .section-heading p:not(.eyebrow) { margin-top: var(--space-sm); }
    .step-grid, .pricing-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-lg); }
    .info-card, .price-card { padding: var(--space-xl); border-radius: var(--radius-lg); }
    .info-card mat-icon, .benefit mat-icon { color: var(--color-primary); }
    .info-card h3, .benefit h3 { margin-block: var(--space-md) var(--space-sm); font-size: var(--font-size-lg); }
    .benefit-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-2xl); }
    .benefit { display: flex; align-items: flex-start; gap: var(--space-md); }
    .benefit h3 { margin-top: 0; }
    .mentor-section { display: grid; grid-template-columns: 1.2fr .8fr; gap: var(--space-6xl); align-items: center; }
    .mentor-section h2 { max-width: 620px; }
    .mentor-section > div > p:not(.eyebrow) { margin-block: var(--space-lg) var(--space-xl); }
    .mentor-benefits { display: grid; gap: var(--space-lg); }
    .mentor-benefits mat-icon { color: var(--color-success); }
    mat-chip-listbox { display: flex; flex-wrap: wrap; gap: var(--space-sm); }
    .mentor-state { display: grid; justify-items: center; gap: var(--space-md); padding: var(--space-4xl); text-align: center; border: 1px dashed var(--color-border); border-radius: var(--radius-lg); }
    .mentor-state mat-icon { width: 48px; height: 48px; color: var(--color-text-muted); font-size: 48px; }
    .mentor-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-lg); }
    .mentor-card { padding: var(--space-xl); }
    .pricing-grid { grid-template-columns: repeat(3, 1fr); max-width: 920px; }
    .price-card { text-align: center; }
    .price { margin-block: var(--space-lg); color: var(--color-primary-700); font-size: var(--font-size-4xl); font-weight: var(--font-weight-bold); }
    .price-card p { min-height: 48px; margin-bottom: var(--space-xl); }
    .faq-section mat-accordion { display: block; max-width: 900px; }
    .final-cta { padding-block: var(--space-6xl); text-align: center; }
    .final-cta p { margin-top: var(--space-md); }
    .final-cta .actions { justify-content: center; }
    footer nav[footer-links] { display: flex; flex-wrap: wrap; gap: var(--space-lg); }
    footer a { color: inherit; }
    @media (max-width: 959px) { .hero { grid-template-columns: 1fr; gap: var(--space-3xl); min-height: auto; } .step-grid { grid-template-columns: repeat(2, 1fr); } .benefit-grid { grid-template-columns: repeat(2, 1fr); } .mentor-section { grid-template-columns: 1fr; gap: var(--space-3xl); } .mentor-cards { grid-template-columns: 1fr; } }
    @media (max-width: 599px) { .hero, .section, .final-cta { padding-block: var(--space-4xl); } .step-grid, .benefit-grid, .pricing-grid { grid-template-columns: 1fr; } .actions { flex-direction: column; } .actions a { width: 100%; } h1 { font-size: 2.5rem; } }
  `],
})
export class HomeComponent {
  private readonly mentorService = inject(MentorService);
  readonly mentors = signal<Mentor[]>([]);
  readonly mentorLoading = signal(true);
  readonly mentorError = signal(false);
  readonly journey = [{ icon: 'search', title: 'Find a mentor' }, { icon: 'event_available', title: 'Book a mock interview' }, { icon: 'forum', title: 'Practice and get feedback' }, { icon: 'trending_up', title: 'Improve with confidence' }];
  readonly howItWorks = [{ icon: 'tune', title: 'Choose Your Skill', description: 'Focus your practice on the skills that matter for your next opportunity.' }, { icon: 'person_search', title: 'Find a Mentor', description: 'Explore verified professionals who can guide your preparation.' }, { icon: 'calendar_month', title: 'Book a Mock Interview', description: 'Choose a convenient slot for a focused practice session.' }, { icon: 'feedback', title: 'Get Feedback & Improve', description: 'Use actionable feedback to make your next attempt stronger.' }];
  readonly studentBenefits = [{ icon: 'work', title: 'Realistic practice', description: 'Practice with professionals in an interview-style setting.' }, { icon: 'feedback', title: 'Detailed feedback', description: 'Understand your strengths and areas to improve.' }, { icon: 'build', title: 'Stronger skills', description: 'Identify technical and communication gaps deliberately.' }, { icon: 'record_voice_over', title: 'Better communication', description: 'Build clarity and confidence through repetition.' }, { icon: 'track_changes', title: 'Track improvement', description: 'Turn every session into a measurable learning step.' }, { icon: 'psychology', title: 'More confidence', description: 'Approach the real interview with a clear plan.' }];
  readonly mentorBenefits = ['Earn by conducting mock interviews', 'Help job seekers prepare', 'Build a mentor reputation', 'Receive ratings and reviews', 'Offer flexible interview slots', 'Grow your professional network'];
  readonly skills = ['Angular', 'React', 'Node.js', 'Java', 'Python', 'JavaScript', '.NET', 'SQL', 'DevOps', 'Data Science', 'HR', 'Finance'];
  readonly pricing = [{ name: 'Quick Practice', price: '₹49', description: 'A focused session to practice one interview area.' }, { name: 'Standard Mock', price: '₹99', description: 'A balanced mock interview with actionable feedback.' }, { name: 'Premium Mock', price: '₹199', description: 'A deeper practice session for broader preparation.' }];
  readonly faqs = [{ question: 'What is MockSchool?', answer: 'MockSchool connects candidates with mentors for structured mock interview practice.' }, { question: 'How does a mock interview work?', answer: 'Choose a skill, select an available mentor slot, and use the session to practice in a realistic setting.' }, { question: 'Who are the mentors?', answer: 'Mentors are professionals whose profiles are reviewed through the platform verification process.' }, { question: 'What feedback will I receive?', answer: 'Feedback can cover technical skills, communication, confidence, strengths, and areas for improvement.' }, { question: 'How can I become a mentor?', answer: 'Use the registration page to create a mentor account. Verification is handled through the platform process.' }];

  constructor() {
    this.mentorService.getVerifiedMentors().subscribe({
      next: (response) => {
        this.mentors.set(response.mentors.slice(0, 3));
        this.mentorLoading.set(false);
      },
      error: () => {
        this.mentorError.set(true);
        this.mentorLoading.set(false);
      },
    });
  }

  mentorName(mentor: Mentor): string {
    return typeof mentor.userId === 'string' ? 'Verified mentor' : mentor.userId.name;
  }
}
