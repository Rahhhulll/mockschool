import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';

export interface SidebarItem {
  label: string;
  route?: string;
  icon?: string;
  badge?: string | number;
  dividerBefore?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatBadgeModule, MatButtonModule, MatDividerModule, MatIconModule, MatSidenavModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-sidenav-container class="sidenav-container">
      <mat-sidenav #drawer [mode]="mobile ? 'over' : 'side'" [opened]="!mobile || open" (closed)="openChange.emit(false)" aria-label="Application navigation">
        <nav class="sidebar" aria-label="Dashboard navigation">
          @for (item of items; track item.label) {
            @if (item.dividerBefore) { <mat-divider></mat-divider> }
            @if (item.route) {
              <a mat-button class="sidebar-link" [routerLink]="item.route" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" (click)="mobile && close()">
                @if (item.icon) { <mat-icon>{{ item.icon }}</mat-icon> }
                <span>{{ item.label }}</span>
                @if (item.badge !== undefined) { <span matBadge="{{ item.badge }}" matBadgeOverlap="false" aria-label="Notification count"></span> }
              </a>
            }
          }
        </nav>
      </mat-sidenav>
      <mat-sidenav-content><ng-content></ng-content></mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    :host, .sidenav-container { display: block; min-height: 100%; }
    mat-sidenav { width: 256px; border-right: 1px solid var(--color-border); background: var(--color-surface); }
    .sidebar { display: flex; flex-direction: column; gap: var(--space-xs); padding: var(--space-lg) var(--space-md); }
    .sidebar-link { justify-content: flex-start; gap: var(--space-md); min-height: 44px; color: var(--color-text-secondary); }
    .sidebar-link.active { color: var(--color-primary-700); background: var(--color-primary-light); font-weight: var(--font-weight-semibold); }
    mat-divider { margin: var(--space-md) 0; }
  `],
})
export class SidebarComponent {
  @Input() items: SidebarItem[] = [];
  @Input() mobile = false;
  @Input() open = true;
  @Output() readonly openChange = new EventEmitter<boolean>();

  close(): void {
    this.openChange.emit(false);
  }
}
