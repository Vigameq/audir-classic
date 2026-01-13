import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthState } from '../../auth-state';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  private readonly auth = inject(AuthState);

  protected get dashboardTitle(): string {
    const role = this.auth.role();
    if (role === 'Auditor') {
      return 'Auditor Overview';
    }
    if (role === 'Manager') {
      return 'Manager Overview';
    }
    if (role === 'Super Admin') {
      return 'Super Admin Overview';
    }
    return 'Dashboard';
  }

  protected get isAuditor(): boolean {
    return this.auth.role() === 'Auditor';
  }

  protected get isManager(): boolean {
    return this.auth.role() === 'Manager';
  }

  protected get isSuperAdmin(): boolean {
    return this.auth.role() === 'Super Admin';
  }

}
