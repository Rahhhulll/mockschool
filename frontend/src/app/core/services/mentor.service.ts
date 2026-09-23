import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Mentor } from '../models/mentor.model';

export interface MentorListResponse {
  message: string;
  count: number;
  mentors: Mentor[];
}

@Injectable({ providedIn: 'root' })
export class MentorService {
  private readonly http = inject(HttpClient);

  getVerifiedMentors(): Observable<MentorListResponse> {
    return this.http.get<MentorListResponse>(`${environment.apiUrl}/mentors`);
  }
}
