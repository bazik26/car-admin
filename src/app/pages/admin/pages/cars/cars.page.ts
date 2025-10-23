import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component, inject, OnInit, ViewEncapsulation } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { NgSelectModule } from '@ng-select/ng-select';
import { BsModalService } from 'ngx-bootstrap/modal';

import { AppService } from '../../../../services/app.service';

import { AdminCarsManagementModal } from './blocks/management.modal';

@Component({
  selector: 'app-admin-cars',
  standalone: true,
  imports: [
    CommonModule,
    NgOptimizedImage,
    ReactiveFormsModule,
    NgSelectModule,
  ],
  templateUrl: './cars.page.html',
  styleUrls: ['./cars.page.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class AdminCarsPage implements OnInit {
  public readonly modal = inject(BsModalService);

  public readonly appService = inject(AppService);

  public cars!: any;
  public admin!: any;

  ngOnInit() {
    this.getCarsAll();
    this.appService.auth().subscribe((admin) => (this.admin = admin));
  }

  openModal(car?: any) {
    const modalRef = this.modal.show(AdminCarsManagementModal, {
      initialState: {
        car,
      },
      backdrop: 'static', // Отключает закрытие по клику на фон
      keyboard: false, // Отключает закрытие по ESC
    });

    modalRef.onHide?.subscribe(() => {
      if (modalRef.content?.result?.reload) {
        this.getCarsAll();
      }
    });
  }

  getCarsAll() {
    // Для обычного админа показываем только его автомобили
    if (this.admin && !this.admin.isSuper) {
      this.appService.getCarsByAdmin(this.admin.id).subscribe((cars) => (this.cars = cars));
    } else {
      this.appService.getCarsAll().subscribe((cars) => (this.cars = cars));
    }
  }

  deleteCar(car: any) {
    if (confirm(`Удалить ${car.brand} ${car.model}?`)) {
      this.appService.deleteCar(car.id).subscribe(() => this.getCarsAll());
    }
  }

  restoreCar(car: any) {
    this.appService.restoreCar(car.id).subscribe(() => this.getCarsAll());
  }

  markAsSold(car: any) {
    if (confirm(`Отметить ${car.brand} ${car.model} как проданную?`)) {
      this.appService.markCarAsSold(car.id).subscribe(() => {
        this.getCarsAll();
        // Показать уведомление об успехе
        this.showNotification('Автомобиль отмечен как проданный', 'success');
      });
    }
  }

  markAsAvailable(car: any) {
    if (confirm(`Вернуть ${car.brand} ${car.model} в статус доступной?`)) {
      this.appService.markCarAsAvailable(car.id).subscribe(() => {
        this.getCarsAll();
        // Показать уведомление об успехе
        this.showNotification('Автомобиль возвращен в статус доступной', 'success');
      });
    }
  }

  get activeCarsCount(): number {
    if (!Array.isArray(this.cars)) {
      return 0;
    }

    return this.cars.filter((car: any) => !car.deletedAt && !car.isSold).length;
  }

  get soldCarsCount(): number {
    if (!Array.isArray(this.cars)) {
      return 0;
    }

    return this.cars.filter((car: any) => !car.deletedAt && car.isSold).length;
  }

  get deletedCarsCount(): number {
    if (!Array.isArray(this.cars)) {
      return 0;
    }

    return this.cars.filter((car: any) => car.deletedAt).length;
  }

  private showNotification(message: string, type: 'success' | 'error' | 'info') {
    // Простое уведомление (можно заменить на toast или другой компонент)
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
