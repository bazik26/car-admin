import { CommonModule } from '@angular/common';
import {
  Component,
  inject,
  Input,
  OnInit,
  ViewEncapsulation,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { AppService } from '../../../../../services/app.service';
import { take } from 'rxjs';
import { WorkingHoursModalComponent } from '../../layout/blocks/working-hours.modal';

interface Admin {
  id: number;
  email: string;
  isSuper: boolean;
  projectId?: 'office_1' | 'office_2';
  permissions?: {
    canAddCars: boolean;
    canViewCars: boolean;
    canManageLeads: boolean;
    canViewLeads: boolean;
  };
  workingDays?: Array<{
    day: number;
    startTime: string;
    endTime: string;
    enabled: boolean;
  }>;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

@Component({
  selector: 'app-admin-details-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './details.modal.html',
  styleUrls: ['./details.modal.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class AdminDetailsModal implements OnInit {
  public readonly activeModal = inject(BsModalRef);
  public readonly appService = inject(AppService);
  public readonly modalService = inject(BsModalService);

  @Input()
  admin!: Admin;

  public adminData = signal<Admin | null>(null);
  public isLoading = signal(true);
  public isEditing = signal(false);
  public activeTab = signal<'info' | 'stats'>('info');
  public stats = signal<any>(null);
  public isLoadingStats = signal(false);
  
  // Форма редактирования
  public editForm = {
    projectId: '' as 'office_1' | 'office_2' | '',
    permissions: {
      canAddCars: false,
      canViewCars: false,
      canManageLeads: false,
      canViewLeads: false,
    }
  };

  ngOnInit() {
    if (this.admin) {
      this.loadAdminData();
    }
  }

  loadAdminData() {
    this.isLoading.set(true);
    this.appService.getAdmin(this.admin.id).pipe(take(1)).subscribe({
      next: (adminData: Admin) => {
        console.log('Admin data loaded:', adminData);
        console.log('ProjectId:', adminData.projectId);
        console.log('Permissions:', adminData.permissions);
        this.adminData.set(adminData);
        this.editForm.projectId = adminData.projectId || '';
        this.editForm.permissions = adminData.permissions || {
          canAddCars: false,
          canViewCars: false,
          canManageLeads: false,
          canViewLeads: false,
        };
        this.isLoading.set(false);
      },
      error: (error: any) => {
        console.error('Error loading admin:', error);
        // Используем данные из входного параметра как fallback
        this.adminData.set(this.admin);
        this.editForm.projectId = this.admin.projectId || '';
        this.editForm.permissions = this.admin.permissions || {
          canAddCars: false,
          canViewCars: false,
          canManageLeads: false,
          canViewLeads: false,
        };
        this.isLoading.set(false);
      }
    });
  }

  closeModal() {
    this.activeModal.hide();
  }

  getProjectLabel(projectId?: string): string {
    if (!projectId) return 'Не назначен';
    const labels: any = {
      office_1: 'Офис 1',
      office_2: 'Офис 2',
    };
    return labels[projectId] || projectId;
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

  toggleEdit() {
    this.isEditing.set(!this.isEditing());
  }

  saveChanges() {
    const admin = this.adminData();
    if (!admin) return;

    const updateData: any = {
      projectId: this.editForm.projectId || null,
      permissions: this.editForm.permissions,
    };

    this.appService.updateAdmin(admin.id, updateData).pipe(take(1)).subscribe({
      next: (updatedAdmin: Admin) => {
        this.adminData.set(updatedAdmin);
        this.isEditing.set(false);
      },
      error: (error: any) => {
        console.error('Error updating admin:', error);
        alert('Ошибка при обновлении данных администратора');
      }
    });
  }

  cancelEdit() {
    const admin = this.adminData();
    if (admin) {
      this.editForm.projectId = admin.projectId || '';
      this.editForm.permissions = admin.permissions || {
        canAddCars: false,
        canViewCars: false,
        canManageLeads: false,
        canViewLeads: false,
      };
    }
    this.isEditing.set(false);
  }

  openWorkingHoursModal() {
    const admin = this.adminData();
    if (!admin) return;

    // Закрываем текущее модальное окно
    this.activeModal.hide();

    // Открываем модальное окно рабочих часов
    setTimeout(() => {
      const modalRef = this.modalService.show(WorkingHoursModalComponent, {
        initialState: { admin },
        backdrop: true,
        keyboard: true,
        class: 'modal-lg'
      });
    }, 300);
  }

  hasWorkingHours(): boolean {
    const admin = this.adminData();
    if (!admin || !admin.workingDays) return false;
    return admin.workingDays.some(day => day.enabled === true);
  }

  loadStats() {
    const admin = this.adminData();
    if (!admin) return;
    
    this.isLoadingStats.set(true);
    this.appService.getAdminStats(admin.id).pipe(take(1)).subscribe({
      next: (stats: any) => {
        this.stats.set(stats);
        this.isLoadingStats.set(false);
      },
      error: (error: any) => {
        console.error('Error loading admin stats:', error);
        this.isLoadingStats.set(false);
      }
    });
  }

  onTabChange(tab: 'info' | 'stats') {
    this.activeTab.set(tab);
    if (tab === 'stats' && !this.stats()) {
      this.loadStats();
    }
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'new': 'Новый',
      'in_progress': 'В работе',
      'contacted': 'Связались',
      'closed': 'Закрыт',
      'lost': 'Потерян',
    };
    return labels[status] || status;
  }

  getPriorityLabel(priority: string): string {
    const labels: Record<string, string> = {
      'low': 'Низкий',
      'normal': 'Обычный',
      'high': 'Высокий',
      'urgent': 'Срочный',
    };
    return labels[priority] || priority;
  }
}

