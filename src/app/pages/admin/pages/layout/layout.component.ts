import { Component, inject, OnInit, OnDestroy, HostListener } from '@angular/core';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';

import { AppService } from '../../../../services/app.service';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLinkActive, RouterLink],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  public router = inject(Router);
  public appService = inject(AppService);
  public authService = inject(AuthService);

  public admin!: any;
  public headerCollapsed = false;
  public headerHeight = 200; // Высота хедера в пикселях

  ngOnInit() {
    this.appService.auth().subscribe({
      next: (admin) => {
        this.admin = admin;
        // Рассчитываем высоту хедера после загрузки
        setTimeout(() => this.calculateHeaderHeight(), 100);
      },
      error: () => {
        this.authService.handleTokenExpiry();
      }
    });
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
    // Очистка ресурсов при уничтожении компонента
  }
}
