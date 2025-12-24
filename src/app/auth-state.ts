import { Injectable, signal } from '@angular/core';

const AUTH_KEY = 'audir_logged_in';
const TOKEN_KEY = 'audir_access_token';

@Injectable({ providedIn: 'root' })
export class AuthState {
  private readonly loggedInSignal = signal(this.loadInitialState());
  private readonly tokenSignal = signal(this.loadToken());

  readonly isLoggedIn = this.loggedInSignal.asReadonly();
  readonly accessToken = this.tokenSignal.asReadonly();

  login(token: string): void {
    this.loggedInSignal.set(true);
    localStorage.setItem(AUTH_KEY, 'true');
    this.tokenSignal.set(token);
    localStorage.setItem(TOKEN_KEY, token);
  }

  logout(): void {
    this.loggedInSignal.set(false);
    localStorage.removeItem(AUTH_KEY);
    this.tokenSignal.set('');
    localStorage.removeItem(TOKEN_KEY);
  }

  private loadInitialState(): boolean {
    return localStorage.getItem(AUTH_KEY) === 'true';
  }

  private loadToken(): string {
    return localStorage.getItem(TOKEN_KEY) ?? '';
  }
}
