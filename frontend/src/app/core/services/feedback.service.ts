import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { CreateFeedbackRequest, FeedbackResponse } from '../models/feedback.model';

@Injectable({ providedIn: 'root' })
export class FeedbackService {
  private readonly http = inject(HttpClient);

  createFeedback(data: CreateFeedbackRequest): Observable<FeedbackResponse> {
    return this.http.post<FeedbackResponse>(`${environment.apiUrl}/feedback`, data);
  }

  getFeedbackByBooking(bookingId: string): Observable<FeedbackResponse> {
    return this.http.get<FeedbackResponse>(`${environment.apiUrl}/feedback/${bookingId}`);
  }
}