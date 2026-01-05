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
  protected readonly managerSummary = {
    totalAudits: 28,
    completedAudits: 19,
    totalAuditors: 8,
    totalTemplates: 12,
    totalRegions: 6,
    totalLocations: 18,
  };
  protected readonly superAdminSummary = {
    totalAuditors: 12,
    totalManagers: 4,
    totalTemplates: 16,
  };
  protected readonly auditorAssignments = [
    { name: 'Asha Menon', assigned: 5, openFindings: 7 },
    { name: 'Priya Shah', assigned: 4, openFindings: 3 },
    { name: 'Aman Rao', assigned: 3, openFindings: 2 },
    { name: 'Ravi Kumar', assigned: 6, openFindings: 5 },
    { name: 'Neha Patel', assigned: 2, openFindings: 1 },
  ];
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
  protected readonly managerCalendarHighlights = new Set([2, 5, 8, 11, 15, 18, 22, 25, 28]);

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
