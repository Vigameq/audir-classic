import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { AuthState } from '../../auth-state';
import { AuditAnswerRecord, AuditAnswerService } from '../../services/audit-answer.service';
import { AuditPlanRecord, AuditPlanService } from '../../services/audit-plan.service';
import { DepartmentService } from '../../services/department.service';
import { NcRecord, NcService } from '../../services/nc.service';
import { RegionService } from '../../services/region.service';
import { ResponseService } from '../../services/response.service';
import { SiteService } from '../../services/site.service';
import { TemplateService } from '../../services/template.service';
import { User, UserService } from '../../services/user.service';

@Component({
  selector: 'app-audit-manage',
  imports: [CommonModule, FormsModule],
  templateUrl: './audit-manage.html',
  styleUrl: './audit-manage.scss',
})
export class AuditManage implements OnInit {
  private readonly auditPlanService = inject(AuditPlanService);
  private readonly auditAnswerService = inject(AuditAnswerService);
  private readonly ncService = inject(NcService);
  private readonly auth = inject(AuthState);
  private readonly userService = inject(UserService);
  private readonly departmentService = inject(DepartmentService);
  private readonly siteService = inject(SiteService);
  private readonly regionService = inject(RegionService);
  private readonly responseService = inject(ResponseService);
  private readonly templateService = inject(TemplateService);

  protected auditors: User[] = [];
  protected activeAudit: AuditPlanRecord | null = null;
  protected editForm = {
    startDate: '',
    endDate: '',
    auditType: '',
    auditSubtype: '',
    auditorName: '',
    department: '',
    locationCity: '',
    site: '',
    country: '',
    region: '',
    auditNote: '',
    responseType: '',
  };
  protected viewAudit: AuditPlanRecord | null = null;
  protected viewResponses: NcRecord[] = [];

  protected completionMap: Record<string, 'Completed' | 'In Progress'> = {};
  protected answersByAudit: Record<string, AuditAnswerRecord[]> = {};
  protected showInProgress = true;
  protected showCompleted = true;

  protected get audits(): AuditPlanRecord[] {
    return [...this.auditPlanService.plans()].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt)
    );
  }

  protected get completedAudits(): AuditPlanRecord[] {
    return this.audits.filter((audit) => this.completionMap[audit.code] === 'Completed');
  }

  protected get inProgressAudits(): AuditPlanRecord[] {
    return this.audits.filter((audit) => this.completionMap[audit.code] !== 'Completed');
  }

  protected readonly citiesByCountry: Record<string, string[]> = {
    India: [
      'Agartala',
      'Agra',
      'Ahmedabad',
      'Ajmer',
      'Aligarh',
      'Allahabad',
      'Amritsar',
      'Aurangabad',
      'Bengaluru',
      'Bhopal',
      'Bhubaneswar',
      'Chandigarh',
      'Chennai',
      'Coimbatore',
      'Cuttack',
      'Dehradun',
      'Delhi',
      'Dhanbad',
      'Faridabad',
      'Gaya',
      'Ghaziabad',
      'Gurugram',
      'Guwahati',
      'Gwalior',
      'Hyderabad',
      'Indore',
      'Jaipur',
      'Jabalpur',
      'Jamshedpur',
      'Jodhpur',
      'Kanpur',
      'Kochi',
      'Kolkata',
      'Kota',
      'Kozhikode',
      'Lucknow',
      'Ludhiana',
      'Madurai',
      'Mangaluru',
      'Meerut',
      'Mumbai',
      'Mysuru',
      'Nagpur',
      'Nashik',
      'Noida',
      'Panaji',
      'Patna',
      'Pimpri-Chinchwad',
      'Pune',
      'Raipur',
      'Rajkot',
      'Ranchi',
      'Surat',
      'Thane',
      'Thiruvananthapuram',
      'Tiruchirappalli',
      'Udaipur',
      'Vadodara',
      'Varanasi',
      'Vijayawada',
      'Visakhapatnam',
    ],
    USA: [
      'Atlanta',
      'Austin',
      'Baltimore',
      'Boston',
      'Charlotte',
      'Chicago',
      'Columbus',
      'Dallas',
      'Denver',
      'Detroit',
      'Houston',
      'Indianapolis',
      'Jacksonville',
      'Kansas City',
      'Las Vegas',
      'Los Angeles',
      'Miami',
      'Minneapolis',
      'Nashville',
      'New York',
      'Orlando',
      'Philadelphia',
      'Phoenix',
      'Pittsburgh',
      'Portland',
      'Raleigh',
      'San Antonio',
      'San Diego',
      'San Francisco',
      'San Jose',
      'Seattle',
      'Tampa',
      'Washington, DC',
    ],
    Canada: [
      'Calgary',
      'Edmonton',
      'Halifax',
      'Hamilton',
      'Kitchener',
      'London',
      'Montreal',
      'Ottawa',
      'Quebec City',
      'Regina',
      'Saskatoon',
      "St. John's",
      'Toronto',
      'Vancouver',
      'Victoria',
      'Winnipeg',
    ],
  };

  protected get cities(): string[] {
    return this.citiesByCountry[this.editForm.country] ?? [];
  }

  protected get departments(): string[] {
    return this.departmentService.departments();
  }

  protected get sites(): string[] {
    return this.siteService.sites();
  }

  protected get regions(): string[] {
    return this.regionService.regions();
  }

  protected get responses(): string[] {
    return this.responseService.responses().map((response) => response.name);
  }

  ngOnInit(): void {
    this.auditPlanService.migrateFromLocal().subscribe();
    this.departmentService.migrateFromLocal().subscribe();
    this.siteService.migrateFromLocal().subscribe();
    this.regionService.migrateFromLocal().subscribe();
    this.responseService.migrateFromLocal().subscribe();
    this.templateService.migrateFromLocal().subscribe();
    this.ncService.listRecords().subscribe();
    this.userService.listUsers().subscribe({
      next: (users) => {
        this.auditors = users.filter((user) => user.role === 'Auditor');
      },
    });
    this.loadAuditProgress();
  }

  protected openEdit(audit: AuditPlanRecord): void {
    this.activeAudit = audit;
    this.editForm = {
      startDate: audit.startDate,
      endDate: audit.endDate,
      auditType: audit.auditType,
      auditSubtype: audit.auditSubtype,
      auditorName: audit.auditorName,
      department: audit.department,
      locationCity: audit.locationCity,
      site: audit.site,
      country: audit.country,
      region: audit.region,
      auditNote: audit.auditNote,
      responseType: audit.responseType,
    };
  }

  protected closeEdit(form: NgForm): void {
    form.resetForm();
    this.activeAudit = null;
  }

  protected saveEdit(form: NgForm): void {
    if (!this.activeAudit || form.invalid) {
      return;
    }
    this.auditPlanService
      .updatePlanApi(this.activeAudit.id, {
        startDate: this.editForm.startDate,
        endDate: this.editForm.endDate,
        auditorName: this.editForm.auditorName,
        department: this.editForm.department,
        locationCity: this.editForm.locationCity,
        site: this.editForm.site,
        country: this.editForm.country,
        region: this.editForm.region,
        auditNote: this.editForm.auditNote,
        responseType: this.editForm.responseType,
      })
      .subscribe({
        next: () => this.closeEdit(form),
      });
  }

  protected openView(audit: AuditPlanRecord): void {
    this.viewAudit = audit;
    this.viewResponses = this.ncService
      .records()
      .filter((record) => record.auditCode === audit.code);
  }

  protected closeView(): void {
    this.viewAudit = null;
    this.viewResponses = [];
  }

  protected deleteAudit(audit: AuditPlanRecord): void {
    if (!confirm('Delete this audit? This cannot be undone.')) {
      return;
    }
    if (this.activeAudit?.id === audit.id) {
      this.activeAudit = null;
    }
    this.auditPlanService.deletePlanApi(audit.id).subscribe();
  }

  protected toggleInProgress(): void {
    this.showInProgress = !this.showInProgress;
  }

  protected toggleCompleted(): void {
    this.showCompleted = !this.showCompleted;
  }

  protected getAuditProgress(audit: AuditPlanRecord): { nc: number; nonNc: number } {
    const answers = this.answersByAudit[audit.code] ?? [];
    const submitted = answers.filter((answer) => answer.status === 'Submitted');
    const nc = submitted.filter((answer) => answer.responseIsNegative).length;
    const nonNc = submitted.length - nc;
    return { nc, nonNc };
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

  private loadAuditProgress(): void {
    const audits = this.audits;
    if (!audits.length) {
      this.completionMap = {};
      return;
    }
    forkJoin(
      audits.map((audit) => this.auditAnswerService.listByAuditCode(audit.code))
    ).subscribe({
      next: (allAnswers) => {
        const nextMap: Record<string, 'Completed' | 'In Progress'> = {};
        const nextAnswers: Record<string, AuditAnswerRecord[]> = {};
        audits.forEach((audit, index) => {
          const answers = allAnswers[index] ?? [];
          nextAnswers[audit.code] = answers;
          const totalQuestions = this.getTemplateQuestionCount(audit.auditType);
          const submittedCount = answers.filter((answer) => answer.status === 'Submitted').length;
          nextMap[audit.code] =
            totalQuestions > 0 && submittedCount >= totalQuestions ? 'Completed' : 'In Progress';
        });
        this.completionMap = nextMap;
        this.answersByAudit = nextAnswers;
      },
    });
  }

  private getTemplateQuestionCount(auditType: string): number {
    const template = this.templateService.templates().find((item) => item.name === auditType);
    return template?.questions.length ?? 0;
  }

  private isAuditOwnedByCurrentAuditor(code: string): boolean {
    const audit = this.auditPlanService.plans().find((item) => item.code === code);
    if (!audit) {
      return false;
    }
    const first = this.auth.firstName().trim();
    const last = this.auth.lastName().trim();
    const fullName = `${first} ${last}`.trim().toLowerCase();
    if (!fullName) {
      return false;
    }
    return audit.auditorName.trim().toLowerCase() === fullName;
  }
}
