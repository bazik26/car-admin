import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppService } from '../../../../services/app.service';
import { BsModalService } from 'ngx-bootstrap/modal';
import { TaskDetailsModalComponent } from './blocks/task-details.modal';

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
  selector: 'app-tasks-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tasks.page.html',
  styleUrls: ['./tasks.page.scss']
})
export class TasksPageComponent implements OnInit {
  private readonly appService = inject(AppService);
  private readonly modalService = inject(BsModalService);

  public tasks = signal<Task[]>([]);
  public groupedTasks = signal<Map<number, Task[]>>(new Map());
  public isLoading = signal(false);
  public filterStatus = signal<string>('all'); // 'all' | 'pending' | 'in_progress' | 'completed'
  public filterCompleted = signal<boolean | null>(null);
  public expandedLeads = signal<Set<number>>(new Set());

  ngOnInit() {
    this.loadTasks();
  }

  loadTasks() {
    this.isLoading.set(true);
    const status = this.filterStatus() === 'all' ? undefined : this.filterStatus();
    const completedValue = this.filterCompleted();
    const completed: boolean | undefined = completedValue === null ? undefined : completedValue;
    
    this.appService.getAdminTasks(status, completed).subscribe({
      next: (tasks: Task[]) => {
        this.tasks.set(tasks);
        this.groupTasksByLead(tasks);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Ошибка загрузки задач:', error);
        this.isLoading.set(false);
      }
    });
  }

  groupTasksByLead(tasks: Task[]) {
    const grouped = new Map<number, Task[]>();
    
    // Группируем задачи по лидам
    tasks.forEach(task => {
      if (!grouped.has(task.leadId)) {
        grouped.set(task.leadId, []);
      }
      grouped.get(task.leadId)!.push(task);
    });
    
    // Сортируем задачи внутри каждой группы:
    // 1. Невыполненные сначала
    // 2. По дате дедлайна (ближайшие сначала)
    grouped.forEach((leadTasks, leadId) => {
      leadTasks.sort((a, b) => {
        // Сначала невыполненные
        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1;
        }
        // Потом по дедлайну
        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        return 0;
      });
      
      // Показываем только первые 3 невыполненные задачи для каждого лида
      const uncompleted = leadTasks.filter(t => !t.completed);
      const completed = leadTasks.filter(t => t.completed);
      
      // Если есть невыполненные, показываем только их (максимум 3)
      if (uncompleted.length > 0) {
        grouped.set(leadId, uncompleted.slice(0, 3));
      } else {
        // Если все выполнены, показываем последние 2
        grouped.set(leadId, completed.slice(-2));
      }
    });
    
    this.groupedTasks.set(grouped);
    
    // Автоматически раскрываем все группы с невыполненными задачами
    const leadsWithUncompleted = new Set<number>();
    grouped.forEach((leadTasks, leadId) => {
      if (leadTasks.some(t => !t.completed)) {
        leadsWithUncompleted.add(leadId);
      }
    });
    this.expandedLeads.set(leadsWithUncompleted);
  }

  toggleLead(leadId: number) {
    const expanded = new Set(this.expandedLeads());
    if (expanded.has(leadId)) {
      expanded.delete(leadId);
    } else {
      expanded.add(leadId);
    }
    this.expandedLeads.set(expanded);
  }

  isLeadExpanded(leadId: number): boolean {
    return this.expandedLeads().has(leadId);
  }

  getLeadTasks(leadId: number): Task[] {
    return this.groupedTasks().get(leadId) || [];
  }

  getLeadName(leadId: number): string {
    const tasks = this.tasks();
    const task = tasks.find(t => t.leadId === leadId);
    return task?.lead?.name || `Лид #${leadId}`;
  }

  getUncompletedCount(leadId: number): number {
    return this.getLeadTasks(leadId).filter(t => !t.completed).length;
  }

  getLeadIds(): number[] {
    return Array.from(this.groupedTasks().keys());
  }

  openTaskDetails(task: Task) {
    const modalRef = this.modalService.show(TaskDetailsModalComponent, {
      initialState: { task },
      backdrop: true,
      keyboard: true,
      class: 'modal-lg'
    });

    // Обновляем список задач после закрытия модального окна
    modalRef.onHide?.subscribe(() => {
      this.loadTasks();
    });
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'pending':
        return 'bg-warning text-dark';
      case 'in_progress':
        return 'bg-info';
      case 'completed':
        return 'bg-success';
      default:
        return 'bg-secondary';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'pending':
        return 'Ожидает';
      case 'in_progress':
        return 'В работе';
      case 'completed':
        return 'Выполнена';
      default:
        return status;
    }
  }

  getTaskTypeLabel(taskType: string): string {
    const labels: any = {
      contact: 'Связаться',
      register_lead: 'Оформить лида',
      car_preferences: 'Выборка машин',
      region: 'Регион',
      budget: 'Бюджет',
      additional_info: 'Доп. информация',
    };
    return labels[taskType] || taskType;
  }

  formatDate(dateString?: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  isOverdue(dueDate?: string): boolean {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && !this.tasks().find(t => t.dueDate === dueDate)?.completed;
  }

  setFilterStatus(status: string) {
    this.filterStatus.set(status);
    this.loadTasks();
  }

  setFilterCompleted(completed: boolean | null) {
    this.filterCompleted.set(completed);
    this.loadTasks();
  }
}

