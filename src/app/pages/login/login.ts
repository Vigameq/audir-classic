import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthState } from '../../auth-state';
import { AuthService } from '../../services/auth.service';
import { DataSyncService } from '../../services/data-sync.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthState);
  private readonly authService = inject(AuthService);
  private readonly dataSync = inject(DataSyncService);

  protected email = '';
  protected password = '';
  protected loginError = '';
  protected role = '';

  protected signIn(): void {
    this.loginError = '';
    this.authService.login(this.email, this.password).subscribe({
      next: (token) => {
        this.auth.login(token.access_token, this.role, this.email);
        this.dataSync.syncAll().subscribe({
          next: () => this.router.navigate(['/dashboard']),
          error: () => this.router.navigate(['/dashboard']),
        });
      },
      error: () => {
        this.loginError = 'Invalid credentials. Please try again.';
      },
    });
  }
}
