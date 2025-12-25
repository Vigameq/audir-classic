import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { AuditPlanService } from '../../services/audit-plan.service';

@Component({
  selector: 'app-audit-perform',
  imports: [CommonModule],
  templateUrl: './audit-perform.html',
  styleUrl: './audit-perform.scss',
})
export class AuditPerform {
  private readonly auditPlanService = inject(AuditPlanService);

  protected get audits() {
    return this.auditPlanService.plans();
  }
}
