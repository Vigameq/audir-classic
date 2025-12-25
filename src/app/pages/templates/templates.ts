import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import * as XLSX from 'xlsx';
import { TemplateService } from '../../services/template.service';

@Component({
  selector: 'app-templates',
  imports: [CommonModule],
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

  protected get questions(): string[] {
    return this.templateService.questions();
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
      const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });
      const questions = rows
        .map((row) => String(row[0] ?? '').trim())
        .filter((value, index) => {
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
}
