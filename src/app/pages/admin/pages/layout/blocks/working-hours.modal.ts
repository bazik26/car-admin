import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { AppService } from '../../../../../../services/app.service';
import { take } from 'rxjs/operators';

interface WorkingDay {
  day: number;
  dayName: string;
  startTime: string;
  endTime: string;
  enabled: boolean;
}

@Component({
  selector: 'app-working-hours-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './working-hours.modal.html',
  styleUrls: ['./working-hours.modal.scss']
})
export class WorkingHoursModalComponent implements OnInit {
  admin: any;
  workingDaysForm: FormGroup;
  days: WorkingDay[] = [
    { day: 0, dayName: 'Воскресенье', startTime: '09:00', endTime: '18:00', enabled: false },
    { day: 1, dayName: 'Понедельник', startTime: '09:00', endTime: '18:00', enabled: true },
    { day: 2, dayName: 'Вторник', startTime: '09:00', endTime: '18:00', enabled: true },
    { day: 3, dayName: 'Среда', startTime: '09:00', endTime: '18:00', enabled: true },
    { day: 4, dayName: 'Четверг', startTime: '09:00', endTime: '18:00', enabled: true },
    { day: 5, dayName: 'Пятница', startTime: '09:00', endTime: '18:00', enabled: true },
    { day: 6, dayName: 'Суббота', startTime: '09:00', endTime: '18:00', enabled: false },
  ];

  constructor(
    public bsModalRef: BsModalRef,
    private fb: FormBuilder,
    private appService: AppService
  ) {
    this.workingDaysForm = this.fb.group({
      days: this.fb.array([])
    });
  }

  ngOnInit() {
    // Загружаем существующие рабочие дни или используем дефолтные
    if (this.admin?.workingDays && Array.isArray(this.admin.workingDays) && this.admin.workingDays.length > 0) {
      // Сортируем по дню недели
      const sortedDays = [...this.admin.workingDays].sort((a, b) => a.day - b.day);
      this.days = this.days.map(day => {
        const savedDay = sortedDays.find(d => d.day === day.day);
        return savedDay ? { ...day, ...savedDay } : day;
      });
    }

    // Создаем FormArray для каждого дня
    const daysFormArray = this.workingDaysForm.get('days') as FormArray;
    this.days.forEach(day => {
      daysFormArray.push(this.createDayFormGroup(day));
    });
  }

  createDayFormGroup(day: WorkingDay): FormGroup {
    return this.fb.group({
      day: [day.day],
      enabled: [day.enabled],
      startTime: [day.startTime, Validators.required],
      endTime: [day.endTime, Validators.required]
    });
  }

  get daysFormArray(): FormArray {
    return this.workingDaysForm.get('days') as FormArray;
  }

  getDayFormGroup(index: number): FormGroup {
    return this.daysFormArray.at(index) as FormGroup;
  }

  save() {
    if (this.workingDaysForm.invalid) {
      return;
    }

    const formValue = this.workingDaysForm.value;
    const workingDays = formValue.days.map((day: any) => ({
      day: day.day,
      startTime: day.startTime,
      endTime: day.endTime,
      enabled: day.enabled
    }));

    this.appService.updateAdmin(this.admin.id, { workingDays })
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.bsModalRef.hide();
          // Обновляем данные админа
          this.appService.auth().pipe(take(1)).subscribe();
        },
        error: (error) => {
          console.error('Ошибка сохранения рабочих часов:', error);
          alert('Ошибка сохранения рабочих часов');
        }
      });
  }

  cancel() {
    this.bsModalRef.hide();
  }
}

