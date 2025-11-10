import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './services/auth.service';

export const AuthInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  // Добавляем токен к запросу, если он есть
  if (token) {
    req = req.clone({
      headers: req.headers.set('Authorization', token),
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Обрабатываем 401 ошибку (Unauthorized)
      if (error.status === 401) {
        // Проверяем, что это не запрос на вход (signin)
        const isSigninRequest = req.url.includes('/auth/signin');
        
        if (!isSigninRequest) {
          // Для всех остальных запросов (включая /auth) - токен истек или невалиден
          // Очищаем токен и перенаправляем на логин
          authService.handleTokenExpiry();
        }
      }
      
      return throwError(() => error);
    })
  );
};
