import { Injectable, signal } from '@angular/core';

export type ResponseDefinition = {
  name: string;
  types: string[];
  negativeTypes: string[];
};

const STORAGE_KEY = 'audir_responses';

@Injectable({ providedIn: 'root' })
export class ResponseService {
  private readonly responsesSignal = signal<ResponseDefinition[]>(this.loadResponses());

  readonly responses = this.responsesSignal.asReadonly();

  addResponse(response: ResponseDefinition): void {
    const next = [response, ...this.responsesSignal()];
    this.responsesSignal.set(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  removeResponse(name: string): void {
    const next = this.responsesSignal().filter((item) => item.name !== name);
    this.responsesSignal.set(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  private loadResponses(): ResponseDefinition[] {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed.map((entry) => ({
          name: String(entry?.name ?? ''),
          types: Array.isArray(entry?.types) ? entry.types : [],
          negativeTypes: Array.isArray(entry?.negativeTypes) ? entry.negativeTypes : [],
        }));
      }
    } catch {
      return [];
    }
    return [];
  }
}
