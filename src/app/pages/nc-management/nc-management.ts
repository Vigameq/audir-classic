import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NcRecord, NcService } from '../../services/nc.service';

@Component({
  selector: 'app-nc-management',
  imports: [CommonModule, FormsModule],
  templateUrl: './nc-management.html',
  styleUrl: './nc-management.scss',
})
export class NcManagement {
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

  protected openRecord(record: NcRecord): void {
    this.activeRecord = record;
    this.ncResponse = {
      rootCause: '',
      containmentAction: '',
      correctiveAction: '',
      preventiveAction: '',
      evidenceFile: '',
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
    // no-op for now
  }

  protected saveNc(): void {
    // no-op for now
  }
}
