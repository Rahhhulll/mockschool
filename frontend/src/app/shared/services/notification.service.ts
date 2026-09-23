import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);
  private readonly duration = 4000;

  success(message: string): void {
    this.snackBar.open(message, 'Dismiss', { duration: this.duration, panelClass: ['notification-success'], politeness: 'polite' });
  }

  error(message: string): void {
    this.snackBar.open(message, 'Dismiss', { duration: this.duration, panelClass: ['notification-error'], politeness: 'assertive' });
  }
}
