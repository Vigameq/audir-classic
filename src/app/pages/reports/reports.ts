import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { firstValueFrom, forkJoin } from 'rxjs';
import { jsPDF } from 'jspdf';
import { AuditAnswerRecord, AuditAnswerService } from '../../services/audit-answer.service';
import { AuditPlanRecord, AuditPlanService } from '../../services/audit-plan.service';
import { NcRecord, NcService } from '../../services/nc.service';
import { TemplateService } from '../../services/template.service';

@Component({
  selector: 'app-reports',
  imports: [CommonModule],
  templateUrl: './reports.html',
  styleUrl: './reports.scss',
})
export class Reports implements OnInit {
  private readonly auditPlanService = inject(AuditPlanService);
  private readonly auditAnswerService = inject(AuditAnswerService);
  private readonly ncService = inject(NcService);
  private readonly templateService = inject(TemplateService);

  protected reportAudits: AuditPlanRecord[] = [];
  protected loading = true;
  protected error = '';
  protected generating: Record<string, boolean> = {};
  private ncRecords: NcRecord[] = [];

  ngOnInit(): void {
    this.loading = true;
    this.error = '';
    forkJoin([
      this.auditPlanService.migrateFromLocal(),
      this.templateService.migrateFromLocal(),
      this.ncService.listRecords(),
    ]).subscribe({
      next: ([, , ncRecords]) => {
        this.ncRecords = ncRecords;
        this.loadReportableAudits();
      },
      error: () => {
        this.loading = false;
        this.error = 'Unable to load reports.';
      },
    });
  }

  protected formatDate(value: string): string {
    if (!value) {
      return '—';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleDateString('en-GB');
  }

  protected async downloadReport(audit: AuditPlanRecord): Promise<void> {
    if (this.generating[audit.code]) {
      return;
    }
    this.generating[audit.code] = true;
    try {
      const answers = await firstValueFrom(this.auditAnswerService.listByAuditCode(audit.code));
      const ncRecords = this.ncRecords.filter((record) => record.auditCode === audit.code);
      if (!this.isAuditClosed(audit, answers, ncRecords)) {
        window.alert('This audit is not closed yet.');
        return;
      }
      this.buildPdf(audit, answers, ncRecords);
    } finally {
      this.generating[audit.code] = false;
    }
  }

  private loadReportableAudits(): void {
    const audits = this.auditPlanService.plans();
    if (!audits.length) {
      this.reportAudits = [];
      this.loading = false;
      return;
    }
    forkJoin(audits.map((audit) => this.auditAnswerService.listByAuditCode(audit.code))).subscribe({
      next: (answersList) => {
        this.reportAudits = audits.filter((audit, index) => {
          const answers = answersList[index] ?? [];
          const ncRecords = this.ncRecords.filter((record) => record.auditCode === audit.code);
          return this.isAuditClosed(audit, answers, ncRecords);
        });
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error = 'Unable to load reports.';
      },
    });
  }

  private isAuditClosed(
    audit: AuditPlanRecord,
    answers: AuditAnswerRecord[],
    ncRecords: NcRecord[]
  ): boolean {
    if (!answers.length) {
      return false;
    }
    const submittedCount = answers.filter((answer) => answer.status === 'Submitted').length;
    const openStatuses = new Set([
      'Assigned',
      'In Progress',
      'Rework',
      'Resolution Submitted',
      'Pending Review',
    ]);
    const hasOpenNc = ncRecords.some((record) => openStatuses.has(record.status ?? ''));
    return submittedCount >= answers.length && !hasOpenNc;
  }

  private getTemplateQuestionCount(auditType: string, answers: AuditAnswerRecord[]): number {
    const template = this.templateService.templates().find((item) => item.name === auditType);
    if (template?.questions.length) {
      return template.questions.length;
    }
    const maxIndex = answers.reduce((max, answer) => Math.max(max, answer.questionIndex), -1);
    return maxIndex >= 0 ? maxIndex + 1 : answers.length;
  }

  private buildPdf(
    audit: AuditPlanRecord,
    answers: AuditAnswerRecord[],
    ncRecords: NcRecord[]
  ): void {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const margin = 40;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let y = margin;

    doc.setFontSize(18);
    doc.text('Audit Report', margin, y);
    y += 24;

    doc.setFontSize(11);
    const meta = [
      `Audit code: ${audit.code}`,
      `Audit type: ${audit.auditType || '—'}`,
      `Audit subtype: ${audit.auditSubtype || '—'}`,
      `Auditor: ${audit.auditorName || '—'}`,
      `Dates: ${this.formatDate(audit.startDate)} → ${this.formatDate(audit.endDate)}`,
    ];
    meta.forEach((line) => {
      doc.text(line, margin, y);
      y += 16;
    });

    y += 8;
    y = this.drawCharts(doc, margin, y, pageWidth - margin * 2, answers, ncRecords);
    y += 16;

    const sortedAnswers = [...answers].sort((a, b) => a.questionIndex - b.questionIndex);
    sortedAnswers.forEach((answer) => {
      const questionTitle = `Q${answer.questionIndex + 1}. ${answer.questionText || '—'}`;
      y = this.ensureSpace(doc, y, pageHeight, 120);
      doc.setFontSize(11);
      const questionLines = doc.splitTextToSize(questionTitle, pageWidth - margin * 2);
      doc.text(questionLines, margin, y);
      y += questionLines.length * 14;

      const detailLines = [
        `Response: ${answer.response || '—'}`,
        `Assigned NC: ${answer.assignedNc || '—'}`,
        `Auditor note: ${answer.note || '—'}`,
      ];
      doc.setFontSize(10);
      detailLines.forEach((line) => {
        const lines = doc.splitTextToSize(line, pageWidth - margin * 2);
        doc.text(lines, margin, y);
        y += lines.length * 13;
      });

      const evidenceDataUrl =
        answer.evidenceDataUrl || this.getEvidenceDataUrl(audit.code, answer.questionIndex);
      if (evidenceDataUrl) {
        const format = evidenceDataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';
        const imageWidth = 220;
        const imageHeight = 140;
        y = this.ensureSpace(doc, y, pageHeight, imageHeight + 20);
        doc.text('Evidence:', margin, y);
        y += 12;
        doc.addImage(evidenceDataUrl, format, margin, y, imageWidth, imageHeight);
        y += imageHeight + 12;
      } else if (answer.evidenceName) {
        doc.text(`Evidence: ${answer.evidenceName}`, margin, y);
        y += 14;
      }

      y += 10;
    });

    doc.save(`audit-${audit.code}.pdf`);
  }

  private drawCharts(
    doc: jsPDF,
    x: number,
    y: number,
    width: number,
    answers: AuditAnswerRecord[],
    ncRecords: NcRecord[]
  ): number {
    const total = answers.length || 1;
    const negative = answers.filter((answer) => answer.responseIsNegative).length;
    const positive = total - negative;
    const statusCounts = ncRecords.reduce<Record<string, number>>((acc, record) => {
      const key = record.status || 'Unassigned';
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});

    doc.setFontSize(12);
    doc.text('Response distribution', x, y);
    y += 14;

    const barHeight = 12;
    const maxBarWidth = width;
    const positiveWidth = (positive / total) * maxBarWidth;
    const negativeWidth = (negative / total) * maxBarWidth;

    doc.setFillColor(233, 245, 236);
    doc.rect(x, y, positiveWidth, barHeight, 'F');
    doc.setFillColor(255, 226, 200);
    doc.rect(x + positiveWidth, y, negativeWidth, barHeight, 'F');
    doc.setTextColor(80, 80, 80);
    doc.text(`Positive: ${positive}`, x + maxBarWidth + 10, y + 10);
    y += barHeight + 18;

    doc.setFontSize(12);
    doc.text('NC status', x, y);
    y += 14;
    doc.setFontSize(10);
    Object.entries(statusCounts).forEach(([status, count]) => {
      doc.text(`${status}: ${count}`, x, y);
      y += 12;
    });

    doc.setTextColor(0, 0, 0);
    return y;
  }

  private ensureSpace(doc: jsPDF, y: number, pageHeight: number, needed: number): number {
    if (y + needed <= pageHeight - 40) {
      return y;
    }
    doc.addPage();
    return 40;
  }

  private getEvidenceDataUrl(auditCode: string, index: number): string {
    const key = `audir_evidence_${auditCode}_${index}`;
    return localStorage.getItem(key) ?? '';
  }
}
