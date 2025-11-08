import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, OnDestroy, signal, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { AppService } from '../../../../services/app.service';
import { interval, Subscription, firstValueFrom } from 'rxjs';

interface DashboardData {
  permissions: {
    canManageLeads: boolean;
    canViewLeads: boolean;
    canAddCars: boolean;
    canViewCars: boolean;
  };
  unassignedLeadsCount: number;
  unassignedLeads: any[];
  carsAddedThisWeek: number;
  chatsAwaitingResponse: number;
  chatSessions: any[];
  lastUpdateTime: Date;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class AdminDashboardPage implements OnInit, OnDestroy {
  public readonly appService = inject(AppService);
  public readonly router = inject(Router);

  public admin = signal<any>(null);
  public dashboardData = signal<DashboardData | null>(null);
  public isLoading = signal(true);
  public hasNewData = signal(false);
  public lastDataHash = signal<string>('');

  private refreshInterval?: Subscription;
  private readonly REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 минут

  ngOnInit() {
    this.loadAdmin();
    this.startAutoRefresh();
  }

  ngOnDestroy() {
    this.stopAutoRefresh();
  }

  loadAdmin() {
    this.appService.auth().subscribe({
      next: (admin) => {
        this.admin.set(admin);
        this.loadDashboardData();
      },
      error: () => {
        // Обработка ошибки
      }
    });
  }

  loadDashboardData() {
    const admin = this.admin();
    if (!admin) return;

    this.isLoading.set(true);

    // Загружаем все данные параллельно
    Promise.all([
      this.loadUnassignedLeads(admin),
      this.loadCarsAddedThisWeek(admin),
      this.loadChatsAwaitingResponse(admin),
    ]).then(([unassignedLeads, carsCount, chatSessions]) => {
      const permissions = {
        canManageLeads: admin.permissions?.canManageLeads || false,
        canViewLeads: admin.permissions?.canViewLeads || false,
        canAddCars: admin.permissions?.canAddCars || false,
        canViewCars: admin.permissions?.canViewCars || false,
      };

      const data: DashboardData = {
        permissions,
        unassignedLeadsCount: unassignedLeads.length,
        unassignedLeads: unassignedLeads.slice(0, 5), // Показываем только первые 5
        carsAddedThisWeek: carsCount,
        chatsAwaitingResponse: chatSessions.length,
        chatSessions: chatSessions.slice(0, 5), // Показываем только первые 5
        lastUpdateTime: new Date(),
      };

      // Проверяем, есть ли новые данные
      const dataHash = this.generateDataHash(data);
      if (this.lastDataHash() && this.lastDataHash() !== dataHash) {
        this.hasNewData.set(true);
        setTimeout(() => this.hasNewData.set(false), 3000); // Подсветка на 3 секунды
      }
      this.lastDataHash.set(dataHash);

      this.dashboardData.set(data);
      this.isLoading.set(false);
    }).catch((error) => {
      console.error('Error loading dashboard data:', error);
      this.isLoading.set(false);
    });
  }

  private async loadUnassignedLeads(admin: any): Promise<any[]> {
    return new Promise((resolve, reject) => {
      // Получаем все лиды и фильтруем на клиенте
      this.appService.getLeads().subscribe({
        next: (leads: any[]) => {
          // Фильтруем лиды без назначенного админа
          let unassigned = leads.filter(lead => !lead.assignedAdminId);
          
          // Если админ не isLeadManager, фильтруем по его projectId
          if (!admin.permissions?.isLeadManager && admin.projectId) {
            unassigned = unassigned.filter(lead => lead.projectId === admin.projectId);
          }
          
          resolve(unassigned);
        },
        error: reject,
      });
    });
  }

  private async loadCarsAddedThisWeek(admin: any): Promise<number> {
    return new Promise((resolve, reject) => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      this.appService.getCarsByAdmin(admin.id).subscribe({
        next: (cars: any[]) => {
          const carsThisWeek = cars.filter(car => {
            const carDate = new Date(car.createdAt);
            return carDate >= weekAgo;
          });
          resolve(carsThisWeek.length);
        },
        error: reject,
      });
    });
  }

  private async loadChatsAwaitingResponse(admin: any): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.appService.getChatSessions().subscribe({
        next: async (sessions: any[]) => {
          // Фильтруем сессии по projectId админа (если не супер-админ)
          let filteredSessions = sessions.filter((session: any) => {
            if (!admin.isSuper && admin.projectId && session.projectId !== admin.projectId) {
              return false;
            }
            return true;
          });

          // Для каждой сессии проверяем непрочитанные сообщения
          const sessionsWithUnread = await Promise.all(
            filteredSessions.map(async (session: any) => {
              try {
                const messages = await firstValueFrom(this.appService.getChatMessages(session.sessionId));
                // Считаем непрочитанные сообщения от клиента
                const unreadCount = messages?.filter((msg: any) => 
                  msg.senderType === 'client' && !msg.isRead
                ).length || 0;
                
                return {
                  ...session,
                  unreadCount,
                };
              } catch (error) {
                return {
                  ...session,
                  unreadCount: 0,
                };
              }
            })
          );

          // Фильтруем только сессии с непрочитанными сообщениями
          const awaitingSessions = sessionsWithUnread.filter((s: any) => s.unreadCount > 0);
          
          resolve(awaitingSessions);
        },
        error: reject,
      });
    });
  }

  generateDataHash(data: DashboardData): string {
    return `${data.unassignedLeadsCount}-${data.carsAddedThisWeek}-${data.chatsAwaitingResponse}`;
  }

  startAutoRefresh() {
    this.refreshInterval = interval(this.REFRESH_INTERVAL_MS).subscribe(() => {
      this.loadDashboardData();
    });
  }

  stopAutoRefresh() {
    if (this.refreshInterval) {
      this.refreshInterval.unsubscribe();
    }
  }

  manualRefresh() {
    this.loadDashboardData();
  }

  goToLeads() {
    this.router.navigate(['/admin/leads']);
  }

  goToChat() {
    this.router.navigate(['/admin/chat']);
  }

  goToCars() {
    this.router.navigate(['/admin/cars']);
  }

  formatDate(date: Date | string): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}

