import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
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
  protected viewRecord: NcRecord | null = null;
  protected readonly currentUserId = signal<number | null>(null);
  protected ncResponse = {
    rootCause: '',
    containmentAction: '',
    correctiveAction: '',
    preventiveAction: '',
    evidenceFile: '',
  };
  protected users: User[] = [];
  private usersLoaded = false;
  private usersLoading = false;

  protected readonly ncRecords = computed(() => {
    const records = this.ncService.records();
    const currentUserId = this.currentUserId();
    let department = this.auth.department().trim().toLowerCase();
    if (!department && currentUserId) {
      const currentUser = this.users.find((user) => user.id === currentUserId);
      department = String(currentUser?.department ?? '').trim().toLowerCase();
    }
    return records.filter((record) => {
      const status = (record.status || 'Assigned').toLowerCase();
      const allowed = status === 'assigned' || status === 'rework' || status === 'in progress';
      if (!allowed) {
        return false;
      }
      const assignedUserId = record.assignedUserId;
      if (assignedUserId && currentUserId && assignedUserId === currentUserId) {
        return true;
      }
      if (!department) {
        return false;
      }
      return record.assignedNc?.trim().toLowerCase() === department;
    });
  });

  protected readonly pendingReviewRecords = computed(() => {
    const records = this.ncService.records().filter((record) => {
      const status = (record.status || '').toLowerCase();
      return status === 'resolution submitted';
    });
    if (this.auth.role() !== 'Auditor') {
      return records;
    }
    const fullName = `${this.auth.firstName()} ${this.auth.lastName()}`.trim().toLowerCase();
    if (!fullName) {
      return [];
    }
    return records.filter(
      (record) => record.auditorName.trim().toLowerCase() === fullName
    );
  });

  ngOnInit(): void {
    this.ncService.listRecords().subscribe();
    this.loadUsers();
  }

  protected openRecord(record: NcRecord): void {
    this.viewRecord = null;
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

  protected openReview(record: NcRecord): void {
    this.activeRecord = null;
    this.viewRecord = record;
  }

  protected closeReview(): void {
    this.viewRecord = null;
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

  protected canPerformNc(record: NcRecord): boolean {
    const currentUserId = this.getCurrentUserId();
    if (record.assignedUserId && currentUserId) {
      return record.assignedUserId === currentUserId;
    }
    return false;
  }

  private getCurrentUserId(): number | null {
    const existing = this.currentUserId();
    if (existing) {
      return existing;
    }
    const email = this.auth.email().trim().toLowerCase();
    if (!email) {
      return null;
    }
    const match = this.users.find((user) => user.email.toLowerCase() === email);
    if (match?.id) {
      this.currentUserId.set(match.id);
      return match.id;
    }
    return null;
  }

  protected usersForDepartment(department: string): User[] {
    const target = String(department ?? '').trim().toLowerCase();
    if (!target) {
      return [];
    }
    if (!this.usersLoaded && !this.usersLoading) {
      this.loadUsers();
    }
    return this.users.filter((user) => {
      const userDepartment = String(user.department ?? '').trim().toLowerCase();
      const status = String(user.status ?? '').trim().toLowerCase();
      return userDepartment === target && status === 'active';
    });
  }

  protected userLabel(user: User): string {
    const name = `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim();
    return name || user.email;
  }

  protected assignUser(record: NcRecord, value: string | number): void {
    if (record.assignedUserId) {
      return;
    }
    const selectedId = Number(value);
    if (!selectedId) {
      return;
    }
    const status = record.status || 'Assigned';
    this.ncService.assignUser(record.answerId, selectedId, status).subscribe({
      next: () => {
        this.ncService.listRecords().subscribe();
      },
    });
  }

  protected approveNc(record: NcRecord): void {
    this.ncService
      .upsertAction({
        answer_id: record.answerId,
        root_cause: record.rootCause || null,
        containment_action: record.containmentAction || null,
        corrective_action: record.correctiveAction || null,
        preventive_action: record.preventiveAction || null,
        evidence_name: record.evidenceName || null,
        status: 'Closed',
      })
      .subscribe({
        next: () => this.ncService.listRecords().subscribe(),
      });
  }

  protected requestRework(record: NcRecord): void {
    this.ncService
      .upsertAction({
        answer_id: record.answerId,
        root_cause: record.rootCause || null,
        containment_action: record.containmentAction || null,
        corrective_action: record.correctiveAction || null,
        preventive_action: record.preventiveAction || null,
        evidence_name: record.evidenceName || null,
        status: 'Rework',
      })
      .subscribe({
        next: () => this.ncService.listRecords().subscribe(),
      });
  }

  private loadUsers(): void {
    if (this.usersLoading) {
      return;
    }
    this.usersLoading = true;
    this.userService.listUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.usersLoaded = true;
        const email = this.auth.email().trim().toLowerCase();
        const current = email
          ? users.find((user) => user.email.toLowerCase() === email)
          : undefined;
        this.currentUserId.set(current?.id ?? null);
      },
      error: () => {
        this.usersLoaded = false;
      },
      complete: () => {
        this.usersLoading = false;
      },
    });
  }
}
