import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AppService {
  public API_URL = environment.API_URL;

  constructor(protected readonly http: HttpClient) {}

  getAllBrandsAndModels(): Observable<any> {
    return this.http
      .get(`${this.API_URL}/cars/all-brands-and-models`)
      .pipe(map((response) => response));
  }

  getBrandsAndModelsWithCount(): Observable<any> {
    return this.http
      .get(`${this.API_URL}/cars/brands-and-models-with-count`)
      .pipe(map((response) => response));
  }

  getCars(params?: any): Observable<any> {
    let url = `${this.API_URL}/cars`;
    
    if (params) {
      const queryParams = new URLSearchParams();
      
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
      if (params.random) queryParams.append('random', 'true');
      
      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }
    }
    
    return this.http
      .get(url)
      .pipe(map((response) => response));
  }

  searchCars(payload: any): Observable<any> {
    return this.http
      .post(`${this.API_URL}/cars/search`, payload)
      .pipe(map((response) => response));
  }

  getCarsAll(): Observable<any> {
    return this.http
      .get(`${this.API_URL}/cars/all`)
      .pipe(map((response) => response));
  }

  createCar(car: any): Observable<any> {
    return this.http
      .post(`${this.API_URL}/cars/car`, car)
      .pipe(map((response) => response));
  }

  getCar(carId: number): Observable<any> {
    return this.http
      .get(`${this.API_URL}/cars/car/${carId}`)
      .pipe(map((response) => response));
  }

  updateCar(carId: number, car: any): Observable<any> {
    delete car.files;

    return this.http
      .patch(`${this.API_URL}/cars/car/${carId}`, car)
      .pipe(map((response) => response));
  }

  uploadCarImages(carId: number, files: File[]): Observable<any> {
    const form = new FormData();
    files
      .filter((file): file is File => !!file)
      .filter((file: any) => !file.id)
      .forEach((file) => form.append('images', file, file.name));

    return this.http.patch<any>(
      `${this.API_URL}/cars/car/${carId}/images`,
      form,
    );
  }

  deleteCarImage(carId: number, fileId: number): Observable<any> {
    return this.http
      .delete(`${this.API_URL}/cars/car/${carId}/images/image/${fileId}`)
      .pipe(map((response) => response));
  }

  deleteCar(carId: number): Observable<any> {
    return this.http
      .delete(`${this.API_URL}/cars/car/${carId}`)
      .pipe(map((response) => response));
  }

  restoreCar(carId: number): Observable<any> {
    return this.http
      .get(`${this.API_URL}/cars/car/${carId}/restore`)
      .pipe(map((response) => response));
  }

  markCarAsSold(carId: number): Observable<any> {
    return this.http
      .patch(`${this.API_URL}/cars/car/${carId}/mark-sold`, {})
      .pipe(map((response) => response));
  }

  markCarAsAvailable(carId: number): Observable<any> {
    return this.http
      .patch(`${this.API_URL}/cars/car/${carId}/mark-available`, {})
      .pipe(map((response) => response));
  }

  getCarsByAdmin(adminId: number): Observable<any> {
    return this.http
      .get(`${this.API_URL}/cars/by-admin/${adminId}`)
      .pipe(map((response) => response));
  }

  auth(): Observable<any> {
    return this.http
      .get(`${this.API_URL}/auth`)
      .pipe(map((response) => response));
  }

  signin(payload: any): Observable<any> {
    return this.http
      .post(`${this.API_URL}/auth/signin`, payload)
      .pipe(map((response) => response));
  }

  getAdminsAll(): Observable<any> {
    return this.http
      .get(`${this.API_URL}/admins/all`)
      .pipe(map((response) => response));
  }

  createAdmin(admin: any): Observable<any> {
    return this.http
      .post(`${this.API_URL}/admins/admin`, admin)
      .pipe(map((response) => response));
  }

  deleteAdmin(adminId: number): Observable<any> {
    return this.http
      .delete(`${this.API_URL}/admins/admin/${adminId}`)
      .pipe(map((response) => response));
  }

  restoreAdmin(adminId: number): Observable<any> {
    return this.http
      .get(`${this.API_URL}/admins/admin/${adminId}/restore`)
      .pipe(map((response) => response));
  }

  getFileUrl(image: any) {
    // Если path содержит старый домен shop-ytb-client, заменяем на наш API
    if (image.path && image.path.includes('shop-ytb-client.onrender.com')) {
      const relativePath = image.path.replace(/https?:\/\/shop-ytb-client\.onrender\.com/, '');
      const normalizedPath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
      return `${this.API_URL}${normalizedPath}`;
    }
    // Если полный URL (другой домен) - используем как есть
    if (image.path.startsWith('http')) {
      return `${image.path}`;
    } else {
      // Относительный путь - добавляем API_URL
      // Убираем 'images/' из начала пути, так как ServeStaticModule раздаёт файлы из /images по корню
      let cleanPath = image.path;
      if (cleanPath.startsWith('images/')) {
        cleanPath = cleanPath.replace('images/', '');
      }
      const normalizedPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
      return `${this.API_URL}${normalizedPath}`;
    }
  }
  contactUs(payload: any) {
    return this.http
      .post(`${this.API_URL}/contact-us`, payload)
      .pipe(map((response) => response));
  }

  // Productivity and Statistics API endpoints
  getProductivityStats(): Observable<any> {
    return this.http
      .get(`${this.API_URL}/stats/productivity`)
      .pipe(map((response) => response));
  }

  getAdminProductivity(adminId: number): Observable<any> {
    return this.http
      .get(`${this.API_URL}/stats/admin/${adminId}/productivity`)
      .pipe(map((response) => response));
  }

  getCarsStats(): Observable<any> {
    return this.http
      .get(`${this.API_URL}/stats/cars`)
      .pipe(map((response) => response));
  }

  getErrorsStats(): Observable<any> {
    return this.http
      .get(`${this.API_URL}/stats/errors`)
      .pipe(map((response) => response));
  }
}
