import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="page-header">
      <div class="heading">
        @if (showBackButton) { <button mat-icon-button type="button" aria-label="Go back" (click)="back.emit()"><mat-icon>arrow_back</mat-icon></button> }
        <div>
          @if (breadcrumbs.length) { <nav class="breadcrumbs" aria-label="Breadcrumb"><span>{{ breadcrumbs.join(' / ') }}</span></nav> }
          <h1>{{ title }}</h1>
          @if (subtitle) { <p>{{ subtitle }}</p> }
        </div>
      </div>
      <div class="actions"><ng-content></ng-content></div>
    </section>
  `,
  styles: [`
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--space-xl); padding-block: var(--space-xl); }
    .heading { display: flex; align-items: flex-start; gap: var(--space-sm); }
    h1 { font-size: var(--font-size-3xl); }
    p { margin-top: var(--space-sm); }
    .breadcrumbs { margin-bottom: var(--space-sm); color: var(--color-text-muted); font-size: var(--font-size-sm); }
    .actions { display: flex; flex-wrap: wrap; gap: var(--space-sm); }
    @media (max-width: 599px) { .page-header { flex-direction: column; } .actions { width: 100%; } .actions > * { max-width: 100%; } }
  `],
})
export class PageHeaderComponent {
  @Input({ required: true }) title = '';
  @Input() subtitle = '';
  @Input() showBackButton = false;
  @Input() breadcrumbs: string[] = [];
  @Output() readonly back = new EventEmitter<void>();
}
