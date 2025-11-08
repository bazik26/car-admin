import { CommonModule } from '@angular/common';
import {
  Component,
  inject,
  Input,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { AccordionModule } from 'ngx-bootstrap/accordion';
import { NgSelectModule } from '@ng-select/ng-select';
import { BsModalRef } from 'ngx-bootstrap/modal';

import { AppService } from '../../../../../services/app.service';

@Component({
  selector: 'app-admin-admins-admin-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AccordionModule, NgSelectModule],
  templateUrl: './management.modal.html',
  styleUrls: ['./management.modal.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class AdminAdminsManagementModal implements OnInit {
  public readonly fb = inject(FormBuilder);

  public readonly activeModal = inject(BsModalRef);

  public readonly appService = inject(AppService);

  public form!: FormGroup;

  result?: { reload: boolean };

  ngOnInit() {
    this.form = this.fb.group({
      email: [null, [Validators.required]],
      password: [null, [Validators.required]],
      isSuper: [false],
      projectId: ['office_1'], // Дефолтное значение - первый офис
      permissions: this.fb.group({
        canAddCars: [true], // Дефолтно все разрешения включены
        canViewCars: [true],
        canManageLeads: [true],
        canViewLeads: [true],
        isLeadManager: [false], // По умолчанию НЕ Lead Manager
      }),
    });
  }

  onSubmit() {
    this.appService.createAdmin(this.form.value).subscribe(() => {
      this.result = { reload: true };
      this.activeModal.hide();
    });
  }
}
