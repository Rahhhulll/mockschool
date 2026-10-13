import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface ConfirmationDialogData {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  warning?: boolean;
}

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [MatButtonModule, MatDialogModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title id="confirmation-dialog-title">{{ data.title }}</h2>
    <mat-dialog-content id="confirmation-dialog-message">{{ data.message }}</mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="cancel()">{{ data.cancelLabel ?? 'Cancel' }}</button>
      <button mat-flat-button type="button" [color]="data.destructive || data.warning ? 'warn' : 'primary'" [disabled]="confirmed" (click)="confirm()">
        {{ data.confirmLabel ?? 'Confirm' }}
      </button>
    </mat-dialog-actions>
  `,
})
export class ConfirmationDialogComponent {
  confirmed = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) readonly data: ConfirmationDialogData,
    readonly dialogRef: MatDialogRef<ConfirmationDialogComponent, boolean>,
  ) {}

  confirm(): void {
    if (this.confirmed) return;
    this.confirmed = true;
    this.dialogRef.close(true);
  }

  cancel(): void {
    if (this.confirmed) return;
    this.dialogRef.close(false);
  }
}
