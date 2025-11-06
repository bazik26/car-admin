import { Component, inject, OnInit, OnDestroy, HostListener, signal } from '@angular/core';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { CommonModule } from '@angular/common';
import { interval, Subscription } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { BsModalService } from 'ngx-bootstrap/modal';

import { AppService } from '../../../../services/app.service';
import { AuthService } from '../../../../services/auth.service';
import { WorkingHoursModalComponent } from './blocks/working-hours.modal';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLinkActive, RouterLink, CommonModule],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  public router = inject(Router);
  public appService = inject(AppService);
  public authService = inject(AuthService);
  public modalService = inject(BsModalService);

  public admin!: any;
  public headerCollapsed = false;
  public headerHeight = 200; // Высота хедера в пикселях
  public unprocessedLeadsCount = signal(0);
  public showLeadNotification = signal(false);
  private leadsCheckSubscription?: Subscription;

  ngOnInit() {
    this.appService.auth().subscribe({
      next: (admin) => {
        this.admin = admin;
        // Рассчитываем высоту хедера после загрузки
        setTimeout(() => this.calculateHeaderHeight(), 100);
        
        // Проверяем рабочие часы для админов с доступом к редактированию лидов
        this.checkWorkingHours(admin);
        
        // Начинаем проверку необработанных лидов
        this.checkUnprocessedLeads();
        this.leadsCheckSubscription = interval(30000).subscribe(() => {
          this.checkUnprocessedLeads();
        });
      },
      error: () => {
        this.authService.handleTokenExpiry();
      }
    });
  }

  private checkWorkingHours(admin: any): void {
    // Проверяем, есть ли у админа доступ к редактированию лидов
    const canManageLeads = admin?.permissions?.canManageLeads || admin?.isSuper;
    
    if (canManageLeads) {
      // Проверяем, заполнены ли рабочие часы
      const hasWorkingHours = admin?.workingDays && 
        Array.isArray(admin.workingDays) && 
        admin.workingDays.length > 0 &&
        admin.workingDays.some((day: any) => day.enabled === true);
      
      if (!hasWorkingHours) {
        // Показываем модальное окно для выбора рабочих часов
        setTimeout(() => {
          const modalRef = this.modalService.show(WorkingHoursModalComponent, {
            initialState: { admin },
            backdrop: 'static',
            keyboard: false,
            class: 'modal-lg'
          });
        }, 500); // Небольшая задержка для лучшего UX
      }
    }
  }

  private checkUnprocessedLeads(): void {
    this.appService.getUnprocessedLeadsCount().pipe(
      catchError(() => of({ count: 0 }))
    ).subscribe({
      next: (response: any) => {
        const count = response.count || 0;
        this.unprocessedLeadsCount.set(count);
        this.showLeadNotification.set(count > 0);
      }
    });
  }

  public navigateToLeads(): void {
    this.router.navigate(['/admin', 'leads']);
    this.showLeadNotification.set(false);
  }

  public dismissNotification(): void {
    this.showLeadNotification.set(false);
  }

  /**
   * Выход из системы
   */
  logout() {
    this.authService.logout();
  }

  /**
   * Переключение состояния хедера
   */
  toggleHeader() {
    this.headerCollapsed = !this.headerCollapsed;
    console.log('Header collapsed:', this.headerCollapsed);
  }

  /**
   * Расчет высоты хедера
   */
  private calculateHeaderHeight() {
    const headerElement = document.querySelector('.admin-header');
    if (headerElement) {
      const baseHeight = headerElement.getBoundingClientRect().height;
      
      // Добавляем дополнительное смещение для мобильных устройств
      if (window.innerWidth <= 320) {
        this.headerHeight = baseHeight + 300; // +300px для экстремально маленьких экранов
      } else if (window.innerWidth <= 360) {
        this.headerHeight = baseHeight + 250; // +250px для очень маленьких экранов
      } else if (window.innerWidth <= 480) {
        this.headerHeight = baseHeight + 200; // +200px для маленьких экранов
      } else if (window.innerWidth <= 768) {
        this.headerHeight = baseHeight + 150; // +150px для планшетов
      } else {
        this.headerHeight = baseHeight;
      }
      
      console.log('Header height calculated:', this.headerHeight, 'Screen width:', window.innerWidth);
    }
  }

  /**
   * Обработчик изменения размера окна
   */
  @HostListener('window:resize', ['$event'])
  onWindowResize(event: any) {
    // Пересчитываем высоту хедера при изменении размера окна
    setTimeout(() => this.calculateHeaderHeight(), 100);
  }

  ngOnDestroy() {
    if (this.leadsCheckSubscription) {
      this.leadsCheckSubscription.unsubscribe();
    }
  }
}
