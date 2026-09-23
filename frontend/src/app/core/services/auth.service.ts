import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, map, of, shareReplay, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest, RegisterResponse } from '../models/auth.model';
import { User, UserRole } from '../models/user.model';

const TOKEN_KEY = 'mockschool_auth_token';
const USER_KEY = 'mockschool_auth_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  readonly currentUser = signal<User | null>(this.readUser());
  readonly isAuthenticated = signal<boolean>(this.hasToken());
  private sessionRestore$?: Observable<void>;

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, credentials).pipe(
      tap((response) => this.setSession(response)),
    );
  }

  register(request: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${environment.apiUrl}/auth/register`, request);
  }

  getProfile(): Observable<{ message: string; user: User }> {
    return this.http.get<{ message: string; user: User }>(`${environment.apiUrl}/auth/profile`);
  }

  profile(): Observable<{ message: string; user: User }> {
    return this.getProfile();
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  token(): string | null {
    return this.getToken();
  }

  getCurrentUser(): User | null {
    return this.currentUser();
  }

  getCurrentRole(): UserRole | null {
    return this.currentUser()?.role ?? null;
  }

  role(): UserRole | null {
    return this.getCurrentRole();
  }

  restoreSession(): Observable<void> {
    if (this.sessionRestore$) return this.sessionRestore$;
    if (!this.getToken()) return of(void 0);

    this.sessionRestore$ = this.getProfile().pipe(
      tap(({ user }) => this.setUser(user)),
      map(() => void 0),
      catchError(() => {
        this.clearSession();
        return of(void 0);
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    return this.sessionRestore$;
  }

  clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
  }

  logout(): void {
    this.clearSession();
    void this.router.navigate(['/login']);
  }

  private setSession(response: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, response.token);
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));
    this.setUser(response.user);
  }

  private setUser(user: User): void {
    this.currentUser.set(user);
    this.isAuthenticated.set(true);
  }

  private hasToken(): boolean {
    return Boolean(localStorage.getItem(TOKEN_KEY));
  }

  private readUser(): User | null {
    const storedUser = localStorage.getItem(USER_KEY);
    if (!storedUser) return null;

    try {
      return JSON.parse(storedUser) as User;
    } catch {
      localStorage.removeItem(USER_KEY);
      return null;
    }
  }
}
