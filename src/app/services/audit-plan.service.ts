import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, map, of, tap } from 'rxjs';

export type AuditPlanRecord = {
  id: string;
  code: string;
  startDate: string;
  endDate: string;
  auditType: string;
  auditSubtype: string;
  auditorName: string;
  department: string;
  locationCity: string;
  site: string;
  country: string;
  region: string;
  auditNote: string;
  responseType: string;
  createdAt: string;
};

const STORAGE_KEY = 'audir_audit_plans';

@Injectable({ providedIn: 'root' })
export class AuditPlanService {
  private readonly http = inject(HttpClient);
  private readonly plansSignal = signal<AuditPlanRecord[]>(this.loadPlans());
  private readonly baseUrl = '/api';

  readonly plans = this.plansSignal.asReadonly();

  addPlan(plan: Omit<AuditPlanRecord, 'id' | 'createdAt' | 'code'>): void {
    const next = [
      {
        ...plan,
        id: crypto.randomUUID(),
        code: this.generateCode(),
        createdAt: new Date().toISOString(),
      },
      ...this.plansSignal(),
    ];
    this.plansSignal.set(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  updatePlan(
    planId: string,
    updates: Partial<Omit<AuditPlanRecord, 'id' | 'code' | 'createdAt'>>
  ): void {
    const next = this.plansSignal().map((plan) =>
      plan.id === planId ? { ...plan, ...updates } : plan
    );
    this.plansSignal.set(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  deletePlan(planId: string): void {
    const next = this.plansSignal().filter((plan) => plan.id !== planId);
    this.plansSignal.set(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  syncFromApi(): Observable<AuditPlanRecord[]> {
    return this.http.get<unknown[]>(`${this.baseUrl}/audit-plans`).pipe(
      map((rows) => (Array.isArray(rows) ? rows.map((row) => this.mapFromApi(row)) : [])),
      tap((plans) => {
        this.plansSignal.set(plans);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
      })
    );
  }

  fetchByCode(code: string): Observable<AuditPlanRecord | null> {
    const local = this.plansSignal().find((plan) => plan.code === code);
    if (local) {
      return of(local);
    }
    return this.syncFromApi().pipe(
      map((plans) => plans.find((plan) => plan.code === code) ?? null)
    );
  }

  private loadPlans(): AuditPlanRecord[] {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed as AuditPlanRecord[];
      }
    } catch {
      return [];
    }
    return [];
  }

  private generateCode(): string {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i += 1) {
      code += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return code;
  }

  private mapFromApi(payload: any): AuditPlanRecord {
    return {
      id: String(payload?.id ?? ''),
      code: String(payload?.code ?? ''),
      startDate: String(payload?.start_date ?? ''),
      endDate: String(payload?.end_date ?? ''),
      auditType: String(payload?.audit_type ?? ''),
      auditSubtype: String(payload?.audit_subtype ?? ''),
      auditorName: String(payload?.auditor_name ?? ''),
      department: String(payload?.department ?? ''),
      locationCity: String(payload?.location_city ?? ''),
      site: String(payload?.site ?? ''),
      country: String(payload?.country ?? ''),
      region: String(payload?.region ?? ''),
      auditNote: String(payload?.audit_note ?? ''),
      responseType: String(payload?.response_type ?? ''),
      createdAt: String(payload?.created_at ?? ''),
    };
  }
}
