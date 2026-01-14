import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, forkJoin, map, of, switchMap, tap } from 'rxjs';

const STORAGE_KEY = 'audir_departments';
const DEFAULT_DEPARTMENTS: string[] = [];

@Injectable({ providedIn: 'root' })
export class DepartmentService {
  private readonly http = inject(HttpClient);
  private readonly departmentsSignal = signal<string[]>(this.loadDepartments());
  private readonly baseUrl = '/api';

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

  removeDepartment(name: string): void {
    const next = this.departmentsSignal().filter((dept) => dept !== name);
    this.departmentsSignal.set(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  syncFromApi(): Observable<string[]> {
    return this.http.get<unknown[]>(`${this.baseUrl}/departments`).pipe(
      map((rows) =>
        Array.isArray(rows)
          ? rows
              .map((row) => String((row as { name?: string })?.name ?? ''))
              .filter(Boolean)
          : []
      ),
      tap((departments) => {
        this.departmentsSignal.set(departments);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(departments));
      })
    );
  }

  createDepartment(name: string): Observable<string[]> {
    return this.http.post(`${this.baseUrl}/departments`, { name }).pipe(
      switchMap(() => this.syncFromApi())
    );
  }

  deleteDepartment(name: string): Observable<string[]> {
    return this.http.delete(`${this.baseUrl}/departments/${encodeURIComponent(name)}`).pipe(
      switchMap(() => this.syncFromApi())
    );
  }

  migrateFromLocal(): Observable<string[]> {
    const local = this.loadLocalRaw();
    if (!local.length) {
      return this.syncFromApi();
    }
    return this.http.get<unknown[]>(`${this.baseUrl}/departments`).pipe(
      map((rows) =>
        Array.isArray(rows)
          ? rows.map((row) => String((row as { name?: string })?.name ?? '')).filter(Boolean)
          : []
      ),
      switchMap((remote) => {
        const toCreate = local.filter((item) => !remote.includes(item));
        if (!toCreate.length) {
          return this.syncFromApi();
        }
        return forkJoin(
          toCreate.map((name) => this.http.post(`${this.baseUrl}/departments`, { name }))
        ).pipe(switchMap(() => this.syncFromApi()));
      })
    );
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

  private loadLocalRaw(): string[] {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.every((item) => typeof item === 'string')) {
        return parsed;
      }
    } catch {
      return [];
    }
    return [];
  }
}
