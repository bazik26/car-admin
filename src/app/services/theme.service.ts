import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ThemeConfig {
  // Цвета
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  cardBackground: string;
  borderColor: string;
  successColor: string;
  warningColor: string;
  dangerColor: string;
  linkColor: string;
  linkHoverColor: string;
  
  // Шрифты
  primaryFont: string;
  secondaryFont: string;
  headingFont: string;
  fontSize: 'small' | 'medium' | 'large';
  fontWeight: 'light' | 'normal' | 'bold';
  headingSize: 'small' | 'medium' | 'large' | 'xl';
  lineHeight: 'tight' | 'normal' | 'loose';
  
  // Изображения
  imageStyle: 'rounded' | 'square' | 'circle';
  imageBorderRadius: number;
  imageShadow: boolean;
  imageHoverEffect: boolean;
  imageOpacity: number;
  imageFilter: 'none' | 'grayscale' | 'sepia' | 'blur';
  
  // Макет
  layoutStyle: 'compact' | 'spacious' | 'minimal';
  cardPadding: 'small' | 'medium' | 'large';
  cardSpacing: 'tight' | 'normal' | 'loose';
  borderRadius: 'none' | 'small' | 'medium' | 'large';
  containerMaxWidth: 'small' | 'medium' | 'large' | 'xl';
  gridColumns: 1 | 2 | 3 | 4;
  
  // Анимации
  animationsEnabled: boolean;
  animationSpeed: 'slow' | 'normal' | 'fast';
  hoverEffects: boolean;
  pageTransitions: boolean;
  
  // Дополнительные стили
  buttonStyle: 'flat' | 'raised' | 'outlined';
  buttonSize: 'small' | 'medium' | 'large';
  inputStyle: 'flat' | 'outlined' | 'filled';
  shadowIntensity: 'none' | 'light' | 'medium' | 'heavy';
  gradientEnabled: boolean;
  gradientDirection: 'horizontal' | 'vertical' | 'diagonal';
}

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly STORAGE_KEY = 'car-theme-config';
  
  private themeSubject = new BehaviorSubject<ThemeConfig>(this.getDefaultTheme());
  public theme$ = this.themeSubject.asObservable();

  constructor() {
    this.loadThemeFromStorage();
    this.applyTheme(this.themeSubject.value);
  }

  /**
   * Получить текущую тему
   */
  getCurrentTheme(): ThemeConfig {
    return this.themeSubject.value;
  }

  /**
   * Установить новую тему
   */
  setTheme(theme: Partial<ThemeConfig>): void {
    const newTheme = { ...this.themeSubject.value, ...theme };
    this.themeSubject.next(newTheme);
    this.saveThemeToStorage(newTheme);
    this.applyTheme(newTheme);
  }

  /**
   * Сбросить к теме по умолчанию
   */
  resetToDefault(): void {
    const defaultTheme = this.getDefaultTheme();
    this.themeSubject.next(defaultTheme);
    this.saveThemeToStorage(defaultTheme);
    this.applyTheme(defaultTheme);
  }

  /**
   * Применить тему к DOM
   */
  private applyTheme(theme: ThemeConfig): void {
    const root = document.documentElement;
    
    // Цвета
    root.style.setProperty('--primary-color', theme.primaryColor);
    root.style.setProperty('--secondary-color', theme.secondaryColor);
    root.style.setProperty('--accent-color', theme.accentColor);
    root.style.setProperty('--background-color', theme.backgroundColor);
    root.style.setProperty('--text-color', theme.textColor);
    root.style.setProperty('--card-background', theme.cardBackground);
    root.style.setProperty('--border-color', theme.borderColor);
    root.style.setProperty('--success-color', theme.successColor);
    root.style.setProperty('--warning-color', theme.warningColor);
    root.style.setProperty('--danger-color', theme.dangerColor);
    root.style.setProperty('--link-color', theme.linkColor);
    root.style.setProperty('--link-hover-color', theme.linkHoverColor);
    
    // Шрифты
    root.style.setProperty('--primary-font', theme.primaryFont);
    root.style.setProperty('--secondary-font', theme.secondaryFont);
    root.style.setProperty('--heading-font', theme.headingFont);
    root.style.setProperty('--font-size', this.getFontSizeValue(theme.fontSize));
    root.style.setProperty('--font-weight', this.getFontWeightValue(theme.fontWeight));
    root.style.setProperty('--heading-size', this.getHeadingSizeValue(theme.headingSize || 'large'));
    root.style.setProperty('--line-height', this.getLineHeightValue(theme.lineHeight || 'normal'));
    
    // Изображения
    root.style.setProperty('--image-border-radius', this.getImageBorderRadius(theme));
    root.style.setProperty('--image-shadow', this.getImageShadowValue(theme));
    root.style.setProperty('--image-hover-transform', theme.imageHoverEffect ? 'scale(1.05)' : 'none');
    root.style.setProperty('--image-opacity', (theme.imageOpacity || 1).toString());
    root.style.setProperty('--image-filter', this.getImageFilterValue(theme.imageFilter || 'none'));
    
    // Макет
    root.style.setProperty('--card-padding', this.getCardPaddingValue(theme.cardPadding));
    root.style.setProperty('--card-spacing', this.getCardSpacingValue(theme.cardSpacing));
    root.style.setProperty('--border-radius', this.getBorderRadiusValue(theme.borderRadius));
    root.style.setProperty('--layout-gap', this.getLayoutGapValue(theme.layoutStyle));
    root.style.setProperty('--container-max-width', this.getContainerMaxWidthValue(theme.containerMaxWidth || 'large'));
    root.style.setProperty('--grid-columns', (theme.gridColumns || 3).toString());
    
    // Анимации
    root.style.setProperty('--animation-duration', this.getAnimationSpeedValue(theme.animationSpeed));
    root.style.setProperty('--hover-transition', theme.hoverEffects ? 'all 0.3s ease' : 'none');
    root.style.setProperty('--page-transition', theme.pageTransitions ? 'all 0.3s ease' : 'none');
    
    // Дополнительные стили
    root.style.setProperty('--button-style', theme.buttonStyle || 'raised');
    root.style.setProperty('--button-size', this.getButtonSizeValue(theme.buttonSize || 'medium'));
    root.style.setProperty('--input-style', theme.inputStyle || 'outlined');
    root.style.setProperty('--shadow-intensity', this.getShadowIntensityValue(theme.shadowIntensity || 'medium'));
    root.style.setProperty('--gradient-enabled', (theme.gradientEnabled || false) ? '1' : '0');
    root.style.setProperty('--gradient-direction', theme.gradientDirection || 'horizontal');
    
    // Применяем шрифты к body
    document.body.style.fontFamily = theme.primaryFont;
    document.body.style.fontSize = this.getFontSizeValue(theme.fontSize);
    document.body.style.fontWeight = this.getFontWeightValue(theme.fontWeight);
    document.body.style.lineHeight = this.getLineHeightValue(theme.lineHeight);
  }

  /**
   * Сохранить тему в localStorage
   */
  private saveThemeToStorage(theme: ThemeConfig): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(theme));
    } catch (error) {
      console.warn('Не удалось сохранить тему:', error);
    }
  }

  /**
   * Загрузить тему из localStorage
   */
  private loadThemeFromStorage(): void {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const theme = JSON.parse(saved);
        this.themeSubject.next(theme);
      }
    } catch (error) {
      console.warn('Не удалось загрузить сохраненную тему:', error);
    }
  }

  /**
   * Получить тему по умолчанию
   */
  private getDefaultTheme(): ThemeConfig {
    return {
      // Цвета
      primaryColor: '#217e02',
      secondaryColor: '#1a6b02',
      accentColor: '#28a745',
      backgroundColor: '#1a1a1a',
      textColor: '#ffffff',
      cardBackground: '#2d2d2d',
      borderColor: '#404040',
      successColor: '#28a745',
      warningColor: '#ffc107',
      dangerColor: '#dc3545',
      linkColor: '#217e02',
      linkHoverColor: '#1a6b02',
      
      // Шрифты
      primaryFont: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      secondaryFont: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      headingFont: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: 'medium',
      fontWeight: 'normal',
      headingSize: 'large',
      lineHeight: 'normal',
      
      // Изображения
      imageStyle: 'rounded',
      imageBorderRadius: 8,
      imageShadow: true,
      imageHoverEffect: true,
      imageOpacity: 1,
      imageFilter: 'none',
      
      // Макет
      layoutStyle: 'spacious',
      cardPadding: 'medium',
      cardSpacing: 'normal',
      borderRadius: 'medium',
      containerMaxWidth: 'large',
      gridColumns: 3,
      
      // Анимации
      animationsEnabled: true,
      animationSpeed: 'normal',
      hoverEffects: true,
      pageTransitions: true,
      
      // Дополнительные стили
      buttonStyle: 'raised',
      buttonSize: 'medium',
      inputStyle: 'outlined',
      shadowIntensity: 'medium',
      gradientEnabled: false,
      gradientDirection: 'horizontal'
    };
  }

  // Вспомогательные методы для преобразования значений
  private getFontSizeValue(size: 'small' | 'medium' | 'large'): string {
    const sizes = { small: '14px', medium: '16px', large: '18px' };
    return sizes[size];
  }

  private getFontWeightValue(weight: 'light' | 'normal' | 'bold'): string {
    const weights = { light: '300', normal: '400', bold: '600' };
    return weights[weight];
  }

  private getImageBorderRadius(theme: ThemeConfig): string {
    if (theme.imageStyle === 'circle') return '50%';
    if (theme.imageStyle === 'square') return '0px';
    return `${theme.imageBorderRadius}px`;
  }

  private getCardPaddingValue(padding: 'small' | 'medium' | 'large'): string {
    const paddings = { small: '12px', medium: '20px', large: '32px' };
    return paddings[padding];
  }

  private getCardSpacingValue(spacing: 'tight' | 'normal' | 'loose'): string {
    const spacings = { tight: '8px', normal: '16px', loose: '24px' };
    return spacings[spacing];
  }

  private getBorderRadiusValue(radius: 'none' | 'small' | 'medium' | 'large'): string {
    const radiuses = { none: '0px', small: '4px', medium: '8px', large: '16px' };
    return radiuses[radius];
  }

  private getLayoutGapValue(style: 'compact' | 'spacious' | 'minimal'): string {
    const gaps = { compact: '12px', spacious: '24px', minimal: '8px' };
    return gaps[style];
  }

  private getAnimationSpeedValue(speed: 'slow' | 'normal' | 'fast'): string {
    const speeds = { slow: '0.5s', normal: '0.3s', fast: '0.15s' };
    return speeds[speed];
  }

  private getHeadingSizeValue(size: 'small' | 'medium' | 'large' | 'xl'): string {
    const sizes = { small: '1.25rem', medium: '1.5rem', large: '1.75rem', xl: '2rem' };
    return sizes[size];
  }

  private getLineHeightValue(height: 'tight' | 'normal' | 'loose'): string {
    const heights = { tight: '1.2', normal: '1.5', loose: '1.8' };
    return heights[height];
  }

  private getImageShadowValue(theme: ThemeConfig): string {
    if (!theme.imageShadow) return 'none';
    const intensity = theme.shadowIntensity || 'medium';
    const shadows = {
      none: 'none',
      light: '0 2px 4px rgba(0,0,0,0.1)',
      medium: '0 4px 8px rgba(0,0,0,0.2)',
      heavy: '0 8px 16px rgba(0,0,0,0.3)'
    };
    return shadows[intensity];
  }

  private getImageFilterValue(filter: 'none' | 'grayscale' | 'sepia' | 'blur'): string {
    const filters = {
      none: 'none',
      grayscale: 'grayscale(100%)',
      sepia: 'sepia(100%)',
      blur: 'blur(2px)'
    };
    return filters[filter];
  }

  private getContainerMaxWidthValue(width: 'small' | 'medium' | 'large' | 'xl'): string {
    const widths = { small: '768px', medium: '992px', large: '1200px', xl: '1400px' };
    return widths[width];
  }

  private getButtonSizeValue(size: 'small' | 'medium' | 'large'): string {
    const sizes = { small: '0.5rem 1rem', medium: '0.75rem 1.5rem', large: '1rem 2rem' };
    return sizes[size];
  }

  private getShadowIntensityValue(intensity: 'none' | 'light' | 'medium' | 'heavy'): string {
    const intensities = {
      none: 'none',
      light: '0 2px 4px rgba(0,0,0,0.1)',
      medium: '0 4px 8px rgba(0,0,0,0.2)',
      heavy: '0 8px 16px rgba(0,0,0,0.3)'
    };
    return intensities[intensity];
  }

  /**
   * Получить предустановленные темы (убрано для расширенной кастомизации)
   */
  getPresetThemes(): { name: string; theme: ThemeConfig }[] {
    return [];
  }

  /**
   * Получить доступные шрифты
   */
  getAvailableFonts(): { name: string; value: string }[] {
    return [
      { name: 'Inter (по умолчанию)', value: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
      { name: 'Roboto', value: 'Roboto, sans-serif' },
      { name: 'Open Sans', value: '"Open Sans", sans-serif' },
      { name: 'Lato', value: 'Lato, sans-serif' },
      { name: 'Montserrat', value: 'Montserrat, sans-serif' },
      { name: 'Poppins', value: 'Poppins, sans-serif' },
      { name: 'Source Sans Pro', value: '"Source Sans Pro", sans-serif' },
      { name: 'Nunito', value: 'Nunito, sans-serif' },
      { name: 'Playfair Display', value: '"Playfair Display", serif' },
      { name: 'Merriweather', value: 'Merriweather, serif' }
    ];
  }
}
