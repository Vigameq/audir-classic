import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import QRCode from 'qrcode';
import { firstValueFrom } from 'rxjs';
import { AuditPlanRecord, AuditPlanService } from '../../services/audit-plan.service';
import { DepartmentService } from '../../services/department.service';
import { NcService } from '../../services/nc.service';
import { ResponseService } from '../../services/response.service';
import { TemplateRecord, TemplateService } from '../../services/template.service';

@Component({
  selector: 'app-audit-perform',
  imports: [CommonModule, FormsModule],
  templateUrl: './audit-perform.html',
  styleUrl: './audit-perform.scss',
})
export class AuditPerform implements OnInit {
  private readonly auditPlanService = inject(AuditPlanService);
  private readonly templateService = inject(TemplateService);
  private readonly responseService = inject(ResponseService);
  private readonly departmentService = inject(DepartmentService);
  private readonly ncService = inject(NcService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

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
  protected negativeResponseOptions: string[] = [];
  protected responseSelections: string[] = [];
  protected noteWords: number[] = [];
  protected ncAssignments: string[] = [];
  protected savedQuestions: boolean[] = [];
  protected evidenceFiles: string[] = [];
  protected noteEntries: string[] = [];
  protected noteHover: string | null = null;
  protected isQrGenerating: Record<string, boolean> = {};

  protected get totalQuestions(): number {
    return this.activeTemplate?.questions.length ?? 0;
  }

  protected get answeredCount(): number {
    return this.responseSelections.filter((value) => value && value.trim().length > 0).length;
  }
  protected filterStart = '';
  protected filterEnd = '';
  protected sortOrder: 'asc' | 'desc' = 'desc';

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const code = params.get('code');
      if (!code) {
        return;
      }
      void this.loadAuditByCode(code);
    });
  }

  private async loadAuditByCode(code: string): Promise<void> {
    const audit =
      this.auditPlanService.plans().find((item) => item.code === code) ??
      (await firstValueFrom(this.auditPlanService.fetchByCode(code)));
    if (!audit) {
      return;
    }
    if (!this.templateService.templates().length) {
      await firstValueFrom(this.templateService.syncFromApi());
    }
    if (!this.responseService.responses().length) {
      await firstValueFrom(this.responseService.syncFromApi());
    }
    if (!this.departmentService.departments().length) {
      await firstValueFrom(this.departmentService.syncFromApi());
    }
    this.openPerform(audit);
  }

  protected openPerform(audit: AuditPlanRecord): void {
    this.activeAudit = audit;
    this.router.navigate(['/audit-perform', audit.code], { replaceUrl: true });
    this.activeTemplate =
      this.templateService.templates().find((template) => template.name === audit.auditType) ??
      null;
    const response = this.responseService
      .responses()
      .find((item) => item.name === audit.responseType);
    this.responseOptions = response?.types ?? [];
    this.negativeResponseOptions = response?.negativeTypes ?? [];
    this.responseSelections = [];
    this.noteWords = this.activeTemplate
      ? new Array(this.activeTemplate.questions.length).fill(0)
      : [];
    this.ncAssignments = this.activeTemplate
      ? new Array(this.activeTemplate.questions.length).fill('')
      : [];
    this.savedQuestions = this.activeTemplate
      ? new Array(this.activeTemplate.questions.length).fill(false)
      : [];
    this.evidenceFiles = this.activeTemplate
      ? new Array(this.activeTemplate.questions.length).fill('')
      : [];
    this.noteEntries = this.activeTemplate
      ? new Array(this.activeTemplate.questions.length).fill('')
      : [];
  }

  protected closePerform(): void {
    this.activeAudit = null;
    this.activeTemplate = null;
    this.responseOptions = [];
    this.negativeResponseOptions = [];
    this.responseSelections = [];
    this.noteWords = [];
    this.ncAssignments = [];
    this.savedQuestions = [];
    this.evidenceFiles = [];
    this.noteEntries = [];
    this.router.navigate(['/audit-perform'], { replaceUrl: true });
  }

  protected get departments(): string[] {
    return this.departmentService.departments();
  }

  protected saveQuestion(index: number): void {
    this.savedQuestions[index] = true;
  }

  protected submitQuestion(index: number): void {
    if (!this.activeAudit || !this.activeTemplate) {
      return;
    }
    if (!this.isNegativeSelection(index)) {
      return;
    }
    const response = this.responseSelections[index];
    if (!response) {
      return;
    }
    this.ncService.addRecord({
      id: crypto.randomUUID(),
      auditCode: this.activeAudit.code,
      auditType: this.activeAudit.auditType,
      auditSubtype: this.activeAudit.auditSubtype || '—',
      startDate: this.activeAudit.startDate,
      endDate: this.activeAudit.endDate,
      auditorName: this.activeAudit.auditorName || '—',
      question: this.activeTemplate.questions[index] ?? '',
      response,
      assignedNc: this.ncAssignments[index] || '—',
      note: this.noteEntries[index] || '',
      createdAt: new Date().toISOString(),
    });
    this.savedQuestions[index] = true;
  }

  protected isNegativeSelection(index: number): boolean {
    const selected = this.responseSelections[index];
    return !!selected && this.negativeResponseOptions.includes(selected);
  }

  protected onResponseChange(index: number): void {
    if (!this.isNegativeSelection(index)) {
      this.ncAssignments[index] = '';
    }
  }

  protected onEvidenceSelected(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.evidenceFiles[index] = file ? file.name : '';
    input.value = '';
  }

  protected countWords(value: string): number {
    const trimmed = value.trim();
    if (!trimmed) {
      return 0;
    }
    return trimmed.split(/\s+/).length;
  }

  protected async downloadQr(audit: AuditPlanRecord): Promise<void> {
    if (this.isQrGenerating[audit.id]) {
      return;
    }
    this.isQrGenerating[audit.id] = true;
    try {
      const url = `${window.location.origin}/audit-perform/${audit.code}`;
      const dataUrl = await QRCode.toDataURL(url, { margin: 1, width: 320 });
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `audit-${audit.code}.png`;
      link.click();
    } finally {
      this.isQrGenerating[audit.id] = false;
    }
  }
}
