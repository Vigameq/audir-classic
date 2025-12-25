import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import { TemplateRecord, TemplateService } from '../../services/template.service';

@Component({
  selector: 'app-templates',
  imports: [CommonModule, FormsModule],
  templateUrl: './templates.html',
  styleUrl: './templates.scss',
})
export class Templates {
  private readonly templateService = inject(TemplateService);

  protected isImporting = false;
  protected importError = '';
  protected importNote = '';
  protected noteChars = 0;
  protected tagInput = '';
  protected tags: string[] = [];
  protected showImportModal = false;
  protected templateName = '';
  protected createError = '';
  protected expandedTemplateId: string | null = null;

  protected get questions(): string[] {
    return this.templateService.questions();
  }

  protected get templates(): TemplateRecord[] {
    return this.templateService.templates();
  }

  protected async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) {
      return;
    }
    const file = input.files[0];
    this.importError = '';
    this.isImporting = true;
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows: unknown[][] = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });
      const normalized: string[] = rows.map((row: unknown[]) => String(row[0] ?? '').trim());
      const questions: string[] = normalized.filter((value: string, index: number) => {
        if (!value) {
          return false;
        }
        if (index === 0 && value.toLowerCase() === 'question') {
          return false;
        }
        return true;
      });
      this.templateService.setQuestions(questions);
    } catch {
      this.importError = 'Unable to read the spreadsheet. Please upload a valid .xlsx file.';
    } finally {
      this.isImporting = false;
      input.value = '';
    }
  }

  protected clearQuestions(): void {
    this.templateService.clear();
  }

  protected openImportModal(): void {
    this.showImportModal = true;
  }

  protected closeImportModal(): void {
    this.showImportModal = false;
    this.createError = '';
  }

  protected updateNoteChars(value: string): void {
    this.noteChars = value.length;
  }

  protected addTag(): void {
    const value = this.tagInput.trim();
    if (!value) {
      return;
    }
    if (this.tags.length >= 3 || this.tags.includes(value)) {
      this.tagInput = '';
      return;
    }
    this.tags = [...this.tags, value];
    this.tagInput = '';
  }

  protected removeTag(tag: string): void {
    this.tags = this.tags.filter((item) => item !== tag);
  }

  protected createTemplate(): void {
    if (!this.questions.length) {
      this.createError = 'Import questions before creating a template.';
      return;
    }
    const name = this.templateName.trim() || `Template ${new Date().toLocaleDateString()}`;
    this.templateService.createTemplate({
      name,
      note: this.importNote.trim(),
      tags: this.tags,
      questions: this.questions,
    });
    this.templateName = '';
    this.importNote = '';
    this.noteChars = 0;
    this.tags = [];
    this.createError = '';
    this.showImportModal = false;
  }

  protected deleteTemplate(id: string): void {
    const confirmed = window.confirm('Delete this template?');
    if (!confirmed) {
      return;
    }
    this.templateService.deleteTemplate(id);
  }

  protected toggleTemplate(id: string): void {
    this.expandedTemplateId = this.expandedTemplateId === id ? null : id;
  }
}
