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
    description?: string;
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
    let isRequiredSection = false;

    for (const line of lines) {
      const trimmed = line.trim();
      
      // Находим секцию "ЧТО УЗНАТЬ" или "ЧТО ОТМЕТИТЬ"
      if (trimmed.match(/^📋\s*ЧТО УЗНАТЬ/i) || 
          trimmed.match(/^📝\s*ЧТО ОТМЕТИТЬ/i) ||
          trimmed.match(/^📝\s*ЗАПИСАТЬ/i) ||
          trimmed.match(/^📝\s*ЗАПОЛНИТЬ/i) ||
          trimmed.match(/^ЧТО УЗНАТЬ/i) ||
          trimmed.match(/^ЧТО ОТМЕТИТЬ/i) ||
          trimmed.match(/^ЗАПИСАТЬ/i) ||
          trimmed.match(/^ЗАПОЛНИТЬ/i)) {
        inChecklistSection = true;
        // Проверяем, есть ли пометка "(обязательно)" в заголовке секции
        isRequiredSection = !!trimmed.match(/\(обязательно\)/i);
        continue;
      }
      
      // Выходим из секции при следующем заголовке с эмодзи или разделителе
      if ((trimmed.match(/^[🎯📞💬⚡💡📅📋📝]/) || trimmed.match(/^━━+/)) && inChecklistSection && trimmed.length > 3) {
        inChecklistSection = false;
        isRequiredSection = false;
      }
      
      if (inChecklistSection && trimmed.length > 0) {
        // Парсим строки вида:
        // "- ✓ Полное имя: Рустем"
        // "- ✓ Email: _____"
        // "- ✓ Год от: _______"
        // "Полное имя: Рустем"
        // "Email: _______"
        const match = trimmed.match(/^-?\s*✓?\s*([^:]+):\s*(.+)$/);
        if (match) {
          let label = match[1].trim();
          let value = match[2].trim();
          
          // Обрабатываем "Пробег до: _______ км"
          if (label.includes('Пробег') && value.includes('км')) {
            value = value.replace(/км/g, '').trim();
          }
          
          // Обрабатываем "Бюджет от: _____ ₽" и "Бюджет до: _____ ₽"
          if (label.includes('Бюджет')) {
            if (value.includes('₽')) {
              value = value.replace(/₽/g, '').trim();
            }
          }
          
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
            required: isRequiredSection // Поле обязательно только если секция помечена как "(обязательно)"
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
      'Результат': 'callResult',
      // Поля из таска 3 (предпочтения по автомобилям)
      'Марки': 'preferredBrands',
      'Модели': 'preferredModels',
      'Год от': 'preferredYearFrom',
      'Год до': 'preferredYearTo',
      'Пробег до': 'preferredMileageMax',
      // Поля из таска 4 (бюджет)
      'Бюджет от': 'budgetMin',
      'Бюджет до': 'budgetMax',
      // Поля из таска 5 (регион)
      'Регион': 'region',
      'Город': 'city',
      // Поля из таска 6 (сроки)
      'Сроки': 'timeline',
      // Поля из таска 7 (отправить подборку)
      'Количество отправленных вариантов': 'offersCount',
      'Дата отправки': 'offersSentDate',
      'Способ отправки': 'offersMethod',
      // Поля из таска 8 (расчет стоимости)
      'Дата отправки расчета': 'calculationSentDate',
      'Клиент понял стоимость': 'clientUnderstoodPrice',
      'Возражения по цене': 'priceObjections',
      // Поля из таска 9 (фото)
      'Количество отправленных фото': 'photosCount',
      'Клиент запросил дополнительные фото': 'clientRequestedPhotos',
      // Поля из таска 10 (follow-up)
      'Реакция клиента': 'clientReaction',
      'Возражения': 'objections',
      'Следующий шаг': 'nextStep',
      // Поля из таска 11 (возражения)
      'Тип возражения': 'objectionType',
      'Ответ клиенту': 'objectionResponse',
      'Результат обработки возражения': 'objectionResult',
      // Поля из таска 12 (встреча)
      'Дата/время встречи': 'meetingDateTime',
      'Формат': 'meetingFormat',
      'Подтверждено клиентом': 'meetingConfirmed',
      // Поля из таска 13 (договор)
      'Дата отправки договора': 'contractSentDate',
      'Договор подписан': 'contractSigned',
      'Первый платеж получен': 'firstPaymentReceived',
      // Поля из таска 14 (предоплата)
      'Сумма предоплаты': 'prepaymentAmount',
      'Дата получения': 'prepaymentDate',
      'Способ оплаты': 'paymentMethod',
      // Поля из таска 15 (подтверждение сделки)
      'Сделка подтверждена': 'dealConfirmed',
      'Дата начала оформления': 'dealStartDate',
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
    
    // Базовые контактные данные (из таска 1 и 2)
    if (taskData.email || taskData.email === '') leadUpdate.email = taskData.email;
    if (taskData.phone || taskData.phone === '') leadUpdate.phone = taskData.phone;
    if (taskData.telegram || taskData.telegram === '') leadUpdate.telegramUsername = taskData.telegram;
    if (taskData.fullName || taskData.fullName === '') leadUpdate.name = taskData.fullName;
    
    // Регион и город (из таска 5)
    if (taskData.region || taskData.region === '') leadUpdate.region = taskData.region;
    if (taskData.city || taskData.city === '') leadUpdate.city = taskData.city;
    if (taskData.deliveryCity || taskData.deliveryCity === '') leadUpdate.city = taskData.deliveryCity;
    
    // Сроки (из таска 6)
    if (taskData.timeline || taskData.timeline === '') leadUpdate.timeline = taskData.timeline;
    if (taskData.purchaseTimeline || taskData.purchaseTimeline === '') leadUpdate.timeline = taskData.purchaseTimeline;
    
    // Бюджет (из таска 4)
    if (taskData.budgetMin || taskData.budgetMax || taskData.budgetMin === 0 || taskData.budgetMax === 0) {
      leadUpdate.budget = {
        min: taskData.budgetMin || 0,
        max: taskData.budgetMax || 0,
        currency: taskData.currency || 'RUB'
      };
    }
    
    // Предпочтения по автомобилям (из таска 3)
    if (taskData.preferredBrands || taskData.preferredModels || taskData.preferredYearFrom || taskData.preferredYearTo || taskData.preferredMileageMax) {
      const brands = taskData.preferredBrands ? 
        (Array.isArray(taskData.preferredBrands) ? taskData.preferredBrands : 
         taskData.preferredBrands.split(',').map((b: string) => b.trim()).filter((b: string) => b.length > 0)) : [];
      const models = taskData.preferredModels ? 
        (Array.isArray(taskData.preferredModels) ? taskData.preferredModels : 
         taskData.preferredModels.split(',').map((m: string) => m.trim()).filter((m: string) => m.length > 0)) : [];
      
      leadUpdate.carPreferences = {
        brands: brands,
        models: models,
        yearFrom: taskData.preferredYearFrom || taskData.preferredYear?.split(' ')[1] || null,
        yearTo: taskData.preferredYearTo || taskData.preferredYear?.split(' ')[3] || null,
        maxMileage: taskData.preferredMileageMax || taskData.preferredMileage || null
      };
    }
    
    // Возражения (из таска 11)
    if (taskData.objectionType || taskData.objectionType === '') {
      if (!leadUpdate.objections) leadUpdate.objections = [];
      leadUpdate.objections.push({
        type: taskData.objectionType,
        response: taskData.objectionResponse || '',
        result: taskData.objectionResult || ''
      });
    }
    
    // Показанные автомобили (из таска 7)
    if (taskData.offersCount) {
      leadUpdate.shownCars = (leadUpdate.shownCars || 0) + parseInt(taskData.offersCount);
    }
    
    // Попытки контакта (из таска 1)
    if (taskData.clientAnswered === 'Да' || taskData.clientAnswered === 'Нет') {
      leadUpdate.contactAttempts = (leadUpdate.contactAttempts || 0) + 1;
      leadUpdate.lastContactAttemptAt = new Date();
    }

    // Данные из секции "ЧТО ОТМЕТИТЬ" (из таска 1)
    // Эти данные сохраняются в taskData и отображаются во вкладке "Собранная информация"
    // Данные автоматически собираются из taskData выполненных задач и отображаются в карточке лида

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

  getGoal(): string {
    const description = this.taskDescription();
    if (!description) return '';
    
    const lines = description.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.match(/^🎯 ЦЕЛЬ:?\s*(.+)$/i)) {
        const match = line.match(/^🎯 ЦЕЛЬ:?\s*(.+)$/i);
        if (match && match[1]) {
          return match[1].trim();
        }
      }
      // Если нашли секцию ЦЕЛЬ без текста, берем следующую строку
      if (line.match(/^🎯 ЦЕЛЬ:?$/i) && i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim();
        if (nextLine && !nextLine.match(/^[🎯📞💬⚡💡📅📋📝]/)) {
          return nextLine;
        }
      }
    }
    return '';
  }

  getScript(): string {
    const description = this.taskDescription();
    if (!description) return '';
    
    const lines = description.split('\n');
    let scriptStart = -1;
    let scriptEnd = -1;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.match(/^📞 СКРИПТ ЗВОНКА:?/i) || line.match(/^💬 СКРИПТ:?/i)) {
        scriptStart = i;
      } else if (scriptStart >= 0 && (line.match(/^📝 ЧТО ОТМЕТИТЬ/i) || line.match(/^📋 ЧТО УЗНАТЬ/i) || line.match(/^⚡ ДЕДЛАЙН/i))) {
        scriptEnd = i;
        break;
      }
    }
    
    if (scriptStart >= 0) {
      const scriptLines = lines.slice(scriptStart + 1, scriptEnd >= 0 ? scriptEnd : lines.length);
      return scriptLines.join('\n').trim();
    }
    
    return '';
  }

  formatScript(script: string): string {
    if (!script) return '';
    
    let formatted = script;
    
    // Обрабатываем подзаголовки
    formatted = formatted.replace(/^(ПРИВЕТСТВИЕ:|ЕСЛИ ДА:|ЕСЛИ НЕТ:)/gim, '<strong style="display: block; margin-top: 16px; margin-bottom: 8px; font-size: 13px; color: #111827;">$1</strong>');
    
    // Обрабатываем кавычки (скрипты)
    formatted = formatted.replace(/^["'`](.+?)["'`]$/gm, '<div class="script-quote">$1</div>');
    
    // Обрабатываем стрелки
    formatted = formatted.replace(/→ (.+)/g, '<span style="color: #10b981; font-weight: 500;">→ $1</span>');
    
    // Обрабатываем нумерованные списки
    formatted = formatted.replace(/^(\d+[\.\)])\s+(.+)$/gm, '<div style="margin: 6px 0;"><span style="font-weight: 600; color: #3b82f6;">$1</span> <span>$2</span></div>');
    
    // Обрабатываем маркированные списки
    formatted = formatted.replace(/^- (.+)$/gm, '<div style="margin: 4px 0; padding-left: 8px;">• $1</div>');
    
    // Разделяем параграфы
    formatted = formatted.replace(/\n\n/g, '</p><p>');
    formatted = '<p>' + formatted + '</p>';
    
    return formatted;
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
      formatted = `<div class="script-quote">${formatted}</div>`;
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
    formatted = formatted.replace(/^(ПРИВЕТСТВИЕ:|ЕСЛИ ДА:|ЕСЛИ НЕТ:)/i, '<strong class="subsection-header">$1</strong>');
    formatted = formatted.replace(/^(1️⃣|2️⃣|3️⃣|4️⃣|5️⃣)\s*(.+)$/, '<strong class="numbered-item">$1</strong> <span>$2</span>');
    
    // Чекбоксы и списки
    formatted = formatted.replace(/^- ✓ (.+)$/, '<div class="checkbox-item"><input type="checkbox" disabled><label>$1</label></div>');
    formatted = formatted.replace(/^- (.+)$/, '<div class="checkbox-item"><input type="checkbox" disabled><label>$1</label></div>');
    formatted = formatted.replace(/^• (.+)$/, '<div class="checkbox-item"><span class="bullet">•</span><span>$1</span></div>');
    
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

