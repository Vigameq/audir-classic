import { Injectable, signal } from '@angular/core';

export type NcRecord = {
  id: string;
  auditCode: string;
  auditType: string;
  auditSubtype: string;
  startDate: string;
  endDate: string;
  auditorName: string;
  question: string;
  response: string;
  assignedNc: string;
  note: string;
  createdAt: string;
};

const STORAGE_KEY = 'audir_nc_records';

@Injectable({ providedIn: 'root' })
export class NcService {
  private readonly recordsSignal = signal<NcRecord[]>(this.loadRecords());

  readonly records = this.recordsSignal.asReadonly();

  addRecord(record: NcRecord): void {
    const next = [record, ...this.recordsSignal()];
    this.recordsSignal.set(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  private loadRecords(): NcRecord[] {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed as NcRecord[];
      }
    } catch {
      return [];
    }
    return [];
  }
}
