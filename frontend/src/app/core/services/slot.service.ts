import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Slot, SlotInput, SlotResponse, SlotsResponse } from '../models/slot.model';
import { SKIP_GLOBAL_HTTP_ERROR_NOTIFICATION } from '../interceptors/http-error-context';

const localErrorContext = () => new HttpContext().set(SKIP_GLOBAL_HTTP_ERROR_NOTIFICATION, true);

@Injectable({ providedIn: 'root' })
export class SlotService {
  private readonly http = inject(HttpClient);
  private readonly slotsUrl = `${environment.apiUrl}/slots`;

  getMySlots(): Observable<Slot[]> {
    return this.http.get<SlotsResponse>(`${this.slotsUrl}/my-slots`).pipe(map((response) => response.slots));
  }

  createSlot(data: SlotInput): Observable<Slot> {
    return this.http.post<SlotResponse>(this.slotsUrl, data, { context: localErrorContext() }).pipe(map((response) => response.slot));
  }

  updateSlot(id: string, data: SlotInput): Observable<Slot> {
    return this.http.put<SlotResponse>(`${this.slotsUrl}/${id}`, data, { context: localErrorContext() }).pipe(map((response) => response.slot));
  }

  deleteSlot(id: string): Observable<void> {
    return this.http.delete<{ message: string }>(`${this.slotsUrl}/${id}`, { context: localErrorContext() }).pipe(map(() => void 0));
  }
}