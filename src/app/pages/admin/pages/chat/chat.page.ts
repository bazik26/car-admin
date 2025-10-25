import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { take } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { SoundService } from '../../../../services/sound.service';

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
  
  private readonly API_URL = 'https://car-api-production.up.railway.app'; // Railway API URL
  private socket: Socket | null = null;
  private pollingInterval: any = null;
  private soundService = inject(SoundService);
  soundEnabled = signal(true);
  
  ngOnInit() {
    this.loadSessions();
    this.connectToWebSocket();
    this.checkSoundSettings();
  }
  
  ngOnDestroy() {
    if (this.socket) {
      this.socket.disconnect();
    }
    this.stopMessagePolling();
  }
  
  loadSessions() {
    this.isLoading.set(true);
    console.log('Loading sessions from:', `${this.API_URL}/chat/sessions`);
    
    this.http.get<ChatSession[]>(`${this.API_URL}/chat/sessions`)
      .pipe(take(1))
      .subscribe({
        next: (sessions) => {
          console.log('Sessions loaded successfully:', sessions);
          this.sessions.set(sessions);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading sessions:', error);
          console.error('Error details:', error.status, error.message);
          this.isLoading.set(false);
        }
      });
  }
  
  selectSession(session: ChatSession) {
    console.log('Selecting session:', session);
    this.currentSession.set(session);
    console.log('Current session set:', this.currentSession());
    this.loadMessages(session.sessionId);
    this.startMessagePolling(session.sessionId);
  }
  
  loadMessages(sessionId: string) {
    console.log('Loading messages for session:', sessionId);
    this.http.get<ChatMessage[]>(`${this.API_URL}/chat/messages/${sessionId}`)
      .pipe(take(1))
      .subscribe({
        next: (messages) => {
          console.log('Messages loaded successfully:', messages);
          console.log('Messages count:', messages.length);
          this.messages.set(messages);
          console.log('Messages signal updated:', this.messages());
          this.markAsRead(sessionId);
        },
        error: (error) => {
          console.error('Error loading messages:', error);
          console.error('Error details:', error.status, error.message);
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
      // adminId: this.currentAdminId, // Временно убираем adminId
      projectSource: 'car-admin'
    };
    
    // Воспроизводим звук отправки
    this.soundService.playSendSound();
    
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

  get messagesList(): ChatMessage[] {
    return this.messages() || [];
  }

  private connectToWebSocket() {
    console.log('Connecting to WebSocket...');
    this.socket = io(this.API_URL, { transports: ['websocket', 'polling'] });
    
    this.socket.on('connect', () => {
      console.log('Connected to chat server');
    });
    
    this.socket.on('disconnect', () => {
      console.log('Disconnected from chat server');
    });
    
    this.socket.on('new-message', (message: ChatMessage) => {
      console.log('Received new message:', message);
      this.messages.update(messages => [...messages, message]);
      
      // Воспроизводим звук только для сообщений от клиента
      if (message.senderType === 'client') {
        this.soundService.playNewMessageSound();
      }
    });
    
    this.socket.on('error', (error: any) => {
      console.error('Chat error:', error);
    });
  }

  private startMessagePolling(sessionId: string) {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
    
    this.pollingInterval = setInterval(() => {
      console.log('Polling for new messages...');
      this.loadMessages(sessionId);
    }, 3000);
  }

  private stopMessagePolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  // Управление звуком
  toggleSound() {
    const newState = this.soundService.toggleSound();
    this.soundEnabled.set(newState);
  }

  // Проверить настройки звука при инициализации
  private checkSoundSettings() {
    this.soundEnabled.set(this.soundService.isSoundEnabled());
  }
}
