import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';

export type ResponseDefinition = {
  name: string;
  types: string[];
  negativeTypes: string[];
};

const STORAGE_KEY = 'audir_responses';

@Injectable({ providedIn: 'root' })
export class ResponseService {
  private readonly http = inject(HttpClient);
  private readonly responsesSignal = signal<ResponseDefinition[]>(this.loadResponses());
  private readonly baseUrl = '/api';

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

  syncFromApi(): Observable<ResponseDefinition[]> {
    return this.http.get<unknown[]>(`${this.baseUrl}/response-types`).pipe(
      map((rows) => (Array.isArray(rows) ? rows.map((row) => this.mapFromApi(row)) : [])),
      tap((responses) => {
        this.responsesSignal.set(responses);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(responses));
      })
    );
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

  private mapFromApi(payload: any): ResponseDefinition {
    const types = Array.isArray(payload?.types) ? payload.types : [];
    const negativeTypes = Array.isArray(payload?.negative_types)
      ? payload.negative_types
      : [];
    return {
      name: String(payload?.name ?? ''),
      types,
      negativeTypes,
    };
  }
}
