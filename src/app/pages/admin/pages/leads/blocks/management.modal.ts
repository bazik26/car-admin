import { CommonModule } from '@angular/common';
import {
  Component,
  inject,
  Input,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { AppService } from '../../../../../services/app.service';
import { take } from 'rxjs';

interface Lead {
  id?: number;
  name: string;
  email?: string;
  phone?: string;
  source: 'chat' | 'telegram' | 'phone' | 'email' | 'other';
  status: 'new' | 'in_progress' | 'contacted' | 'closed' | 'lost';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  hasTelegramContact?: boolean;
  telegramUsername?: string;
  description?: string;
}

@Component({
  selector: 'app-lead-management-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './management.modal.html',
  styleUrls: ['./management.modal.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class LeadManagementModal implements OnInit {
  public readonly activeModal = inject(BsModalRef);
  public readonly appService = inject(AppService);

  @Input()
  lead?: Lead;

  public leadForm: Lead = {
    name: '',
    email: '',
    phone: '',
    source: 'chat',
    status: 'new',
    priority: 'normal',
    hasTelegramContact: false,
    telegramUsername: '',
    description: ''
  };

  result?: { reload: boolean };

  ngOnInit() {
    if (this.lead) {
      this.leadForm = { ...this.lead };
    }
  }

  onSubmit() {
    if (!this.leadForm.name.trim()) {
      alert('Имя обязательно для заполнения');
      return;
    }

    if (this.lead?.id) {
      // Обновление существующего лида
      this.appService.updateLead(this.lead.id, this.leadForm).pipe(take(1)).subscribe({
        next: () => {
          this.result = { reload: true };
          this.activeModal.hide();
        },
        error: (error: any) => {
          console.error('Error updating lead:', error);
          alert('Ошибка при обновлении лида');
        }
      });
    } else {
      // Создание нового лида
      this.appService.createLead(this.leadForm).pipe(take(1)).subscribe({
        next: () => {
          this.result = { reload: true };
          this.activeModal.hide();
        },
        error: (error: any) => {
          console.error('Error creating lead:', error);
          alert('Ошибка при создании лида');
        }
      });
    }
  }
}

