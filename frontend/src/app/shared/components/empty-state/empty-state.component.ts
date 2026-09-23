import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="state" aria-live="polite">
      <mat-icon aria-hidden="true">{{ icon }}</mat-icon>
      <h2>{{ title }}</h2>
      @if (description) { <p>{{ description }}</p> }
      @if (actionLabel) { <button mat-flat-button type="button" (click)="action.emit()">{{ actionLabel }}</button> }
    </section>
  `,
  styles: [`
    .state { display: flex; flex-direction: column; align-items: center; gap: var(--space-md); padding: var(--space-5xl) var(--space-xl); text-align: center; }
    mat-icon { width: 48px; height: 48px; color: var(--color-text-muted); font-size: 48px; }
    p { max-width: 42rem; }
  `],
})
export class EmptyStateComponent {
  @Input() icon = 'inbox';
  @Input() title = 'Nothing here yet';
  @Input() description = '';
  @Input() actionLabel = '';
  @Output() readonly action = new EventEmitter<void>();
}
