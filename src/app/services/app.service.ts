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

  getAdmin(adminId: number): Observable<any> {
    return this.http
      .get(`${this.API_URL}/admins/admin/${adminId}`)
      .pipe(map((response) => response));
  }

  createAdmin(admin: any): Observable<any> {
    return this.http
      .post(`${this.API_URL}/admins/admin`, admin)
      .pipe(map((response) => response));
  }

  updateAdmin(adminId: number, admin: any): Observable<any> {
    return this.http
      .put(`${this.API_URL}/admins/admin/${adminId}`, admin)
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

  // Leads API endpoints
  getLeads(filters?: { status?: string; source?: string; assignedAdminId?: number; search?: string }): Observable<any> {
    let url = `${this.API_URL}/leads`;
    if (filters) {
      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.source) queryParams.append('source', filters.source);
      if (filters.assignedAdminId) queryParams.append('assignedAdminId', filters.assignedAdminId.toString());
      if (filters.search) queryParams.append('search', filters.search);
      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }
    }
    return this.http.get(url).pipe(map((response) => response));
  }

  getLead(leadId: number): Observable<any> {
    return this.http
      .get(`${this.API_URL}/leads/${leadId}`)
      .pipe(map((response) => response));
  }

  createLead(lead: any): Observable<any> {
    return this.http
      .post(`${this.API_URL}/leads`, lead)
      .pipe(map((response) => response));
  }

  createLeadFromChat(chatSessionId: string, assignedAdminId?: number): Observable<any> {
    return this.http
      .post(`${this.API_URL}/leads/from-chat/${chatSessionId}`, { assignedAdminId })
      .pipe(map((response) => response));
  }

  updateLead(leadId: number, lead: any): Observable<any> {
    return this.http
      .put(`${this.API_URL}/leads/${leadId}`, lead)
      .pipe(map((response) => response));
  }

  deleteLead(leadId: number): Observable<any> {
    return this.http
      .delete(`${this.API_URL}/leads/${leadId}`)
      .pipe(map((response) => response));
  }

  createLeadComment(leadId: number, comment: { adminId: number; comment: string }): Observable<any> {
    return this.http
      .post(`${this.API_URL}/leads/${leadId}/comments`, comment)
      .pipe(map((response) => response));
  }

  getLeadComments(leadId: number): Observable<any> {
    return this.http
      .get(`${this.API_URL}/leads/${leadId}/comments`)
      .pipe(map((response) => response));
  }

  deleteLeadComment(commentId: number): Observable<any> {
    return this.http
      .delete(`${this.API_URL}/leads/comments/${commentId}`)
      .pipe(map((response) => response));
  }

  getLeadsStats(): Observable<any> {
    return this.http
      .get(`${this.API_URL}/leads/stats/summary`)
      .pipe(map((response) => response));
  }

  // Chat messages for lead
  getChatMessages(sessionId: string): Observable<any> {
    return this.http
      .get(`${this.API_URL}/chat/messages/${sessionId}`)
      .pipe(map((response) => response));
  }

  // ==================== ACTIVITY LOG ====================
  getLeadActivities(leadId: number): Observable<any> {
    return this.http
      .get(`${this.API_URL}/leads/${leadId}/activities`)
      .pipe(map((response) => response));
  }

  // ==================== TASKS ====================
  // ==================== LEAD TASKS ====================
  getAdminTasks(status?: string, completed?: boolean): Observable<any> {
    let url = `${this.API_URL}/leads/tasks/my`;
    const queryParams = new URLSearchParams();
    if (status) queryParams.append('status', status);
    if (completed !== undefined) queryParams.append('completed', completed.toString());
    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`;
    }
    return this.http.get(url).pipe(map((response) => response));
  }

  createLeadTask(leadId: number, task: { adminId: number; title: string; description?: string; taskType?: string; status?: string; dueDate?: string; taskData?: any }): Observable<any> {
    return this.http
      .post(`${this.API_URL}/leads/${leadId}/tasks`, task)
      .pipe(map((response) => response));
  }

  getLeadTasks(leadId: number): Observable<any> {
    return this.http
      .get(`${this.API_URL}/leads/${leadId}/tasks`)
      .pipe(map((response) => response));
  }

  updateLeadTask(taskId: number, task: { title?: string; description?: string; taskType?: string; status?: string; dueDate?: string; completed?: boolean; taskData?: any }): Observable<any> {
    return this.http
      .put(`${this.API_URL}/leads/tasks/${taskId}`, task)
      .pipe(map((response) => response));
  }

  deleteLeadTask(taskId: number): Observable<any> {
    return this.http
      .delete(`${this.API_URL}/leads/tasks/${taskId}`)
      .pipe(map((response) => response));
  }

  // ==================== TAGS ====================
  getAllTags(): Observable<any> {
    return this.http
      .get(`${this.API_URL}/leads/tags/all`)
      .pipe(map((response) => response));
  }

  createTag(name: string, color?: string): Observable<any> {
    return this.http
      .post(`${this.API_URL}/leads/tags`, { name, color })
      .pipe(map((response) => response));
  }

  addTagToLead(leadId: number, tagId: number): Observable<any> {
    return this.http
      .post(`${this.API_URL}/leads/${leadId}/tags/${tagId}`, {})
      .pipe(map((response) => response));
  }

  removeTagFromLead(leadId: number, tagId: number): Observable<any> {
    return this.http
      .delete(`${this.API_URL}/leads/${leadId}/tags/${tagId}`)
      .pipe(map((response) => response));
  }

  // ==================== ATTACHMENTS ====================
  createLeadAttachment(leadId: number, file: File, description?: string): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    if (description) {
      formData.append('description', description);
    }
    return this.http
      .post(`${this.API_URL}/leads/${leadId}/attachments`, formData)
      .pipe(map((response) => response));
  }

  getLeadAttachments(leadId: number): Observable<any> {
    return this.http
      .get(`${this.API_URL}/leads/${leadId}/attachments`)
      .pipe(map((response) => response));
  }

  deleteLeadAttachment(attachmentId: number): Observable<any> {
    return this.http
      .delete(`${this.API_URL}/leads/attachments/${attachmentId}`)
      .pipe(map((response) => response));
  }

  // ==================== MEETINGS ====================
  createLeadMeeting(leadId: number, meeting: { adminId: number; title: string; description?: string; meetingDate: string; location?: string; meetingType?: string }): Observable<any> {
    return this.http
      .post(`${this.API_URL}/leads/${leadId}/meetings`, meeting)
      .pipe(map((response) => response));
  }

  getLeadMeetings(leadId: number): Observable<any> {
    return this.http
      .get(`${this.API_URL}/leads/${leadId}/meetings`)
      .pipe(map((response) => response));
  }

  updateLeadMeeting(meetingId: number, meeting: { title?: string; description?: string; meetingDate?: string; location?: string; meetingType?: string; completed?: boolean }): Observable<any> {
    return this.http
      .put(`${this.API_URL}/leads/meetings/${meetingId}`, meeting)
      .pipe(map((response) => response));
  }

  deleteLeadMeeting(meetingId: number): Observable<any> {
    return this.http
      .delete(`${this.API_URL}/leads/meetings/${meetingId}`)
      .pipe(map((response) => response));
  }

  // ==================== LEAD SCORING ====================
  calculateLeadScore(leadId: number): Observable<any> {
    return this.http
      .post(`${this.API_URL}/leads/${leadId}/calculate-score`, {})
      .pipe(map((response) => response));
  }

  convertLeadToClient(leadId: number): Observable<any> {
    return this.http
      .post(`${this.API_URL}/leads/${leadId}/convert-to-client`, {})
      .pipe(map((response) => response));
  }

  getUnprocessedLeadsCount(): Observable<any> {
    return this.http
      .get(`${this.API_URL}/leads/stats/unprocessed-count`)
      .pipe(map((response) => response));
  }

  getAdminStats(adminId: number): Observable<any> {
    return this.http
      .get(`${this.API_URL}/stats/admin/${adminId}/productivity`)
      .pipe(map((response) => response));
  }
}
