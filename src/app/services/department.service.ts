import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'audir_departments';
const DEFAULT_DEPARTMENTS = ['Risk & compliance', 'Infrastructure', 'Executive'];

@Injectable({ providedIn: 'root' })
export class DepartmentService {
  private readonly departmentsSignal = signal<string[]>(this.loadDepartments());

  readonly departments = this.departmentsSignal.asReadonly();

  addDepartment(name: string): void {
    const value = name.trim();
    if (!value) {
      return;
    }
    const current = this.departmentsSignal();
    if (current.includes(value)) {
      return;
    }
    const next = [value, ...current];
    this.departmentsSignal.set(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  private loadDepartments(): string[] {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [...DEFAULT_DEPARTMENTS];
    }
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.every((item) => typeof item === 'string')) {
        return parsed;
      }
    } catch {
      return [...DEFAULT_DEPARTMENTS];
    }
    return [...DEFAULT_DEPARTMENTS];
  }
}
