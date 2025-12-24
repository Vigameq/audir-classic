import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';

type UserRow = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  department: string;
  role: string;
  status: string;
  lastActive: string;
};

@Component({
  selector: 'app-user-management',
  imports: [CommonModule, FormsModule],
  templateUrl: './user-management.html',
  styleUrl: './user-management.scss',
})
export class UserManagement {
  protected showInviteModal = false;
  protected showEditModal = false;
  protected selectedUser: UserRow | null = null;
  protected onboardForm = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: '',
    role: '',
    status: '',
    password: '',
  };

  protected readonly users: UserRow[] = [
    {
      firstName: 'Riya',
      lastName: 'Patel',
      email: 'riya@audir.com',
      department: 'Risk & compliance',
      role: 'Auditor',
      status: 'Active',
      lastActive: 'Today',
    },
    {
      firstName: 'Lucas',
      lastName: 'Martin',
      email: 'lucas@audir.com',
      phone: '+1 415 555 0104',
      department: 'Infrastructure',
      role: 'Manager',
      status: 'Active',
      lastActive: 'Yesterday',
    },
    {
      firstName: 'Amara',
      lastName: 'Singh',
      email: 'amara@audir.com',
      department: 'Executive',
      role: 'Super Admin',
      status: 'Pending',
      lastActive: '2 days ago',
    },
  ];

  protected openInvite(): void {
    this.showInviteModal = true;
  }

  protected closeInvite(): void {
    this.showInviteModal = false;
  }

  protected onboardUser(form: NgForm): void {
    if (form.invalid) {
      return;
    }
    this.users.unshift({
      firstName: this.onboardForm.firstName,
      lastName: this.onboardForm.lastName,
      email: this.onboardForm.email,
      phone: this.onboardForm.phone || undefined,
      department: this.onboardForm.department,
      role: this.onboardForm.role,
      status: this.onboardForm.status,
      lastActive: 'Just now',
    });
    form.resetForm();
    this.showInviteModal = false;
  }

  protected openEdit(user: UserRow): void {
    this.selectedUser = { ...user };
    this.showEditModal = true;
  }

  protected closeEdit(): void {
    this.showEditModal = false;
    this.selectedUser = null;
  }
}
