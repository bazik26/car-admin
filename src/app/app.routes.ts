import { Routes } from '@angular/router';

import { AdminLayoutComponent } from './pages/admin/pages/layout/layout.component';
import { SigninPage } from './pages/admin/pages/signin/signin.page';
import { AdminAdminsPage } from './pages/admin/pages/admins/admins.page';
import { AdminCarsPage } from './pages/admin/pages/cars/cars.page';
import { AdminProblematicCarsPage } from './pages/admin/pages/problematic-cars/problematic-cars.page';
import { AdminProductivityPage } from './pages/admin/pages/productivity/productivity.page';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/admin/signin',
    pathMatch: 'full',
  },
  {
    path: 'admin',
    children: [
      {
        path: 'signin',
        component: SigninPage,
        title: 'Вход в админ панель',
      },
      {
        path: '',
        component: AdminLayoutComponent,
        children: [
          {
            path: 'admins',
            component: AdminAdminsPage,
            title: 'Управление менеджерами',
          },
          {
            path: 'cars',
            component: AdminCarsPage,
            title: 'Управление автомобилями',
          },
          {
            path: 'problematic-cars',
            component: AdminProblematicCarsPage,
            title: 'Проблемные автомобили',
          },
          {
            path: 'productivity',
            component: AdminProductivityPage,
            title: 'Продуктивность администраторов',
          },
        ],
      },
    ],
  },
];
