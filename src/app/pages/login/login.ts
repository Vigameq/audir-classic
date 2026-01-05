import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthState } from '../../auth-state';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthState);

  protected email = '';
  protected password = '';
  protected loginError = '';
  protected role = '';

  protected signIn(): void {
    this.loginError = '';
    this.auth.login('dev-token', this.role);
    this.router.navigate(['/dashboard']);
  }
}
