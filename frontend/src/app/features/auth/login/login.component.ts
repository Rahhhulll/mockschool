import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { NotificationService } from '../../../shared/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { UserRole } from '../../../core/models/user.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="login-page">
      <mat-card class="login-card">
        <div class="brand">MockSchool</div>
        <h1>Welcome back</h1>
        <p class="supporting-text">Sign in to manage your mock interviews and mentorship.</p>

        <form [formGroup]="loginForm" (ngSubmit)="submit()" novalidate>
          <mat-form-field appearance="outline">
            <mat-label>Email</mat-label>
            <input matInput type="email" formControlName="email" autocomplete="email" />
            @if (email.hasError('required')) { <mat-error>Email is required.</mat-error> }
            @if (email.hasError('email')) { <mat-error>Please enter a valid email address.</mat-error> }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Password</mat-label>
            <input matInput [type]="showPassword() ? 'text' : 'password'" formControlName="password" autocomplete="current-password" />
            <button mat-icon-button matSuffix type="button" [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'" (click)="showPassword.update((visible) => !visible)">
              <mat-icon>{{ showPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            @if (password.hasError('required')) { <mat-error>Password is required.</mat-error> }
            @if (password.hasError('minlength')) { <mat-error>Password must be at least 6 characters.</mat-error> }
          </mat-form-field>

          @if (errorMessage()) {
            <p class="error-message" role="alert">{{ errorMessage() }}</p>
          }

          <button mat-flat-button class="submit-button" type="submit" [disabled]="loading()">
            @if (loading()) {
              <mat-progress-spinner diameter="20" mode="indeterminate" aria-label="Logging in"></mat-progress-spinner>
              <span>Logging in...</span>
            } @else {
              <span>Login</span>
            }
          </button>
        </form>

        <p class="register-link">Don't have an account? <a routerLink="/register">Create one</a></p>
      </mat-card>
    </main>
  `,
  styles: [`
    :host { display: block; min-height: 100%; }
    .login-page { display: grid; min-height: calc(100vh - 64px); place-items: center; padding: var(--space-3xl) var(--space-lg); background: var(--color-page); }
    .login-card { width: min(100%, 440px); padding: var(--space-3xl); border-radius: var(--radius-xl); }
    .brand { margin-bottom: var(--space-xl); color: var(--color-primary-700); font-size: var(--font-size-xl); font-weight: var(--font-weight-bold); }
    h1 { font-size: var(--font-size-3xl); }
    .supporting-text { margin: var(--space-sm) 0 var(--space-2xl); }
    form { display: flex; flex-direction: column; gap: var(--space-sm); }
    mat-form-field { width: 100%; }
    .submit-button { display: inline-flex; align-items: center; justify-content: center; gap: var(--space-sm); min-height: 48px; margin-top: var(--space-sm); }
    .submit-button mat-progress-spinner { --mdc-circular-progress-active-indicator-color: white; }
    .error-message { padding: var(--space-md); color: var(--color-error); background: var(--color-error-light); border-radius: var(--radius-md); }
    .register-link { margin-top: var(--space-xl); text-align: center; font-size: var(--font-size-sm); }
    @media (max-width: 599px) { .login-page { min-height: calc(100vh - 56px); padding: var(--space-xl) var(--space-md); } .login-card { padding: var(--space-xl); } }
  `],
})
export class LoginComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly notification = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal(false);
  readonly showPassword = signal(false);
  readonly errorMessage = signal('');
  readonly loginForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  get email() {
    return this.loginForm.controls.email;
  }

  get password() {
    return this.loginForm.controls.password;
  }

  submit(): void {
    this.errorMessage.set('');
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.authService.login(this.loginForm.getRawValue()).pipe(
      finalize(() => this.loading.set(false)),
    ).subscribe({
      next: ({ user }) => {
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        const destination = returnUrl?.startsWith('/') ? returnUrl : this.dashboardRoute(user.role);
        void this.router.navigateByUrl(destination);
      },
      error: (error: HttpErrorResponse) => {
        const message = this.errorFor(error);
        this.errorMessage.set(message);
        this.notification.error(message);
      },
    });
  }

  private dashboardRoute(role: UserRole): string {
    return role === 'student' ? '/student/dashboard' : role === 'mentor' ? '/mentor/dashboard' : '/admin/dashboard';
  }

  private errorFor(error: HttpErrorResponse): string {
    if (!error.status) return 'Unable to connect to the server. Please try again later.';
    if (error.status === 401) return 'Invalid email or password.';
    if (error.status === 403) return 'Access denied.';
    if (error.status === 404) return 'Authentication service not found.';
    if (error.status === 400 && typeof error.error?.message === 'string') return error.error.message;
    return 'Something went wrong. Please try again.';
  }
}
