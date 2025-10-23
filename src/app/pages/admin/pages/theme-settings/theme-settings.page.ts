import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { ThemeService, ThemeConfig } from '../../../../services/theme.service';
import { AppService } from '../../../../services/app.service';

@Component({
  selector: 'app-admin-theme-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './theme-settings.page.html',
  styleUrls: ['./theme-settings.page.scss']
})
export class AdminThemeSettingsPage implements OnInit {
  private readonly themeService = inject(ThemeService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly appService = inject(AppService);

  public themeForm!: FormGroup;
  public currentTheme!: ThemeConfig;
  public availableFonts: { name: string; value: string }[] = [];
  public isCustomizing = true; // Всегда показываем кастомизацию
  public activeTab = 'colors'; // colors, fonts, images, layout, animations, advanced
  public admin: any = null;
  public hasAccess = false;

  ngOnInit() {
    // Проверяем права доступа
    this.appService.auth().subscribe(admin => {
      this.admin = admin;
      this.hasAccess = admin && admin.isSuper;
      
      if (!this.hasAccess) {
        this.showNotification('Доступ запрещен. Только супер администраторы могут использовать этот модуль.', 'error');
        this.router.navigate(['/admin/cars']);
        return;
      }
      
      // Инициализируем только если есть доступ
      this.availableFonts = this.themeService.getAvailableFonts();
      this.currentTheme = this.themeService.getCurrentTheme();
      this.initForm();
      
      // Подписываемся на изменения темы
      this.themeService.theme$.subscribe(theme => {
        this.currentTheme = theme;
        this.updateFormValues(theme);
      });
    });
  }

  private initForm() {
    this.themeForm = this.fb.group({
      // Цвета
      primaryColor: [this.currentTheme.primaryColor, [Validators.required]],
      secondaryColor: [this.currentTheme.secondaryColor, [Validators.required]],
      accentColor: [this.currentTheme.accentColor, [Validators.required]],
      backgroundColor: [this.currentTheme.backgroundColor, [Validators.required]],
      textColor: [this.currentTheme.textColor, [Validators.required]],
      cardBackground: [this.currentTheme.cardBackground, [Validators.required]],
      borderColor: [this.currentTheme.borderColor, [Validators.required]],
      successColor: [this.currentTheme.successColor, [Validators.required]],
      warningColor: [this.currentTheme.warningColor, [Validators.required]],
      dangerColor: [this.currentTheme.dangerColor, [Validators.required]],
      linkColor: [this.currentTheme.linkColor, [Validators.required]],
      linkHoverColor: [this.currentTheme.linkHoverColor, [Validators.required]],
      
      // Шрифты
      primaryFont: [this.currentTheme.primaryFont, [Validators.required]],
      secondaryFont: [this.currentTheme.secondaryFont, [Validators.required]],
      headingFont: [this.currentTheme.headingFont, [Validators.required]],
      fontSize: [this.currentTheme.fontSize, [Validators.required]],
      fontWeight: [this.currentTheme.fontWeight, [Validators.required]],
      headingSize: [this.currentTheme.headingSize, [Validators.required]],
      lineHeight: [this.currentTheme.lineHeight, [Validators.required]],
      
      // Изображения
      imageStyle: [this.currentTheme.imageStyle, [Validators.required]],
      imageBorderRadius: [this.currentTheme.imageBorderRadius, [Validators.required]],
      imageShadow: [this.currentTheme.imageShadow],
      imageHoverEffect: [this.currentTheme.imageHoverEffect],
      imageOpacity: [this.currentTheme.imageOpacity, [Validators.required]],
      imageFilter: [this.currentTheme.imageFilter, [Validators.required]],
      
      // Макет
      layoutStyle: [this.currentTheme.layoutStyle, [Validators.required]],
      cardPadding: [this.currentTheme.cardPadding, [Validators.required]],
      cardSpacing: [this.currentTheme.cardSpacing, [Validators.required]],
      borderRadius: [this.currentTheme.borderRadius, [Validators.required]],
      containerMaxWidth: [this.currentTheme.containerMaxWidth, [Validators.required]],
      gridColumns: [this.currentTheme.gridColumns, [Validators.required]],
      
      // Анимации
      animationsEnabled: [this.currentTheme.animationsEnabled],
      animationSpeed: [this.currentTheme.animationSpeed, [Validators.required]],
      hoverEffects: [this.currentTheme.hoverEffects],
      pageTransitions: [this.currentTheme.pageTransitions],
      
      // Дополнительные стили
      buttonStyle: [this.currentTheme.buttonStyle, [Validators.required]],
      buttonSize: [this.currentTheme.buttonSize, [Validators.required]],
      inputStyle: [this.currentTheme.inputStyle, [Validators.required]],
      shadowIntensity: [this.currentTheme.shadowIntensity, [Validators.required]],
      gradientEnabled: [this.currentTheme.gradientEnabled],
      gradientDirection: [this.currentTheme.gradientDirection, [Validators.required]]
    });

    // Автоматически применяем изменения при вводе
    this.themeForm.valueChanges.subscribe(values => {
      if (this.themeForm.valid) {
        this.applyCustomTheme(values);
      }
    });
  }

  private updateFormValues(theme: ThemeConfig) {
    this.themeForm.patchValue(theme, { emitEvent: false });
  }

  /**
   * Применить предустановленную тему
   */
  applyPresetTheme(presetTheme: ThemeConfig) {
    this.themeService.setTheme(presetTheme);
    this.showNotification('Тема применена!', 'success');
  }

  /**
   * Применить кастомную тему
   */
  private applyCustomTheme(values: any) {
    this.themeService.setTheme(values);
  }

  /**
   * Сохранить текущие настройки
   */
  saveTheme() {
    if (this.themeForm.valid) {
      this.themeService.setTheme(this.themeForm.value);
      this.showNotification('Настройки темы сохранены!', 'success');
    }
  }

  /**
   * Сбросить к теме по умолчанию
   */
  resetToDefault() {
    if (confirm('Сбросить все настройки темы к значениям по умолчанию?')) {
      this.themeService.resetToDefault();
      this.showNotification('Тема сброшена к значениям по умолчанию!', 'info');
    }
  }

  /**
   * Переключить режим кастомизации
   */
  toggleCustomization() {
    this.isCustomizing = !this.isCustomizing;
  }

  /**
   * Переключить вкладку
   */
  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  /**
   * Проверить активна ли вкладка
   */
  isTabActive(tab: string): boolean {
    return this.activeTab === tab;
  }

  /**
   * Получить цвет для предпросмотра
   */
  getPreviewStyle(color: string) {
    return {
      'background-color': color,
      'border': `1px solid ${this.currentTheme.borderColor}`
    };
  }

  /**
   * Показать уведомление
   */
  private showNotification(message: string, type: 'success' | 'error' | 'info') {
    const alertClass = type === 'success' ? 'alert-success' :
                      type === 'error' ? 'alert-danger' : 'alert-info';

    const notification = document.createElement('div');
    notification.className = `alert ${alertClass} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    notification.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    document.body.appendChild(notification);

    // Автоматически скрыть через 3 секунды
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }
}
