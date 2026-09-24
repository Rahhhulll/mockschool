import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { StudentDashboardResponse } from '../models/dashboard.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);

  getStudentDashboard(): Observable<StudentDashboardResponse> {
    return this.http.get<StudentDashboardResponse>(`${environment.apiUrl}/dashboard/student`);
  }
}
