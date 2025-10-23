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
    const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>';
    const xmlRoot = '<cars>';
    const xmlFooter = '</cars>';

    const carsXml = this.cars.map(car => {
      return `
  <car>
    <id>${car.id}</id>
    <brand>${this.escapeXml(car.brand || '')}</brand>
    <model>${this.escapeXml(car.model || '')}</model>
    <year>${car.year || ''}</year>
    <mileage>${car.mileage || 0}</mileage>
    <vin>${this.escapeXml(car.vin || '')}</vin>
    <gearbox>${this.escapeXml(car.gearbox || '')}</gearbox>
    <fuel>${this.escapeXml(car.fuel || '')}</fuel>
    <powerValue>${car.powerValue || 0}</powerValue>
    <powerType>${this.escapeXml(car.powerType || '')}</powerType>
    <engine>${car.engine || 0}</engine>
    <drive>${this.escapeXml(car.drive || '')}</drive>
    <price>${car.price || 0}</price>
    <description>${this.escapeXml(car.description || '')}</description>
    <createdAt>${car.createdAt}</createdAt>
    <updatedAt>${car.updatedAt}</updatedAt>
    <admin>
      <id>${car.admin?.id || ''}</id>
      <email>${this.escapeXml(car.admin?.email || '')}</email>
    </admin>
  </car>`;
    }).join('');

    this.xmlContent = xmlHeader + xmlRoot + carsXml + '\n' + xmlFooter;
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
      console.log('XML скопирован в буфер обмена');
    }).catch(err => {
      console.error('Ошибка копирования:', err);
    });
  }

  downloadXml() {
    const blob = new Blob([this.xmlContent], { type: 'application/xml' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `active-cars-${new Date().toISOString().split('T')[0]}.xml`;
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
