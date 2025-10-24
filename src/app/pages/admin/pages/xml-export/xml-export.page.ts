import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppService } from '../../../../services/app.service';

interface Car {
  id: number;
  brand: string;
  model: string;
  year: number;
  mileage: number;
  vin: string;
  gearbox: string;
  fuel: string;
  powerValue: number;
  powerType: string;
  engine: number;
  drive: string;
  price: number;
  isSold: boolean;
  promo: boolean;
  promoSold: boolean;
  description: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  admin?: {
    id: number;
    email: string;
  };
}

@Component({
  selector: 'app-xml-export',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './xml-export.page.html',
  styleUrls: ['./xml-export.page.scss'],
})
export class XmlExportPage implements OnInit {
  cars: Car[] = [];
  loading = false;
  error: string | null = null;
  xmlContent = '';
  showXml = false;
  currentDate = new Date().toLocaleDateString('ru-RU');

  constructor(private appService: AppService) {}

  ngOnInit() {
    this.loadCars();
  }

  loadCars() {
    this.loading = true;
    this.error = null;

    this.appService.getCarsAll().subscribe({
      next: (cars: Car[]) => {
        // Фильтруем только активные (не проданные) автомобили
        this.cars = cars.filter(car => !car.isSold && !car.deletedAt);
        this.generateXml();
        this.loading = false;
      },
      error: (err: any) => {
        this.error = 'Ошибка загрузки данных';
        this.loading = false;
        console.error('Error loading cars:', err);
      }
    });
  }

  generateXml() {
    const currentDate = new Date().toISOString();
    const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>';
    const ymlHeader = `<yml_catalog date="${currentDate}">
<shop>
<name>Adena Trans</name>
<company>Adena Trans Company</company>
<url>https://adenatrans.ru/</url>
<currencies>
<currency id="RUB" rate="1"/>
</currencies>
<categories>
<category id="1">Автомобили</category>
<category id="2" parentId="1">Кроссоверы</category>
<category id="3" parentId="1">Седаны</category>
<category id="4" parentId="1">Хэтчбеки</category>
<category id="5" parentId="1">Универсалы</category>
<category id="6" parentId="1">Купе</category>
<category id="7" parentId="1">Кабриолеты</category>
</categories>
<delivery-options>
<option cost="0" days="1-3"/>
</delivery-options>
<offers>`;

    const offersXml = this.cars.map(car => {
      const categoryId = this.getCategoryId(car);
      const carName = this.generateCarName(car);
      const description = this.generateDescription(car);
      
      return `
<offer id="${car.id}" available="true">
<url>https://adenatrans.ru/car/${car.id}</url>
<price>${car.price || 0}</price>
<currencyId>RUB</currencyId>
<categoryId>${categoryId}</categoryId>
<picture>https://adenatrans.ru/api/images/cars/${car.id}</picture>
<vendor>${this.escapeXml(car.brand || '')}</vendor>
<vendorCode>${this.escapeXml(car.vin || '')}</vendorCode>
<name>${this.escapeXml(carName)}</name>
<description>
<![CDATA[${description}]]>
</description>
<pickup>true</pickup>
<delivery>true</delivery>
</offer>`;
    }).join('');

    const ymlFooter = `
</offers>
</shop>
</yml_catalog>`;

    this.xmlContent = xmlHeader + ymlHeader + offersXml + ymlFooter;
  }

  getCategoryId(car: Car): number {
    // Простая логика определения категории по типу кузова
    const model = car.model?.toLowerCase() || '';
    if (model.includes('x') || model.includes('q') || model.includes('cross') || 
        model.includes('sport') || model.includes('crossover') || model.includes('suv')) {
      return 2; // Кроссоверы
    }
    return 1; // Автомобили (по умолчанию)
  }

  generateCarName(car: Car): string {
    const year = car.year || '';
    const price = car.price || 0;
    const formattedPrice = price.toLocaleString('ru-RU');
    
    return `Авто с пробегом ${car.brand} ${car.model} ${year} год. Цена ${formattedPrice} ₽`;
  }

  generateDescription(car: Car): string {
    const mileage = car.mileage || 0;
    const engine = car.engine || 0;
    const power = car.powerValue || 0;
    const fuel = this.getFuelType(car.fuel || '');
    const drive = this.getDriveType(car.drive || '');
    const gearbox = this.getGearboxType(car.gearbox || '');
    
    const formattedMileage = mileage.toLocaleString('ru-RU');
    const powerText = power > 0 ? `${power}Л/C` : '';
    const engineText = engine > 0 ? `${engine}л` : '';
    
    return `Как новый! Состояние идеал ${formattedMileage} км пробег ${engineText}(${powerText}) ${fuel}. ${drive}. ${gearbox}.`;
  }

  getFuelType(fuel: string): string {
    const fuelLower = fuel.toLowerCase();
    if (fuelLower.includes('дизель') || fuelLower.includes('diesel')) return 'Дизель';
    if (fuelLower.includes('гибрид') || fuelLower.includes('hybrid')) return 'Гибрид';
    if (fuelLower.includes('электро') || fuelLower.includes('electric')) return 'Электро';
    return 'Бензин';
  }

  getDriveType(drive: string): string {
    const driveLower = drive.toLowerCase();
    if (driveLower.includes('полный') || driveLower.includes('awd') || driveLower.includes('4wd')) return 'Полный привод';
    if (driveLower.includes('задний') || driveLower.includes('rwd')) return 'Задний привод';
    return 'Передний привод';
  }

  getGearboxType(gearbox: string): string {
    const gearboxLower = gearbox.toLowerCase();
    if (gearboxLower.includes('автомат') || gearboxLower.includes('automatic')) return 'Автомат';
    if (gearboxLower.includes('механик') || gearboxLower.includes('manual')) return 'Механика';
    if (gearboxLower.includes('вариатор') || gearboxLower.includes('cvt')) return 'Вариатор';
    return 'Автомат';
  }

  escapeXml(text: string): string {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  copyToClipboard() {
    navigator.clipboard.writeText(this.xmlContent).then(() => {
      // Можно добавить уведомление об успешном копировании
      console.log('YML каталог скопирован в буфер обмена');
    }).catch(err => {
      console.error('Ошибка копирования:', err);
    });
  }

  downloadXml() {
    const blob = new Blob([this.xmlContent], { type: 'application/xml' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `adenatrans-catalog-${new Date().toISOString().split('T')[0]}.yml`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  toggleXmlView() {
    this.showXml = !this.showXml;
  }

  refreshData() {
    this.loadCars();
  }
}
