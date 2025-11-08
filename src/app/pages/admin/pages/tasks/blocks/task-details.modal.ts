import { Component, inject, OnInit, signal, ViewEncapsulation, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { AppService } from '../../../../../services/app.service';
import { Router } from '@angular/router';
import { take } from 'rxjs/operators';
import { getTaskTemplate } from '../../../../../utils/task-templates';

export interface Task {
  id: number;
  leadId: number;
  adminId: number;
  title: string;
  description?: string;
  taskType: string;
  status: string;
  dueDate?: string;
  completed: boolean;
  completedAt?: string;
  taskData?: any;
  lead?: {
    id: number;
    name: string;
    email?: string;
    phone?: string;
  };
  createdAt: string;
  updatedAt: string;
}

@Component({
  selector: 'app-task-details-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task-details.modal.html',
  styleUrls: ['./task-details.modal.scss'],
  encapsulation: ViewEncapsulation.None
})
export class TaskDetailsModalComponent implements OnInit {
  public readonly bsModalRef = inject(BsModalRef);
  private readonly appService = inject(AppService);
  private readonly router = inject(Router);

  task!: Task;
  taskForm: any = {};
  isSaving = signal(false);
  taskFields = signal<Array<{key: string; label: string; value: string; required: boolean}>>([]);
  
  // Получаем описание из шаблона или используем существующее
  taskDescription = computed(() => {
    if (this.task.taskType && this.task.lead) {
      const template = getTaskTemplate(this.task.taskType, this.task.lead);
      if (template) {
        return template.description;
      }
    }
    return this.task.description || '';
  });

  ngOnInit() {
    this.taskForm = {
      status: this.task.status || 'pending',
      taskData: this.task.taskData ? { ...this.task.taskData } : {},
    };

    // Преобразуем массивы в строки для редактирования
    if (this.taskForm.taskData.preferredBrands && Array.isArray(this.taskForm.taskData.preferredBrands)) {
      this.taskForm.taskData.preferredBrands = this.taskForm.taskData.preferredBrands.join(', ');
    }
    if (this.taskForm.taskData.preferredModels && Array.isArray(this.taskForm.taskData.preferredModels)) {
      this.taskForm.taskData.preferredModels = this.taskForm.taskData.preferredModels.join(', ');
    }

    // Парсим описание задачи для извлечения полей (используем шаблон если есть)
    const description = this.taskDescription();
    if (description) {
      this.parseTaskFields(description);
    }
  }

  parseTaskFields(description: string) {
    const fields: Array<{key: string; label: string; value: string; required: boolean}> = [];
    const lines = description.split('\n');
    let inChecklistSection = false;

    for (const line of lines) {
      const trimmed = line.trim();
      
      // Находим секцию "ЧТО УЗНАТЬ" или "ЧТО ОТМЕТИТЬ"
      if (trimmed.match(/^📋\s*ЧТО УЗНАТЬ/i) || 
          trimmed.match(/^📝\s*ЧТО ОТМЕТИТЬ/i) ||
          trimmed.match(/^ЧТО УЗНАТЬ/i) ||
          trimmed.match(/^ЧТО ОТМЕТИТЬ/i)) {
        inChecklistSection = true;
        continue;
      }
      
      // Выходим из секции при следующем заголовке с эмодзи или разделителе
      if ((trimmed.match(/^[🎯📞💬⚡💡📅📋📝]/) || trimmed.match(/^━━+/)) && inChecklistSection && trimmed.length > 3) {
        inChecklistSection = false;
      }
      
      if (inChecklistSection && trimmed.length > 0) {
        // Парсим строки вида:
        // "- ✓ Полное имя: Рустем"
        // "- ✓ Email: _____"
        // "Полное имя: Рустем"
        // "Email: _______"
        const match = trimmed.match(/^-?\s*✓?\s*([^:]+):\s*(.+)$/);
        if (match) {
          const label = match[1].trim();
          const value = match[2].trim();
          const key = this.generateFieldKey(label);
          
          // Проверяем, заполнено ли поле (не пустое и не только подчеркивания/пробелы)
          const isFilled = value && !value.match(/^[_\-\.\s]+$/) && value.length > 0;
          const currentValue = this.taskForm.taskData[key] || (isFilled ? value : '');
          
          // Пропускаем пустые значения из описания (только подчеркивания)
          if (!isFilled && !this.taskForm.taskData[key]) {
            // Оставляем пустое значение для заполнения
          }
          
          fields.push({
            key,
            label,
            value: currentValue,
            required: true // Все поля в "ЧТО УЗНАТЬ" обязательны
          });
        }
      }
    }
    
    this.taskFields.set(fields);
    
    // Инициализируем значения полей в taskForm.taskData
    fields.forEach(field => {
      if (!this.taskForm.taskData[field.key]) {
        this.taskForm.taskData[field.key] = field.value || '';
      }
    });
  }

  generateFieldKey(label: string): string {
    // Преобразуем русские названия в ключи
    const keyMap: Record<string, string> = {
      'Полное имя': 'fullName',
      'Email': 'email',
      'Телефон': 'phone',
      'Telegram': 'telegram',
      'Город доставки': 'deliveryCity',
      'Когда планирует покупку': 'purchaseTimeline',
      'Дата/время звонка': 'callDateTime',
      'Клиент взял трубку': 'clientAnswered',
      'Удобное время для разговора': 'convenientTime',
      'Результат': 'result',
    };
    
    const normalizedLabel = label.trim();
    return keyMap[normalizedLabel] || normalizedLabel.toLowerCase().replace(/\s+/g, '_');
  }

  updateFieldValue(key: string, value: string) {
    if (!this.taskForm.taskData) {
      this.taskForm.taskData = {};
    }
    this.taskForm.taskData[key] = value;
    
    // Обновляем значение в массиве полей
    const fields = this.taskFields();
    const fieldIndex = fields.findIndex(f => f.key === key);
    if (fieldIndex >= 0) {
      fields[fieldIndex].value = value;
      this.taskFields.set([...fields]);
    }
  }

  canCompleteTask(): boolean {
    const fields = this.taskFields();
    if (fields.length === 0) return true; // Если нет полей, можно завершить
    
    // Проверяем, что все обязательные поля заполнены
    return fields.every(field => {
      if (!field.required) return true;
      const value = this.taskForm.taskData[field.key];
      return value && value.trim().length > 0 && !value.match(/^_+$/);
    });
  }

  getMissingFields(): string[] {
    const fields = this.taskFields();
    return fields
      .filter(field => field.required && (!this.taskForm.taskData[field.key] || 
        this.taskForm.taskData[field.key].trim().length === 0 || 
        this.taskForm.taskData[field.key].match(/^_+$/)))
      .map(field => field.label);
  }

  save() {
    this.isSaving.set(true);
    
    const updateData: any = {
      status: this.taskForm.status,
      taskData: { ...this.taskForm.taskData },
    };

    // Преобразуем строки обратно в массивы
    if (updateData.taskData.preferredBrands && typeof updateData.taskData.preferredBrands === 'string') {
      updateData.taskData.preferredBrands = updateData.taskData.preferredBrands.split(',').map((b: string) => b.trim()).filter((b: string) => b.length > 0);
    }
    if (updateData.taskData.preferredModels && typeof updateData.taskData.preferredModels === 'string') {
      updateData.taskData.preferredModels = updateData.taskData.preferredModels.split(',').map((m: string) => m.trim()).filter((m: string) => m.length > 0);
    }

    if (this.taskForm.status === 'completed') {
      updateData.completed = true;
    }

    this.appService.updateLeadTask(this.task.id, updateData)
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.bsModalRef.hide();
        },
        error: (error: any) => {
          console.error('Ошибка сохранения задачи:', error);
          alert('Ошибка сохранения задачи');
          this.isSaving.set(false);
        }
      });
  }

  completeTask() {
    // Проверяем заполненность всех обязательных полей
    if (!this.canCompleteTask()) {
      const missingFields = this.getMissingFields();
      alert(`Не все обязательные поля заполнены:\n${missingFields.join('\n')}`);
      return;
    }

    // Сохраняем данные и помечаем задачу как выполненную
    this.isSaving.set(true);
    
    const updateData: any = {
      status: 'completed',
      completed: true,
      taskData: { ...this.taskForm.taskData },
    };

    // Преобразуем строки обратно в массивы
    if (updateData.taskData.preferredBrands && typeof updateData.taskData.preferredBrands === 'string') {
      updateData.taskData.preferredBrands = updateData.taskData.preferredBrands.split(',').map((b: string) => b.trim()).filter((b: string) => b.length > 0);
    }
    if (updateData.taskData.preferredModels && typeof updateData.taskData.preferredModels === 'string') {
      updateData.taskData.preferredModels = updateData.taskData.preferredModels.split(',').map((m: string) => m.trim()).filter((m: string) => m.length > 0);
    }

    // Обновляем информацию о лиде на основе собранных данных
    this.updateLeadFromTaskData(updateData.taskData);

    this.appService.updateLeadTask(this.task.id, updateData)
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.bsModalRef.hide();
        },
        error: (error: any) => {
          console.error('Ошибка завершения задачи:', error);
          alert('Ошибка завершения задачи');
          this.isSaving.set(false);
        }
      });
  }

  updateLeadFromTaskData(taskData: any) {
    // Обновляем информацию о лиде на основе собранных данных из задачи
    const leadUpdate: any = {};
    
    if (taskData.email) leadUpdate.email = taskData.email;
    if (taskData.phone) leadUpdate.phone = taskData.phone;
    if (taskData.telegram) leadUpdate.telegramUsername = taskData.telegram;
    if (taskData.deliveryCity) leadUpdate.city = taskData.deliveryCity;
    if (taskData.region) leadUpdate.region = taskData.region;
    if (taskData.purchaseTimeline) leadUpdate.timeline = taskData.purchaseTimeline;
    if (taskData.budgetMin || taskData.budgetMax) {
      leadUpdate.budget = {
        min: taskData.budgetMin || 0,
        max: taskData.budgetMax || 0,
        currency: taskData.currency || 'RUB'
      };
    }
    if (taskData.preferredBrands || taskData.preferredModels) {
      leadUpdate.carPreferences = {
        brands: Array.isArray(taskData.preferredBrands) ? taskData.preferredBrands : 
                (taskData.preferredBrands ? taskData.preferredBrands.split(',').map((b: string) => b.trim()) : []),
        models: Array.isArray(taskData.preferredModels) ? taskData.preferredModels : 
                (taskData.preferredModels ? taskData.preferredModels.split(',').map((m: string) => m.trim()) : []),
        yearFrom: taskData.preferredYearFrom,
        yearTo: taskData.preferredYearTo,
        maxMileage: taskData.preferredMileageMax
      };
    }

    // Обновляем лид, если есть данные для обновления
    if (Object.keys(leadUpdate).length > 0) {
      this.appService.updateLead(this.task.leadId, leadUpdate)
        .pipe(take(1))
        .subscribe({
          next: () => {
            console.log('Информация о лиде обновлена');
          },
          error: (error: any) => {
            console.error('Ошибка обновления лида:', error);
          }
        });
    }
  }

  cancel() {
    this.bsModalRef.hide();
  }

  goToLead() {
    this.bsModalRef.hide();
    this.router.navigate(['/admin/leads'], { queryParams: { leadId: this.task.leadId } });
  }

  formatDate(dateString?: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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
      
      // Заголовки секций
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
      } else if (line.match(/^⚡ ДЕДЛАЙН:?\s*(.+)$/i)) {
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
      } else if (line.match(/^💡 ПОДСКАЗКА:?/i) || line.match(/^💡 ПРЕИМУЩЕСТВА:?/i)) {
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
      } else if (line.match(/^✅ ЧТО ВХОДИТ/i)) {
        closeCurrentBlock();
        result.push('<div class="section-header"><span>✅</span><span>ЧТО ВХОДИТ В СТОИМОСТЬ</span></div>');
        currentBlock = { type: 'checklist', content: [] };
      } else if (line.match(/^💰.*ШАБЛОН/i)) {
        closeCurrentBlock();
        result.push('<div class="section-header"><span>💰</span><span>ШАБЛОН РАСЧЕТА</span></div>');
        currentBlock = { type: 'script', content: [] };
      } else if (line.match(/^━━━+/)) {
        closeCurrentBlock();
        result.push('<hr>');
      } else if (line) {
        if (currentBlock) {
          currentBlock.content.push(line);
        } else {
          result.push(this.formatLine(line));
        }
      } else {
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
    
    // Обрабатываем таблицы (| Стоимость | [X] € |)
    formatted = formatted.replace(/\|(.+?)\|/g, (match, content) => {
      const cells = content.split('|').map((c: string) => c.trim()).filter((c: string) => c);
      if (cells.length > 1) {
        return `<div class="table-row">${cells.map((cell: string) => `<span class="table-cell">${cell}</span>`).join('')}</div>`;
      }
      return match;
    });
    
    // Обрабатываем поля ввода
    formatted = formatted.replace(/^([А-Яа-яЁё\w\s]+):\s*_+$/g, '<div class="input-field"><label>$1:</label><span class="input-placeholder">________</span></div>');
    formatted = formatted.replace(/^([А-Яа-яЁё\w\s]+):\s*(.+)$/g, '<div class="input-field"><label>$1:</label><span>$2</span></div>');
    
    // Подзаголовки
    formatted = formatted.replace(/^(ПРИВЕТСТВИЕ:|ЕСЛИ ДА:|ЕСЛИ НЕТ:)/i, '<strong style="display: block; margin-top: 12px; margin-bottom: 6px;">$1</strong>');
    formatted = formatted.replace(/^(1️⃣|2️⃣|3️⃣|4️⃣|5️⃣)\s*(.+)$/, '<strong>$1</strong> $2');
    
    // Чекбоксы и списки
    formatted = formatted.replace(/^- ✓ (.+)$/, '<div class="checkbox-item"><input type="checkbox" disabled><label>$1</label></div>');
    formatted = formatted.replace(/^- (.+)$/, '<div class="checkbox-item"><input type="checkbox" disabled><label>$1</label></div>');
    formatted = formatted.replace(/^• (.+)$/, '<div class="checkbox-item"><span class="bullet">•</span><span>$1</span></div>');
    
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

