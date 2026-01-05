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
  protected readonly auditorCalendars = [
    { label: 'January 2026', days: 31, highlights: [8, 15, 22, 24] },
    { label: 'February 2026', days: 28, highlights: [3, 12, 19, 26] },
    { label: 'March 2026', days: 31, highlights: [5, 11, 18, 27] },
    { label: 'April 2026', days: 30, highlights: [2, 9, 16, 23] },
    { label: 'May 2026', days: 31, highlights: [6, 14, 21, 29] },
    { label: 'June 2026', days: 30, highlights: [4, 13, 20, 28] },
    { label: 'July 2026', days: 31, highlights: [7, 15, 22, 30] },
    { label: 'August 2026', days: 31, highlights: [5, 12, 19, 27] },
    { label: 'September 2026', days: 30, highlights: [3, 10, 17, 25] },
    { label: 'October 2026', days: 31, highlights: [1, 9, 16, 24] },
    { label: 'November 2026', days: 30, highlights: [4, 11, 18, 26] },
    { label: 'December 2026', days: 31, highlights: [2, 8, 15, 23] },
  ];
  protected selectedAuditorMonth = this.auditorCalendars[0];

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

  protected getDays(total: number): number[] {
    return Array.from({ length: total }, (_, index) => index + 1);
  }
}
