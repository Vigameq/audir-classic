import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { AuditPlanRecord, AuditPlanService } from '../../services/audit-plan.service';
import { DepartmentService } from '../../services/department.service';
import { RegionService } from '../../services/region.service';
import { ResponseService } from '../../services/response.service';
import { SiteService } from '../../services/site.service';
import { User, UserService } from '../../services/user.service';

@Component({
  selector: 'app-audit-manage',
  imports: [CommonModule, FormsModule],
  templateUrl: './audit-manage.html',
  styleUrl: './audit-manage.scss',
})
export class AuditManage implements OnInit {
  private readonly auditPlanService = inject(AuditPlanService);
  private readonly userService = inject(UserService);
  private readonly departmentService = inject(DepartmentService);
  private readonly siteService = inject(SiteService);
  private readonly regionService = inject(RegionService);
  private readonly responseService = inject(ResponseService);

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

  protected get audits(): AuditPlanRecord[] {
    return [...this.auditPlanService.plans()].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt)
    );
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
    this.userService.listUsers().subscribe({
      next: (users) => {
        this.auditors = users.filter((user) => user.role === 'Auditor');
      },
    });
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
    this.auditPlanService.updatePlan(this.activeAudit.id, {
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
    });
    this.closeEdit(form);
  }

  protected deleteAudit(audit: AuditPlanRecord): void {
    if (!confirm('Delete this audit? This cannot be undone.')) {
      return;
    }
    if (this.activeAudit?.id === audit.id) {
      this.activeAudit = null;
    }
    this.auditPlanService.deletePlan(audit.id);
  }
}
