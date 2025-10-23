import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, ViewEncapsulation } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { NgSelectModule } from '@ng-select/ng-select';
import { BsModalService } from 'ngx-bootstrap/modal';

import { AppService } from '../../../../services/app.service';

import { AdminAdminsManagementModal } from './blocks/management.modal';

@Component({
  selector: 'app-admin-admins',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgSelectModule],
  templateUrl: './admins.page.html',
  styleUrls: ['./admins.page.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class AdminAdminsPage implements OnInit {
  public readonly modal = inject(BsModalService);

  public readonly appService = inject(AppService);

  public admins!: any;

  ngOnInit() {
    this.getAdminsAll();
  }

  openModal() {
    const modalRef = this.modal.show(AdminAdminsManagementModal);

    modalRef.onHide?.subscribe(() => {
      if (modalRef.content?.result?.reload) {
        this.getAdminsAll();
      }
    });
  }

  getAdminsAll() {
    this.appService
      .getAdminsAll()
      .subscribe((admins) => (this.admins = admins));
  }

  deleteAdmin(admin: any) {
    if (confirm(`Удалить ${admin.email}?`)) {
      this.appService
        .deleteAdmin(admin.id)
        .subscribe(() => this.getAdminsAll());
    }
  }

  restoreAdmin(admin: any) {
    this.appService.restoreAdmin(admin.id).subscribe(() => this.getAdminsAll());
  }
}
