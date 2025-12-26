import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ResponseService } from '../../services/response.service';

@Component({
  selector: 'app-nc-management',
  imports: [CommonModule],
  templateUrl: './nc-management.html',
  styleUrl: './nc-management.scss',
})
export class NcManagement {
  private readonly responseService = inject(ResponseService);

  protected get responseNames(): string[] {
    return this.responseService.responses().map((response) => response.name);
  }
}
