import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { AuthState } from '../auth-state';

type TokenResponse = {
  access_token: string;
  token_type: string;
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly baseUrl = 'http://localhost:8000';

  constructor(private readonly http: HttpClient, private readonly auth: AuthState) {}

  login(email: string, password: string): Observable<TokenResponse> {
    const body = new HttpParams()
      .set('username', email)
      .set('password', password);
    return this.http
      .post<TokenResponse>(`${this.baseUrl}/auth/login`, body.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      .pipe(tap((response) => this.auth.login(response.access_token)));
  }
}
