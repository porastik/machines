import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { DataService } from '../../../services/data.service';
import { AuthService } from '../../../services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { QrCodeComponent } from '../../shared/qr-code/qr-code.component';
import { ChecklistComponent } from '../../shared/checklist/checklist.component';
import { Device } from '../../../models';
import { TranslatePipe } from '../../../pipes/translate.pipe';

@Component({
  selector: 'app-device-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, QrCodeComponent, ChecklistComponent, TranslatePipe],
  templateUrl: './device-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeviceDetailComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dataService = inject(DataService);
  private notificationService = inject(NotificationService);
  authService = inject(AuthService);

  // Use signal that gets updated when devices change
  private allDevices = this.dataService.getDevicesSignal();
  private deviceId = toSignal(this.route.paramMap.pipe(map(params => params.get('id'))));
  
  device = computed(() => {
    const id = this.deviceId();
    if (!id) return undefined;
    // Read from the signal that gets updated by updateDeviceStatus
    return this.allDevices().find(d => d.id === id);
  });

  qrCodeData = computed(() => {
    const dev = this.device();
    if (dev) {
      return `Device ID: ${dev.id}\nName: ${dev.name}\nLocation: ${dev.location}`;
    }
    return '';
  });

  getStatusClass(status: Device['status']): string {
    switch (status) {
      case 'operational': return 'bg-green-100 text-green-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'offline': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  logMaintenance(notes: string, type: 'scheduled' | 'emergency', durationMinutes: number) {
    const dev = this.device();
    const user = this.authService.currentUser();
    
    if (!dev || !user) {
      return;
    }
    
    if (!notes || notes.trim() === '') {
      this.notificationService.warning('Prosím zadajte poznámky k údržbe.');
      return;
    }

    if (!durationMinutes || durationMinutes < 15) {
      this.notificationService.warning('Minimálne trvanie údržby je 15 minút.');
      return;
    }
    
    const typeLabel = type === 'scheduled' ? '📅 Plánovaná' : '🚨 Neodkladná';
    const durationHours = (durationMinutes / 60).toFixed(1);
    const maintenanceDate = new Date();
    console.log(`📝 Logging ${type} maintenance for device:`, dev.name, 'Duration:', durationMinutes, 'minutes');
    
    this.dataService.addMaintenanceLog({
      deviceId: dev.id,
      deviceName: dev.name,
      date: maintenanceDate.toISOString(),
      technician: user.email,
      notes: notes.trim(),
      type: type,
      durationMinutes: durationMinutes,
    }).subscribe({
      next: (log) => {
        console.log('✅ Maintenance log saved:', log);
        
        // Ak je to plánovaná údržba, aktualizuj dátumy údržby na zariadení
        if (type === 'scheduled' && dev.maintenancePeriod) {
          const lastMaintenanceStr = maintenanceDate.toISOString().split('T')[0];
          
          // Vypočítať nasledujúcu údržbu podľa periódy
          const nextMaintenanceDate = new Date(maintenanceDate);
          switch (dev.maintenancePeriod) {
            case 'monthly':
              nextMaintenanceDate.setMonth(nextMaintenanceDate.getMonth() + 1);
              break;
            case 'quarterly':
              nextMaintenanceDate.setMonth(nextMaintenanceDate.getMonth() + 3);
              break;
            case 'semi-annually':
              nextMaintenanceDate.setMonth(nextMaintenanceDate.getMonth() + 6);
              break;
            case 'annually':
              nextMaintenanceDate.setFullYear(nextMaintenanceDate.getFullYear() + 1);
              break;
          }
          const nextMaintenanceStr = nextMaintenanceDate.toISOString().split('T')[0];
          
          console.log('📅 Updating maintenance dates - Last:', lastMaintenanceStr, 'Next:', nextMaintenanceStr);
          
          this.dataService.updateDeviceMaintenance(dev.id, lastMaintenanceStr, nextMaintenanceStr).subscribe({
            next: (updatedDevice) => {
              console.log('✅ Device maintenance dates updated:', updatedDevice);
            },
            error: (err) => {
              console.error('❌ Error updating maintenance dates:', err);
            }
          });
        }
        
        this.notificationService.success(`Údržba zariadenia "${dev.name}" bola úspešne zaznamenaná.\nTyp: ${typeLabel}\nTrvanie: ${durationMinutes} minút`);
      },
      error: (err) => {
        this.notificationService.error(`Chyba pri zaznamenávaní údržby: ${err.message}`);
      }
    });
  }

  updateStatus(newStatus: Device['status']) {
    const dev = this.device();
    if (dev) {
      console.log('🔄 Updating device status to:', newStatus);
      this.dataService.updateDeviceStatus(dev.id, newStatus).subscribe({
        next: (updatedDevice) => console.log('✅ Device status updated:', updatedDevice),
        error: (err) => console.error('❌ Error updating status:', err)
      });
    }
  }

  decommissionDevice() {
    const dev = this.device();
    if (!dev) return;

    const confirmMessage = `Naozaj chcete vyradiť zariadenie "${dev.name}"? Táto akcia sa nedá vrátiť späť.`;
    if (!confirm(confirmMessage)) {
      return;
    }

    console.log('🗑️ Decommissioning device:', dev.id);
    this.dataService.deleteDevice(dev.id).subscribe({
      next: () => {
        this.notificationService.success(`Zariadenie "${dev.name}" bolo úspešne vyradené.`);
        // Navigate back to devices list
        this.router.navigate(['/devices']);
      },
      error: (err) => {
        this.notificationService.error(`Chyba pri vyraďovaní zariadenia: ${err.message}`);
      }
    });
  }

  uploadManual(event: Event) {
    const input = event.target as HTMLInputElement;
    const dev = this.device();
    
    if (!input.files || input.files.length === 0 || !dev) {
      return;
    }

    const file = input.files[0];
    
    // Kontrola či je to PDF
    if (file.type !== 'application/pdf') {
      this.notificationService.warning('Môžete nahrať len PDF súbory.');
      input.value = '';
      return;
    }

    // Kontrola veľkosti (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      this.notificationService.warning('Súbor je príliš veľký. Maximálna veľkosť je 10MB.');
      input.value = '';
      return;
    }

    console.log('📤 Uploading manual:', file.name);
    
    this.dataService.uploadDeviceManual(dev.id, file).subscribe({
      next: (url) => {
        this.notificationService.success(`Manuál "${file.name}" bol úspešne nahraný.`);
        input.value = '';
      },
      error: (err) => {
        this.notificationService.error(`Chyba pri nahrávaní manuálu: ${err.message}`);
        input.value = '';
      }
    });
  }

  updateElectricalInspection(inspectionDate: string, period: number) {
    const dev = this.device();
    
    if (!dev) {
      return;
    }

    if (!inspectionDate || inspectionDate.trim() === '') {
      this.notificationService.warning('Prosím zadajte dátum revízie.');
      return;
    }

    if (![1, 2, 3, 4, 5, 10].includes(period)) {
      this.notificationService.warning('Prosím vyberte platnú periódu.');
      return;
    }

    this.dataService.updateElectricalInspection(dev.id, inspectionDate, period as 1 | 2 | 3 | 4 | 5 | 10).subscribe({
      next: (updatedDevice) => {
        this.notificationService.success(`Elektrická revízia zariadenia "${dev.name}" bola úspešne aktualizovaná.`);
      },
      error: (err) => {
        this.notificationService.error(`Chyba pri aktualizácii revízie: ${err.message}`);
      }
    });
  }

  isInspectionExpired(expiryDate: string): boolean {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    return expiry < today;
  }

  isInspectionExpiringSoon(expiryDate: string): boolean {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry > 0 && daysUntilExpiry <= 30; // 30 dní pred expirovaním
  }

  getInspectionExpiryClass(expiryDate: string): string {
    if (this.isInspectionExpired(expiryDate)) {
      return 'text-red-600 font-bold';
    } else if (this.isInspectionExpiringSoon(expiryDate)) {
      return 'text-yellow-600 font-bold';
    }
    return 'text-green-600';
  }

  objectKeys(obj: Record<string, any>): string[] {
    return Object.keys(obj);
  }
}
