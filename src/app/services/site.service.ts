import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, forkJoin, map, switchMap, tap } from 'rxjs';

const STORAGE_KEY = 'audir_sites';
const DEFAULT_SITES: string[] = [];

@Injectable({ providedIn: 'root' })
export class SiteService {
  private readonly http = inject(HttpClient);
  private readonly sitesSignal = signal<string[]>(this.loadSites());
  private readonly baseUrl = '/api';

  readonly sites = this.sitesSignal.asReadonly();

  addSite(name: string): void {
    const value = name.trim();
    if (!value) {
      return;
    }
    const current = this.sitesSignal();
    if (current.includes(value)) {
      return;
    }
    const next = [value, ...current];
    this.sitesSignal.set(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  removeSite(name: string): void {
    const next = this.sitesSignal().filter((site) => site !== name);
    this.sitesSignal.set(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  private loadSites(): string[] {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [...DEFAULT_SITES];
    }
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.every((item) => typeof item === 'string')) {
        return parsed;
      }
    } catch {
      return [...DEFAULT_SITES];
    }
    return [...DEFAULT_SITES];
  }

  syncFromApi(): Observable<string[]> {
    return this.http.get<unknown[]>(`${this.baseUrl}/sites`).pipe(
      map((rows) =>
        Array.isArray(rows)
          ? rows.map((row) => String((row as { name?: string })?.name ?? '')).filter(Boolean)
          : []
      ),
      tap((sites) => {
        this.sitesSignal.set(sites);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sites));
      })
    );
  }

  createSite(name: string): Observable<string[]> {
    return this.http.post(`${this.baseUrl}/sites`, { name }).pipe(
      switchMap(() => this.syncFromApi())
    );
  }

  deleteSite(name: string): Observable<string[]> {
    return this.http.delete(`${this.baseUrl}/sites/${encodeURIComponent(name)}`).pipe(
      switchMap(() => this.syncFromApi())
    );
  }

  migrateFromLocal(): Observable<string[]> {
    const local = this.loadLocalRaw();
    if (!local.length) {
      return this.syncFromApi();
    }
    return this.http.get<unknown[]>(`${this.baseUrl}/sites`).pipe(
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
        return forkJoin(toCreate.map((name) => this.http.post(`${this.baseUrl}/sites`, { name }))).pipe(
          switchMap(() => this.syncFromApi())
        );
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
