import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { DepartmentService } from '../../services/department.service';
import { RegionService } from '../../services/region.service';
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
  protected newDepartment = '';
  protected newSite = '';
  protected newRegion = '';
  protected showResponseModal = false;
  protected responseName = '';
  protected responseTypeInput = '';
  protected responseTypes: string[] = [];
  protected responses: { name: string; types: string[] }[] = [];

  protected get departments(): string[] {
    return this.departmentService.departments();
  }

  protected get sites(): string[] {
    return this.siteService.sites();
  }

  protected get regions(): string[] {
    return this.regionService.regions();
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

  protected openResponseModal(): void {
    this.showResponseModal = true;
  }

  protected closeResponseModal(): void {
    this.showResponseModal = false;
    this.responseName = '';
    this.responseTypeInput = '';
    this.responseTypes = [];
  }

  protected addResponse(): void {
    const name = this.responseName.trim();
    if (!name || !this.responseTypes.length) {
      return;
    }
    this.responses = [{ name, types: [...this.responseTypes] }, ...this.responses];
    this.closeResponseModal();
  }

  protected addResponseType(): void {
    const value = this.responseTypeInput.trim();
    if (!value) {
      return;
    }
    if (this.responseTypes.includes(value)) {
      this.responseTypeInput = '';
      return;
    }
    this.responseTypes = [...this.responseTypes, value];
    this.responseTypeInput = '';
  }

  protected removeResponseType(value: string): void {
    this.responseTypes = this.responseTypes.filter((item) => item !== value);
  }

}
