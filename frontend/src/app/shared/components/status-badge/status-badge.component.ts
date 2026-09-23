import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

type BadgeTone = 'success' | 'warning' | 'error' | 'info' | 'neutral';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="badge" [class]="tone" [attr.aria-label]="'Status: ' + label">{{ label }}</span>`,
  styles: [`
    .badge { display: inline-flex; align-items: center; min-height: 24px; padding: 2px 10px; border-radius: 999px; font-size: var(--font-size-xs); font-weight: var(--font-weight-semibold); text-transform: capitalize; }
    .success { color: var(--color-success); background: var(--color-success-light); }
    .warning { color: var(--color-warning); background: var(--color-warning-light); }
    .error { color: var(--color-error); background: var(--color-error-light); }
    .info { color: var(--color-info); background: var(--color-info-light); }
    .neutral { color: var(--color-text-secondary); background: var(--color-section); }
  `],
})
export class StatusBadgeComponent {
  @Input({ required: true }) status = '';

  get label(): string {
    return this.status.replace(/[-_]/g, ' ');
  }

  get tone(): BadgeTone {
    const status = this.status.toLowerCase();
    if (['completed', 'paid', 'verified', 'success', 'confirmed'].includes(status)) return 'success';
    if (['pending', 'cancelled', 'failed', 'warning'].includes(status)) return status === 'failed' || status === 'cancelled' ? 'error' : 'warning';
    if (['info', 'upcoming'].includes(status)) return 'info';
    return 'neutral';
  }
}
