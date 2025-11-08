import { Component, Input, Output, EventEmitter, signal, ViewEncapsulation, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { getTaskTemplate } from '../../../../../utils/task-templates';

interface LeadTask {
  id: number;
  title: string;
  description?: string;
  taskType?: string;
  status?: string;
  dueDate?: string;
  completed: boolean;
  completedAt?: string;
  taskData?: any;
  admin?: any;
}

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [CommonModule],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="task-card" [class.completed]="task.completed" [class.overdue]="isOverdue()">
      <div class="task-header">
        <div class="task-checkbox">
          <input 
            type="checkbox" 
            [checked]="task.completed"
            (change)="onToggle.emit(task)"
            [id]="'task-' + task.id"
          />
          <label [for]="'task-' + task.id"></label>
        </div>
        
        <div class="task-info">
          <h5 class="task-title" [class.completed]="task.completed">
            {{ taskTitle() }}
          </h5>
          
          @if (task.dueDate && !task.completed) {
            <span class="task-due-date" [class.overdue]="isOverdue()">
              <i class="fas fa-clock"></i>
              {{ formatDate(task.dueDate) }}
              @if (isOverdue()) {
                <span class="overdue-badge">Просрочена!</span>
              }
            </span>
          }
          
          @if (task.completedAt) {
            <span class="task-completed-at">
              <i class="fas fa-check-circle"></i>
              Выполнена: {{ formatDate(task.completedAt) }}
            </span>
          }
        </div>
        
        <button class="task-delete-btn" (click)="onDelete.emit(task.id)" title="Удалить задачу">
          <i class="fas fa-trash"></i>
        </button>
      </div>
      
      @if (showDescription() && taskDescription()) {
        <div class="task-description" [innerHTML]="formatDescription(taskDescription())"></div>
      }
      
      @if (!task.completed && taskDescription()) {
        <button class="task-show-script-btn" (click)="toggleDescription()">
          <i class="fas" [class.fa-chevron-down]="!isDescriptionVisible()" [class.fa-chevron-up]="isDescriptionVisible()"></i>
          {{ isDescriptionVisible() ? 'Скрыть скрипт' : 'Показать скрипт общения' }}
        </button>
      }
    </div>
  `,
  styles: [`
    .task-card {
      background: #ffffff;
      border: 1px solid #d1d5db;
      border-left: 4px solid #3b82f6;
      border-radius: 6px;
      padding: 12px;
      transition: all 0.2s ease;
      margin-bottom: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    
    .task-card:hover {
      border-left-color: #2563eb;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
      transform: translateY(-1px);
    }
    
    .task-card.completed {
      background: #f0fdf4;
      border-left-color: #10b981;
      opacity: 0.85;
    }
    
    .task-card.overdue:not(.completed) {
      background: #fef2f2;
      border-left-color: #ef4444;
    }
    
    .task-header {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }
    
    .task-checkbox {
      position: relative;
      flex-shrink: 0;
    }
    
    .task-checkbox input[type="checkbox"] {
      width: 24px;
      height: 24px;
      cursor: pointer;
      opacity: 0;
      position: absolute;
    }
    
    .task-checkbox label {
      display: block;
      width: 24px;
      height: 24px;
      border: 2px solid #cbd5e1;
      border-radius: 6px;
      cursor: pointer;
      position: relative;
      transition: all 0.2s ease;
    }
    
    .task-checkbox input[type="checkbox"]:checked + label {
      background: #10b981;
      border-color: #10b981;
    }
    
    .task-checkbox input[type="checkbox"]:checked + label::after {
      content: '✓';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: white;
      font-size: 16px;
      font-weight: bold;
    }
    
    .task-info {
      flex: 1;
    }
    
    .task-title {
      font-size: 14px;
      font-weight: 600;
      color: #111827;
      margin: 0 0 4px 0;
      line-height: 1.4;
    }
    
    .task-title.completed {
      text-decoration: line-through;
      color: #9ca3af;
    }
    
    .task-due-date {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: #6b7280;
      padding: 4px 10px;
      background: #f3f4f6;
      border-radius: 6px;
    }
    
    .task-due-date.overdue {
      background: #fee2e2;
      color: #dc2626;
      font-weight: 600;
    }
    
    .overdue-badge {
      margin-left: 8px;
      padding: 2px 8px;
      background: #dc2626;
      color: white;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
    }
    
    .task-completed-at {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: #10b981;
      padding: 4px 10px;
      background: #d1fae5;
      border-radius: 6px;
    }
    
    .task-delete-btn {
      background: none;
      border: none;
      color: #dc2626;
      cursor: pointer;
      padding: 8px;
      border-radius: 6px;
      transition: all 0.2s;
      flex-shrink: 0;
    }
    
    .task-delete-btn:hover {
      background: #fee2e2;
    }
    
    .task-description {
      margin-top: 12px;
      padding: 14px;
      background: #f8fafc;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      font-size: 13px;
      line-height: 1.6;
      color: #475569;
    }
    
    .task-description ::ng-deep {
      h3, h4 {
        margin: 20px 0 12px 0;
        font-weight: 700;
        color: #111827;
        font-size: 16px;
      }
      
      h3:first-child {
        margin-top: 0;
      }
      
      .section-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 16px 0 8px 0;
        font-weight: 700;
        color: #1e293b;
        font-size: 14px;
        padding: 6px 0;
        border-bottom: 1px solid #cbd5e1;
      }
      
      .section-header:first-child {
        margin-top: 0;
      }
      
      .section-header span:first-child {
        font-size: 16px;
      }
      
      .goal-block {
        background: #e0f2fe;
        padding: 10px 14px;
        border-radius: 6px;
        margin: 8px 0;
        border-left: 3px solid #0284c7;
        color: #0c4a6e;
        box-shadow: 0 1px 2px rgba(2, 132, 199, 0.1);
      }
      
      .script-block {
        background: #d1fae5;
        padding: 10px 14px;
        border-radius: 6px;
        margin: 8px 0;
        border-left: 3px solid #059669;
        color: #064e3b;
        box-shadow: 0 1px 2px rgba(5, 150, 105, 0.1);
      }
      
      .checklist-block {
        background: #fef3c7;
        padding: 10px 14px;
        border-radius: 6px;
        margin: 8px 0;
        border-left: 3px solid #d97706;
        color: #78350f;
        box-shadow: 0 1px 2px rgba(217, 119, 6, 0.1);
      }
      
      .deadline-block {
        background: #fee2e2;
        padding: 10px 14px;
        border-radius: 6px;
        margin: 8px 0;
        border-left: 3px solid #dc2626;
        font-weight: 600;
        color: #991b1b;
        box-shadow: 0 1px 2px rgba(220, 38, 38, 0.1);
      }
      
      ul, ol {
        margin: 8px 0;
        padding-left: 20px;
      }
      
      li {
        margin: 4px 0;
        line-height: 1.6;
        color: #475569;
      }
      
      .checkbox-item {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        margin: 4px 0;
        padding: 6px 10px;
        background: rgba(255, 255, 255, 0.7);
        border-radius: 4px;
        font-size: 12px;
        transition: background 0.2s;
      }
      
      .checkbox-item:hover {
        background: rgba(255, 255, 255, 0.9);
      }
      
      .checkbox-item input[type="checkbox"] {
        margin-top: 3px;
        flex-shrink: 0;
        width: 16px;
        height: 16px;
        cursor: pointer;
      }
      
      .checkbox-item label {
        flex: 1;
        cursor: pointer;
        font-size: 12px;
        color: #475569;
      }
      
      strong {
        color: #1e293b;
        font-weight: 600;
      }
      
      em {
        color: #64748b;
        font-style: italic;
      }
      
      code {
        background: #e2e8f0;
        padding: 2px 5px;
        border-radius: 3px;
        font-family: 'Courier New', monospace;
        font-size: 11px;
        color: #dc2626;
        border: 1px solid #cbd5e1;
      }
      
      hr {
        border: none;
        border-top: 1px solid #cbd5e1;
        margin: 10px 0;
      }
      
      p {
        margin: 6px 0;
        color: #475569;
      }
      
      .highlight {
        background: #fef3c7;
        padding: 2px 6px;
        border-radius: 3px;
        font-weight: 600;
        color: #78350f;
      }
      
      .input-field {
        display: flex;
        align-items: baseline;
        gap: 8px;
        margin: 4px 0;
        padding: 6px 10px;
        background: rgba(255, 255, 255, 0.8);
        border-radius: 4px;
        border: 1px dashed #94a3b8;
        font-size: 12px;
      }
      
      .input-field label {
        font-weight: 600;
        color: #475569;
        min-width: 100px;
      }
      
      .input-field .input-placeholder {
        color: #94a3b8;
        font-family: 'Courier New', monospace;
        letter-spacing: 0.5px;
        font-size: 11px;
      }
      
      .input-field span:not(.input-placeholder) {
        color: #1e293b;
      }
      
      // Стили для скриптов в кавычках
      div[style*="border-left: 3px solid #10b981"] {
        background: #f0fdf4 !important;
        border-left: 4px solid #10b981 !important;
        padding: 12px 16px !important;
        border-radius: 8px !important;
        margin: 12px 0 !important;
        color: #065f46 !important;
        font-style: normal !important;
        box-shadow: 0 2px 4px rgba(16, 185, 129, 0.1) !important;
      }
      
      // Стили для подзаголовков типа "ПРИВЕТСТВИЕ:", "ЕСЛИ ДА:" и т.д.
      strong[style*="display: block"] {
        color: #111827 !important;
        font-size: 14px !important;
        margin-top: 16px !important;
        margin-bottom: 8px !important;
        padding-bottom: 4px !important;
        border-bottom: 1px solid #e5e7eb !important;
      }
      
      // Стили для скриптов в кавычках
      .script-quote {
        background: #d1fae5 !important;
        border-left: 3px solid #059669 !important;
        padding: 8px 12px !important;
        border-radius: 6px !important;
        margin: 8px 0 !important;
        color: #064e3b !important;
        font-style: normal !important;
        box-shadow: 0 1px 2px rgba(5, 150, 105, 0.1) !important;
      }
      
      // Стили для подзаголовков типа "ПРИВЕТСТВИЕ:", "ЕСЛИ ДА:" и т.д.
      .subsection-header {
        display: block !important;
        color: #1e293b !important;
        font-size: 13px !important;
        font-weight: 700 !important;
        margin-top: 12px !important;
        margin-bottom: 6px !important;
        padding-bottom: 4px !important;
        border-bottom: 1px solid #cbd5e1 !important;
      }
      
      .numbered-item {
        color: #0284c7;
        font-size: 14px;
      }
      
      // Стили для стрелок и переходов
      .arrow-link {
        display: inline-block;
        margin-left: 6px;
        color: #059669;
        font-weight: 600;
      }
    }
    
    
    .task-show-script-btn {
      margin-top: 12px;
      padding: 8px 16px;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 6px;
      color: #1e40af;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .task-show-script-btn:hover {
      background: #dbeafe;
      border-color: #93c5fd;
    }
  `]
})
export class TaskCardComponent {
  @Input() task!: LeadTask;
  @Input() lead?: any; // Данные лида для подстановки в шаблоны
  @Output() onToggle = new EventEmitter<LeadTask>();
  @Output() onDelete = new EventEmitter<number>();
  
  descriptionVisible = signal(false);
  
  // Получаем описание из шаблона или используем существующее
  taskDescription = computed(() => {
    if (this.task.taskType && this.lead) {
      const template = getTaskTemplate(this.task.taskType, this.lead);
      if (template) {
        return template.description;
      }
    }
    return this.task.description || '';
  });
  
  // Получаем заголовок из шаблона или используем существующий
  taskTitle = computed(() => {
    if (this.task.taskType && this.lead) {
      const template = getTaskTemplate(this.task.taskType, this.lead);
      if (template) {
        return template.title;
      }
    }
    return this.task.title;
  });
  
  isDescriptionVisible(): boolean {
    return this.descriptionVisible();
  }
  
  toggleDescription(): void {
    this.descriptionVisible.set(!this.descriptionVisible());
  }
  
  showDescription(): boolean {
    return this.isDescriptionVisible();
  }
  
  isOverdue(): boolean {
    if (!this.task.dueDate || this.task.completed) return false;
    return new Date(this.task.dueDate) < new Date();
  }
  
  formatDate(dateString?: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  formatDescription(description: string): string {
    if (!description) return '';
    
    const lines = description.split('\n');
    const result: string[] = [];
    let currentBlock: { type: string; content: string[] } | null = null;
    
    const closeCurrentBlock = () => {
      if (currentBlock) {
        const content = currentBlock.content.join('\n').trim();
        if (content) {
          let blockHtml = '';
          
          switch (currentBlock.type) {
            case 'goal':
              blockHtml = `<div class="goal-block">${this.formatBlockContent(content)}</div>`;
              break;
            case 'script':
              blockHtml = `<div class="script-block">${this.formatBlockContent(content)}</div>`;
              break;
            case 'checklist':
              blockHtml = `<div class="checklist-block">${this.formatBlockContent(content)}</div>`;
              break;
            case 'deadline':
              blockHtml = `<div class="deadline-block"><strong>⚡ ДЕДЛАЙН:</strong> ${this.formatBlockContent(content)}</div>`;
              break;
          }
          
          if (blockHtml) {
            result.push(blockHtml);
          }
        }
        currentBlock = null;
      }
    };
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Заголовки секций (проверяем, есть ли контент на той же строке)
      if (line.match(/^🎯 ЦЕЛЬ:?\s*(.+)$/i)) {
        closeCurrentBlock();
        const match = line.match(/^🎯 ЦЕЛЬ:?\s*(.+)$/i);
        result.push('<div class="section-header"><span>🎯</span><span>ЦЕЛЬ</span></div>');
        if (match && match[1].trim()) {
          result.push(`<div class="goal-block">${this.formatBlockContent(match[1].trim())}</div>`);
        } else {
          currentBlock = { type: 'goal', content: [] };
        }
      } else if (line.match(/^📞 СКРИПТ ЗВОНКА:?\s*(.+)$/i)) {
        closeCurrentBlock();
        const match = line.match(/^📞 СКРИПТ ЗВОНКА:?\s*(.+)$/i);
        result.push('<div class="section-header"><span>📞</span><span>СКРИПТ ЗВОНКА</span></div>');
        if (match && match[1].trim()) {
          result.push(`<div class="script-block">${this.formatBlockContent(match[1].trim())}</div>`);
        } else {
          currentBlock = { type: 'script', content: [] };
        }
      } else if (line.match(/^💬 СКРИПТ:?\s*(.+)$/i)) {
        closeCurrentBlock();
        const match = line.match(/^💬 СКРИПТ:?\s*(.+)$/i);
        result.push('<div class="section-header"><span>💬</span><span>СКРИПТ</span></div>');
        if (match && match[1].trim()) {
          result.push(`<div class="script-block">${this.formatBlockContent(match[1].trim())}</div>`);
        } else {
          currentBlock = { type: 'script', content: [] };
        }
      } else if (line.match(/^🎯 ЦЕЛЬ:?$/i)) {
        closeCurrentBlock();
        result.push('<div class="section-header"><span>🎯</span><span>ЦЕЛЬ</span></div>');
        currentBlock = { type: 'goal', content: [] };
      } else if (line.match(/^📞 СКРИПТ ЗВОНКА:?$/i)) {
        closeCurrentBlock();
        result.push('<div class="section-header"><span>📞</span><span>СКРИПТ ЗВОНКА</span></div>');
        currentBlock = { type: 'script', content: [] };
      } else if (line.match(/^💬 СКРИПТ:?$/i)) {
        closeCurrentBlock();
        result.push('<div class="section-header"><span>💬</span><span>СКРИПТ</span></div>');
        currentBlock = { type: 'script', content: [] };
      } else if (line.match(/^📋 ЧТО УЗНАТЬ/i)) {
        closeCurrentBlock();
        result.push('<div class="section-header"><span>📋</span><span>ЧТО УЗНАТЬ</span></div>');
        currentBlock = { type: 'checklist', content: [] };
      } else if (line.match(/^📝 ЧТО ОТМЕТИТЬ:?/i)) {
        closeCurrentBlock();
        result.push('<div class="section-header"><span>📝</span><span>ЧТО ОТМЕТИТЬ</span></div>');
        currentBlock = { type: 'checklist', content: [] };
      } else if (line.match(/^📝 ЗАПОЛНИТЬ В СИСТЕМЕ:?/i)) {
        closeCurrentBlock();
        result.push('<div class="section-header"><span>📝</span><span>ЗАПОЛНИТЬ В СИСТЕМЕ</span></div>');
        currentBlock = { type: 'checklist', content: [] };
      } else if (line.match(/^⚡ ДЕДЛАЙН:?/i)) {
        closeCurrentBlock();
        const deadlineText = line.replace(/^⚡ ДЕДЛАЙН:?\s*/i, '').trim();
        if (deadlineText) {
          result.push(`<div class="deadline-block"><strong>⚡ ДЕДЛАЙН:</strong> ${this.formatBlockContent(deadlineText)}</div>`);
        } else {
          currentBlock = { type: 'deadline', content: [] };
        }
      } else if (line.match(/^⚡ СЛЕДУЮЩИЙ ШАГ:?/i)) {
        closeCurrentBlock();
        result.push('<div class="section-header"><span>⚡</span><span>СЛЕДУЮЩИЙ ШАГ</span></div>');
        currentBlock = { type: 'goal', content: [] };
      } else if (line.match(/^💡 ПОДСКАЗКА:?/i)) {
        closeCurrentBlock();
        result.push('<div class="section-header"><span>💡</span><span>ПОДСКАЗКА</span></div>');
        currentBlock = { type: 'goal', content: [] };
      } else if (line.match(/^📅 ПЛАН ДЕЙСТВИЙ:?/i)) {
        closeCurrentBlock();
        result.push('<div class="section-header"><span>📅</span><span>ПЛАН ДЕЙСТВИЙ</span></div>');
        currentBlock = { type: 'checklist', content: [] };
      } else if (line.match(/^📝 ДЕЙСТВИЯ:?/i)) {
        closeCurrentBlock();
        result.push('<div class="section-header"><span>📝</span><span>ДЕЙСТВИЯ</span></div>');
        currentBlock = { type: 'checklist', content: [] };
      } else if (line.match(/^━━━+/)) {
        closeCurrentBlock();
        result.push('<hr>');
      } else if (line) {
        // Добавляем строку в текущий блок или как обычный текст
        if (currentBlock) {
          currentBlock.content.push(line);
        } else {
          result.push(this.formatLine(line));
        }
      } else {
        // Пустая строка
        if (currentBlock && currentBlock.content.length > 0) {
          currentBlock.content.push('');
        } else {
          result.push('<br>');
        }
      }
    }
    
    closeCurrentBlock();
    
    return result.join('');
  }
  
  formatBlockContent(content: string): string {
    const lines = content.split('\n');
    const formatted: string[] = [];
    
    for (const line of lines) {
      if (line.trim()) {
        formatted.push(this.formatLine(line));
      }
    }
    
    return formatted.join('<br>');
  }
  
  formatLine(line: string): string {
    let formatted = line.trim();
    if (!formatted) return '';
    
    // Обрабатываем кавычки (скрипты)
    if (formatted.match(/^["'`].*["'`]$/)) {
      formatted = `<div class="script-quote">${formatted}</div>`;
    }
    
    // Обрабатываем поля ввода (Регион: ________)
    formatted = formatted.replace(/^([А-Яа-яЁё\w\s]+):\s*_+$/g, '<div class="input-field"><label>$1:</label><span class="input-placeholder">________</span></div>');
    formatted = formatted.replace(/^([А-Яа-яЁё\w\s]+):\s*(.+)$/g, '<div class="input-field"><label>$1:</label><span>$2</span></div>');
    
      // Подзаголовки
      formatted = formatted.replace(/^(ПРИВЕТСТВИЕ:|ЕСЛИ ДА:|ЕСЛИ НЕТ:)/i, '<strong class="subsection-header">$1</strong>');
      formatted = formatted.replace(/^(1️⃣|2️⃣|3️⃣|4️⃣|5️⃣)\s*(.+)$/, '<strong class="numbered-item">$1</strong> <span>$2</span>');
    
    // Чекбоксы
    formatted = formatted.replace(/^- ✓ (.+)$/, '<div class="checkbox-item"><input type="checkbox" disabled><label>$1</label></div>');
    formatted = formatted.replace(/^- (.+)$/, '<div class="checkbox-item"><input type="checkbox" disabled><label>$1</label></div>');
    
    // Нумерованные списки
    formatted = formatted.replace(/^(\d+[\.\)])\s+(.+)$/, '<div class="checkbox-item"><span style="font-weight: 600; color: #3b82f6;">$1</span><span>$2</span></div>');
    
      // Стрелки и переходы
      formatted = formatted.replace(/→ (.+)/g, '<span class="arrow-link">→ $1</span>');
    
    // Выделение текста
    formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/\*(.+?)\*/g, '<em>$1</em>');
    
    // Код/переменные
    formatted = formatted.replace(/\[(.+?)\]/g, '<code>$1</code>');
    
    return formatted;
  }
}

