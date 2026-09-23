import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';

import { AuthService } from '../../../core/services/auth.service';
import { RegistrationRole } from '../../../core/models/auth.model';
import { NotificationService } from '../../../shared/services/notification.service';

function passwordsMatch(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  return password && confirmPassword && password !== confirmPassword ? { passwordMismatch: true } : null;
}

@Component({
  selector: 'app-register',
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
    MatRadioModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="register-page">
      <mat-card class="register-card">
        <div class="brand">MockSchool</div>
        <h1>Create your account</h1>
        <p class="supporting-text">Join MockSchool to practice interviews and grow with expert mentorship.</p>

        <form [formGroup]="registerForm" (ngSubmit)="submit()" novalidate>
          <mat-form-field appearance="outline">
            <mat-label>Full name</mat-label>
            <input matInput type="text" formControlName="name" autocomplete="name" />
            @if (name.hasError('required')) { <mat-error>Name is required.</mat-error> }
            @if (name.hasError('minlength')) { <mat-error>Name must be at least 2 characters.</mat-error> }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Email</mat-label>
            <input matInput type="email" formControlName="email" autocomplete="email" />
            @if (email.hasError('required')) { <mat-error>Email is required.</mat-error> }
            @if (email.hasError('email')) { <mat-error>Please enter a valid email address.</mat-error> }
          </mat-form-field>

          <fieldset class="role-group">
            <legend>Register as</legend>
            <mat-radio-group formControlName="role" aria-label="Choose registration role">
              <mat-radio-button value="student">Student</mat-radio-button>
              <mat-radio-button value="mentor">Mentor</mat-radio-button>
            </mat-radio-group>
            @if (role.hasError('required') && role.touched) { <p class="field-error">Please choose a role.</p> }
          </fieldset>

          <mat-form-field appearance="outline">
            <mat-label>Password</mat-label>
            <input matInput [type]="showPassword() ? 'text' : 'password'" formControlName="password" autocomplete="new-password" />
            <button mat-icon-button matSuffix type="button" [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'" (click)="showPassword.update((visible) => !visible)">
              <mat-icon>{{ showPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            @if (password.hasError('required')) { <mat-error>Password is required.</mat-error> }
            @if (password.hasError('minlength')) { <mat-error>Password must be at least 6 characters.</mat-error> }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Confirm password</mat-label>
            <input matInput [type]="showConfirmPassword() ? 'text' : 'password'" formControlName="confirmPassword" autocomplete="new-password" />
            <button mat-icon-button matSuffix type="button" [attr.aria-label]="showConfirmPassword() ? 'Hide confirm password' : 'Show confirm password'" (click)="showConfirmPassword.update((visible) => !visible)">
              <mat-icon>{{ showConfirmPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            @if (confirmPassword.hasError('required')) { <mat-error>Confirm password is required.</mat-error> }
            @if (registerForm.hasError('passwordMismatch') && confirmPassword.touched) { <mat-error>Passwords do not match.</mat-error> }
          </mat-form-field>

          @if (errorMessage()) { <p class="error-message" role="alert">{{ errorMessage() }}</p> }

          <button mat-flat-button class="submit-button" type="submit" [disabled]="loading()">
            @if (loading()) {
              <mat-progress-spinner diameter="20" mode="indeterminate" aria-label="Creating account"></mat-progress-spinner>
              <span>Creating account...</span>
            } @else {
              <span>Create account</span>
            }
          </button>
        </form>

        <p class="login-link">Already have an account? <a routerLink="/login">Login</a></p>
      </mat-card>
    </main>
  `,
  styles: [`
    :host { display: block; min-height: 100%; }
    .register-page { display: grid; min-height: calc(100vh - 64px); place-items: center; padding: var(--space-3xl) var(--space-lg); background: var(--color-page); }
    .register-card { width: min(100%, 480px); padding: var(--space-3xl); border-radius: var(--radius-xl); }
    .brand { margin-bottom: var(--space-xl); color: var(--color-primary-700); font-size: var(--font-size-xl); font-weight: var(--font-weight-bold); }
    h1 { font-size: var(--font-size-3xl); }
    .supporting-text { margin: var(--space-sm) 0 var(--space-2xl); }
    form { display: flex; flex-direction: column; gap: var(--space-sm); }
    mat-form-field { width: 100%; }
    .role-group { display: flex; flex-direction: column; gap: var(--space-sm); margin: 0 0 var(--space-sm); padding: 0; border: 0; }
    legend { margin-bottom: var(--space-xs); color: var(--color-text-primary); font-size: var(--font-size-sm); font-weight: var(--font-weight-medium); }
    mat-radio-group { display: flex; flex-wrap: wrap; gap: var(--space-lg); }
    .field-error { color: var(--color-error); font-size: var(--font-size-xs); }
    .submit-button { display: inline-flex; align-items: center; justify-content: center; gap: var(--space-sm); min-height: 48px; margin-top: var(--space-sm); }
    .submit-button mat-progress-spinner { --mdc-circular-progress-active-indicator-color: white; }
    .error-message { padding: var(--space-md); color: var(--color-error); background: var(--color-error-light); border-radius: var(--radius-md); }
    .login-link { margin-top: var(--space-xl); text-align: center; font-size: var(--font-size-sm); }
    @media (max-width: 599px) { .register-page { min-height: calc(100vh - 56px); padding: var(--space-xl) var(--space-md); } .register-card { padding: var(--space-xl); } }
  `],
})
export class RegisterComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly notification = inject(NotificationService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);
  readonly errorMessage = signal('');
  readonly registerForm = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.pattern(/\S/)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]],
    role: ['student' as RegistrationRole, [Validators.required]],
  }, { validators: passwordsMatch });

  get name() { return this.registerForm.controls.name; }
  get email() { return this.registerForm.controls.email; }
  get password() { return this.registerForm.controls.password; }
  get confirmPassword() { return this.registerForm.controls.confirmPassword; }
  get role() { return this.registerForm.controls.role; }

  submit(): void {
    this.errorMessage.set('');
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const { name, email, password, role } = this.registerForm.getRawValue();
    this.loading.set(true);
    this.authService.register({ name: name.trim(), email: email.trim(), password, role }).pipe(
      finalize(() => this.loading.set(false)),
    ).subscribe({
      next: () => {
        const message = role === 'mentor'
          ? 'Mentor account created successfully. Please login.'
          : 'Student account created successfully. Please login.';
        this.notification.success(message);
        void this.router.navigate(['/login']);
      },
      error: (error: HttpErrorResponse) => {
        const message = this.errorFor(error);
        this.errorMessage.set(message);
        this.notification.error(message);
      },
    });
  }

  private errorFor(error: HttpErrorResponse): string {
    if (!error.status) return 'Unable to connect to the server. Please try again later.';
    if (error.status === 409) return 'This email is already registered. Please use another email or login.';
    if (error.status === 400) return 'Please check your registration details.';
    if (error.status >= 500) return 'Something went wrong. Please try again later.';
    return 'Unable to create your account. Please try again.';
  }
}
