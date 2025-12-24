import { Injectable, signal } from '@angular/core';

const AUTH_KEY = 'audir_logged_in';

@Injectable({ providedIn: 'root' })
export class AuthState {
  private readonly loggedInSignal = signal(this.loadInitialState());

  readonly isLoggedIn = this.loggedInSignal.asReadonly();

  login(): void {
    this.loggedInSignal.set(true);
    localStorage.setItem(AUTH_KEY, 'true');
  }

  logout(): void {
    this.loggedInSignal.set(false);
    localStorage.removeItem(AUTH_KEY);
  }

  private loadInitialState(): boolean {
    return localStorage.getItem(AUTH_KEY) === 'true';
  }
}
