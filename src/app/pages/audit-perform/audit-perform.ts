import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuditPlanRecord, AuditPlanService } from '../../services/audit-plan.service';
import { ResponseService } from '../../services/response.service';
import { TemplateRecord, TemplateService } from '../../services/template.service';

@Component({
  selector: 'app-audit-perform',
  imports: [CommonModule, FormsModule],
  templateUrl: './audit-perform.html',
  styleUrl: './audit-perform.scss',
})
export class AuditPerform {
  private readonly auditPlanService = inject(AuditPlanService);
  private readonly templateService = inject(TemplateService);
  private readonly responseService = inject(ResponseService);

  protected get audits() {
    const audits = this.auditPlanService.plans();
    const start = this.filterStart ? new Date(this.filterStart) : null;
    const end = this.filterEnd ? new Date(this.filterEnd) : null;
    const filtered = audits.filter((audit) => {
      const created = new Date(audit.createdAt);
      if (start && created < start) {
        return false;
      }
      if (end) {
        const endOfDay = new Date(end);
        endOfDay.setHours(23, 59, 59, 999);
        if (created > endOfDay) {
          return false;
        }
      }
      return true;
    });
    return filtered.sort((a, b) =>
      this.sortOrder === 'asc'
        ? a.createdAt.localeCompare(b.createdAt)
        : b.createdAt.localeCompare(a.createdAt)
    );
  }

  protected activeAudit: AuditPlanRecord | null = null;
  protected activeTemplate: TemplateRecord | null = null;
  protected responseOptions: string[] = [];
  protected responseSelections: string[] = [];
  protected filterStart = '';
  protected filterEnd = '';
  protected sortOrder: 'asc' | 'desc' = 'desc';

  protected openPerform(audit: AuditPlanRecord): void {
    this.activeAudit = audit;
    this.activeTemplate =
      this.templateService.templates().find((template) => template.name === audit.auditType) ??
      null;
    const response = this.responseService
      .responses()
      .find((item) => item.name === audit.responseType);
    this.responseOptions = response?.types ?? [];
    this.responseSelections = [];
  }

  protected closePerform(): void {
    this.activeAudit = null;
    this.activeTemplate = null;
    this.responseOptions = [];
    this.responseSelections = [];
  }
}
