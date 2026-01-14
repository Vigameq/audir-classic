import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { AuthState } from './auth-state';
import { DataSyncService } from './services/data-sync.service';
import { LoadingService } from './loading.service';
import { UserService } from './services/user.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly auth = inject(AuthState);
  protected readonly loading = inject(LoadingService);
  private readonly router = inject(Router);
  private readonly dataSync = inject(DataSyncService);
  private readonly userService = inject(UserService);
  protected isUserMenuOpen = false;

  constructor() {
    if (this.auth.isLoggedIn()) {
      this.dataSync.syncAll().subscribe();
      this.loadUserDepartment();
    }
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.loading.setNavigation(true);
      } else if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.loading.setNavigation(false);
      }
    });
  }

  private loadUserDepartment(): void {
    const email = this.auth.email();
    if (!email) {
      return;
    }
    this.userService.listUsers().subscribe({
      next: (users) => {
        const match = users.find((user) => user.email === email);
        if (match?.first_name) {
          this.auth.setFirstName(match.first_name);
        }
        if (match?.last_name) {
          this.auth.setLastName(match.last_name);
        }
        if (match?.department) {
          this.auth.setDepartment(match.department);
        }
      },
    });
  }

  protected get showNav(): boolean {
    return !this.router.url.startsWith('/login');
  }

  protected logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
    this.isUserMenuOpen = false;
  }

  protected get displayName(): string {
    const firstName = this.auth.firstName();
    if (firstName) {
      return firstName;
    }
    return 'User';
  }

  protected get avatarText(): string {
    const source = this.auth.email() || this.auth.role() || 'U';
    const cleaned = source.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
    if (!cleaned) {
      return 'U';
    }
    return cleaned.slice(0, 2).toUpperCase();
  }

  protected toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  protected closeUserMenu(): void {
    this.isUserMenuOpen = false;
  }
}
