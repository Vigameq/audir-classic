import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'audir_sites';
const DEFAULT_SITES: string[] = [];

@Injectable({ providedIn: 'root' })
export class SiteService {
  private readonly sitesSignal = signal<string[]>(this.loadSites());

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
}
