import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal, ViewEncapsulation } from '@angular/core';
import { AppService } from '../../../../services/app.service';
import { AuthService } from '../../../../services/auth.service';

interface AdminStats {
  id: number;
  name: string;
  email: string;
  carsAdded: number;
  soldCars: number;
  errorsCount: number;
  productivityScore: number;
  lastActivity: string;
  isActive: boolean;
  leads: {
    total: number;
    open: number;
    inProgress: number;
    closed: number;
    lost: number;
  };
  recentLeads: Array<{
    id: number;
    name: string;
    status: string;
    priority: string;
    score: number;
    updatedAt: string;
  }>;
}

@Component({
  selector: 'app-admin-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-stats.page.html',
  styleUrls: ['./admin-stats.page.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class AdminStatsPage implements OnInit {
  public readonly appService = inject(AppService);
  public readonly authService = inject(AuthService);

  public admin: any = null;
  public stats = signal<AdminStats | null>(null);
  public isLoading = signal(true);

  ngOnInit() {
    this.loadAdminAndStats();
  }

  private loadAdminAndStats() {
    this.appService.auth().subscribe({
      next: (admin) => {
        this.admin = admin;
        if (admin?.id) {
          this.loadStats(admin.id);
        }
      },
      error: () => {
        this.authService.handleTokenExpiry();
      }
    });
  }

  private loadStats(adminId: number) {
    this.isLoading.set(true);
    this.appService.getAdminStats(adminId).subscribe({
      next: (stats: AdminStats) => {
        this.stats.set(stats);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading admin stats:', error);
        this.isLoading.set(false);
      }
    });
  }

  public formatDate(date: string): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  public getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'new': 'Новый',
      'in_progress': 'В работе',
      'contacted': 'Связались',
      'closed': 'Закрыт',
      'lost': 'Потерян',
    };
    return labels[status] || status;
  }

  public getPriorityLabel(priority: string): string {
    const labels: Record<string, string> = {
      'low': 'Низкий',
      'normal': 'Обычный',
      'high': 'Высокий',
      'urgent': 'Срочный',
    };
    return labels[priority] || priority;
  }
}

