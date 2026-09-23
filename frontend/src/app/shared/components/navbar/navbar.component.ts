import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { inject } from '@angular/core';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatMenuModule, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="navbar">
      @if (showMenuButton) {
        <button mat-icon-button type="button" class="menu-button" aria-label="Open navigation menu" [matMenuTriggerFor]="mobileMenu" (click)="menuToggle.emit()">
          <mat-icon>menu</mat-icon>
        </button>
      }
      <a class="brand" [routerLink]="brandHref" [attr.aria-label]="title + ' home'">{{ title }}</a>
      <nav class="navigation" aria-label="Primary navigation">
        @if (publicNavigation) {
          <a routerLink="/home" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Home</a>
          <a routerLink="/mentors" routerLinkActive="active">Mentors</a>
          <a href="/home#how-it-works">How It Works</a>
          @if (!auth.isAuthenticated()) { <a routerLink="/login">Login</a><a routerLink="/register">Register</a> }
          @if (auth.isAuthenticated()) { <a [routerLink]="dashboardRoute" routerLinkActive="active">Dashboard</a> }
        }
        <ng-content select="[navbar-links]"></ng-content>
      </nav>
      <div class="actions">
        <ng-content select="[navbar-actions]"></ng-content>
        <button mat-icon-button type="button" aria-label="Open user menu" [matMenuTriggerFor]="userMenu">
          <mat-icon>account_circle</mat-icon>
        </button>
      </div>
    </header>
    <mat-menu #userMenu="matMenu">
      @if (auth.isAuthenticated()) {
        <a mat-menu-item [routerLink]="dashboardRoute">Dashboard</a>
        <button mat-menu-item type="button" (click)="auth.logout()">Logout</button>
      } @else {
        <a mat-menu-item routerLink="/login">Login</a>
        <a mat-menu-item routerLink="/register">Register</a>
      }
      <ng-content select="[navbar-menu]"></ng-content>
    </mat-menu>
    <mat-menu #mobileMenu="matMenu">
      <a mat-menu-item routerLink="/home">Home</a>
      <a mat-menu-item routerLink="/mentors">Mentors</a>
      <a mat-menu-item href="/home#how-it-works">How It Works</a>
      @if (!auth.isAuthenticated()) {
        <a mat-menu-item routerLink="/login">Login</a>
        <a mat-menu-item routerLink="/register">Register</a>
      } @else {
        <a mat-menu-item [routerLink]="dashboardRoute">Dashboard</a>
        <button mat-menu-item type="button" (click)="auth.logout()">Logout</button>
      }
    </mat-menu>
  `,
  styles: [`
    :host { display: block; }
    .navbar { min-height: 64px; display: flex; align-items: center; gap: var(--space-md); padding: 0 var(--space-xl); background: var(--color-surface); border-bottom: 1px solid var(--color-border); }
    .brand { color: var(--color-primary-700); font-size: var(--font-size-xl); font-weight: var(--font-weight-bold); text-decoration: none; white-space: nowrap; }
    .navigation { display: flex; align-items: center; gap: var(--space-lg); margin-inline: var(--space-xl); }
    .navigation a { color: var(--color-text-secondary); font-size: var(--font-size-sm); text-decoration: none; }
    .navigation a.active, .navigation a:hover { color: var(--color-primary-700); }
    .actions { display: flex; align-items: center; gap: var(--space-xs); margin-inline-start: auto; }
    .menu-button { display: none; }
    @media (max-width: 959px) { .navigation { display: none; } .menu-button { display: inline-flex; } .navbar { padding-inline: var(--space-lg); } }
    @media (max-width: 599px) { .navbar { min-height: 56px; padding-inline: var(--space-md); } .brand { font-size: var(--font-size-lg); } }
  `],
})
export class NavbarComponent {
  readonly auth = inject(AuthService);
  @Input() title = 'MockSchool';
  @Input() brandHref = '/home';
  @Input() showMenuButton = true;
  @Input() publicNavigation = false;
  @Output() readonly menuToggle = new EventEmitter<void>();

  get dashboardRoute(): string {
    const role = this.auth.getCurrentRole();
    return role === 'student' ? '/student/dashboard' : role === 'mentor' ? '/mentor/dashboard' : '/admin/dashboard';
  }
}
