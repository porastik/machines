
import { inject } from '@angular/core';
import { Router, type Routes } from '@angular/router';
import { AuthService } from './services/auth.service';
import { map } from 'rxjs/operators';

const authGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.currentUser();
  console.log('AuthGuard checking user:', user);
  
  if (user) {
    console.log('AuthGuard: User authenticated, allowing access');
    return true;
  }
  
  console.log('AuthGuard: No user, redirecting to login');
  return router.parseUrl('/login');
};

export const APP_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./components/login/login.component').then(c => c.LoginComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./components/layout/layout.component').then(c => c.LayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { 
        path: 'dashboard', 
        loadComponent: () => import('./components/dashboard/dashboard.component').then(c => c.DashboardComponent) 
      },
      { 
        path: 'devices', 
        loadComponent: () => import('./components/devices/device-list/device-list.component').then(c => c.DeviceListComponent) 
      },
      { 
        path: 'devices/:id', 
        loadComponent: () => import('./components/devices/device-detail/device-detail.component').then(c => c.DeviceDetailComponent) 
      },
      { 
        path: 'parts', 
        loadComponent: () => import('./components/parts/part-list/part-list.component').then(c => c.PartListComponent) 
      },
      { 
        path: 'suppliers', 
        loadComponent: () => import('./components/parts/supplier-list/supplier-list.component').then(c => c.SupplierListComponent) 
      },
      { 
        path: 'maintenance', 
        loadComponent: () => import('./components/maintenance/maintenance-list/maintenance-list.component').then(c => c.MaintenanceListComponent) 
      },
      { 
        path: 'downtime', 
        loadComponent: () => import('./components/downtime/downtime.component').then(c => c.DowntimeComponent) 
      },
      { 
        path: 'admin/checklists', 
        loadComponent: () => import('./components/admin/checklist-manager/checklist-manager.component').then(c => c.ChecklistManagerComponent) 
      },
      { 
        path: 'admin/users', 
        loadComponent: () => import('./components/admin/user-manager/user-manager.component').then(c => c.UserManagerComponent) 
      },
      { 
        path: 'admin/backup', 
        loadComponent: () => import('./components/admin/backup-restore/backup-restore.component').then(c => c.BackupRestoreComponent) 
      },
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
