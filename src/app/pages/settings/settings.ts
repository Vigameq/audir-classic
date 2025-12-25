import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { DepartmentService } from '../../services/department.service';
import { RegionService } from '../../services/region.service';
import { ResponseTypeService } from '../../services/response-type.service';
import { SiteService } from '../../services/site.service';

@Component({
  selector: 'app-settings',
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class Settings {
  private readonly departmentService = inject(DepartmentService);
  private readonly siteService = inject(SiteService);
  private readonly regionService = inject(RegionService);
  private readonly responseTypeService = inject(ResponseTypeService);
  protected newDepartment = '';
  protected newSite = '';
  protected newRegion = '';
  protected newResponseType = '';

  protected get departments(): string[] {
    return this.departmentService.departments();
  }

  protected get sites(): string[] {
    return this.siteService.sites();
  }

  protected get regions(): string[] {
    return this.regionService.regions();
  }

  protected get responseTypes(): string[] {
    return this.responseTypeService.responseTypes();
  }

  protected addDepartment(form: NgForm): void {
    const value = this.newDepartment.trim();
    if (!value) {
      return;
    }
    this.departmentService.addDepartment(value);
    this.newDepartment = '';
    form.resetForm();
  }

  protected removeDepartment(name: string): void {
    this.departmentService.removeDepartment(name);
  }

  protected addSite(form: NgForm): void {
    const value = this.newSite.trim();
    if (!value) {
      return;
    }
    this.siteService.addSite(value);
    this.newSite = '';
    form.resetForm();
  }

  protected removeSite(name: string): void {
    this.siteService.removeSite(name);
  }

  protected addRegion(form: NgForm): void {
    const value = this.newRegion.trim();
    if (!value) {
      return;
    }
    this.regionService.addRegion(value);
    this.newRegion = '';
    form.resetForm();
  }

  protected removeRegion(name: string): void {
    this.regionService.removeRegion(name);
  }

  protected addResponseType(form: NgForm): void {
    const value = this.newResponseType.trim();
    if (!value) {
      return;
    }
    this.responseTypeService.addResponseType(value);
    this.newResponseType = '';
    form.resetForm();
  }

  protected removeResponseType(name: string): void {
    this.responseTypeService.removeResponseType(name);
  }
}
