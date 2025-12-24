import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthState } from '../../auth-state';

@Component({
  selector: 'app-login',
  imports: [],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthState);

  protected signIn(): void {
    this.auth.login();
    this.router.navigate(['/dashboard']);
  }
}
