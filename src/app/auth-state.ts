import { Injectable, signal } from '@angular/core';

const AUTH_KEY = 'audir_logged_in';
const TOKEN_KEY = 'audir_access_token';
const ROLE_KEY = 'audir_role';
const EMAIL_KEY = 'audir_email';

@Injectable({ providedIn: 'root' })
export class AuthState {
  private readonly loggedInSignal = signal(this.loadInitialState());
  private readonly tokenSignal = signal(this.loadToken());
  private readonly roleSignal = signal(this.loadRole());
  private readonly emailSignal = signal(this.loadEmail());

  readonly isLoggedIn = this.loggedInSignal.asReadonly();
  readonly accessToken = this.tokenSignal.asReadonly();
  readonly role = this.roleSignal.asReadonly();
  readonly email = this.emailSignal.asReadonly();

  login(token: string, role?: string, email?: string): void {
    this.loggedInSignal.set(true);
    localStorage.setItem(AUTH_KEY, 'true');
    this.tokenSignal.set(token);
    localStorage.setItem(TOKEN_KEY, token);
    if (role) {
      this.roleSignal.set(role);
      localStorage.setItem(ROLE_KEY, role);
    }
    if (email) {
      this.emailSignal.set(email);
      localStorage.setItem(EMAIL_KEY, email);
    }
  }

  logout(): void {
    this.loggedInSignal.set(false);
    localStorage.removeItem(AUTH_KEY);
    this.tokenSignal.set('');
    localStorage.removeItem(TOKEN_KEY);
    this.roleSignal.set('');
    localStorage.removeItem(ROLE_KEY);
    this.emailSignal.set('');
    localStorage.removeItem(EMAIL_KEY);
  }

  private loadInitialState(): boolean {
    return localStorage.getItem(AUTH_KEY) === 'true';
  }

  private loadToken(): string {
    return localStorage.getItem(TOKEN_KEY) ?? '';
  }

  private loadRole(): string {
    return localStorage.getItem(ROLE_KEY) ?? '';
  }

  private loadEmail(): string {
    return localStorage.getItem(EMAIL_KEY) ?? '';
  }
}
