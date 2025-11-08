import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export enum PipelineStage {
  NEW_LEAD = 'new_lead',
  FIRST_CONTACT = 'first_contact',
  QUALIFICATION = 'qualification',
  NEEDS_ANALYSIS = 'needs_analysis',
  PRESENTATION = 'presentation',
  NEGOTIATION = 'negotiation',
  DEAL_CLOSING = 'deal_closing',
  WON = 'won',
  LOST = 'lost',
}

interface PipelineStep {
  stage: PipelineStage;
  title: string;
  description: string;
  emoji: string;
  timeframe: string;
  color: string;
}

@Component({
  selector: 'app-lead-pipeline',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="lead-pipeline">
      <h4 class="pipeline-title">
        <i class="fas fa-route"></i>
        Этапы работы с лидом
      </h4>
      
      <div class="pipeline-progress">
        <div class="progress-bar-container">
          <div class="progress-bar" [style.width.%]="getProgressPercentage()"></div>
        </div>
        <span class="progress-text">{{ getProgressPercentage() }}% завершено</span>
      </div>
      
      <div class="pipeline-steps">
        @for (step of pipelineSteps; track step.stage; let i = $index) {
          <div 
            class="pipeline-step" 
            [class.active]="isActiveStage(step.stage)"
            [class.completed]="isCompletedStage(step.stage)"
            [class.current]="isCurrentStage(step.stage)"
          >
            <div class="step-header">
              <div class="step-number">
                @if (isCompletedStage(step.stage)) {
                  <i class="fas fa-check"></i>
                } @else {
                  {{ i + 1 }}
                }
              </div>
              <div class="step-emoji">{{ step.emoji }}</div>
            </div>
            
            <div class="step-content">
              <h5 class="step-title">{{ step.title }}</h5>
              <p class="step-description">{{ step.description }}</p>
              <span class="step-timeframe">
                <i class="fas fa-clock"></i>
                {{ step.timeframe }}
              </span>
            </div>
            
            @if (i < pipelineSteps.length - 2) {
              <div class="step-connector"></div>
            }
          </div>
        }
      </div>
      
      <div class="pipeline-actions">
        <div class="action-hint">
          <i class="fas fa-lightbulb"></i>
          <strong>Текущий этап:</strong> {{ getCurrentStageTitle() }}
        </div>
        <div class="action-hint">
          <i class="fas fa-tasks"></i>
          <strong>Следующее действие:</strong> {{ getNextAction() }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    .lead-pipeline {
      background: #fff;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      margin-bottom: 20px;
    }
    
    .pipeline-title {
      font-size: 18px;
      font-weight: 700;
      color: #2c3e50;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .pipeline-progress {
      margin-bottom: 25px;
    }
    
    .progress-bar-container {
      height: 8px;
      background: #e9ecef;
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 8px;
    }
    
    .progress-bar {
      height: 100%;
      background: linear-gradient(90deg, #10b981, #059669);
      transition: width 0.3s ease;
      border-radius: 4px;
    }
    
    .progress-text {
      font-size: 13px;
      color: #6c757d;
      font-weight: 600;
    }
    
    .pipeline-steps {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-bottom: 20px;
    }
    
    .pipeline-step {
      position: relative;
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding: 16px;
      border-radius: 8px;
      background: #f8f9fa;
      border: 2px solid #e9ecef;
      transition: all 0.3s ease;
    }
    
    .pipeline-step.completed {
      background: #d1fae5;
      border-color: #10b981;
    }
    
    .pipeline-step.current {
      background: #fff7ed;
      border-color: #f59e0b;
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2);
      transform: scale(1.02);
    }
    
    .pipeline-step.completed .step-number {
      background: #10b981;
      color: white;
    }
    
    .pipeline-step.current .step-number {
      background: #f59e0b;
      color: white;
      animation: pulse 2s infinite;
    }
    
    .step-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      min-width: 60px;
    }
    
    .step-number {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #6c757d;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 14px;
    }
    
    .step-emoji {
      font-size: 24px;
    }
    
    .step-content {
      flex: 1;
    }
    
    .step-title {
      font-size: 15px;
      font-weight: 700;
      color: #2c3e50;
      margin-bottom: 6px;
    }
    
    .step-description {
      font-size: 13px;
      color: #6c757d;
      margin-bottom: 8px;
      line-height: 1.5;
    }
    
    .step-timeframe {
      font-size: 12px;
      color: #94a3b8;
      display: flex;
      align-items: center;
      gap: 5px;
    }
    
    .step-connector {
      position: absolute;
      left: 46px;
      bottom: -18px;
      width: 2px;
      height: 18px;
      background: #cbd5e1;
    }
    
    .pipeline-step.completed .step-connector {
      background: #10b981;
    }
    
    .pipeline-actions {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 16px;
      background: #f1f5f9;
      border-radius: 8px;
      border-left: 4px solid #3b82f6;
    }
    
    .action-hint {
      font-size: 14px;
      color: #475569;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .action-hint i {
      color: #3b82f6;
    }
    
    @keyframes pulse {
      0%, 100% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.1);
      }
    }
  `]
})
export class LeadPipelineComponent {
  @Input() currentStage: PipelineStage = PipelineStage.NEW_LEAD;
  @Input() completedTasks: number = 0;
  @Input() totalTasks: number = 14;
  
  pipelineSteps: PipelineStep[] = [
    {
      stage: PipelineStage.NEW_LEAD,
      title: '1. Новый лид',
      description: 'Лид только что создан в системе',
      emoji: '🆕',
      timeframe: '0 часов',
      color: '#94a3b8'
    },
    {
      stage: PipelineStage.FIRST_CONTACT,
      title: '2. Первый контакт',
      description: 'Связаться с клиентом в течение 2 часов',
      emoji: '📞',
      timeframe: '0-2 часа',
      color: '#3b82f6'
    },
    {
      stage: PipelineStage.QUALIFICATION,
      title: '3. Квалификация',
      description: 'Собрать контактные данные и понять потребность',
      emoji: '📋',
      timeframe: '2-24 часа',
      color: '#8b5cf6'
    },
    {
      stage: PipelineStage.NEEDS_ANALYSIS,
      title: '4. Выявление потребностей',
      description: 'Узнать предпочтения, бюджет, регион, сроки',
      emoji: '🔍',
      timeframe: '1-3 дня',
      color: '#06b6d4'
    },
    {
      stage: PipelineStage.PRESENTATION,
      title: '5. Презентация',
      description: 'Отправить подборку и расчеты',
      emoji: '🚗',
      timeframe: '3-7 дней',
      color: '#10b981'
    },
    {
      stage: PipelineStage.NEGOTIATION,
      title: '6. Переговоры',
      description: 'Работа с возражениями, follow-up',
      emoji: '💬',
      timeframe: '7-14 дней',
      color: '#f59e0b'
    },
    {
      stage: PipelineStage.DEAL_CLOSING,
      title: '7. Закрытие сделки',
      description: 'Договор, предоплата, подтверждение',
      emoji: '📝',
      timeframe: '14-30 дней',
      color: '#ef4444'
    },
    {
      stage: PipelineStage.WON,
      title: '✅ Успех',
      description: 'Сделка закрыта, клиент доволен',
      emoji: '🎉',
      timeframe: 'Завершено',
      color: '#10b981'
    },
    {
      stage: PipelineStage.LOST,
      title: '❌ Отказ',
      description: 'Клиент отказался от покупки',
      emoji: '😞',
      timeframe: 'Завершено',
      color: '#64748b'
    },
  ];
  
  isActiveStage(stage: PipelineStage): boolean {
    const currentIndex = this.pipelineSteps.findIndex(s => s.stage === this.currentStage);
    const stageIndex = this.pipelineSteps.findIndex(s => s.stage === stage);
    return stageIndex <= currentIndex;
  }
  
  isCompletedStage(stage: PipelineStage): boolean {
    const currentIndex = this.pipelineSteps.findIndex(s => s.stage === this.currentStage);
    const stageIndex = this.pipelineSteps.findIndex(s => s.stage === stage);
    return stageIndex < currentIndex;
  }
  
  isCurrentStage(stage: PipelineStage): boolean {
    return this.currentStage === stage;
  }
  
  getProgressPercentage(): number {
    const currentIndex = this.pipelineSteps.findIndex(s => s.stage === this.currentStage);
    const totalSteps = this.pipelineSteps.length - 2; // Исключаем WON и LOST
    
    if (this.currentStage === PipelineStage.WON) return 100;
    if (this.currentStage === PipelineStage.LOST) return 0;
    
    return Math.round((currentIndex / totalSteps) * 100);
  }
  
  getCurrentStageTitle(): string {
    const stage = this.pipelineSteps.find(s => s.stage === this.currentStage);
    return stage ? stage.title : 'Неизвестный этап';
  }
  
  getNextAction(): string {
    switch (this.currentStage) {
      case PipelineStage.NEW_LEAD:
        return 'Позвонить клиенту в течение 2 часов';
      case PipelineStage.FIRST_CONTACT:
        return 'Собрать контактные данные и квалифицировать лид';
      case PipelineStage.QUALIFICATION:
        return 'Узнать предпочтения по автомобилям, бюджет, регион';
      case PipelineStage.NEEDS_ANALYSIS:
        return 'Подобрать 3-5 вариантов и отправить подборку';
      case PipelineStage.PRESENTATION:
        return 'Дождаться обратной связи, ответить на вопросы';
      case PipelineStage.NEGOTIATION:
        return 'Обработать возражения, назначить встречу';
      case PipelineStage.DEAL_CLOSING:
        return 'Отправить договор, получить предоплату';
      case PipelineStage.WON:
        return 'Поздравляем! Сделка закрыта успешно 🎉';
      case PipelineStage.LOST:
        return 'Проанализировать причину отказа';
      default:
        return 'Продолжить работу с лидом';
    }
  }
}

