import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Mentor } from '../models/mentor.model';
import { Slot } from '../models/slot.model';

export interface MentorListResponse {
  message: string;
  count: number;
  mentors: Mentor[];
}

export interface MentorDetailResponse {
  message: string;
  mentor: Mentor;
}

export interface AvailableSlotsResponse {
  message: string;
  count: number;
  slots: Slot[];
}

@Injectable({ providedIn: 'root' })
export class MentorService {
  private readonly http = inject(HttpClient);

  getVerifiedMentors(): Observable<MentorListResponse> {
    return this.http.get<MentorListResponse>(`${environment.apiUrl}/mentors`);
  }

  getMentorById(id: string): Observable<MentorDetailResponse> {
    return this.http.get<MentorDetailResponse>(`${environment.apiUrl}/mentors/${id}`);
  }

  getAvailableSlots(): Observable<AvailableSlotsResponse> {
    return this.http.get<AvailableSlotsResponse>(`${environment.apiUrl}/slots`);
  }
}
