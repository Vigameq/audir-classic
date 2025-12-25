import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'audir_template_questions';
const TEMPLATE_KEY = 'audir_templates';

export type TemplateRecord = {
  id: string;
  name: string;
  note: string;
  tags: string[];
  questions: string[];
  createdAt: string;
};

@Injectable({ providedIn: 'root' })
export class TemplateService {
  private readonly questionsSignal = signal<string[]>(this.loadQuestions());
  private readonly templatesSignal = signal<TemplateRecord[]>(this.loadTemplates());

  readonly questions = this.questionsSignal.asReadonly();
  readonly templates = this.templatesSignal.asReadonly();

  setQuestions(questions: string[]): void {
    const cleaned = questions.filter((q) => q.trim().length > 0);
    this.questionsSignal.set(cleaned);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
  }

  clear(): void {
    this.questionsSignal.set([]);
    localStorage.removeItem(STORAGE_KEY);
  }

  createTemplate(payload: Omit<TemplateRecord, 'id' | 'createdAt'>): void {
    const next = [
      {
        ...payload,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      },
      ...this.templatesSignal(),
    ];
    this.templatesSignal.set(next);
    localStorage.setItem(TEMPLATE_KEY, JSON.stringify(next));
  }

  deleteTemplate(id: string): void {
    const next = this.templatesSignal().filter((item) => item.id !== id);
    this.templatesSignal.set(next);
    localStorage.setItem(TEMPLATE_KEY, JSON.stringify(next));
  }

  private loadQuestions(): string[] {
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

  private loadTemplates(): TemplateRecord[] {
    const stored = localStorage.getItem(TEMPLATE_KEY);
    if (!stored) {
      return [];
    }
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed as TemplateRecord[];
      }
    } catch {
      return [];
    }
    return [];
  }
}
