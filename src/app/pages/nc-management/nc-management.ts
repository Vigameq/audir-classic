import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { NcRecord, NcService } from '../../services/nc.service';

@Component({
  selector: 'app-nc-management',
  imports: [CommonModule],
  templateUrl: './nc-management.html',
  styleUrl: './nc-management.scss',
})
export class NcManagement {
  private readonly ncService = inject(NcService);
  protected activeRecord: NcRecord | null = null;

  protected get ncRecords(): NcRecord[] {
    return this.ncService.records();
  }

  protected openRecord(record: NcRecord): void {
    this.activeRecord = record;
  }

  protected closeRecord(): void {
    this.activeRecord = null;
  }
}
