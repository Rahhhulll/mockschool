import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-error-state',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="state" role="alert">
      <mat-icon aria-hidden="true">error_outline</mat-icon>
      <h2>{{ title }}</h2>
      <p>{{ message }}</p>
      @if (showRetry) {
        <button mat-stroked-button type="button" (click)="retry.emit()">{{ retryLabel }}</button>
      }
    </section>
  `,
  styles: [`
    .state { display: flex; flex-direction: column; align-items: center; gap: var(--space-md); padding: var(--space-5xl) var(--space-xl); text-align: center; }
    mat-icon { color: var(--color-error); font-size: 48px; width: 48px; height: 48px; }
    p { max-width: 42rem; }
  `],
})
export class ErrorStateComponent {
  @Input() title = 'Something went wrong';
  @Input() message = "We couldn't load this information. Please try again.";
  @Input() retryLabel = 'Retry';
  @Input() showRetry = true;
  @Output() readonly retry = new EventEmitter<void>();
}
