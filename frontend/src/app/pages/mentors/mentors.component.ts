import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-mentors',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="mentors app-shell">
      <mat-icon>groups</mat-icon>
      <h1>Find a Mentor</h1>
      <p>Mentor discovery is coming next. Your selected skill can be carried into the future mentor search.</p>
      <a mat-flat-button routerLink="/home">Back to Home</a>
    </main>
  `,
  styles: [`
    .mentors { display: grid; min-height: 70vh; place-items: center; align-content: center; gap: var(--space-lg); text-align: center; }
    mat-icon { width: 56px; height: 56px; color: var(--color-primary); font-size: 56px; }
    p { max-width: 520px; }
  `],
})
export class MentorsComponent {}
