import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthState } from '../../auth-state';
import { AuditPlanRecord, AuditPlanService } from '../../services/audit-plan.service';
import { NcRecord, NcService } from '../../services/nc.service';
import { TemplateService } from '../../services/template.service';
import { User, UserService } from '../../services/user.service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private readonly auth = inject(AuthState);
  private readonly auditPlanService = inject(AuditPlanService);
  private readonly ncService = inject(NcService);
  private readonly userService = inject(UserService);
  private readonly templateService = inject(TemplateService);
  protected users: User[] = [];

  ngOnInit(): void {
    this.auditPlanService.syncFromApi().subscribe();
    this.ncService.listRecords().subscribe();
    this.templateService.syncFromApi().subscribe();
    this.userService.listUsers().subscribe({
      next: (users) => {
        this.users = users;
      },
    });
  }

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

  protected get audits(): AuditPlanRecord[] {
    return this.auditPlanService.plans();
  }

  protected get templatesCount(): number {
    return this.templateService.templates().length;
  }

  protected get auditors(): User[] {
    return this.users.filter((user) => user.role === 'Auditor');
  }

  protected get managers(): User[] {
    return this.users.filter((user) => user.role === 'Manager');
  }

  protected get ncRecords(): NcRecord[] {
    return this.ncService.records();
  }

  protected get assignedAudits(): AuditPlanRecord[] {
    const fullName = this.currentUserName();
    if (!fullName) {
      return [];
    }
    return this.audits.filter(
      (audit) => audit.auditorName.trim().toLowerCase() === fullName
    );
  }


  protected get assignedOpenFindings(): number {
    const assignedCodes = new Set(this.assignedAudits.map((audit) => audit.code));
    return this.ncRecords.filter((record) => {
      const status = (record.status || '').trim().toLowerCase();
      const isClosed = status === 'closed';
      return assignedCodes.has(record.auditCode) && !isClosed;
    }).length;
  }

  protected get auditorChartMax(): number {
    return Math.max(this.assignedAudits.length, this.assignedOpenFindings, this.pendingReviewCount, 1);
  }

  protected chartPercent(value: number, max: number): number {
    if (!max) {
      return 0;
    }
    return Math.min(100, Math.round((value / max) * 100));
  }

  protected get pendingReviewCount(): number {
    const assignedCodes = new Set(this.assignedAudits.map((audit) => audit.code));
    return this.ncRecords.filter((record) => {
      const status = (record.status || '').trim().toLowerCase();
      return status === 'resolution submitted' && assignedCodes.has(record.auditCode);
    }).length;
  }

  protected get pendingReviewAll(): number {
    return this.ncRecords.filter((record) => {
      const status = (record.status || '').trim().toLowerCase();
      return status === 'resolution submitted';
    }).length;
  }

  protected get openNcCount(): number {
    return this.ncRecords.filter((record) => {
      const status = (record.status || '').trim().toLowerCase();
      return status === 'assigned' || status === 'in progress' || status === 'rework';
    }).length;
  }

  protected formatDate(value: string): string {
    if (!value) {
      return '—';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }


  private currentUserName(): string {
    const first = this.auth.firstName().trim();
    const last = this.auth.lastName().trim();
    return `${first} ${last}`.trim().toLowerCase();
  }
}
