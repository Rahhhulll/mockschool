import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="footer">
      <span class="brand">{{ brand }}</span>
      <span>© {{ year }} {{ brand }}. All rights reserved.</span>
      <ng-content></ng-content>
    </footer>
  `,
  styles: [`
    .footer { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--space-md); padding: var(--space-xl); color: var(--color-text-muted); border-top: 1px solid var(--color-border); font-size: var(--font-size-sm); }
    .brand { color: var(--color-primary-700); font-weight: var(--font-weight-semibold); }
  `],
})
export class FooterComponent {
  @Input() brand = 'MockSchool';
  @Input() year = new Date().getFullYear();
}
