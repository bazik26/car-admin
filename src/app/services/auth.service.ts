import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly AUTH_KEY = 'AUTH_KEY';
  private readonly router = inject(Router);

  constructor() { }

  /**
   * Сохраняет токен в localStorage
   * @param token - токен аутентификации
   */
  setToken(token: string): void {
    localStorage.setItem(this.AUTH_KEY, token);
  }

  /**
   * Получает токен из localStorage
   * @returns токен аутентификации или null
   */
  getToken(): string | null {
    return localStorage.getItem(this.AUTH_KEY);
  }

  /**
   * Удаляет токен из localStorage и перенаправляет на страницу логина
   */
  logout(): void {
    localStorage.removeItem(this.AUTH_KEY);
    this.router.navigate(['/admin/signin']);
  }

  /**
   * Обрабатывает истечение токена: удаляет токен и перенаправляет на страницу логина
   */
  handleTokenExpiry(): void {
    this.logout();
  }
}