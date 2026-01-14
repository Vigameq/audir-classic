import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

export type AuditAnswerRecord = {
  id: string;
  auditPlanId: string;
  questionIndex: number;
  questionText: string;
  response: string;
  responseIsNegative: boolean;
  assignedNc: string;
  note: string;
  evidenceName: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

@Injectable({ providedIn: 'root' })
export class AuditAnswerService {
  private readonly baseUrl = '/api';

  constructor(private readonly http: HttpClient) {}

  listByAuditCode(code: string): Observable<AuditAnswerRecord[]> {
    return this.http
      .get<unknown[]>(`${this.baseUrl}/audit-answers?audit_code=${encodeURIComponent(code)}`)
      .pipe(map((rows) => (Array.isArray(rows) ? rows.map((row) => this.mapFromApi(row)) : [])));
  }

  upsertAnswer(payload: {
    audit_code: string;
    question_index: number;
    question_text: string;
    response?: string | null;
    response_is_negative?: boolean;
    assigned_nc?: string | null;
    note?: string | null;
    evidence_name?: string | null;
    status?: string;
  }): Observable<AuditAnswerRecord> {
    return this.http.post<AuditAnswerRecord>(`${this.baseUrl}/audit-answers`, payload);
  }

  private mapFromApi(payload: any): AuditAnswerRecord {
    return {
      id: String(payload?.id ?? ''),
      auditPlanId: String(payload?.audit_plan_id ?? ''),
      questionIndex: Number(payload?.question_index ?? 0),
      questionText: String(payload?.question_text ?? ''),
      response: String(payload?.response ?? ''),
      responseIsNegative: Boolean(payload?.response_is_negative ?? false),
      assignedNc: String(payload?.assigned_nc ?? ''),
      note: String(payload?.note ?? ''),
      evidenceName: String(payload?.evidence_name ?? ''),
      status: String(payload?.status ?? ''),
      createdAt: String(payload?.created_at ?? ''),
      updatedAt: String(payload?.updated_at ?? ''),
    };
  }
}
