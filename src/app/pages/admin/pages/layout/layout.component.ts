import { Component, inject, OnInit } from '@angular/core';
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
export class AdminLayoutComponent implements OnInit {
  public router = inject(Router);
  public appService = inject(AppService);
  public authService = inject(AuthService);

  public admin!: any;
  public headerCollapsed = false;

  ngOnInit() {
    this.appService.auth().subscribe({
      next: (admin) => {
        this.admin = admin;
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
  }
}
