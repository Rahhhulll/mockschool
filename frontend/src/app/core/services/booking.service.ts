import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Booking, BookingResponse, MyBookingsResponse } from '../models/booking.model';

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly http = inject(HttpClient);

  getMyBookings(): Observable<Booking[]> {
    return this.http
      .get<MyBookingsResponse>(`${environment.apiUrl}/bookings/my-bookings`)
      .pipe(map((response) => response.bookings));
  }

  getBookingById(id: string): Observable<Booking> {
    return this.http
      .get<BookingResponse>(`${environment.apiUrl}/bookings/${id}`)
      .pipe(map((response) => response.booking));
  }

  cancelBooking(id: string): Observable<Booking> {
    return this.http
      .patch<BookingResponse>(`${environment.apiUrl}/bookings/${id}/cancel`, {})
      .pipe(map((response) => response.booking));
  }
}
