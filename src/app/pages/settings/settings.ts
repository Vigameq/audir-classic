import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { DepartmentService } from '../../services/department.service';

@Component({
  selector: 'app-settings',
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class Settings {
  private readonly departmentService = inject(DepartmentService);
  protected newDepartment = '';

  protected get departments(): string[] {
    return this.departmentService.departments();
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
}
