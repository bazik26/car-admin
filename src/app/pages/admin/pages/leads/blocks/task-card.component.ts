import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
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
      padding: 16px;
      background: #f9fafb;
      border-radius: 8px;
      border-left: 4px solid #3b82f6;
      font-size: 13px;
      line-height: 1.6;
      color: #374151;
      white-space: pre-wrap;
      font-family: 'Courier New', monospace;
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
    // Преобразуем markdown-like форматирование в HTML
    return description
      .replace(/\n/g, '<br>')
      .replace(/━━━/g, '<hr style="border: 1px solid #e5e7eb; margin: 10px 0;">')
      .replace(/^(✅|❌|💡|⚡|📝|💬|📞|📋|🎯)/gm, '<strong>$1</strong>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  }
}

