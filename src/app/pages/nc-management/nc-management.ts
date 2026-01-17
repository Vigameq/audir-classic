import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthState } from '../../auth-state';
import { NcRecord, NcService } from '../../services/nc.service';
import { User, UserService } from '../../services/user.service';

@Component({
  selector: 'app-nc-management',
  imports: [CommonModule, FormsModule],
  templateUrl: './nc-management.html',
  styleUrl: './nc-management.scss',
})
export class NcManagement implements OnInit {
  private readonly auth = inject(AuthState);
  private readonly ncService = inject(NcService);
  private readonly userService = inject(UserService);
  protected activeRecord: NcRecord | null = null;
  private currentUserId: number | null = null;
  protected ncResponse = {
    rootCause: '',
    containmentAction: '',
    correctiveAction: '',
    preventiveAction: '',
    evidenceFile: '',
  };
  protected users: User[] = [];

  protected get ncRecords(): NcRecord[] {
    const records = this.ncService.records();
    const department = this.auth.department().trim().toLowerCase();
    return records.filter((record) => {
      const status = (record.status || 'Assigned').toLowerCase();
      const allowed = status === 'assigned' || status === 'rework' || status === 'in progress';
      if (!allowed) {
        return false;
      }
      const assignedUserId = record.assignedUserId;
      if (assignedUserId && this.currentUserId) {
        return assignedUserId === this.currentUserId;
      }
      if (!department) {
        return false;
      }
      return record.assignedNc?.trim().toLowerCase() === department;
    });
  }

  ngOnInit(): void {
    this.ncService.listRecords().subscribe();
    this.userService.listUsers().subscribe({
      next: (users) => {
        this.users = users;
        const email = this.auth.email();
        const current = email ? users.find((user) => user.email === email) : undefined;
        this.currentUserId = current?.id ?? null;
      },
    });
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
        status: 'Resolution Submitted',
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
        status: 'In Progress',
      })
      .subscribe({
        next: () => {
          this.closeRecord();
          this.ncService.listRecords().subscribe();
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
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  protected assignToMe(record: NcRecord): void {
    if (record.assignedUserId) {
      return;
    }
    if (!this.currentUserId) {
      const email = this.auth.email();
      const match = email ? this.users.find((user) => user.email === email) : undefined;
      this.currentUserId = match?.id ?? null;
    }
    if (!this.currentUserId) {
      return;
    }
    const confirmed = window.confirm('Assign this NC to you?');
    if (!confirmed) {
      return;
    }
    const currentUser = this.users.find((user) => user.id === this.currentUserId);
    const label = currentUser
      ? `${currentUser.first_name ?? ''} ${currentUser.last_name ?? ''}`.trim() || currentUser.email
      : '';
    record.assignedUserId = this.currentUserId;
    record.assignedUserName = label || record.assignedUserName;
    record.assignedUserEmail = currentUser?.email || this.auth.email() || record.assignedUserEmail;
    const status = record.status || 'Assigned';
    this.ncService.assignUser(record.answerId, this.currentUserId, status).subscribe({
      next: () => {
        this.ncService.listRecords().subscribe();
      },
    });
  }

  protected getAssignedUserLabel(record: NcRecord): string {
    if (record.assignedUserName) {
      return record.assignedUserName;
    }
    if (record.assignedUserEmail) {
      return record.assignedUserEmail;
    }
    if (record.assignedUserId) {
      return 'Assigned';
    }
    return 'Unassigned';
  }
}
