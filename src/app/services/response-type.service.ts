import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'audir_response_types';
const DEFAULT_RESPONSE_TYPES: string[] = ['Yes', 'No', 'Maybe'];

@Injectable({ providedIn: 'root' })
export class ResponseTypeService {
  private readonly responseTypesSignal = signal<string[]>(this.loadResponseTypes());

  readonly responseTypes = this.responseTypesSignal.asReadonly();

  addResponseType(name: string): void {
    const value = name.trim();
    if (!value) {
      return;
    }
    const current = this.responseTypesSignal();
    if (current.includes(value)) {
      return;
    }
    const next = [value, ...current];
    this.responseTypesSignal.set(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  removeResponseType(name: string): void {
    const next = this.responseTypesSignal().filter((item) => item !== name);
    this.responseTypesSignal.set(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  private loadResponseTypes(): string[] {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [...DEFAULT_RESPONSE_TYPES];
    }
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.every((item) => typeof item === 'string')) {
        return parsed;
      }
    } catch {
      return [...DEFAULT_RESPONSE_TYPES];
    }
    return [...DEFAULT_RESPONSE_TYPES];
  }
}
