import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { AppService } from '../../../../services/app.service';

interface AdminStats {
  id: number;
  name: string;
  email: string;
  carsAdded: number;
  errorsCount: number;
  lastActivity: string;
  productivityScore: number;
}

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string[];
    borderColor: string[];
    borderWidth: number;
  }[];
}

@Component({
  selector: 'app-admin-productivity',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './productivity.page.html',
  styleUrls: ['./productivity.page.scss'],
})
export class AdminProductivityPage implements OnInit {
  // Данные для статистики
  adminStats: AdminStats[] = [];
  topProductiveAdmins: AdminStats[] = [];
  topUnproductiveAdmins: AdminStats[] = [];
  topProblematicAdmins: AdminStats[] = [];

  // Настройки графиков
  public productivityChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        labels: {
          color: '#D4AF37',
          font: {
            family: 'Inter',
            size: 12,
            weight: '600'
          }
        }
      },
      title: {
        display: true,
        text: 'Продуктивность админов',
        color: '#D4AF37',
        font: {
          family: 'Inter',
          size: 16,
          weight: '700'
        }
      }
    },
    scales: {
      x: {
        ticks: {
          color: '#FFFFFF',
          font: {
            family: 'Inter',
            size: 11
          }
        },
        grid: {
          color: 'rgba(212, 175, 55, 0.1)'
        }
      },
      y: {
        ticks: {
          color: '#FFFFFF',
          font: {
            family: 'Inter',
            size: 11
          }
        },
        grid: {
          color: 'rgba(212, 175, 55, 0.1)'
        }
      }
    }
  };

  public errorsChartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          color: '#D4AF37',
          font: {
            family: 'Inter',
            size: 12,
            weight: '600'
          }
        }
      },
      title: {
        display: true,
        text: 'Распределение ошибок',
        color: '#D4AF37',
        font: {
          family: 'Inter',
          size: 16,
          weight: '700'
        }
      }
    }
  };

  public carsAddedChartOptions: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        labels: {
          color: '#D4AF37',
          font: {
            family: 'Inter',
            size: 12,
            weight: '600'
          }
        }
      },
      title: {
        display: true,
        text: 'Динамика добавления автомобилей',
        color: '#D4AF37',
        font: {
          family: 'Inter',
          size: 16,
          weight: '700'
        }
      }
    },
    scales: {
      x: {
        ticks: {
          color: '#FFFFFF',
          font: {
            family: 'Inter',
            size: 11
          }
        },
        grid: {
          color: 'rgba(212, 175, 55, 0.1)'
        }
      },
      y: {
        ticks: {
          color: '#FFFFFF',
          font: {
            family: 'Inter',
            size: 11
          }
        },
        grid: {
          color: 'rgba(212, 175, 55, 0.1)'
        }
      }
    }
  };

  // Данные для графиков
  public productivityChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [
      {
        label: 'Автомобили добавлено',
        data: [],
        backgroundColor: 'rgba(212, 175, 55, 0.8)',
        borderColor: '#D4AF37',
        borderWidth: 2
      }
    ]
  };

  public errorsChartData: ChartConfiguration<'doughnut'>['data'] = {
    labels: [],
    datasets: [
      {
        label: 'Ошибки',
        data: [],
        backgroundColor: [
          '#D4AF37',
          '#B8860B',
          '#F4E4BC',
          '#6B46C1',
          '#A78BFA'
        ],
        borderColor: '#1a1a1a',
        borderWidth: 2
      }
    ]
  };

  public carsAddedChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [
      {
        label: 'Автомобили',
        data: [],
        borderColor: '#D4AF37',
        backgroundColor: 'rgba(212, 175, 55, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4
      }
    ]
  };

  loading = true;
  error: string | null = null;

  constructor(private appService: AppService) {}

  ngOnInit() {
    this.loadProductivityData();
  }

  loadProductivityData() {
    this.loading = true;
    this.error = null;

    // Загружаем данные админов
    this.appService.getAdmins().subscribe({
      next: (admins) => {
        this.processAdminData(admins);
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Ошибка загрузки данных';
        this.loading = false;
        console.error('Error loading admin data:', err);
      }
    });
  }

  processAdminData(admins: any[]) {
    // Обрабатываем данные и создаем статистику
    this.adminStats = admins.map(admin => ({
      id: admin.id,
      name: admin.name || admin.email,
      email: admin.email,
      carsAdded: Math.floor(Math.random() * 50) + 1, // Временные данные
      errorsCount: Math.floor(Math.random() * 20), // Временные данные
      lastActivity: new Date().toISOString(),
      productivityScore: Math.floor(Math.random() * 100) + 1
    }));

    // Сортируем по продуктивности
    this.topProductiveAdmins = [...this.adminStats]
      .sort((a, b) => b.carsAdded - a.carsAdded)
      .slice(0, 5);

    this.topUnproductiveAdmins = [...this.adminStats]
      .sort((a, b) => a.carsAdded - b.carsAdded)
      .slice(0, 5);

    this.topProblematicAdmins = [...this.adminStats]
      .sort((a, b) => b.errorsCount - a.errorsCount)
      .slice(0, 3);

    this.updateCharts();
  }

  updateCharts() {
    // Обновляем данные для графиков
    this.productivityChartData = {
      labels: this.topProductiveAdmins.map(admin => admin.name),
      datasets: [
        {
          label: 'Автомобили добавлено',
          data: this.topProductiveAdmins.map(admin => admin.carsAdded),
          backgroundColor: 'rgba(212, 175, 55, 0.8)',
          borderColor: '#D4AF37',
          borderWidth: 2
        }
      ]
    };

    this.errorsChartData = {
      labels: this.topProblematicAdmins.map(admin => admin.name),
      datasets: [
        {
          label: 'Ошибки',
          data: this.topProblematicAdmins.map(admin => admin.errorsCount),
          backgroundColor: [
            '#D4AF37',
            '#B8860B',
            '#F4E4BC'
          ],
          borderColor: '#1a1a1a',
          borderWidth: 2
        }
      ]
    };

    // Создаем данные для временного графика (последние 7 дней)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' });
    });

    this.carsAddedChartData = {
      labels: last7Days,
      datasets: [
        {
          label: 'Автомобили добавлено',
          data: Array.from({ length: 7 }, () => Math.floor(Math.random() * 20) + 1),
          borderColor: '#D4AF37',
          backgroundColor: 'rgba(212, 175, 55, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4
        }
      ]
    };
  }

  getProductivityLevel(score: number): string {
    if (score >= 80) return 'Отлично';
    if (score >= 60) return 'Хорошо';
    if (score >= 40) return 'Удовлетворительно';
    return 'Требует внимания';
  }

  getProductivityClass(score: number): string {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    if (score >= 40) return 'text-info';
    return 'text-danger';
  }

  refreshData() {
    this.loadProductivityData();
  }
}
