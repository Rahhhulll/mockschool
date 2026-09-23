import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-rating',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="rating" role="group" [attr.aria-label]="'Rating: ' + rating + ' out of 5'">
      @for (star of stars; track star) {
        <button type="button" class="star" [class.filled]="star <= roundedRating" [disabled]="readonly" [attr.aria-label]="'Rate ' + star + ' out of 5'" (click)="setRating(star)">
          <mat-icon aria-hidden="true">{{ star <= roundedRating ? 'star' : 'star_border' }}</mat-icon>
        </button>
      }
      @if (showValue) { <span class="value">{{ rating | number:'1.1-1' }}</span> }
    </div>
  `,
  styles: [`
    .rating { display: inline-flex; align-items: center; gap: 2px; }
    .star { display: inline-flex; padding: 2px; border: 0; color: var(--color-accent); background: transparent; cursor: pointer; }
    .star:disabled { cursor: default; }
    .star mat-icon { font-size: 22px; width: 22px; height: 22px; }
    .value { margin-inline-start: var(--space-sm); color: var(--color-text-secondary); font-size: var(--font-size-sm); }
  `],
})
export class RatingComponent {
  @Input() rating = 0;
  @Input() readonly = true;
  @Input() showValue = false;
  @Output() readonly ratingChange = new EventEmitter<number>();
  readonly stars = [1, 2, 3, 4, 5];

  get roundedRating(): number {
    return Math.max(0, Math.min(5, Math.round(this.rating)));
  }

  setRating(value: number): void {
    if (!this.readonly) this.ratingChange.emit(value);
  }
}
