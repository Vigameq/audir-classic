import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, forkJoin, map, of, switchMap, tap } from 'rxjs';

const STORAGE_KEY = 'audir_regions';
const DEFAULT_REGIONS: string[] = [];

@Injectable({ providedIn: 'root' })
export class RegionService {
  private readonly http = inject(HttpClient);
  private readonly regionsSignal = signal<string[]>(this.loadRegions());
  private readonly baseUrl = '/api';

  readonly regions = this.regionsSignal.asReadonly();

  addRegion(name: string): void {
    const value = name.trim();
    if (!value) {
      return;
    }
    const current = this.regionsSignal();
    if (current.includes(value)) {
      return;
    }
    const next = [value, ...current];
    this.regionsSignal.set(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  removeRegion(name: string): void {
    const next = this.regionsSignal().filter((region) => region !== name);
    this.regionsSignal.set(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  private loadRegions(): string[] {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [...DEFAULT_REGIONS];
    }
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.every((item) => typeof item === 'string')) {
        return parsed;
      }
    } catch {
      return [...DEFAULT_REGIONS];
    }
    return [...DEFAULT_REGIONS];
  }

  syncFromApi(): Observable<string[]> {
    return this.http.get<unknown[]>(`${this.baseUrl}/regions`).pipe(
      map((rows) =>
        Array.isArray(rows)
          ? rows.map((row) => String((row as { name?: string })?.name ?? '')).filter(Boolean)
          : []
      ),
      tap((regions) => {
        this.regionsSignal.set(regions);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(regions));
      })
    );
  }

  createRegion(name: string): Observable<string[]> {
    return this.http.post(`${this.baseUrl}/regions`, { name }).pipe(
      switchMap(() => this.syncFromApi())
    );
  }

  deleteRegion(name: string): Observable<string[]> {
    return this.http.delete(`${this.baseUrl}/regions/${encodeURIComponent(name)}`).pipe(
      switchMap(() => this.syncFromApi())
    );
  }

  migrateFromLocal(): Observable<string[]> {
    const local = this.loadLocalRaw();
    if (!local.length) {
      return this.syncFromApi();
    }
    return this.http.get<unknown[]>(`${this.baseUrl}/regions`).pipe(
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
          toCreate.map((name) => this.http.post(`${this.baseUrl}/regions`, { name }))
        ).pipe(switchMap(() => this.syncFromApi()));
      })
    );
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
