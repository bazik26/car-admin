import { CommonModule } from '@angular/common';
import {
  Component,
  inject,
  Input,
  OnInit,
  ViewEncapsulation,
  signal,
  computed,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { AppService } from '../../../../../services/app.service';
import { take } from 'rxjs';
import { LeadPipelineComponent } from './lead-pipeline.component';
import { TaskCardComponent } from './task-card.component';
import { filterTasksByPipelineStage, getTasksForCurrentStage, PipelineStage as PipelineStageEnum } from '../../../../../utils/pipeline-helpers';

interface Lead {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  source: 'chat' | 'telegram' | 'phone' | 'email' | 'other';
  status: 'new' | 'in_progress' | 'contacted' | 'closed' | 'lost';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  pipelineStage?: 'new_lead' | 'first_contact' | 'qualification' | 'needs_analysis' | 'presentation' | 'negotiation' | 'deal_closing' | 'won' | 'lost';
  hasTelegramContact?: boolean;
  telegramUsername?: string;
  chatSessionId?: string;
  assignedAdminId?: number;
  assignedAdmin?: any;
  description?: string;
  comments?: any[];
  tags?: any[];
  score?: number;
  convertedToClient?: boolean;
  budget?: { min: number; max: number; currency: string };
  carPreferences?: any;
  city?: string;
  region?: string;
  timeline?: string;
  objections?: string;
  shownCars?: number[];
  contactAttempts?: number;
  createdAt: Date;
  updatedAt: Date;
}

interface LeadComment {
  id: number;
  comment: string;
  admin?: any;
  createdAt: string;
}

export interface LeadTask {
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

interface LeadTag {
  id: number;
  name: string;
  color: string;
}

interface LeadAttachment {
  id: number;
  fileName: string;
  filePath: string;
  fileSize?: number;
  admin?: any;
  createdAt: string;
}

interface LeadMeeting {
  id: number;
  title: string;
  description?: string;
  meetingDate: string;
  location?: string;
  meetingType: string;
  completed: boolean;
  admin?: any;
}

interface LeadActivity {
  id: number;
  activityType: string;
  description?: string;
  admin?: any;
  createdAt: string;
}

interface ChatMessage {
  id?: number;
  message: string;
  senderType: 'client' | 'admin';
  clientName?: string;
  createdAt: string;
}

@Component({
  selector: 'app-lead-details-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LeadPipelineComponent, TaskCardComponent],
  templateUrl: './details.modal.html',
  styleUrls: ['./details.modal.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class LeadDetailsModal implements OnInit {
  public readonly activeModal = inject(BsModalRef);
  public readonly appService = inject(AppService);

  @Input()
  lead!: Lead;

  public activeTab = signal('pipeline'); // Начинаем с вкладки "Воронка"
  public leadData = signal<Lead | null>(null);
  public isLoading = signal(true);
  
  // Данные
  public chatMessages = signal<ChatMessage[]>([]);
  public leadTasks = signal<LeadTask[]>([]);
  public leadAttachments = signal<LeadAttachment[]>([]);
  public leadMeetings = signal<LeadMeeting[]>([]);
  public leadActivities = signal<LeadActivity[]>([]);
  public allTags = signal<LeadTag[]>([]);
  public admins: any[] = [];
  public currentAdmin: any = null;

  // Формы
  public newComment = '';
  public showTaskForm = signal(false);
  public newTask = { title: '', description: '', dueDate: '' };
  public showTagForm = signal(false);
  public newTag = { name: '', color: '#4f8cff' };
  public showMeetingForm = signal(false);
  public newMeeting = { title: '', description: '', meetingDate: '', location: '', meetingType: 'call' };
  public selectedFile: File | null = null;

  ngOnInit() {
    if (this.lead) {
      this.loadFullLeadData();
      this.loadAdmins();
      this.loadAllTags();
      this.loadCurrentAdmin();
    }
  }

  loadCurrentAdmin() {
    this.appService.auth().pipe(take(1)).subscribe({
      next: (admin: any) => {
        this.currentAdmin = admin;
      }
    });
  }

  loadFullLeadData() {
    this.isLoading.set(true);
    this.appService.getLead(this.lead.id).pipe(take(1)).subscribe({
      next: (fullLead: Lead) => {
        this.leadData.set(fullLead);
        
        // Загружаем все данные
        if (fullLead.chatSessionId) {
          this.loadChatMessages(fullLead.chatSessionId);
        }
        this.loadLeadTasks(fullLead.id);
        this.loadLeadAttachments(fullLead.id);
        this.loadLeadMeetings(fullLead.id);
        this.loadLeadActivities(fullLead.id);
        
        this.isLoading.set(false);
      },
      error: (error: any) => {
        console.error('Error loading full lead:', error);
        this.leadData.set(this.lead);
        this.isLoading.set(false);
      }
    });
  }

  loadAdmins() {
    this.appService.getAdminsAll().pipe(take(1)).subscribe({
      next: (admins: any) => {
        this.admins = admins;
      }
    });
  }

  loadChatMessages(chatSessionId: string) {
    this.appService.getChatMessages(chatSessionId).pipe(take(1)).subscribe({
      next: (messages: ChatMessage[]) => {
        this.chatMessages.set(messages);
      }
    });
  }

  loadLeadTasks(leadId: number) {
    this.appService.getLeadTasks(leadId).pipe(take(1)).subscribe({
      next: (tasks: LeadTask[]) => {
        this.leadTasks.set(tasks);
      }
    });
  }

  loadLeadAttachments(leadId: number) {
    this.appService.getLeadAttachments(leadId).pipe(take(1)).subscribe({
      next: (attachments: LeadAttachment[]) => {
        this.leadAttachments.set(attachments);
      }
    });
  }

  loadLeadMeetings(leadId: number) {
    this.appService.getLeadMeetings(leadId).pipe(take(1)).subscribe({
      next: (meetings: LeadMeeting[]) => {
        this.leadMeetings.set(meetings);
      }
    });
  }

  loadLeadActivities(leadId: number) {
    this.appService.getLeadActivities(leadId).pipe(take(1)).subscribe({
      next: (activities: LeadActivity[]) => {
        this.leadActivities.set(activities);
      }
    });
  }

  loadAllTags() {
    this.appService.getAllTags().pipe(take(1)).subscribe({
      next: (tags: LeadTag[]) => {
        this.allTags.set(tags);
      }
    });
  }

  closeModal() {
    this.activeModal.hide();
  }

  getSourceLabel(source: string): string {
    const labels: any = {
      chat: 'Чат',
      telegram: 'Telegram',
      phone: 'Телефон',
      email: 'Email',
      other: 'Другое'
    };
    return labels[source] || source;
  }

  getScoreClass(score: number): string {
    if (score >= 80) return 'score-high';
    if (score >= 50) return 'score-medium';
    return 'score-low';
  }

  formatDate(dateString: string | Date): string {
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

  formatTime(dateString: string | Date): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatFileSize(bytes?: number): string {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  getMeetingTypeLabel(type: string): string {
    const labels: any = {
      call: 'Звонок',
      email: 'Email',
      meeting: 'Встреча',
      visit: 'Визит',
      other: 'Другое'
    };
    return labels[type] || type;
  }

  getActivityIcon(type: string): string {
    const icons: any = {
      created: 'fa-plus-circle',
      updated: 'fa-edit',
      commented: 'fa-comment',
      assigned: 'fa-user-plus',
      converted: 'fa-check-circle',
      task_created: 'fa-tasks',
      task_completed: 'fa-check',
      meeting_created: 'fa-calendar',
      attachment_added: 'fa-paperclip',
    };
    return icons[type] || 'fa-info-circle';
  }

  getActivityDescription(activity: LeadActivity): string {
    const lead = this.leadData();
    if (!lead) return '';
    
    switch (activity.activityType) {
      case 'created':
        return 'Лид создан';
      case 'updated':
        return 'Лид обновлен';
      case 'assigned':
        return `Лид назначен администратору ${activity.admin?.email || ''}`;
      case 'converted':
        return 'Лид конвертирован в клиента';
      default:
        return activity.description || 'Действие выполнено';
    }
  }

  isOverdue(dueDate: string): boolean {
    return new Date(dueDate) < new Date() && !this.leadTasks().find(t => t.dueDate === dueDate)?.completed;
  }

  isTagAssigned(tagId: number): boolean {
    const lead = this.leadData();
    return lead?.tags?.some(t => t.id === tagId) || false;
  }

  // Методы для обновления данных
  updateLeadStatus(status: string) {
    const lead = this.leadData();
    if (!lead) return;
    
    this.appService.updateLead(lead.id, { status }).pipe(take(1)).subscribe({
      next: (updatedLead: Lead) => {
        this.leadData.set(updatedLead);
        this.loadLeadActivities(lead.id);
      }
    });
  }

  updateLeadPriority(priority: string) {
    const lead = this.leadData();
    if (!lead) return;
    
    this.appService.updateLead(lead.id, { priority }).pipe(take(1)).subscribe({
      next: (updatedLead: Lead) => {
        this.leadData.set(updatedLead);
        this.loadLeadActivities(lead.id);
      }
    });
  }

  assignLead(adminId: number | null) {
    const lead = this.leadData();
    if (!lead) return;
    
    this.appService.updateLead(lead.id, { assignedAdminId: adminId }).pipe(take(1)).subscribe({
      next: (updatedLead: Lead) => {
        this.leadData.set(updatedLead);
        this.loadLeadActivities(lead.id);
      }
    });
  }

  addComment() {
    const lead = this.leadData();
    if (!lead || !this.newComment.trim() || !this.currentAdmin) return;
    
    this.appService.createLeadComment(lead.id, { adminId: this.currentAdmin.id, comment: this.newComment }).pipe(take(1)).subscribe({
      next: () => {
        this.newComment = '';
        this.loadFullLeadData();
      }
    });
  }

  createTask() {
    const lead = this.leadData();
    if (!lead || !this.newTask.title.trim() || !this.currentAdmin) return;
    
    this.appService.createLeadTask(lead.id, { 
      adminId: this.currentAdmin.id,
      title: this.newTask.title,
      description: this.newTask.description || undefined,
      dueDate: this.newTask.dueDate || undefined
    }).pipe(take(1)).subscribe({
      next: () => {
        this.newTask = { title: '', description: '', dueDate: '' };
        this.showTaskForm.set(false);
        this.loadLeadTasks(lead.id);
        this.loadLeadActivities(lead.id);
      }
    });
  }

  toggleTask(task: LeadTask) {
    this.appService.updateLeadTask(task.id, { completed: !task.completed }).pipe(take(1)).subscribe({
      next: () => {
        const lead = this.leadData();
        if (lead) {
          // Перезагружаем данные лида (включая обновленный pipelineStage)
          this.loadFullLeadData();
          
          // Показываем уведомление об автопереходе
          if (!task.completed) {
            // Задача только что была выполнена
            setTimeout(() => {
              this.showStageChangeNotification();
            }, 500);
          }
        }
      }
    });
  }
  
  // Показать уведомление о смене этапа
  private showStageChangeNotification() {
    // Проверяем, изменился ли этап
    const currentStage = this.getCurrentPipelineStage();
    const stageNames: any = {
      'new_lead': 'Новый лид',
      'first_contact': 'Первый контакт',
      'qualification': 'Квалификация',
      'needs_analysis': 'Выявление потребностей',
      'presentation': 'Презентация',
      'negotiation': 'Переговоры',
      'deal_closing': 'Закрытие сделки',
      'won': 'Успех! 🎉',
      'lost': 'Отказ'
    };
    
    // Создаем уведомление (toast)
    const toast = document.createElement('div');
    toast.className = 'stage-change-toast';
    toast.innerHTML = `
      <div class="toast-content">
        <i class="fas fa-arrow-circle-up text-success"></i>
        <div>
          <strong>Этап обновлен!</strong>
          <p class="mb-0">Лид перешел на этап: ${stageNames[currentStage] || currentStage}</p>
        </div>
      </div>
    `;
    toast.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      background: white;
      padding: 16px 20px;
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.15);
      border-left: 4px solid #10b981;
      z-index: 9999;
      animation: slideInRight 0.3s ease;
      min-width: 300px;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideOutRight 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  deleteTask(taskId: number) {
    if (!confirm('Удалить задачу?')) return;
    
    this.appService.deleteLeadTask(taskId).pipe(take(1)).subscribe({
      next: () => {
        const lead = this.leadData();
        if (lead) {
          this.loadLeadTasks(lead.id);
          this.loadLeadActivities(lead.id);
        }
      }
    });
  }

  createTag() {
    if (!this.newTag.name.trim()) return;
    
    this.appService.createTag(this.newTag.name, this.newTag.color).pipe(take(1)).subscribe({
      next: () => {
        this.newTag = { name: '', color: '#4f8cff' };
        this.showTagForm.set(false);
        this.loadAllTags();
      }
    });
  }

  toggleTag(tagId: number) {
    const lead = this.leadData();
    if (!lead) return;
    
    const isAssigned = this.isTagAssigned(tagId);
    
    if (isAssigned) {
      this.appService.removeTagFromLead(lead.id, tagId).pipe(take(1)).subscribe({
        next: () => {
          this.loadFullLeadData();
        }
      });
    } else {
      this.appService.addTagToLead(lead.id, tagId).pipe(take(1)).subscribe({
        next: () => {
          this.loadFullLeadData();
        }
      });
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    
    this.selectedFile = file;
    const lead = this.leadData();
    if (!lead) return;
    
    this.appService.createLeadAttachment(lead.id, file).pipe(take(1)).subscribe({
      next: () => {
        this.selectedFile = null;
        this.loadLeadAttachments(lead.id);
        this.loadLeadActivities(lead.id);
      }
    });
  }

  deleteAttachment(attachmentId: number) {
    if (!confirm('Удалить файл?')) return;
    
    this.appService.deleteLeadAttachment(attachmentId).pipe(take(1)).subscribe({
      next: () => {
        const lead = this.leadData();
        if (lead) {
          this.loadLeadAttachments(lead.id);
          this.loadLeadActivities(lead.id);
        }
      }
    });
  }

  createMeeting() {
    const lead = this.leadData();
    if (!lead || !this.newMeeting.title.trim() || !this.currentAdmin) return;
    
    this.appService.createLeadMeeting(lead.id, { 
      adminId: this.currentAdmin.id,
      title: this.newMeeting.title,
      description: this.newMeeting.description || undefined,
      meetingDate: this.newMeeting.meetingDate,
      location: this.newMeeting.location || undefined,
      meetingType: this.newMeeting.meetingType || undefined
    }).pipe(take(1)).subscribe({
      next: () => {
        this.newMeeting = { title: '', description: '', meetingDate: '', location: '', meetingType: 'call' };
        this.showMeetingForm.set(false);
        this.loadLeadMeetings(lead.id);
        this.loadLeadActivities(lead.id);
      }
    });
  }

  toggleMeeting(meeting: LeadMeeting) {
    this.appService.updateLeadMeeting(meeting.id, { completed: !meeting.completed }).pipe(take(1)).subscribe({
      next: () => {
        const lead = this.leadData();
        if (lead) {
          this.loadLeadMeetings(lead.id);
          this.loadLeadActivities(lead.id);
        }
      }
    });
  }

  deleteMeeting(meetingId: number) {
    if (!confirm('Удалить встречу?')) return;
    
    this.appService.deleteLeadMeeting(meetingId).pipe(take(1)).subscribe({
      next: () => {
        const lead = this.leadData();
        if (lead) {
          this.loadLeadMeetings(lead.id);
          this.loadLeadActivities(lead.id);
        }
      }
    });
  }

  convertToClient() {
    const lead = this.leadData();
    if (!lead || !confirm('Конвертировать лид в клиента?')) return;
    
    this.appService.convertLeadToClient(lead.id).pipe(take(1)).subscribe({
      next: () => {
        this.loadFullLeadData();
      }
    });
  }
  
  getCompletedTasksCount(): number {
    return this.leadTasks().filter(t => t.completed).length;
  }
  
  getTotalTasksCount(): number {
    return this.leadTasks().length;
  }
  
  getCurrentPipelineStage(): any {
    return this.leadData()?.pipelineStage || 'new_lead';
  }
  
  updatePipelineStage(newStage: any) {
    const lead = this.leadData();
    if (!lead) return;
    
    this.appService.updateLead(lead.id, { pipelineStage: newStage }).pipe(take(1)).subscribe({
      next: () => {
        this.loadFullLeadData();
        this.loadLeadActivities(lead.id);
      },
      error: (error: any) => {
        console.error('Error updating pipeline stage:', error);
        alert('Ошибка при обновлении этапа');
      }
    });
  }
  
  // Задачи только текущего этапа
  getCurrentStageTasks(): LeadTask[] {
    const currentStage = this.getCurrentPipelineStage() as PipelineStageEnum;
    const allTasks = this.leadTasks();
    
    return getTasksForCurrentStage(allTasks, currentStage);
  }
}
