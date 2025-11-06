import { Component, OnInit, signal, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { take } from 'rxjs';
import { BsModalService } from 'ngx-bootstrap/modal';
import { AppService } from '../../../../services/app.service';
import { LeadManagementModal } from './blocks/management.modal';

interface Lead {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  source: 'chat' | 'telegram' | 'phone' | 'email' | 'other';
  status: 'new' | 'in_progress' | 'contacted' | 'closed' | 'lost';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  hasTelegramContact: boolean;
  telegramUsername?: string;
  chatSessionId?: string;
  assignedAdminId?: number;
  assignedAdmin?: any;
  description?: string;
  comments?: LeadComment[];
  tags?: LeadTag[];
  score?: number;
  convertedToClient?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface LeadTag {
  id: number;
  name: string;
  color: string;
}

interface LeadTask {
  id: number;
  leadId: number;
  adminId: number;
  admin?: any;
  title: string;
  description?: string;
  dueDate?: Date;
  completed: boolean;
  completedAt?: Date;
  createdAt: Date;
}

interface LeadAttachment {
  id: number;
  leadId: number;
  adminId?: number;
  admin?: any;
  fileName: string;
  filePath: string;
  fileSize?: number;
  mimeType?: string;
  description?: string;
  createdAt: Date;
}

interface LeadMeeting {
  id: number;
  leadId: number;
  adminId: number;
  admin?: any;
  title: string;
  description?: string;
  meetingDate: Date;
  location?: string;
  meetingType: 'call' | 'email' | 'meeting' | 'visit' | 'other';
  completed: boolean;
  createdAt: Date;
}

interface LeadActivity {
  id: number;
  leadId: number;
  adminId?: number;
  admin?: any;
  activityType: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
  description?: string;
  createdAt: Date;
}

interface LeadComment {
  id: number;
  leadId: number;
  adminId: number;
  admin?: any;
  comment: string;
  createdAt: Date;
}

interface ChatMessage {
  id?: number;
  sessionId: string;
  message: string;
  senderType: 'client' | 'admin';
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  adminId?: number;
  isRead?: boolean;
  createdAt?: Date;
}

@Component({
  selector: 'app-leads',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './leads.page.html',
  styleUrls: ['./leads.page.scss'],
  encapsulation: ViewEncapsulation.None
})
export class LeadsPage implements OnInit {
  private readonly http = inject(HttpClient);
  public readonly appService = inject(AppService);
  private readonly modal = inject(BsModalService);
  
  private readonly API_URL = 'https://car-api-production.up.railway.app';

  leads = signal<Lead[]>([]);
  selectedLead = signal<Lead | null>(null);
  showDetailsModal = signal(false);
  isLoading = signal(false);
  admin: any = null;
  admins: any[] = [];
  
  // Фильтры
  filterStatus = signal<string>('');
  filterSource = signal<string>('');
  filterAdmin = signal<number | null>(null);
  searchQuery = signal<string>('');

  // Комментарии
  newComment = '';
  chatMessages = signal<ChatMessage[]>([]);

  // Табы
  activeTab = signal<'info' | 'tasks' | 'tags' | 'attachments' | 'meetings' | 'activity'>('info');

  // Задачи
  leadTasks = signal<LeadTask[]>([]);
  showTaskForm = signal(false);
  newTask = { title: '', description: '', dueDate: '' };

  // Теги
  allTags = signal<LeadTag[]>([]);
  showTagForm = signal(false);
  newTag = { name: '', color: '#4f8cff' };

  // Файлы
  leadAttachments = signal<LeadAttachment[]>([]);
  selectedFile: File | null = null;

  // Встречи
  leadMeetings = signal<LeadMeeting[]>([]);
  showMeetingForm = signal(false);
  newMeeting = { title: '', description: '', meetingDate: '', location: '', meetingType: 'call' };

  // История
  leadActivities = signal<LeadActivity[]>([]);

  ngOnInit() {
    this.loadAdmin();
    this.loadAdmins();
    this.loadLeads();
  }

  loadAdmin() {
    this.appService.auth().subscribe((admin: any) => {
      this.admin = admin;
    });
  }

  loadAdmins() {
    this.appService.getAdminsAll().subscribe((admins: any) => {
      this.admins = admins;
    });
  }

  loadLeads() {
    this.isLoading.set(true);
    const filters: any = {};
    if (this.filterStatus()) filters.status = this.filterStatus();
    if (this.filterSource()) filters.source = this.filterSource();
    if (this.filterAdmin()) filters.assignedAdminId = this.filterAdmin();
    if (this.searchQuery()) filters.search = this.searchQuery();

    this.appService.getLeads(filters).pipe(take(1)).subscribe({
      next: (leads: Lead[]) => {
        this.leads.set(leads);
        this.isLoading.set(false);
      },
      error: (error: any) => {
        console.error('Error loading leads:', error);
        this.isLoading.set(false);
      }
    });
  }

  openDetailsModal(lead: Lead, event?: Event) {
    console.log('openDetailsModal called with lead:', lead);
    if (!lead) {
      console.error('Lead is null or undefined');
      return;
    }
    
    // Останавливаем распространение события, если оно есть
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    
    // Сначала показываем модальное окно с базовыми данными
    this.selectedLead.set(lead);
    this.showDetailsModal.set(true);
    this.activeTab.set('info');
    
    console.log('Modal state:', { 
      showDetailsModal: this.showDetailsModal(), 
      selectedLead: this.selectedLead() 
    });
    
    // Принудительно обновляем представление
    setTimeout(() => {
      console.log('Modal state after timeout:', { 
        showDetailsModal: this.showDetailsModal(), 
        selectedLead: this.selectedLead() 
      });
    }, 100);
    
    // Предотвращаем скролл body при открытом модальном окне
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden';
    }
    
    // Загружаем полные данные лида с сервера
    this.appService.getLead(lead.id).pipe(take(1)).subscribe({
      next: (fullLead: Lead) => {
        this.selectedLead.set(fullLead);
        
        // Загружаем все данные
        if (fullLead.chatSessionId) {
          this.loadChatMessages(fullLead.chatSessionId);
        }
        this.loadLeadTasks(fullLead.id);
        this.loadLeadAttachments(fullLead.id);
        this.loadLeadMeetings(fullLead.id);
        this.loadLeadActivities(fullLead.id);
        this.loadAllTags();
      },
      error: (error: any) => {
        console.error('Error loading full lead:', error);
        // Используем данные из списка, если не удалось загрузить
        if (lead.chatSessionId) {
          this.loadChatMessages(lead.chatSessionId);
        }
        this.loadLeadTasks(lead.id);
        this.loadLeadAttachments(lead.id);
        this.loadLeadMeetings(lead.id);
        this.loadLeadActivities(lead.id);
        this.loadAllTags();
      }
    });
  }

  closeDetailsModal() {
    this.showDetailsModal.set(false);
    this.selectedLead.set(null);
    // Восстанавливаем скролл body
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'auto';
    }
    this.chatMessages.set([]);
    this.leadTasks.set([]);
    this.leadAttachments.set([]);
    this.leadMeetings.set([]);
    this.leadActivities.set([]);
    this.showTaskForm.set(false);
    this.showTagForm.set(false);
    this.showMeetingForm.set(false);
  }

  loadChatMessages(sessionId: string) {
    this.appService.getChatMessages(sessionId).pipe(take(1)).subscribe({
      next: (messages: ChatMessage[]) => {
        this.chatMessages.set(messages);
      },
      error: (error: any) => {
        console.error('Error loading chat messages:', error);
      }
    });
  }

  openCreateModal() {
    const modalRef = this.modal.show(LeadManagementModal, {
      initialState: {},
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.onHide?.subscribe(() => {
      if (modalRef.content?.result?.reload) {
        this.loadLeads();
      }
    });
  }

  openEditModal(lead: Lead) {
    const modalRef = this.modal.show(LeadManagementModal, {
      initialState: {
        lead
      },
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.onHide?.subscribe(() => {
      if (modalRef.content?.result?.reload) {
        this.loadLeads();
        // Обновляем выбранный лид, если он был изменен
        if (this.selectedLead()?.id === lead.id) {
          this.appService.getLead(lead.id).pipe(take(1)).subscribe((updatedLead: Lead) => {
            this.selectedLead.set(updatedLead);
          });
        }
      }
    });
  }

deleteLead(lead: Lead) {
  if (confirm(`Удалить лид "${lead.name}"?`)) {
    this.appService.deleteLead(lead.id).pipe(take(1)).subscribe({
      next: () => {
        this.loadLeads();
        if (this.selectedLead()?.id === lead.id) {
          this.closeDetailsModal();
        }
      },
      error: (error: any) => {
        console.error('Error deleting lead:', error);
        alert('Ошибка при удалении лида');
      }
    });
  }
}

addComment() {
  if (!this.newComment.trim() || !this.selectedLead() || !this.admin) return;

  this.appService.createLeadComment(this.selectedLead()!.id, {
    adminId: this.admin.id,
    comment: this.newComment.trim()
  }).pipe(take(1)).subscribe({
    next: () => {
      this.newComment = '';
      this.loadLeads();
      // Обновляем выбранный лид
      const lead = this.leads().find(l => l.id === this.selectedLead()!.id);
      if (lead) {
        this.selectedLead.set(lead);
      }
    },
    error: (error: any) => {
      console.error('Error adding comment:', error);
      alert('Ошибка при добавлении комментария');
    }
  });
}

updateLeadStatus(lead: Lead, status: Lead['status']) {
  this.appService.updateLead(lead.id, { status }).pipe(take(1)).subscribe({
    next: () => {
      this.loadLeads();
      if (this.selectedLead()?.id === lead.id) {
        const updatedLead = this.leads().find(l => l.id === lead.id);
        if (updatedLead) {
          this.selectedLead.set(updatedLead);
        }
      }
    },
    error: (error: any) => {
      console.error('Error updating lead status:', error);
      alert('Ошибка при обновлении статуса');
    }
  });
}

assignLead(lead: Lead, adminId: number | null) {
  this.appService.updateLead(lead.id, { assignedAdminId: adminId || undefined }).pipe(take(1)).subscribe({
    next: () => {
      this.loadLeads();
      if (this.selectedLead()?.id === lead.id) {
        const updatedLead = this.leads().find(l => l.id === lead.id);
        if (updatedLead) {
          this.selectedLead.set(updatedLead);
        }
      }
    },
    error: (error: any) => {
      console.error('Error assigning lead:', error);
      alert('Ошибка при назначении лида');
    }
  });
}

createLeadFromChat(sessionId: string) {
  this.appService.createLeadFromChat(sessionId, this.admin?.id).pipe(take(1)).subscribe({
    next: () => {
      this.loadLeads();
      alert('Лид создан из чат-сессии');
    },
    error: (error: any) => {
      console.error('Error creating lead from chat:', error);
      alert('Ошибка при создании лида из чата');
    }
  });
}

  getStatusLabel(status: Lead['status']): string {
    const labels: Record<Lead['status'], string> = {
      new: 'Новый',
      in_progress: 'В работе',
      contacted: 'Связались',
      closed: 'Закрыт',
      lost: 'Потерян'
    };
    return labels[status] || status;
  }

  getSourceLabel(source: Lead['source']): string {
    const labels: Record<Lead['source'], string> = {
      chat: 'Чат',
      telegram: 'Telegram',
      phone: 'Телефон',
      email: 'Email',
      other: 'Другое'
    };
    return labels[source] || source;
  }

  getPriorityLabel(priority: Lead['priority']): string {
    const labels: Record<Lead['priority'], string> = {
      low: 'Низкий',
      normal: 'Обычный',
      high: 'Высокий',
      urgent: 'Срочный'
    };
    return labels[priority] || priority;
  }

  getStatusClass(status: Lead['status']): string {
    const classes: Record<Lead['status'], string> = {
      new: 'status-new',
      in_progress: 'status-in-progress',
      contacted: 'status-contacted',
      closed: 'status-closed',
      lost: 'status-lost'
    };
    return classes[status] || '';
  }

  getPriorityClass(priority: Lead['priority']): string {
    const classes: Record<Lead['priority'], string> = {
      low: 'priority-low',
      normal: 'priority-normal',
      high: 'priority-high',
      urgent: 'priority-urgent'
    };
    return classes[priority] || '';
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('ru-RU', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatTime(date: Date | string | undefined): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  }

  applyFilters() {
    this.loadLeads();
  }

  clearFilters() {
    this.filterStatus.set('');
    this.filterSource.set('');
    this.filterAdmin.set(null);
    this.searchQuery.set('');
    this.loadLeads();
  }

  updateLeadPriority() {
    if (!this.selectedLead()) return;
    this.appService.updateLead(this.selectedLead()!.id, { priority: this.selectedLead()!.priority }).pipe(take(1)).subscribe({
      next: () => {
        this.loadLeads();
        const updatedLead = this.leads().find(l => l.id === this.selectedLead()!.id);
        if (updatedLead) {
          this.selectedLead.set(updatedLead);
        }
      },
      error: (error: any) => {
        console.error('Error updating lead priority:', error);
      }
    });
  }

  // ==================== TASKS ====================
  loadLeadTasks(leadId: number) {
    this.appService.getLeadTasks(leadId).pipe(take(1)).subscribe({
      next: (tasks: LeadTask[]) => {
        this.leadTasks.set(tasks);
      },
      error: (error: any) => {
        console.error('Error loading tasks:', error);
      }
    });
  }

  createTask() {
    if (!this.newTask.title.trim() || !this.selectedLead() || !this.admin) return;

    const taskData = {
      adminId: this.admin.id,
      title: this.newTask.title,
      description: this.newTask.description || undefined,
      dueDate: this.newTask.dueDate ? new Date(this.newTask.dueDate).toISOString() : undefined,
    };

    this.appService.createLeadTask(this.selectedLead()!.id, taskData).pipe(take(1)).subscribe({
      next: () => {
        this.newTask = { title: '', description: '', dueDate: '' };
        this.showTaskForm.set(false);
        this.loadLeadTasks(this.selectedLead()!.id);
        this.loadLeads();
      },
      error: (error: any) => {
        console.error('Error creating task:', error);
        alert('Ошибка при создании задачи');
      }
    });
  }

  toggleTask(task: LeadTask) {
    this.appService.updateLeadTask(task.id, { completed: !task.completed }).pipe(take(1)).subscribe({
      next: () => {
        this.loadLeadTasks(this.selectedLead()!.id);
        this.loadLeads();
      },
      error: (error: any) => {
        console.error('Error updating task:', error);
      }
    });
  }

  deleteTask(taskId: number) {
    if (confirm('Удалить задачу?')) {
      this.appService.deleteLeadTask(taskId).pipe(take(1)).subscribe({
        next: () => {
          this.loadLeadTasks(this.selectedLead()!.id);
          this.loadLeads();
        },
        error: (error: any) => {
          console.error('Error deleting task:', error);
        }
      });
    }
  }

  isOverdue(dueDate: Date | string | undefined): boolean {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  }

  // ==================== TAGS ====================
  loadAllTags() {
    this.appService.getAllTags().pipe(take(1)).subscribe({
      next: (tags: LeadTag[]) => {
        this.allTags.set(tags);
      },
      error: (error: any) => {
        console.error('Error loading tags:', error);
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
        this.loadLeads();
      },
      error: (error: any) => {
        console.error('Error creating tag:', error);
        alert('Ошибка при создании тега');
      }
    });
  }

  isTagAssigned(tagId: number): boolean {
    return this.selectedLead()?.tags?.some(t => t.id === tagId) || false;
  }

  toggleTag(tagId: number) {
    if (!this.selectedLead()) return;

    if (this.isTagAssigned(tagId)) {
      this.appService.removeTagFromLead(this.selectedLead()!.id, tagId).pipe(take(1)).subscribe({
        next: () => {
          this.loadLeads();
          this.appService.getLead(this.selectedLead()!.id).pipe(take(1)).subscribe((lead: Lead) => {
            this.selectedLead.set(lead);
          });
        },
        error: (error: any) => {
          console.error('Error removing tag:', error);
        }
      });
    } else {
      this.appService.addTagToLead(this.selectedLead()!.id, tagId).pipe(take(1)).subscribe({
        next: () => {
          this.loadLeads();
          this.appService.getLead(this.selectedLead()!.id).pipe(take(1)).subscribe((lead: Lead) => {
            this.selectedLead.set(lead);
          });
        },
        error: (error: any) => {
          console.error('Error adding tag:', error);
        }
      });
    }
  }

  // ==================== ATTACHMENTS ====================
  loadLeadAttachments(leadId: number) {
    this.appService.getLeadAttachments(leadId).pipe(take(1)).subscribe({
      next: (attachments: LeadAttachment[]) => {
        this.leadAttachments.set(attachments);
      },
      error: (error: any) => {
        console.error('Error loading attachments:', error);
      }
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file || !this.selectedLead()) return;

    this.appService.createLeadAttachment(this.selectedLead()!.id, file).pipe(take(1)).subscribe({
      next: () => {
        this.loadLeadAttachments(this.selectedLead()!.id);
        this.loadLeads();
      },
      error: (error: any) => {
        console.error('Error uploading file:', error);
        alert('Ошибка при загрузке файла');
      }
    });
  }

  deleteAttachment(attachmentId: number) {
    if (confirm('Удалить файл?')) {
      this.appService.deleteLeadAttachment(attachmentId).pipe(take(1)).subscribe({
        next: () => {
          this.loadLeadAttachments(this.selectedLead()!.id);
          this.loadLeads();
        },
        error: (error: any) => {
          console.error('Error deleting attachment:', error);
        }
      });
    }
  }

  formatFileSize(bytes?: number): string {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  // ==================== MEETINGS ====================
  loadLeadMeetings(leadId: number) {
    this.appService.getLeadMeetings(leadId).pipe(take(1)).subscribe({
      next: (meetings: LeadMeeting[]) => {
        this.leadMeetings.set(meetings);
      },
      error: (error: any) => {
        console.error('Error loading meetings:', error);
      }
    });
  }

  createMeeting() {
    if (!this.newMeeting.title.trim() || !this.newMeeting.meetingDate || !this.selectedLead() || !this.admin) return;

    const meetingData = {
      adminId: this.admin.id,
      title: this.newMeeting.title,
      description: this.newMeeting.description || undefined,
      meetingDate: new Date(this.newMeeting.meetingDate).toISOString(),
      location: this.newMeeting.location || undefined,
      meetingType: this.newMeeting.meetingType,
    };

    this.appService.createLeadMeeting(this.selectedLead()!.id, meetingData).pipe(take(1)).subscribe({
      next: () => {
        this.newMeeting = { title: '', description: '', meetingDate: '', location: '', meetingType: 'call' };
        this.showMeetingForm.set(false);
        this.loadLeadMeetings(this.selectedLead()!.id);
        this.loadLeads();
      },
      error: (error: any) => {
        console.error('Error creating meeting:', error);
        alert('Ошибка при создании встречи');
      }
    });
  }

  toggleMeeting(meeting: LeadMeeting) {
    this.appService.updateLeadMeeting(meeting.id, { completed: !meeting.completed }).pipe(take(1)).subscribe({
      next: () => {
        this.loadLeadMeetings(this.selectedLead()!.id);
        this.loadLeads();
      },
      error: (error: any) => {
        console.error('Error updating meeting:', error);
      }
    });
  }

  deleteMeeting(meetingId: number) {
    if (confirm('Удалить встречу?')) {
      this.appService.deleteLeadMeeting(meetingId).pipe(take(1)).subscribe({
        next: () => {
          this.loadLeadMeetings(this.selectedLead()!.id);
          this.loadLeads();
        },
        error: (error: any) => {
          console.error('Error deleting meeting:', error);
        }
      });
    }
  }

  getMeetingTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'call': 'Звонок',
      'email': 'Email',
      'meeting': 'Встреча',
      'visit': 'Визит',
      'other': 'Другое',
    };
    return labels[type] || type;
  }

  // ==================== ACTIVITY LOG ====================
  loadLeadActivities(leadId: number) {
    this.appService.getLeadActivities(leadId).pipe(take(1)).subscribe({
      next: (activities: LeadActivity[]) => {
        this.leadActivities.set(activities);
      },
      error: (error: any) => {
        console.error('Error loading activities:', error);
      }
    });
  }

  getActivityIcon(activityType: string): string {
    const icons: Record<string, string> = {
      'created': 'fa-plus-circle',
      'updated': 'fa-edit',
      'status_changed': 'fa-exchange-alt',
      'priority_changed': 'fa-star',
      'assigned': 'fa-user-plus',
      'comment_added': 'fa-comment',
      'task_created': 'fa-tasks',
      'task_completed': 'fa-check-circle',
      'tag_added': 'fa-tag',
      'tag_removed': 'fa-tag',
      'file_attached': 'fa-paperclip',
      'meeting_scheduled': 'fa-calendar',
      'converted': 'fa-check-double',
    };
    return icons[activityType] || 'fa-circle';
  }

  getActivityDescription(activity: LeadActivity): string {
    if (activity.description) return activity.description;
    
    const fieldLabels: Record<string, string> = {
      'status': 'Статус',
      'priority': 'Приоритет',
      'assignedAdminId': 'Назначение',
      'name': 'Имя',
      'email': 'Email',
      'phone': 'Телефон',
    };

    if (activity.field && activity.oldValue !== undefined && activity.newValue !== undefined) {
      const fieldLabel = fieldLabels[activity.field] || activity.field;
      return `${fieldLabel}: ${activity.oldValue || 'не указано'} → ${activity.newValue || 'не указано'}`;
    }

    return 'Изменение';
  }

  // ==================== LEAD SCORING ====================
  getScoreClass(score: number): string {
    if (score >= 80) return 'score-high';
    if (score >= 50) return 'score-medium';
    return 'score-low';
  }

  convertToClient() {
    if (!this.selectedLead() || !confirm('Конвертировать лид в клиента?')) return;

    this.appService.convertLeadToClient(this.selectedLead()!.id).pipe(take(1)).subscribe({
      next: () => {
        this.loadLeads();
        this.appService.getLead(this.selectedLead()!.id).pipe(take(1)).subscribe((lead: Lead) => {
          this.selectedLead.set(lead);
        });
      },
      error: (error: any) => {
        console.error('Error converting lead:', error);
        alert('Ошибка при конвертации лида');
      }
    });
  }
}

