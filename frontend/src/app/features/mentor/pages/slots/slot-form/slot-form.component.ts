import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { Slot, SlotInput } from '../../../../../core/models/slot.model';
import { SlotService } from '../../../../../core/services/slot.service';
import { LoadingSpinnerComponent } from '../../../../../shared/components/loading-spinner/loading-spinner.component';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { NotificationService } from '../../../../../shared/services/notification.service';

@Component({
  selector: 'app-slot-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatButtonModule, MatDatepickerModule, MatFormFieldModule, MatIconModule, MatInputModule, LoadingSpinnerComponent, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './slot-form.component.html',
  styleUrl: './slot-form.component.scss',
})
export class SlotFormComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly slotService = inject(SlotService);
  private readonly notification = inject(NotificationService);

  readonly slotId = this.route.snapshot.paramMap.get('id');
  readonly editing = Boolean(this.slotId);
  readonly loading = signal(this.editing);
  readonly saving = signal(false);
  readonly submitted = signal(false);
  readonly loadError = signal('');
  readonly minDate = this.localMidnight(new Date());
  readonly title = computed(() => this.editing ? 'Edit Interview Slot' : 'Create Interview Slot');
  readonly slotForm = this.formBuilder.group({
    date: this.formBuilder.control<Date | null>(null, Validators.required),
    startTime: this.formBuilder.nonNullable.control('', Validators.required),
    endTime: this.formBuilder.nonNullable.control('', Validators.required),
  }, { validators: (control) => this.validateRange(control) });

  constructor() {
    if (this.slotId) this.loadSlot(this.slotId);
  }

  fieldInvalid(name: 'date' | 'startTime' | 'endTime'): boolean {
    const field = this.slotForm.controls[name];
    return field.invalid && (field.touched || this.submitted());
  }

  get rangeInvalid(): boolean {
    return Boolean(this.slotForm.hasError('endBeforeStart') && (this.slotForm.controls.endTime.touched || this.submitted()));
  }

  get pastTimeInvalid(): boolean {
    return Boolean(this.slotForm.hasError('pastSlot') && (this.slotForm.controls.startTime.touched || this.submitted()));
  }

  submit(): void {
    this.submitted.set(true);
    if (this.slotForm.invalid || this.saving()) {
      this.slotForm.markAllAsTouched();
      return;
    }

    const value = this.slotForm.getRawValue();
    if (!value.date) return;
    const payload: SlotInput = {
      date: this.toDateString(value.date),
      startTime: value.startTime,
      endTime: value.endTime,
    };

    this.saving.set(true);
    const request = this.slotId
      ? this.slotService.updateSlot(this.slotId, payload)
      : this.slotService.createSlot(payload);
    request.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.notification.success(this.editing ? 'Slot updated successfully.' : 'Slot created successfully.');
        void this.router.navigate(['/mentor/slots']);
      },
      error: (error: HttpErrorResponse) => this.handleSaveError(error),
    });
  }

  private loadSlot(id: string): void {
    this.slotService.getMySlots().pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (slots) => {
        const slot = slots.find((item) => item._id === id);
        if (!slot) {
          this.loadError.set('This slot is unavailable.');
        } else if (slot.isBooked) {
          this.loadError.set('This slot has already been booked and cannot be edited.');
        } else {
          this.setFormSlot(slot);
        }
      },
      error: () => this.loadError.set('Unable to load this slot. Please return to My Slots and try again.'),
    });
  }

  private setFormSlot(slot: Slot): void {
    const date = slot.date.slice(0, 10).split('-').map(Number);
    this.slotForm.setValue({
      date: new Date(date[0], date[1] - 1, date[2]),
      startTime: slot.startTime,
      endTime: slot.endTime,
    });
  }

  private validateRange(control: AbstractControl): ValidationErrors | null {
    const date = control.get('date')?.value as Date | null;
    const startTime = control.get('startTime')?.value as string;
    const endTime = control.get('endTime')?.value as string;
    const errors: ValidationErrors = {};
    if (startTime && endTime && startTime >= endTime) errors['endBeforeStart'] = true;
    if (date && startTime && this.isInPast(date, startTime)) errors['pastSlot'] = true;
    return Object.keys(errors).length ? errors : null;
  }

  private isInPast(date: Date, time: string): boolean {
    const [hours, minutes] = time.split(':').map(Number);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return false;
    const selected = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes);
    return selected.getTime() <= Date.now();
  }

  private localMidnight(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  private toDateString(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
  }

  private handleSaveError(error: HttpErrorResponse): void {
    if (error.status === 409) {
      this.notification.error('This time slot overlaps with an existing slot.');
    } else if (error.status === 404 && this.editing) {
      this.notification.error('This slot has already been booked and cannot be edited.');
      if (this.slotId) this.loadSlot(this.slotId);
    } else if (error.status === 400) {
      this.notification.error('Invalid slot data. Check the date and time and try again.');
    } else if (error.status === 401) {
      this.notification.error('Your session has expired. Please sign in again.');
    } else if (error.status === 403) {
      this.notification.error('Only mentors can manage interview slots.');
    } else {
      this.notification.error('Unable to save this slot. Please try again.');
    }
  }
}