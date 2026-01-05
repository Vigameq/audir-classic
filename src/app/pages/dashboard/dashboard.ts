import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { AuthState } from '../../auth-state';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  private readonly auth = inject(AuthState);
  protected readonly auditorSummary = {
    planned: 6,
    completed: 14,
    openFindings: 9,
  };
  protected readonly assignedAudits = [
    {
      code: 'HBP87K',
      type: 'ISO 9001',
      subtype: 'Vendor',
      dateRange: '2026-01-08 → 2026-01-12',
      status: 'Planned',
    },
    {
      code: '965CCJ',
      type: 'ISO 27001',
      subtype: 'Internal',
      dateRange: '2026-01-15 → 2026-01-18',
      status: 'In progress',
    },
    {
      code: '3JK9RM',
      type: 'SOC 2',
      subtype: 'Quarterly',
      dateRange: '2026-01-22 → 2026-01-24',
      status: 'Planned',
    },
  ];
  protected readonly calendarMonth = 'January 2026';
  protected readonly calendarDays = Array.from({ length: 31 }, (_, index) => index + 1);
  protected readonly calendarHighlights = new Set([8, 15, 22, 24]);

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
}
