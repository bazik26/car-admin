import { Component, Input, Output, EventEmitter, signal, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';

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
            {{ task.title }}
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
      
      @if (showDescription() && task.description) {
        <div class="task-description" [innerHTML]="formatDescription(task.description)"></div>
      }
      
      @if (!task.completed && task.description) {
        <button class="task-show-script-btn" (click)="toggleDescription()">
          <i class="fas" [class.fa-chevron-down]="!isDescriptionVisible()" [class.fa-chevron-up]="isDescriptionVisible()"></i>
          {{ isDescriptionVisible() ? 'Скрыть скрипт' : 'Показать скрипт общения' }}
        </button>
      }
    </div>
  `,
  styles: [`
    .task-card {
      background: white;
      border: 2px solid #e5e7eb;
      border-radius: 10px;
      padding: 16px;
      transition: all 0.2s ease;
      margin-bottom: 12px;
    }
    
    .task-card:hover {
      border-color: #cbd5e1;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }
    
    .task-card.completed {
      background: #f0fdf4;
      border-color: #86efac;
      opacity: 0.8;
    }
    
    .task-card.overdue:not(.completed) {
      background: #fef2f2;
      border-color: #fca5a5;
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
      font-size: 15px;
      font-weight: 600;
      color: #1f2937;
      margin: 0 0 8px 0;
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
      margin-top: 16px;
      padding: 20px;
      background: #f9fafb;
      border-radius: 8px;
      border-left: 4px solid #3b82f6;
      font-size: 14px;
      line-height: 1.8;
      color: #374151;
    }
    
    .task-description ::ng-deep {
      h3, h4 {
        margin: 20px 0 12px 0;
        font-weight: 700;
        color: #1f2937;
        font-size: 15px;
      }
      
      h3:first-child {
        margin-top: 0;
      }
      
      .section-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 20px 0 12px 0;
        font-weight: 700;
        color: #1f2937;
        font-size: 15px;
        padding-bottom: 8px;
        border-bottom: 2px solid #e5e7eb;
      }
      
      .section-header:first-child {
        margin-top: 0;
      }
      
      .goal-block {
        background: #eff6ff;
        padding: 12px 16px;
        border-radius: 6px;
        margin: 12px 0;
        border-left: 3px solid #3b82f6;
      }
      
      .script-block {
        background: #f0fdf4;
        padding: 16px;
        border-radius: 6px;
        margin: 12px 0;
        border-left: 3px solid #10b981;
      }
      
      .checklist-block {
        background: #fffbeb;
        padding: 16px;
        border-radius: 6px;
        margin: 12px 0;
        border-left: 3px solid #f59e0b;
      }
      
      .deadline-block {
        background: #fef2f2;
        padding: 12px 16px;
        border-radius: 6px;
        margin: 12px 0;
        border-left: 3px solid #ef4444;
        font-weight: 600;
      }
      
      ul, ol {
        margin: 12px 0;
        padding-left: 24px;
      }
      
      li {
        margin: 6px 0;
        line-height: 1.7;
      }
      
      .checkbox-item {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        margin: 8px 0;
        padding: 4px 0;
      }
      
      .checkbox-item input[type="checkbox"] {
        margin-top: 4px;
        flex-shrink: 0;
      }
      
      .checkbox-item label {
        flex: 1;
        cursor: pointer;
      }
      
      strong {
        color: #1f2937;
        font-weight: 600;
      }
      
      em {
        color: #6b7280;
        font-style: italic;
      }
      
      code {
        background: #f3f4f6;
        padding: 2px 6px;
        border-radius: 4px;
        font-family: 'Courier New', monospace;
        font-size: 13px;
        color: #dc2626;
      }
      
      hr {
        border: none;
        border-top: 2px solid #e5e7eb;
        margin: 16px 0;
      }
      
      p {
        margin: 10px 0;
      }
      
      .highlight {
        background: #fef3c7;
        padding: 2px 6px;
        border-radius: 4px;
        font-weight: 600;
      }
      
      .input-field {
        display: flex;
        align-items: baseline;
        gap: 8px;
        margin: 8px 0;
        padding: 6px 0;
      }
      
      .input-field label {
        font-weight: 600;
        color: #374151;
        min-width: 80px;
      }
      
      .input-field .input-placeholder {
        color: #9ca3af;
        font-family: 'Courier New', monospace;
        letter-spacing: 2px;
      }
      
      .input-field span:not(.input-placeholder) {
        color: #1f2937;
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
  @Output() onToggle = new EventEmitter<LeadTask>();
  @Output() onDelete = new EventEmitter<number>();
  
  descriptionVisible = signal(false);
  
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
      formatted = `<div style="font-style: italic; color: #1f2937; margin: 8px 0; padding-left: 12px; border-left: 3px solid #10b981;">${formatted}</div>`;
    }
    
    // Обрабатываем поля ввода (Регион: ________)
    formatted = formatted.replace(/^([А-Яа-яЁё\w\s]+):\s*_+$/g, '<div class="input-field"><label>$1:</label><span class="input-placeholder">________</span></div>');
    formatted = formatted.replace(/^([А-Яа-яЁё\w\s]+):\s*(.+)$/g, '<div class="input-field"><label>$1:</label><span>$2</span></div>');
    
    // Подзаголовки
    formatted = formatted.replace(/^(ПРИВЕТСТВИЕ:|ЕСЛИ ДА:|ЕСЛИ НЕТ:)/i, '<strong style="display: block; margin-top: 12px; margin-bottom: 6px;">$1</strong>');
    formatted = formatted.replace(/^(1️⃣|2️⃣|3️⃣|4️⃣|5️⃣)\s*(.+)$/, '<strong>$1</strong> $2');
    
    // Чекбоксы
    formatted = formatted.replace(/^- ✓ (.+)$/, '<div class="checkbox-item"><input type="checkbox" disabled><label>$1</label></div>');
    formatted = formatted.replace(/^- (.+)$/, '<div class="checkbox-item"><input type="checkbox" disabled><label>$1</label></div>');
    
    // Нумерованные списки
    formatted = formatted.replace(/^(\d+[\.\)])\s+(.+)$/, '<div class="checkbox-item"><span style="font-weight: 600; color: #3b82f6;">$1</span><span>$2</span></div>');
    
    // Стрелки и переходы
    formatted = formatted.replace(/→ (.+)/g, '<span style="color: #10b981; font-weight: 600;">→ $1</span>');
    
    // Выделение текста
    formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/\*(.+?)\*/g, '<em>$1</em>');
    
    // Код/переменные
    formatted = formatted.replace(/\[(.+?)\]/g, '<code>$1</code>');
    
    return formatted;
  }
}

