import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { take } from 'rxjs';

interface ChatMessage {
  id?: number;
  sessionId: string;
  message: string;
  senderType: 'client' | 'admin';
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  adminId?: number;
  isRead?: boolean;
  projectSource?: string;
  createdAt?: Date;
}

interface ChatSession {
  id?: number;
  sessionId: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  projectSource: string;
  isActive?: boolean;
  assignedAdminId?: number;
  lastMessageAt?: Date;
  unreadCount?: number;
  createdAt?: Date;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.page.html',
  styleUrl: './chat.page.scss'
})
export class ChatPage implements OnInit, OnDestroy {
  private readonly http = inject(HttpClient);
  
  // Состояние чата
  sessions = signal<ChatSession[]>([]);
  currentSession = signal<ChatSession | null>(null);
  messages = signal<ChatMessage[]>([]);
  isLoading = signal(false);
  
  // Форма
  newMessage = '';
  currentAdminId = 1; // В реальном приложении получать из AuthService
  
  private readonly API_URL = 'http://localhost:3001'; // Замените на ваш API URL
  
  ngOnInit() {
    this.loadSessions();
  }
  
  ngOnDestroy() {
    // Cleanup если нужно
  }
  
  loadSessions() {
    this.isLoading.set(true);
    this.http.get<ChatSession[]>(`${this.API_URL}/chat/sessions`)
      .pipe(take(1))
      .subscribe({
        next: (sessions) => {
          this.sessions.set(sessions);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading sessions:', error);
          this.isLoading.set(false);
        }
      });
  }
  
  selectSession(session: ChatSession) {
    this.currentSession.set(session);
    this.loadMessages(session.sessionId);
  }
  
  loadMessages(sessionId: string) {
    this.http.get<ChatMessage[]>(`${this.API_URL}/chat/messages/${sessionId}`)
      .pipe(take(1))
      .subscribe({
        next: (messages) => {
          this.messages.set(messages);
          this.markAsRead(sessionId);
        },
        error: (error) => {
          console.error('Error loading messages:', error);
        }
      });
  }
  
  sendMessage() {
    if (!this.newMessage.trim() || !this.currentSession()) return;
    
    const session = this.currentSession();
    if (!session) return;
    
    const messageData: ChatMessage = {
      sessionId: session.sessionId,
      message: this.newMessage.trim(),
      senderType: 'admin',
      adminId: this.currentAdminId,
      projectSource: 'car-admin'
    };
    
    this.http.post(`${this.API_URL}/chat/message`, messageData)
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          this.newMessage = '';
          this.loadMessages(session.sessionId);
        },
        error: (error) => {
          console.error('Error sending message:', error);
        }
      });
  }
  
  markAsRead(sessionId: string) {
    this.http.post(`${this.API_URL}/chat/read/${sessionId}`, { adminId: this.currentAdminId })
      .pipe(take(1))
      .subscribe({
        next: () => {
          console.log('Messages marked as read');
        },
        error: (error) => {
          console.error('Error marking as read:', error);
        }
      });
  }
  
  assignToMe(session: ChatSession) {
    this.http.post(`${this.API_URL}/chat/session/${session.sessionId}/assign`, { adminId: this.currentAdminId })
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.loadSessions();
        },
        error: (error) => {
          console.error('Error assigning session:', error);
        }
      });
  }
  
  closeSession(session: ChatSession) {
    this.http.post(`${this.API_URL}/chat/session/${session.sessionId}/close`, {})
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.loadSessions();
          if (this.currentSession()?.sessionId === session.sessionId) {
            this.currentSession.set(null);
            this.messages.set([]);
          }
        },
        error: (error) => {
          console.error('Error closing session:', error);
        }
      });
  }
  
  formatTime(date: Date | string | undefined): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  }
  
  formatDate(date: Date | string | undefined): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('ru-RU');
  }

  // Геттеры для упрощения шаблона
  get totalSessions(): number {
    return (this.sessions() || []).length;
  }

  get activeSessions(): number {
    return (this.sessions() || []).filter(s => s.isActive === true).length;
  }

  get sessionsList(): ChatSession[] {
    return this.sessions() || [];
  }
}
