import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { AuditPlanRecord, AuditPlanService } from '../../services/audit-plan.service';

@Component({
  selector: 'app-audit-manage',
  imports: [CommonModule],
  templateUrl: './audit-manage.html',
  styleUrl: './audit-manage.scss',
})
export class AuditManage {
  private readonly auditPlanService = inject(AuditPlanService);

  protected get audits(): AuditPlanRecord[] {
    return [...this.auditPlanService.plans()].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt)
    );
  }
}
