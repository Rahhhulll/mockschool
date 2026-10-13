import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { CreateFeedbackRequest, FeedbackResponse } from '../models/feedback.model';
import { SKIP_GLOBAL_HTTP_ERROR_NOTIFICATION } from '../interceptors/http-error-context';

const localErrorContext = () => new HttpContext().set(SKIP_GLOBAL_HTTP_ERROR_NOTIFICATION, true);

@Injectable({ providedIn: 'root' })
export class FeedbackService {
  private readonly http = inject(HttpClient);

  createFeedback(data: CreateFeedbackRequest): Observable<FeedbackResponse> {
    return this.http.post<FeedbackResponse>(`${environment.apiUrl}/feedback`, data, { context: localErrorContext() });
  }

  getFeedbackByBooking(bookingId: string): Observable<FeedbackResponse> {
    return this.http.get<FeedbackResponse>(`${environment.apiUrl}/feedback/${bookingId}`, { context: localErrorContext() });
  }
}