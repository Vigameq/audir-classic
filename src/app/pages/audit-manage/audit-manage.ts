import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import QRCode from 'qrcode';
import { AuditPlanRecord, AuditPlanService } from '../../services/audit-plan.service';

@Component({
  selector: 'app-audit-manage',
  imports: [CommonModule, RouterModule],
  templateUrl: './audit-manage.html',
  styleUrl: './audit-manage.scss',
})
export class AuditManage {
  private readonly auditPlanService = inject(AuditPlanService);

  protected isQrGenerating: Record<string, boolean> = {};

  protected get audits(): AuditPlanRecord[] {
    return [...this.auditPlanService.plans()].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt)
    );
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
