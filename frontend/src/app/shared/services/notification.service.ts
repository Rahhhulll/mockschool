import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

type NotificationKind = 'success' | 'error' | 'warning' | 'info';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);

  success(message: string): void {
    this.show(message, 'success', 4000, 'polite');
  }

  error(message: string): void {
    this.show(message, 'error', 6000, 'assertive');
  }

  warning(message: string): void {
    this.show(message, 'warning', 5000, 'polite');
  }

  info(message: string): void {
    this.show(message, 'info', 4000, 'polite');
  }

  private show(message: string, kind: NotificationKind, duration: number, politeness: 'polite' | 'assertive'): void {
    this.snackBar.open(message, 'Dismiss', {
      duration,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: [`notification-${kind}`],
      politeness,
    });
  }
}
