import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NcRecord, NcService } from '../../services/nc.service';

@Component({
  selector: 'app-nc-management',
  imports: [CommonModule, FormsModule],
  templateUrl: './nc-management.html',
  styleUrl: './nc-management.scss',
})
export class NcManagement implements OnInit {
  private readonly ncService = inject(NcService);
  protected activeRecord: NcRecord | null = null;
  protected ncResponse = {
    rootCause: '',
    containmentAction: '',
    correctiveAction: '',
    preventiveAction: '',
    evidenceFile: '',
  };

  protected get ncRecords(): NcRecord[] {
    return this.ncService.records();
  }

  ngOnInit(): void {
    this.ncService.listRecords().subscribe();
  }

  protected openRecord(record: NcRecord): void {
    this.activeRecord = record;
    this.ncResponse = {
      rootCause: record.rootCause || '',
      containmentAction: record.containmentAction || '',
      correctiveAction: record.correctiveAction || '',
      preventiveAction: record.preventiveAction || '',
      evidenceFile: record.evidenceName || '',
    };
  }

  protected closeRecord(): void {
    this.activeRecord = null;
  }

  protected onEvidenceSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.ncResponse.evidenceFile = file ? file.name : '';
    input.value = '';
  }

  protected submitNc(): void {
    if (!this.activeRecord) {
      return;
    }
    this.ncService
      .upsertAction({
        answer_id: this.activeRecord.answerId,
        root_cause: this.ncResponse.rootCause || null,
        containment_action: this.ncResponse.containmentAction || null,
        corrective_action: this.ncResponse.correctiveAction || null,
        preventive_action: this.ncResponse.preventiveAction || null,
        evidence_name: this.ncResponse.evidenceFile || null,
        status: 'Submitted',
      })
      .subscribe({
        next: () => {
          this.closeRecord();
          this.ncService.listRecords().subscribe();
        },
      });
  }

  protected saveNc(): void {
    if (!this.activeRecord) {
      return;
    }
    this.ncService
      .upsertAction({
        answer_id: this.activeRecord.answerId,
        root_cause: this.ncResponse.rootCause || null,
        containment_action: this.ncResponse.containmentAction || null,
        corrective_action: this.ncResponse.correctiveAction || null,
        preventive_action: this.ncResponse.preventiveAction || null,
        evidence_name: this.ncResponse.evidenceFile || null,
        status: 'Saved',
      })
      .subscribe({
        next: () => {
          this.closeRecord();
          this.ncService.listRecords().subscribe();
        },
      });
  }
}
