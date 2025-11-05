import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { take } from 'rxjs';
import { AppService } from '../../../../services/app.service';

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
  createdAt: Date;
  updatedAt: Date;
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
  styleUrl: './leads.page.scss'
})
export class LeadsPage implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly appService = inject(AppService);
  
  private readonly API_URL = 'https://car-api-production.up.railway.app';

  leads = signal<Lead[]>([]);
  selectedLead = signal<Lead | null>(null);
  isLoading = signal(false);
  admin: any = null;
  admins: any[] = [];
  
  // Фильтры
  filterStatus = signal<string>('');
  filterSource = signal<string>('');
  filterAdmin = signal<number | null>(null);
  searchQuery = signal<string>('');

  // Форма создания/редактирования лида
  showLeadModal = signal(false);
  editingLead = signal<Lead | null>(null);
  leadForm = {
    name: '',
    email: '',
    phone: '',
    source: 'chat' as Lead['source'],
    status: 'new' as Lead['status'],
    priority: 'normal' as Lead['priority'],
    hasTelegramContact: false,
    telegramUsername: '',
    description: ''
  };

  // Комментарии
  newComment = '';
  chatMessages = signal<ChatMessage[]>([]);

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

  selectLead(lead: Lead) {
    this.selectedLead.set(lead);
    if (lead.chatSessionId) {
      this.loadChatMessages(lead.chatSessionId);
    }
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
    this.editingLead.set(null);
    this.leadForm = {
      name: '',
      email: '',
      phone: '',
      source: 'chat',
      status: 'new',
      priority: 'normal',
      hasTelegramContact: false,
      telegramUsername: '',
      description: ''
    };
    this.showLeadModal.set(true);
  }

  openEditModal(lead: Lead) {
    this.editingLead.set(lead);
    this.leadForm = {
      name: lead.name,
      email: lead.email || '',
      phone: lead.phone || '',
      source: lead.source,
      status: lead.status,
      priority: lead.priority,
      hasTelegramContact: lead.hasTelegramContact,
      telegramUsername: lead.telegramUsername || '',
      description: lead.description || ''
    };
    this.showLeadModal.set(true);
  }

  saveLead() {
    const leadData = { ...this.leadForm };
    
    if (this.editingLead()) {
      this.appService.updateLead(this.editingLead()!.id, leadData).pipe(take(1)).subscribe({
        next: () => {
          this.showLeadModal.set(false);
          this.loadLeads();
          if (this.selectedLead()?.id === this.editingLead()?.id) {
            this.loadLeads(); // Перезагружаем для обновления выбранного лида
          }
        },
      error: (error: any) => {
        console.error('Error updating lead:', error);
        alert('Ошибка при обновлении лида');
      }
    });
  } else {
    this.appService.createLead(leadData).pipe(take(1)).subscribe({
      next: () => {
        this.showLeadModal.set(false);
        this.loadLeads();
      },
      error: (error: any) => {
        console.error('Error creating lead:', error);
        alert('Ошибка при создании лида');
      }
    });
  }
}

deleteLead(lead: Lead) {
  if (confirm(`Удалить лид "${lead.name}"?`)) {
    this.appService.deleteLead(lead.id).pipe(take(1)).subscribe({
      next: () => {
        this.loadLeads();
        if (this.selectedLead()?.id === lead.id) {
          this.selectedLead.set(null);
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
        this.selectLead(lead);
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
          this.selectLead(updatedLead);
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
          this.selectLead(updatedLead);
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
          this.selectLead(updatedLead);
        }
      },
      error: (error: any) => {
        console.error('Error updating lead priority:', error);
      }
    });
  }
}

