import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, ViewEncapsulation } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup } from '@angular/forms';

import { NgSelectModule } from '@ng-select/ng-select';
import { BsModalService } from 'ngx-bootstrap/modal';

import { AppService } from '../../../../services/app.service';
import { AdminCarsManagementModal } from '../cars/blocks/management.modal';

@Component({
  selector: 'app-admin-database',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgSelectModule,
  ],
  templateUrl: './database.page.html',
  styleUrls: ['./database.page.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class AdminDatabasePage implements OnInit {
  public readonly modal = inject(BsModalService);
  public readonly appService = inject(AppService);

  public cars: any[] = [];
  public admin!: any;
  public loading = false;
  public editingCell: { row: number, field: string } | null = null;
  public tempValue: any = null;

  // Форма для редактирования ячейки
  public cellForm = new FormGroup({
    value: new FormControl('')
  });

  // Геттер для безопасного доступа к FormControl
  get valueControl(): FormControl {
    return this.cellForm.get('value') as FormControl;
  }

  // Поля для отображения в таблице
  public readonly tableFields = [
    { key: 'id', label: 'ID', type: 'number', editable: false },
    { key: 'brand', label: 'Марка', type: 'text', editable: true },
    { key: 'model', label: 'Модель', type: 'text', editable: true },
    { key: 'year', label: 'Год', type: 'number', editable: true },
    { key: 'mileage', label: 'Пробег', type: 'number', editable: true },
    { key: 'price', label: 'Цена', type: 'number', editable: true },
    { key: 'engine', label: 'Объем', type: 'number', editable: true },
    { key: 'powerValue', label: 'Мощность', type: 'number', editable: true },
    { key: 'gearbox', label: 'КПП', type: 'text', editable: true },
    { key: 'fuel', label: 'Топливо', type: 'text', editable: true },
    { key: 'drive', label: 'Привод', type: 'text', editable: true },
    { key: 'sale', label: 'Продано', type: 'boolean', editable: true },
    { key: 'isSold', label: 'Статус', type: 'boolean', editable: true },
    { key: 'createdAt', label: 'Создано', type: 'date', editable: false },
    { key: 'updatedAt', label: 'Обновлено', type: 'date', editable: false }
  ];

  ngOnInit() {
    this.appService.auth().subscribe((admin) => {
      this.admin = admin;
      if (admin && admin.isSuper) {
        this.loadCars();
      }
    });
  }

  loadCars() {
    this.loading = true;
    this.appService.getCarsAll().subscribe((cars) => {
      this.cars = cars;
      this.loading = false;
    });
  }

  startEdit(rowIndex: number, field: string, currentValue: any) {
    this.editingCell = { row: rowIndex, field };
    this.tempValue = currentValue;
    this.valueControl.setValue(currentValue);
  }

  cancelEdit() {
    this.editingCell = null;
    this.tempValue = null;
    this.cellForm.reset();
  }

  saveEdit() {
    if (!this.editingCell) return;

    const { row, field } = this.editingCell;
    const newValue = this.valueControl.value;
    const car = this.cars[row];

    // Обновляем значение в локальном массиве
    car[field] = newValue;

    // Отправляем запрос на сервер
    this.appService.updateCar(car.id, { [field]: newValue }).subscribe({
      next: () => {
        this.showNotification(`Поле ${this.getFieldLabel(field)} обновлено`, 'success');
        this.cancelEdit();
      },
      error: (error) => {
        // Возвращаем старое значение при ошибке
        car[field] = this.tempValue;
        this.showNotification('Ошибка при обновлении', 'error');
        this.cancelEdit();
      }
    });
  }

  getFieldLabel(fieldKey: string): string {
    const field = this.tableFields.find(f => f.key === fieldKey);
    return field ? field.label : fieldKey;
  }

  formatValue(value: any, type: string): string {
    if (value === null || value === undefined) return '-';
    
    switch (type) {
      case 'number':
        return typeof value === 'number' ? value.toLocaleString() : value;
      case 'boolean':
        return value ? 'Да' : 'Нет';
      case 'date':
        return new Date(value).toLocaleDateString('ru-RU');
      default:
        return String(value);
    }
  }

  openModal(car?: any) {
    const modalRef = this.modal.show(AdminCarsManagementModal, {
      initialState: {
        car,
      },
    });

    modalRef.onHide?.subscribe(() => {
      if (modalRef.content?.result?.reload) {
        this.loadCars();
      }
    });
  }

  deleteCar(car: any) {
    if (confirm(`Удалить ${car.brand} ${car.model}?`)) {
      this.appService.deleteCar(car.id).subscribe(() => {
        this.loadCars();
        this.showNotification('Автомобиль удален', 'success');
      });
    }
  }

  restoreCar(car: any) {
    this.appService.restoreCar(car.id).subscribe(() => {
      this.loadCars();
      this.showNotification('Автомобиль восстановлен', 'success');
    });
  }

  markAsSold(car: any) {
    if (confirm(`Отметить ${car.brand} ${car.model} как проданную?`)) {
      this.appService.markCarAsSold(car.id).subscribe(() => {
        this.loadCars();
        this.showNotification('Автомобиль отмечен как проданный', 'success');
      });
    }
  }

  markAsAvailable(car: any) {
    if (confirm(`Вернуть ${car.brand} ${car.model} в статус доступной?`)) {
      this.appService.markCarAsAvailable(car.id).subscribe(() => {
        this.loadCars();
        this.showNotification('Автомобиль возвращен в статус доступной', 'success');
      });
    }
  }

  exportToCSV() {
    const csvContent = this.generateCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `cars_database_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.showNotification('База данных экспортирована в CSV', 'success');
  }

  private generateCSV(): string {
    const headers = this.tableFields.map(field => field.label).join(',');
    const rows = this.cars.map(car => 
      this.tableFields.map(field => {
        const value = car[field.key];
        const formattedValue = this.formatValue(value, field.type);
        // Экранируем кавычки и запятые для CSV
        return `"${formattedValue.toString().replace(/"/g, '""')}"`;
      }).join(',')
    );
    
    return [headers, ...rows].join('\n');
  }

  getActiveCars(): number {
    return this.cars.filter(car => !car.deletedAt && !car.isSold).length;
  }

  getSoldCars(): number {
    return this.cars.filter(car => !car.deletedAt && car.isSold).length;
  }

  getDeletedCars(): number {
    return this.cars.filter(car => car.deletedAt).length;
  }

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
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }
}
