import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [MatButtonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="unauthorized app-shell">
      <section>
        <p class="code">403</p>
        <h1>Access Denied</h1>
        <p>You do not have permission to access this page.</p>
        <a mat-flat-button routerLink="/home">Go to Home</a>
      </section>
    </main>
  `,
  styles: [`
    .unauthorized { display: grid; min-height: 100vh; place-items: center; text-align: center; }
    .code { color: var(--color-primary-600); font-size: 4rem; font-weight: var(--font-weight-bold); }
    h1 { margin-block: var(--space-md); }
    a { margin-top: var(--space-xl); }
  `],
})
export class UnauthorizedComponent {}
