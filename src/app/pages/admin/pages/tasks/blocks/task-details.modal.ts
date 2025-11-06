import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { AppService } from '../../../../../services/app.service';
import { Router } from '@angular/router';
import { take } from 'rxjs/operators';

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
  styleUrls: ['./task-details.modal.scss']
})
export class TaskDetailsModalComponent implements OnInit {
  public readonly bsModalRef = inject(BsModalRef);
  private readonly appService = inject(AppService);
  private readonly router = inject(Router);

  task!: Task;
  taskForm: any = {};
  isSaving = signal(false);

  ngOnInit() {
    this.taskForm = {
      status: this.task.status || 'pending',
      taskData: { ...this.task.taskData } || {},
    };
  }

  save() {
    this.isSaving.set(true);
    
    const updateData: any = {
      status: this.taskForm.status,
      taskData: this.taskForm.taskData,
    };

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
}

