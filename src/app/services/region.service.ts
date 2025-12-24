import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'audir_regions';
const DEFAULT_REGIONS: string[] = [];

@Injectable({ providedIn: 'root' })
export class RegionService {
  private readonly regionsSignal = signal<string[]>(this.loadRegions());

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
}
