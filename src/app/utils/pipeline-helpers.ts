// Утилиты для работы с воронкой продаж и задачами

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

// Маппинг: какие типы задач относятся к какому этапу воронки
export const TASK_TYPE_TO_STAGE_MAP: Record<string, PipelineStage> = {
  // Этап 1: Новый лид
  'contact': PipelineStage.NEW_LEAD,
  
  // Этап 2: Первый контакт
  'first_contact': PipelineStage.FIRST_CONTACT,
  
  // Этап 3: Квалификация
  'qualification': PipelineStage.QUALIFICATION,
  'collect_contacts': PipelineStage.QUALIFICATION,
  
  // Этап 4: Выявление потребностей
  'car_preferences': PipelineStage.NEEDS_ANALYSIS,
  'budget': PipelineStage.NEEDS_ANALYSIS,
  'region': PipelineStage.NEEDS_ANALYSIS,
  'timeline': PipelineStage.NEEDS_ANALYSIS,
  'register_lead': PipelineStage.NEEDS_ANALYSIS,
  
  // Этап 5: Презентация
  'send_offers': PipelineStage.PRESENTATION,
  'send_calculation': PipelineStage.PRESENTATION,
  'send_photos': PipelineStage.PRESENTATION,
  
  // Этап 6: Переговоры
  'follow_up': PipelineStage.NEGOTIATION,
  'objection_handling': PipelineStage.NEGOTIATION,
  'additional_info': PipelineStage.NEGOTIATION,
  
  // Этап 7: Закрытие сделки
  'schedule_meeting': PipelineStage.DEAL_CLOSING,
  'send_contract': PipelineStage.DEAL_CLOSING,
  'get_prepayment': PipelineStage.DEAL_CLOSING,
  'confirm_deal': PipelineStage.DEAL_CLOSING,
};

/**
 * Фильтрует задачи по текущему этапу воронки
 * Показывает: задачи текущего этапа + следующего этапа
 */
export function filterTasksByPipelineStage(tasks: any[], currentStage: PipelineStage): any[] {
  const currentStageIndex = getStageIndex(currentStage);
  const nextStage = getNextStage(currentStage);
  
  return tasks.filter(task => {
    const taskStage = TASK_TYPE_TO_STAGE_MAP[task.taskType];
    if (!taskStage) return true; // Неизвестный тип - показываем
    
    // Показываем задачи текущего или следующего этапа
    return taskStage === currentStage || taskStage === nextStage;
  });
}

/**
 * Группирует задачи по этапам
 */
export function groupTasksByStage(tasks: any[]): Record<string, any[]> {
  const grouped: Record<string, any[]> = {};
  
  tasks.forEach(task => {
    const stage = TASK_TYPE_TO_STAGE_MAP[task.taskType] || 'other';
    if (!grouped[stage]) {
      grouped[stage] = [];
    }
    grouped[stage].push(task);
  });
  
  return grouped;
}

/**
 * Получает следующий этап воронки
 */
function getNextStage(currentStage: PipelineStage): PipelineStage | null {
  const stages = [
    PipelineStage.NEW_LEAD,
    PipelineStage.FIRST_CONTACT,
    PipelineStage.QUALIFICATION,
    PipelineStage.NEEDS_ANALYSIS,
    PipelineStage.PRESENTATION,
    PipelineStage.NEGOTIATION,
    PipelineStage.DEAL_CLOSING,
    PipelineStage.WON,
    PipelineStage.LOST,
  ];
  
  const currentIndex = stages.indexOf(currentStage);
  if (currentIndex === -1 || currentIndex >= stages.length - 3) {
    return null; // Нет следующего этапа
  }
  
  return stages[currentIndex + 1];
}

function getStageIndex(stage: PipelineStage): number {
  const stages = [
    PipelineStage.NEW_LEAD,
    PipelineStage.FIRST_CONTACT,
    PipelineStage.QUALIFICATION,
    PipelineStage.NEEDS_ANALYSIS,
    PipelineStage.PRESENTATION,
    PipelineStage.NEGOTIATION,
    PipelineStage.DEAL_CLOSING,
    PipelineStage.WON,
    PipelineStage.LOST,
  ];
  return stages.indexOf(stage);
}

/**
 * Получает задачи для текущего этапа
 */
export function getTasksForCurrentStage(tasks: any[], currentStage: PipelineStage): any[] {
  return tasks.filter(task => {
    const taskStage = TASK_TYPE_TO_STAGE_MAP[task.taskType];
    return taskStage === currentStage;
  });
}

/**
 * Получает название этапа на русском
 */
export function getStageName(stage: PipelineStage): string {
  const names: Record<PipelineStage, string> = {
    [PipelineStage.NEW_LEAD]: 'Новый лид',
    [PipelineStage.FIRST_CONTACT]: 'Первый контакт',
    [PipelineStage.QUALIFICATION]: 'Квалификация',
    [PipelineStage.NEEDS_ANALYSIS]: 'Выявление потребностей',
    [PipelineStage.PRESENTATION]: 'Презентация',
    [PipelineStage.NEGOTIATION]: 'Переговоры',
    [PipelineStage.DEAL_CLOSING]: 'Закрытие сделки',
    [PipelineStage.WON]: 'Успех',
    [PipelineStage.LOST]: 'Отказ',
  };
  return names[stage] || stage;
}

