import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [MatProgressSpinnerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="spinner" [class.overlay]="fullPage" role="status" aria-live="polite">
      <mat-progress-spinner [diameter]="diameter" mode="indeterminate"></mat-progress-spinner>
      @if (message) { <span>{{ message }}</span> }
    </div>
  `,
  styles: [`
    .spinner { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--space-md); padding: var(--space-3xl); color: var(--color-text-secondary); }
    .overlay { position: fixed; inset: 0; z-index: 1000; background: rgb(255 255 255 / 0.82); }
  `],
})
export class LoadingSpinnerComponent {
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() fullPage = false;
  @Input() message = '';

  get diameter(): number {
    return { small: 24, medium: 40, large: 64 }[this.size];
  }
}
