import { Injectable, signal } from '@angular/core';

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
  private readonly plansSignal = signal<AuditPlanRecord[]>(this.loadPlans());

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
}
