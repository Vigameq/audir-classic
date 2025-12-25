import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'audir_template_questions';

@Injectable({ providedIn: 'root' })
export class TemplateService {
  private readonly questionsSignal = signal<string[]>(this.loadQuestions());

  readonly questions = this.questionsSignal.asReadonly();

  setQuestions(questions: string[]): void {
    const cleaned = questions.filter((q) => q.trim().length > 0);
    this.questionsSignal.set(cleaned);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
  }

  clear(): void {
    this.questionsSignal.set([]);
    localStorage.removeItem(STORAGE_KEY);
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
}
