import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-user-management',
  imports: [CommonModule],
  templateUrl: './user-management.html',
  styleUrl: './user-management.scss',
})
export class UserManagement {
  protected showInviteModal = false;

  protected openInvite(): void {
    this.showInviteModal = true;
  }

  protected closeInvite(): void {
    this.showInviteModal = false;
  }
}
