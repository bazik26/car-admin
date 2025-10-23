import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component, inject, OnInit, ViewEncapsulation } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { NgSelectModule } from '@ng-select/ng-select';
import { BsModalService } from 'ngx-bootstrap/modal';

import { AppService } from '../../../../services/app.service';
import { AdminCarsManagementModal } from '../cars/blocks/management.modal';

@Component({
  selector: 'app-admin-problematic-cars',
  standalone: true,
  imports: [
    CommonModule,
    NgOptimizedImage,
    ReactiveFormsModule,
    NgSelectModule,
  ],
  templateUrl: './problematic-cars.page.html',
  styleUrls: ['./problematic-cars.page.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class AdminProblematicCarsPage implements OnInit {
  public readonly modal = inject(BsModalService);
  public readonly appService = inject(AppService);

  public cars!: any[];
  public admin!: any;
  public problematicCars: any[] = [];
  public loading = false;

  ngOnInit() {
    this.appService.auth().subscribe((admin) => {
      this.admin = admin;
      if (admin && admin.isSuper) {
        this.loadProblematicCars();
      }
    });
  }

  loadProblematicCars() {
    this.loading = true;
    this.appService.getCarsAll().subscribe((cars) => {
      this.cars = cars;
      this.problematicCars = this.findProblematicCars(cars);
      this.loading = false;
    });
  }

  private findProblematicCars(cars: any[]): any[] {
    return cars.filter(car => {
      const problems = this.getCarProblems(car);
      return problems.length > 0;
    }).map(car => ({
      ...car,
      problems: this.getCarProblems(car)
    }));
  }

  private getCarProblems(car: any): string[] {
    const problems: string[] = [];

    // Проверка основных полей
    if (!car.brand || car.brand.trim() === '') {
      problems.push('Не указана марка');
    }
    if (!car.model || car.model.trim() === '') {
      problems.push('Не указана модель');
    }
    if (!car.year || car.year < 1900 || car.year > new Date().getFullYear() + 1) {
      problems.push('Некорректный год выпуска');
    }

    // Проверка технических характеристик
    if (!car.mileage || car.mileage <= 0) {
      problems.push('Не указан пробег');
    }
    if (!car.engine || car.engine <= 0) {
      problems.push('Не указан объем двигателя');
    }
    if (!car.powerValue || car.powerValue <= 0) {
      problems.push('Не указана мощность двигателя');
    }

    // Проверка обязательных полей
    if (!car.gearbox || car.gearbox.trim() === '') {
      problems.push('Не указана коробка передач');
    }
    if (!car.fuel || car.fuel.trim() === '') {
      problems.push('Не указан тип топлива');
    }
    if (!car.drive || car.drive.trim() === '') {
      problems.push('Не указан привод');
    }
    if (!car.powerType || car.powerType.trim() === '') {
      problems.push('Не указан тип мощности');
    }

    // Проверка цены
    if (!car.price || car.price <= 0) {
      problems.push('Не указана цена');
    }

    // Проверка изображений
    if (!car.files || car.files.length === 0) {
      problems.push('Нет изображений');
    }

    // Проверка опций (должно быть минимум несколько опций)
    const totalOptions = this.countTotalOptions(car);
    if (totalOptions < 3) {
      problems.push(`Мало опций (${totalOptions} из минимум 3)`);
    }

    // Проверка логических несоответствий
    if (car.year && car.mileage) {
      const age = new Date().getFullYear() - car.year;
      const expectedMileage = age * 15000; // 15к км в год
      const mileageRatio = car.mileage / expectedMileage;
      
      if (mileageRatio > 3) {
        problems.push('Подозрительно высокий пробег для возраста');
      } else if (mileageRatio < 0.1 && age > 2) {
        problems.push('Подозрительно низкий пробег для возраста');
      }
    }

    // Проверка мощности и объема двигателя
    if (car.powerValue && car.engine) {
      const powerPerLiter = car.powerValue / car.engine;
      if (powerPerLiter > 200) {
        problems.push('Подозрительно высокая мощность для объема двигателя');
      } else if (powerPerLiter < 30) {
        problems.push('Подозрительно низкая мощность для объема двигателя');
      }
    }

    return problems;
  }

  private countTotalOptions(car: any): number {
    let count = 0;
    const optionGroups = ['group1', 'group2', 'group3', 'group4', 'group5', 'group6', 'group7', 'group8', 'group9'];
    
    optionGroups.forEach(group => {
      if (car[group] && Array.isArray(car[group])) {
        count += car[group].length;
      }
    });

    return count;
  }

  openModal(car: any) {
    const modalRef = this.modal.show(AdminCarsManagementModal, {
      initialState: {
        car,
      },
    });

    modalRef.onHide?.subscribe(() => {
      if (modalRef.content?.result?.reload) {
        this.loadProblematicCars();
      }
    });
  }

  deleteCar(car: any) {
    if (confirm(`Удалить ${car.brand} ${car.model}?`)) {
      this.appService.deleteCar(car.id).subscribe(() => {
        this.loadProblematicCars();
        this.showNotification('Автомобиль удален', 'success');
      });
    }
  }

  getTotalProblems(): number {
    return this.problematicCars.reduce((total, car) => total + car.problems.length, 0);
  }

  getAverageProblems(): number {
    if (this.problematicCars.length === 0) return 0;
    return Math.round((this.getTotalProblems() / this.problematicCars.length) * 10) / 10;
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
