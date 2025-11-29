import { CommonModule } from '@angular/common';
import {
  Component,
  inject,
  Input,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { AccordionModule } from 'ngx-bootstrap/accordion';
import { NgSelectModule } from '@ng-select/ng-select';
import { BsModalRef } from 'ngx-bootstrap/modal';

import { switchMap, catchError } from 'rxjs';

import { AppService } from '../../../../../services/app.service';

@Component({
  selector: 'app-admin-cars-car-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AccordionModule, NgSelectModule],
  templateUrl: './management.modal.html',
  styleUrls: ['./management.modal.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class AdminCarsManagementModal implements OnInit {
  public readonly fb = inject(FormBuilder);

  public readonly activeModal = inject(BsModalRef);

  public readonly appService = inject(AppService);

  @Input()
  car!: any;

  public form!: FormGroup;

  public BRANDS_AND_MODELS!: any[];

  public previews: (string | null)[] = [];

  result?: { reload: boolean };
  
  public isSubmitting = false; // Флаг для предотвращения множественных отправок

  ngOnInit() {
    this.form = this.fb.group({
      brand: [null, [Validators.required]],
      model: [null, [Validators.required]],
      year: [null, [Validators.required]],
      mileage: [null, [Validators.required]],
      vin: [null],
      gearbox: [null, [Validators.required]],
      fuel: [null, [Validators.required]],
      powerValue: [null, [Validators.required]],
      powerType: [null, [Validators.required]],
      engine: [null, [Validators.required]],
      drive: [null, [Validators.required]],
      price: [null, [Validators.required]],
      description: [null],

      conditionerType: [null],
      windowLifter: [null],
      interiorMaterials: [null],
      interiorColor: [null],
      powerSteering: [null],
      steeringWheelAdjustment: [null],
      spareWheel: [null],
      headlights: [null],
      seatAdjustment: [null],
      memorySeatModule: [null],
      seatHeated: [null],
      seatVentilation: [null],

      group1: this.fb.array([]),
      group2: this.fb.array([]),
      group3: this.fb.array([]),
      group4: this.fb.array([]),
      group5: this.fb.array([]),
      group6: this.fb.array([]),
      group7: this.fb.array([]),
      group8: this.fb.array([]),
      group9: this.fb.array([]),

      files: this.fb.array([]),
    });

    Object.keys(this.form.controls).forEach((key) => {
      if (
        this.form.get(key) instanceof FormArray &&
        this.car &&
        Array.isArray(this.car[key])
      ) {
        const formArray = this.form.get(key) as FormArray;
        formArray.clear();
        this.car[key].forEach((value: any) => {
          formArray.push(this.fb.control(value));
        });
      }
    });

    if (this.car) {
      this.car.files.forEach((file: any) => {
        this.previews.push(this.appService.getFileUrl(file));
      });

      this.form.patchValue(this.car);
    }

    this.previews.push(null);
    this.files.push(this.fb.control(null));

    this.appService
      .getAllBrandsAndModels()
      .subscribe(
        (BRANDS_AND_MODELS) => (this.BRANDS_AND_MODELS = BRANDS_AND_MODELS),
      );
  }

  get brands() {
    return this.BRANDS_AND_MODELS;
  }

  get models() {
    const brand = this.form.get('brand')?.value;

    if (brand) {
      return this.BRANDS_AND_MODELS.find((item) => item.title === brand).models;
    }

    return [];
  }

  private _years!: string[];
  get years() {
    if (!this._years) {
      const arr: string[] = [];

      let i = 0;

      while (arr[0] !== '2025') {
        arr.unshift(String(1900 + i));
        i++;
      }

      this._years = arr;
    }

    return this._years;
  }

  public readonly gearboxes = [
    'Механика',
    'Автомат',
    'Типтроник',
    'Робот',
    'Вариатор',
  ];

  public readonly fuels = [
    'Бензин',
    'Газ',
    'Газ пропан-бутан / Бензин',
    'Газ метан / Бензин',
    'Гибрид',
    'Гибрид (HEV)',
    'Гибрид (PHEV)',
    'Гибрид (MHEV)',
    'Дизель',
    'Электро',
  ];

  public readonly powerTypes = ['Л/C', 'кВт'];

  public readonly drives = ['Полный', 'Передний', 'Задний'];

  onCheckboxChange(event: any, groupName: string) {
    const formArray = this.form.get(groupName) as FormArray;
    if (event.target.checked) {
      formArray.push(this.fb.control(event.target.value));
    } else {
      const index = formArray.controls.findIndex(
        (x) => x.value === event.target.value,
      );

      if (index !== -1) {
        formArray.removeAt(index);
      }
    }
  }

  get files(): FormArray {
    return this.form.get('files') as FormArray;
  }

  private ensureTailSlot() {
    for (let i = 0; i < this.files.length - 1; i++) {
      if (!this.files.at(i).value) {
        this.files.removeAt(i);
        this.previews.splice(i, 1);
        i--;
      }
    }
    const needTail =
      this.files.length === 0 || !!this.files.at(this.files.length - 1).value;
    if (needTail) {
      this.files.push(this.fb.control(null));
      this.previews.push(null);
    }
  }

  onFileSelected(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      input.value = '';
      return;
    }

    this.files.at(index).setValue(file);

    if (this.previews[index]) URL.revokeObjectURL(this.previews[index]!);
    this.previews[index] = URL.createObjectURL(file);

    input.value = '';

    this.ensureTailSlot();
  }

  // Пакетная загрузка изображений
  onMultipleFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files || files.length === 0) return;

    // Фильтруем только изображения
    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      alert('Выберите хотя бы одно изображение');
      input.value = '';
      return;
    }

    // Находим первый пустой слот
    let currentIndex = this.files.controls.findIndex((_, i) => !this.previews[i]);
    if (currentIndex === -1) currentIndex = 0;

    // Загружаем файлы в слоты
    imageFiles.forEach((file, i) => {
      const targetIndex = currentIndex + i;
      
      // Добавляем слоты если нужно
      while (this.files.length <= targetIndex) {
        this.files.push(this.fb.control(null));
        this.previews.push(null);
      }

      this.files.at(targetIndex).setValue(file);
      if (this.previews[targetIndex]) {
        URL.revokeObjectURL(this.previews[targetIndex]!);
      }
      this.previews[targetIndex] = URL.createObjectURL(file);
    });

    input.value = '';
    this.ensureTailSlot();
  }

  removeFile(index: number, preview: any) {
    if (preview.id) {
      if (confirm(`Удалить изображение из базы?`)) {
        this.appService.deleteCarImage(this.car.id, preview.id).subscribe();
      } else {
        return;
      }
    }

    if (this.previews[index]) URL.revokeObjectURL(this.previews[index]!);
    this.previews.splice(index, 1);
    this.files.removeAt(index);

    this.ensureTailSlot();
  }

  public readonly options = [
    {
      title: 'Кондиционер',
      controlName: 'conditionerType',
      values: [
        'Кондиционер',
        'Климат-контроль 1-зонный',
        'Климат-контроль 2-зонный',
        'Климат-контроль многозонный',
      ],
    },
    {
      title: 'Электростеклоподъёмники',
      controlName: 'windowLifter',
      values: ['Передние', 'Передние и задние'],
    },
    {
      title: 'Материалы салона',
      controlName: 'interiorMaterials',
      values: [
        'Ткань',
        'Кожа',
        'Велюр',
        'Комбинированный',
        'Искусственная кожа',
        'Алькантара',
      ],
    },
    {
      title: 'Цвет салона',
      controlName: 'interiorColor',
      values: ['Светлый', 'Тёмный', 'Коричневый'],
    },
    {
      title: 'Усилитель руля',
      controlName: 'powerSteering',
      values: ['Гидро', 'Электро'],
    },
    {
      title: 'Регулировка руля',
      controlName: 'steeringWheelAdjustment',
      values: ['По высоте', 'По высоте и по вылету'],
    },
    {
      title: 'Запасное колесо',
      controlName: 'spareWheel',
      values: ['Полноразмерное', 'Докатка'],
    },
    {
      title: 'Фары',
      controlName: 'headlights',
      values: [
        'Ксенон/Биксенон',
        'Лазерные',
        'Светодиодные',
        'Матричные',
        'Галогенные',
      ],
    },
    {
      title: 'Регулировка сидений по высоте',
      controlName: 'seatAdjustment',
      values: [
        'Ручная регулировка сиденья водителя',
        'Ручная регулировка передних сидений',
        'Электрорегулировка сиденья водителя',
        'Электрорегулировка передних сидений',
        'Электрорегулировка передних и задних сидений',
      ],
    },
    {
      title: 'Память положения сидений',
      controlName: 'memorySeatModule',
      values: [
        'Сиденье водителя',
        'Передние сиденья',
        'Передние и задние сиденья',
      ],
    },
    {
      title: 'Подогрев сидений',
      controlName: 'seatHeated',
      values: ['Передние сиденья', 'Передние и задние сиденья'],
    },
    {
      title: 'Вентиляция сидений',
      controlName: 'seatVentilation',
      values: ['Передние сиденья', 'Передние и задние сиденья'],
    },
  ];

  public readonly group1 = [
    'Бортовой компьютер',
    'Подогрев зеркал',
    'Круиз-контроль',
    'Электропривод зеркал',
    'Тонированные стекла',
    'Датчик дождя',
    'Многофункциональный руль',
    'Передний центральный подлокотник',
    'Розетка 12V',
    'Отделка руля кожей',
    'Прикуриватель и пепельница',
    'Складное заднее сиденье',
    'Электроскладывание зеркал',
    'Отделка кожей рычага КПП',
    'Бардачок с охлаждением',
    'Запуск двигателя с кнопки',
    'Адаптивный круиз',
    'Декоративная подсветка салона',
    'Третий задний подголовник',
    'Обогрев лобового стекла',
    'Система «старт-стоп»',
    'Выбор режима движения',
    'Система доступа без ключа',
    'Люк',
    'Электронная приборная панель',
    'Электропривод крышки багажника',
    'Обогрев руля',
    'Электрорегулировка руля',
    'Подрулевые лепестки переключения передач',
    'Панорамная крыша / Лобовое стекло',
    'Открытие багажника без помощи рук',
    'Декоративные накладки на педали',
    'Функция складывания спинки сиденья пассажира',
    'Руль с памятью положения',
    'Отделка потолка черного цвета',
    'Третий ряд сидений',
    'Беспроводная зарядка для смартфона',
    'Дистанционный запуск двигателя',
    'Солнцезащитные шторки в задних дверях',
    'Розетка 220V',
    'Солнцезащитная шторка на заднем стекле',
    'Проекционный дисплей',
    'Складной столик на спинках передних сидений',
    'Доводчик дверей',
    'Холодильник',
    'Сиденья с массажем',
    'Регулируемый педальный узел',
  ];

  public readonly group2 = [
    'Парктроник задний',
    'Задняя камера',
    'Парктроник передний',
    'Передняя камера',
    'Камера 360',
    'Система автоматической парковки',
  ];

  public readonly group3 = [
    'AUX',
    'USB',
    'Bluetooth',
    'Акустика',
    'Навигационная система',
    'Мультимедиа система с LCD-экраном',
    'Голосовое управление',
    'Аудиоподготовка',
    'Android Auto',
    'CarPlay',
    'Система мультимедиа для задних пассажиров',
  ];

  public readonly group4 = [
    'Противотуманные фары',
    'Датчик света',
    'Дневные ходовые огни',
    'Омыватель фар',
    'Система адаптивного освещения',
    'Система управления дальним светом',
  ];

  public readonly group5 = [
    'Антиблокировочная система (ABS)',
    'Центральный замок',
    'Блокировка замков задних дверей',
    'Антипробуксовочная система (ASR)',
    'Система стабилизации (ESP)',
    'Иммобилайзер',
    'Сигнализация',
    'Датчик давления в шинах',
    'Система крепления IsoFix',
    'Распределение тормозных усилий (BAS, EBD)',
    'Помощь при старте в гору',
    'Помощь при спуске',
    'Стабилизация рулевого управления (VSM)',
    'Датчик проникновения в салон (датчик объёма)',
    'Предотвращение столкновения',
    'Контроль слепых зон',
    'Датчик усталости водителя',
    'Контроль за полосой движения',
    'Распознавание дорожных знаков',
    'Ночное видение',
  ];

  public readonly group6 = [
    'Гаражное хранение',
    'Сервисная книжка',
    'Первый владелец',
    'Первая регистрация',
    'Авто в кредите',
  ];

  public readonly group7 = [
    'Защита картера',
    'Фаркоп',
    'Защита коробки',
    'Накладки на пороги',
    'Длинная база',
    'Кузов MAXI',
    'Бронированный кузов',
  ];

  public readonly group8 = [
    'Водителя',
    'Пассажира',
    'Боковые передние',
    'Боковые задние',
    'Оконные (шторки)',
    'Подушка для колен водителя',
  ];

  public readonly group9 = [
    'Газобаллонное оборудование (ГБО)',
    'Автономный обогреватель Webasto',
    'Пневмоподвеска',
    'Ручное управление для людей с инвалидностью',
    'Пандус для людей с инвалидностью',
  ];

  canAutoFill(): boolean {
    const brand = this.form.get('brand')?.value;
    const model = this.form.get('model')?.value;
    const year = this.form.get('year')?.value;
    return !!(brand && model && year);
  }

  getSelectedCarInfo(): string {
    const brand = this.form.get('brand')?.value;
    const model = this.form.get('model')?.value;
    const year = this.form.get('year')?.value;
    return `${brand} ${model} ${year}`;
  }

  autoFillForm() {
    const carInfo = this.getSelectedCarInfo();
    if (confirm(`Автозаполнить форму для ${carInfo}? Это перезапишет текущие значения.`)) {
      this.fillRealisticData();
    }
  }

  private fillRealisticData() {
    const brand = this.form.get('brand')?.value;
    const model = this.form.get('model')?.value;
    const year = parseInt(this.form.get('year')?.value);
    
    // Генерируем реалистичные данные для конкретной марки и года
    const autoData = this.generateBrandSpecificData(brand, model, year);
    
    // Заполняем форму
    this.form.patchValue({
      mileage: autoData.mileage,
      gearbox: autoData.gearbox,
      fuel: autoData.fuel,
      powerValue: autoData.powerValue,
      powerType: autoData.powerType,
      engine: autoData.engine,
      drive: autoData.drive,
      price: autoData.price,
      vin: autoData.vin,
      conditionerType: autoData.conditionerType,
      windowLifter: autoData.windowLifter,
      interiorMaterials: autoData.interiorMaterials,
      interiorColor: autoData.interiorColor,
      powerSteering: autoData.powerSteering,
      steeringWheelAdjustment: autoData.steeringWheelAdjustment,
      spareWheel: autoData.spareWheel,
      headlights: autoData.headlights,
      seatAdjustment: autoData.seatAdjustment,
      memorySeatModule: autoData.memorySeatModule,
      seatHeated: autoData.seatHeated,
      seatVentilation: autoData.seatVentilation
    });

    // Заполняем группы опций специфичные для марки и года
    this.fillBrandSpecificOptions(brand, year);

    this.showNotification(`Форма автозаполнена для ${brand} ${model} ${year}!`, 'success');
  }

  private generateBrandSpecificData(brand: string, model: string, year: number) {
    const currentYear = new Date().getFullYear();
    const age = currentYear - year;
    
    // Генерируем пробег в зависимости от возраста автомобиля
    const baseMileage = age * 15000; // 15к км в год в среднем
    const mileage = baseMileage + Math.floor(Math.random() * 50000) - 25000; // ±25к км
    
    // Генерируем цену в зависимости от марки, года и пробега
    const basePrice = this.getBrandBasePrice(brand, year);
    const mileageFactor = Math.max(0.3, 1 - (mileage / 200000)); // коэффициент износа
    const price = Math.floor(basePrice * mileageFactor * (0.8 + Math.random() * 0.4));

    // Получаем характеристики специфичные для марки
    const brandSpecs = this.getBrandSpecifications(brand, year);

    return {
      mileage: Math.max(1000, mileage),
      gearbox: brandSpecs.gearbox,
      fuel: brandSpecs.fuel,
      powerValue: brandSpecs.powerValue,
      powerType: brandSpecs.powerType,
      engine: brandSpecs.engine,
      drive: brandSpecs.drive,
      price: price,
      vin: this.generateVIN(),
      conditionerType: brandSpecs.conditionerType,
      windowLifter: brandSpecs.windowLifter,
      interiorMaterials: brandSpecs.interiorMaterials,
      interiorColor: brandSpecs.interiorColor,
      powerSteering: brandSpecs.powerSteering,
      steeringWheelAdjustment: brandSpecs.steeringWheelAdjustment,
      spareWheel: brandSpecs.spareWheel,
      headlights: brandSpecs.headlights,
      seatAdjustment: brandSpecs.seatAdjustment,
      memorySeatModule: brandSpecs.memorySeatModule,
      seatHeated: brandSpecs.seatHeated,
      seatVentilation: brandSpecs.seatVentilation
    };
  }

  private getBrandBasePrice(brand: string, year: number): number {
    // Базовые цены для разных марок
    const brandMultipliers: { [key: string]: number } = {
      'BMW': 1.5,
      'Mercedes-Benz': 1.4,
      'Audi': 1.3,
      'Lexus': 1.3,
      'Porsche': 2.0,
      'Toyota': 1.0,
      'Honda': 1.0,
      'Nissan': 0.9,
      'Hyundai': 0.8,
      'Kia': 0.8,
      'Volkswagen': 1.1,
      'Skoda': 0.9,
      'Ford': 0.9,
      'Chevrolet': 0.8,
      'Renault': 0.8,
      'Peugeot': 0.8,
      'Citroen': 0.7,
      'Opel': 0.8,
      'Fiat': 0.7,
      'Lada': 0.5
    };

    const basePrice = 500000 + (year - 2010) * 100000;
    const multiplier = brandMultipliers[brand] || 1.0;
    return basePrice * multiplier;
  }

  private getBrandSpecifications(brand: string, year: number) {
    // Спецификации для разных марок
    const brandSpecs: { [key: string]: any } = {
      'BMW': {
        gearbox: Math.random() > 0.3 ? 'Автомат' : 'Механика',
        fuel: Math.random() > 0.7 ? 'Бензин' : 'Дизель',
        powerValue: Math.floor(Math.random() * 150) + 150, // 150-300 л.с.
        powerType: 'Л/C',
        engine: (Math.random() * 2 + 2).toFixed(1), // 2.0-4.0 л
        drive: Math.random() > 0.6 ? 'Полный' : 'Задний',
        conditionerType: 'Климат-контроль 2-зонный',
        windowLifter: 'Передние и задние',
        interiorMaterials: Math.random() > 0.5 ? 'Кожа' : 'Комбинированный',
        interiorColor: Math.random() > 0.5 ? 'Светлый' : 'Тёмный',
        powerSteering: 'Электро',
        steeringWheelAdjustment: 'По высоте и по вылету',
        spareWheel: 'Докатка',
        headlights: Math.random() > 0.5 ? 'Ксенон/Биксенон' : 'Светодиодные',
        seatAdjustment: 'Электрорегулировка передних сидений',
        memorySeatModule: 'Передние сиденья',
        seatHeated: 'Передние сиденья',
        seatVentilation: Math.random() > 0.7 ? 'Передние сиденья' : null
      },
      'Toyota': {
        gearbox: Math.random() > 0.4 ? 'Автомат' : 'Механика',
        fuel: Math.random() > 0.6 ? 'Бензин' : 'Гибрид',
        powerValue: Math.floor(Math.random() * 100) + 100, // 100-200 л.с.
        powerType: 'Л/C',
        engine: (Math.random() * 1.5 + 1.5).toFixed(1), // 1.5-3.0 л
        drive: Math.random() > 0.7 ? 'Полный' : 'Передний',
        conditionerType: 'Климат-контроль 1-зонный',
        windowLifter: 'Передние и задние',
        interiorMaterials: Math.random() > 0.6 ? 'Ткань' : 'Комбинированный',
        interiorColor: Math.random() > 0.4 ? 'Светлый' : 'Тёмный',
        powerSteering: 'Электро',
        steeringWheelAdjustment: 'По высоте и по вылету',
        spareWheel: 'Полноразмерное',
        headlights: Math.random() > 0.6 ? 'Галогенные' : 'Светодиодные',
        seatAdjustment: 'Ручная регулировка передних сидений',
        memorySeatModule: null,
        seatHeated: Math.random() > 0.7 ? 'Передние сиденья' : null,
        seatVentilation: null
      },
      'Lada': {
        gearbox: Math.random() > 0.7 ? 'Механика' : 'Автомат',
        fuel: 'Бензин',
        powerValue: Math.floor(Math.random() * 50) + 80, // 80-130 л.с.
        powerType: 'Л/C',
        engine: (Math.random() * 0.8 + 1.2).toFixed(1), // 1.2-2.0 л
        drive: 'Передний',
        conditionerType: Math.random() > 0.5 ? 'Кондиционер' : null,
        windowLifter: 'Передние',
        interiorMaterials: 'Ткань',
        interiorColor: Math.random() > 0.5 ? 'Светлый' : 'Тёмный',
        powerSteering: 'Электро',
        steeringWheelAdjustment: 'По высоте',
        spareWheel: 'Полноразмерное',
        headlights: 'Галогенные',
        seatAdjustment: 'Ручная регулировка сиденья водителя',
        memorySeatModule: null,
        seatHeated: null,
        seatVentilation: null
      }
    };

    // Возвращаем спецификации для марки или дефолтные
    return brandSpecs[brand] || this.getDefaultSpecifications(year);
  }

  private getDefaultSpecifications(year: number) {
    const isModern = year > 2018;
    return {
      gearbox: isModern ? 'Автомат' : (Math.random() > 0.5 ? 'Автомат' : 'Механика'),
      fuel: isModern ? 'Бензин' : this.fuels[Math.floor(Math.random() * this.fuels.length)],
      powerValue: Math.floor(Math.random() * 120) + 100, // 100-220 л.с.
      powerType: 'Л/C',
      engine: (Math.random() * 2 + 1.5).toFixed(1), // 1.5-3.5 л
      drive: this.drives[Math.floor(Math.random() * this.drives.length)],
      conditionerType: this.options[0].values[Math.floor(Math.random() * this.options[0].values.length)],
      windowLifter: this.options[1].values[Math.floor(Math.random() * this.options[1].values.length)],
      interiorMaterials: this.options[2].values[Math.floor(Math.random() * this.options[2].values.length)],
      interiorColor: this.options[3].values[Math.floor(Math.random() * this.options[3].values.length)],
      powerSteering: this.options[4].values[Math.floor(Math.random() * this.options[4].values.length)],
      steeringWheelAdjustment: this.options[5].values[Math.floor(Math.random() * this.options[5].values.length)],
      spareWheel: this.options[6].values[Math.floor(Math.random() * this.options[6].values.length)],
      headlights: this.options[7].values[Math.floor(Math.random() * this.options[7].values.length)],
      seatAdjustment: this.options[8].values[Math.floor(Math.random() * this.options[8].values.length)],
      memorySeatModule: this.options[9].values[Math.floor(Math.random() * this.options[9].values.length)],
      seatHeated: this.options[10].values[Math.floor(Math.random() * this.options[10].values.length)],
      seatVentilation: this.options[11].values[Math.floor(Math.random() * this.options[11].values.length)]
    };
  }

  private generateVIN(): string {
    const chars = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789';
    let vin = '';
    for (let i = 0; i < 17; i++) {
      vin += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return vin;
  }

  private fillBrandSpecificOptions(brand: string, year: number) {
    // Заполняем опции специфичные для марки и года
    const groups = [
      { name: 'group1', options: this.group1 },
      { name: 'group2', options: this.group2 },
      { name: 'group3', options: this.group3 },
      { name: 'group4', options: this.group4 },
      { name: 'group5', options: this.group5 },
      { name: 'group6', options: this.group6 },
      { name: 'group7', options: this.group7 },
      { name: 'group8', options: this.group8 },
      { name: 'group9', options: this.group9 }
    ];

    groups.forEach(group => {
      const formArray = this.form.get(group.name) as FormArray;
      formArray.clear();
      
      // Выбираем опции в зависимости от марки и года
      const selectedOptions = this.getBrandSpecificOptions(group.options, brand, year);
      
      selectedOptions.forEach(option => {
        formArray.push(this.fb.control(option));
      });
    });
  }

  private getBrandSpecificOptions(options: string[], brand: string, year: number): string[] {
    const isModern = year > 2018;
    const isLuxury = ['BMW', 'Mercedes-Benz', 'Audi', 'Lexus', 'Porsche'].includes(brand);
    const isBudget = ['Lada', 'Fiat', 'Citroen'].includes(brand);
    
    // Фильтруем опции в зависимости от марки и года
    let filteredOptions = options;
    
    if (isBudget) {
      // Для бюджетных марок убираем дорогие опции
      filteredOptions = options.filter(option => 
        !option.includes('Электро') && 
        !option.includes('Память') &&
        !option.includes('Вентиляция') &&
        !option.includes('Массаж')
      );
    } else if (isLuxury) {
      // Для люксовых марок добавляем больше опций
      filteredOptions = options;
    } else if (isModern) {
      // Для современных автомобилей убираем устаревшие опции
      filteredOptions = options.filter(option => 
        !option.includes('Прикуриватель') &&
        !option.includes('Пепельница')
      );
    }
    
    // Выбираем случайное количество опций (от 2 до 6 для бюджетных, от 4 до 8 для люксовых)
    const minOptions = isBudget ? 2 : (isLuxury ? 4 : 3);
    const maxOptions = isBudget ? 6 : (isLuxury ? 8 : 7);
    const numOptions = Math.floor(Math.random() * (maxOptions - minOptions + 1)) + minOptions;
    
    return this.getRandomItems(filteredOptions, numOptions);
  }

  private getRandomItems(array: any[], count: number): any[] {
    const shuffled = array.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
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

  showSuccessNotification(message: string) {
    // Простое уведомление без дополнительных библиотек
    const notification = document.createElement('div');
    notification.className = 'alert alert-success position-fixed top-0 start-50 translate-middle-x mt-3';
    notification.style.zIndex = '9999';
    notification.innerHTML = `<i class="fas fa-check-circle me-2"></i>${message}`;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  }

  showErrorNotification(message: string) {
    const notification = document.createElement('div');
    notification.className = 'alert alert-danger position-fixed top-0 start-50 translate-middle-x mt-3';
    notification.style.zIndex = '9999';
    notification.innerHTML = `<i class="fas fa-exclamation-circle me-2"></i>${message}`;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 5000);
  }

  closeModal() {
    // Закрываем модалку без сохранения
    this.result = { reload: false };
    this.activeModal.hide();
  }

  onSubmit() {
    // Защита от множественных кликов
    if (this.isSubmitting) return;
    
    // Проверка наличия изображений перед созданием новой машины
    const files = this.form.get('files')!.value;
    const filesToUpload = files.filter((file: any) => file && !file.id);
    
    if (!this.car) {
      // Для новой машины требуем минимум 8 изображений
      if (filesToUpload.length < 8) {
        this.showErrorNotification(`Пожалуйста, загрузите минимум 8 изображений. Загружено: ${filesToUpload.length}`);
        return;
      }
    }
    
    this.isSubmitting = true;
    
    if (this.car) {
      this.appService
        .updateCar(this.car.id, this.form.value)
        .pipe(
          switchMap((car: any) =>
            this.appService.uploadCarImages(
              car.id,
              this.form.get('files')!.value,
            ),
          ),
        )
        .subscribe({
          next: () => {
            this.showSuccessNotification('Автомобиль успешно обновлён!');
            this.result = { reload: true };
            setTimeout(() => {
              this.isSubmitting = false;
              this.activeModal.hide();
            }, 500);
          },
          error: (err) => {
            this.isSubmitting = false;
            let errorMessage = 'Ошибка при обновлении автомобиля';
            if (err.status === 401) {
              errorMessage = 'Сессия истекла. Пожалуйста, войдите заново.';
            } else if (err.error?.message) {
              errorMessage += ': ' + err.error.message;
            } else if (err.message) {
              errorMessage += ': ' + err.message;
            }
            this.showErrorNotification(errorMessage);
          }
        });
    } else {
      // При создании новой машины изображения уже проверены выше
      let createdCarId: number | null = null;
      
      this.appService
        .createCar(this.form.value)
        .pipe(
          switchMap((car: any) => {
            // Сохраняем ID созданной машины для возможного удаления при ошибке
            createdCarId = car.id;
            // Если создание успешно, загружаем изображения
            return this.appService.uploadCarImages(
              car.id,
              this.form.get('files')!.value,
            );
          }),
          catchError((err) => {
            // Если загрузка изображений не удалась, удаляем созданную машину
            if (createdCarId) {
              this.appService.deleteCar(createdCarId).subscribe({
                next: () => {
                  console.log('Автомобиль удален из-за ошибки загрузки изображений');
                },
                error: (deleteErr) => {
                  console.error('Ошибка при удалении автомобиля:', deleteErr);
                }
              });
            }
            // Пробрасываем ошибку дальше
            throw err;
          })
        )
        .subscribe({
          next: () => {
            this.showSuccessNotification('Автомобиль успешно добавлен!');
            this.result = { reload: true };
            setTimeout(() => {
              this.isSubmitting = false;
              this.activeModal.hide();
            }, 500);
          },
          error: (err) => {
            this.isSubmitting = false;
            let errorMessage = 'Ошибка при создании автомобиля';
            if (err.status === 401) {
              errorMessage = 'Сессия истекла. Пожалуйста, войдите заново.';
            } else if (err.status === 409) {
              errorMessage = 'Автомобиль с таким VIN уже существует';
            } else if (err.error?.message) {
              errorMessage += ': ' + err.error.message;
            } else if (err.message) {
              errorMessage += ': ' + err.message;
            }
            // Если это ошибка загрузки изображений, добавляем дополнительное сообщение
            if (createdCarId && err.status !== 409) {
              errorMessage += '. Автомобиль был удален из-за ошибки загрузки изображений.';
            }
            this.showErrorNotification(errorMessage);
          }
        });
    }
  }
}
