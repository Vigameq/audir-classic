import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, forkJoin, map, of, switchMap, tap } from 'rxjs';

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

  createPlan(plan: Omit<AuditPlanRecord, 'id' | 'createdAt' | 'code'> & { code?: string }): Observable<AuditPlanRecord[]> {
    return this.http
      .post(`${this.baseUrl}/audit-plans`, {
        code: plan.code ?? null,
        start_date: plan.startDate,
        end_date: plan.endDate,
        audit_type: plan.auditType,
        audit_subtype: plan.auditSubtype || null,
        auditor_name: plan.auditorName || null,
        department: plan.department || null,
        location_city: plan.locationCity || null,
        site: plan.site || null,
        country: plan.country || null,
        region: plan.region || null,
        audit_note: plan.auditNote || null,
        response_type: plan.responseType || null,
      })
      .pipe(switchMap(() => this.syncFromApi()));
  }

  updatePlanApi(
    planId: string,
    updates: Partial<Omit<AuditPlanRecord, 'id' | 'code' | 'createdAt'>>
  ): Observable<AuditPlanRecord[]> {
    return this.http
      .put(`${this.baseUrl}/audit-plans/${planId}`, {
        start_date: updates.startDate,
        end_date: updates.endDate,
        auditor_name: updates.auditorName,
        department: updates.department,
        location_city: updates.locationCity,
        site: updates.site,
        country: updates.country,
        region: updates.region,
        audit_note: updates.auditNote,
        response_type: updates.responseType,
      })
      .pipe(switchMap(() => this.syncFromApi()));
  }

  deletePlanApi(planId: string): Observable<AuditPlanRecord[]> {
    return this.http.delete(`${this.baseUrl}/audit-plans/${planId}`).pipe(
      switchMap(() => this.syncFromApi())
    );
  }

  migrateFromLocal(): Observable<AuditPlanRecord[]> {
    const local = this.loadLocalRaw();
    if (!local.length) {
      return this.syncFromApi();
    }
    return this.http.get<unknown[]>(`${this.baseUrl}/audit-plans`).pipe(
      map((rows) => (Array.isArray(rows) ? rows.map((row) => this.mapFromApi(row)) : [])),
      switchMap((remote) => {
        const remoteCodes = remote.map((item) => item.code);
        const toCreate = local.filter((item) => !remoteCodes.includes(item.code));
        if (!toCreate.length) {
          return this.syncFromApi();
        }
        return forkJoin(
          toCreate.map((plan) =>
            this.http.post(`${this.baseUrl}/audit-plans`, {
              code: plan.code,
              start_date: plan.startDate,
              end_date: plan.endDate,
              audit_type: plan.auditType,
              audit_subtype: plan.auditSubtype || null,
              auditor_name: plan.auditorName || null,
              department: plan.department || null,
              location_city: plan.locationCity || null,
              site: plan.site || null,
              country: plan.country || null,
              region: plan.region || null,
              audit_note: plan.auditNote || null,
              response_type: plan.responseType || null,
            })
          )
        ).pipe(switchMap(() => this.syncFromApi()));
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

  private loadLocalRaw(): AuditPlanRecord[] {
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
}
