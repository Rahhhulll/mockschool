import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

export type SkeletonVariant = 'card' | 'table' | 'list' | 'details';

@Component({
  selector: 'app-skeleton-loader',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="skeleton-group" role="status" aria-label="Loading content" aria-busy="true">
      @switch (variant) {
        @case ('card') {
          <div class="card-grid">
            @for (item of items; track item) {
              <div class="card-shape" aria-hidden="true">
                <span class="shape icon"></span>
                <span class="shape line medium"></span>
                <span class="shape line short"></span>
              </div>
            }
          </div>
        }
        @case ('table') {
          <div class="table-shape" aria-hidden="true">
            <div class="row header">
              @for (column of columns; track column) { <span class="shape line"></span> }
            </div>
            @for (item of items; track item) {
              <div class="row">
                @for (column of columns; track column) { <span class="shape line"></span> }
              </div>
            }
          </div>
        }
        @case ('list') {
          @for (item of items; track item) {
            <div class="list-shape" aria-hidden="true">
              <span class="shape avatar"></span>
              <span class="shape line medium"></span>
              <span class="shape line short"></span>
            </div>
          }
        }
        @case ('details') {
          <div class="details-shape" aria-hidden="true">
            @for (item of items; track item) {
              <span class="shape line"></span>
              <span class="shape line wide"></span>
            }
          </div>
        }
      }
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; }
    .skeleton-group { display: block; }
    .shape { display: block; background: var(--color-section); border-radius: var(--radius-md); }
    .card-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr)); gap: var(--space-lg); }
    .card-shape { min-height: 128px; padding: var(--space-xl); display: flex; flex-direction: column; align-items: flex-start; justify-content: center; gap: var(--space-md); background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); }
    .icon { width: 36px; height: 36px; border-radius: 50%; }
    .line { height: 14px; width: 100%; }
    .medium { width: 68%; }
    .short { width: 42%; }
    .wide { width: 82%; }
    .table-shape { overflow: hidden; border: 1px solid var(--color-border); border-radius: var(--radius-lg); background: var(--color-surface); }
    .row { min-width: 600px; display: grid; grid-template-columns: repeat(4, minmax(90px, 1fr)); gap: var(--space-lg); align-items: center; padding: var(--space-lg); border-bottom: 1px solid var(--color-border-light); }
    .header { background: var(--color-section); }
    .header .line { height: 12px; }
    .list-shape { display: grid; grid-template-columns: auto 1fr; grid-template-rows: auto auto; gap: var(--space-sm) var(--space-lg); padding: var(--space-lg); border-bottom: 1px solid var(--color-border-light); }
    .avatar { width: 44px; height: 44px; grid-row: span 2; border-radius: 50%; }
    .details-shape { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--space-md) var(--space-lg); }
    .details-shape .line { height: 18px; }
    .shape { background-image: linear-gradient(90deg, transparent, rgb(255 255 255 / 0.65), transparent); background-size: 200% 100%; animation: shimmer 1.6s ease-in-out infinite; }
    @keyframes shimmer { to { background-position-x: -200%; } }
    @media (prefers-reduced-motion: reduce) { .shape { animation: none; background-image: none; } }
    @media (max-width: 599px) { .details-shape { grid-template-columns: 1fr; } }
  `],
})
export class SkeletonLoaderComponent {
  @Input() variant: SkeletonVariant = 'list';
  @Input() count = 4;
  @Input() columnCount = 4;

  get items(): readonly number[] {
    return Array.from({ length: Math.max(1, Math.min(12, this.count)) }, (_, index) => index);
  }

  get columns(): readonly number[] {
    return Array.from({ length: Math.max(2, Math.min(8, this.columnCount)) }, (_, index) => index);
  }
}
