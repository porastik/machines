import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { DataService } from '../../services/data.service';
import { ExportService } from '../../services/export.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { Device } from '../../models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, TranslatePipe, RouterLink],
  templateUrl: './dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  private dataService = inject(DataService);
  private exportService = inject(ExportService);

  // Expose Math and parseFloat for template
  Math = Math;
  parseFloat = parseFloat;

  // Current month string for display
  currentMonth = new Date().toLocaleDateString('sk-SK', { month: 'long', year: 'numeric' });

  devices = toSignal(this.dataService.loadDevices(), { initialValue: [] });
  parts = toSignal(this.dataService.getParts(), { initialValue: [] });
  logs = toSignal(this.dataService.getMaintenanceLogs(), {initialValue: [] });

  operationalDevices = computed(() => this.devices().filter(d => d.status === 'operational').length);
  maintenanceDevices = computed(() => this.devices().filter(d => d.status === 'maintenance').length);
  offlineDevices = computed(() => this.devices().filter(d => d.status === 'offline').length);
  
  lowStockParts = computed(() => this.parts().filter(p => p.quantity < p.minQuantity).length);

  // Celkový downtime zo VŠETKÝCH emergency údržieb (nie len aktuálny mesiac)
  totalDowntime = computed(() => {
    // Filtrovať len emergency údržby
    const emergencyLogs = this.logs().filter(log => log.type === 'emergency');
    
    // Sčítať všetky durationMinutes a konvertovať na hodiny
    const totalMinutes = emergencyLogs.reduce((acc, log) => acc + (log.durationMinutes || 0), 0);
    const totalHours = totalMinutes / 60;
    
    return totalHours.toFixed(1);
  });

  // Mesačný downtime z maintenance logs (aktuálny mesiac, len aktívne zariadenia, len neodkladná údržba)
  monthlyDowntime = computed(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Získať ID aktívnych zariadení (operational alebo maintenance, vynechať offline)
    const activeDeviceIds = this.devices()
      .filter(d => d.status === 'operational' || d.status === 'maintenance')
      .map(d => d.id);
    
    // Filtrovať logy len z aktívnych zariadení v aktuálnom mesiaci a len NEODKLADNÚ údržbu
    const monthlyLogs = this.logs().filter(log => {
      const logDate = new Date(log.date);
      const isCurrentMonth = logDate.getMonth() === currentMonth && logDate.getFullYear() === currentYear;
      const isActiveDevice = activeDeviceIds.includes(log.deviceId);
      const isEmergency = log.type === 'emergency'; // Len neodkladná údržba
      return isCurrentMonth && isActiveDevice && isEmergency;
    });
    
    const totalMinutes = monthlyLogs.reduce((acc, log) => acc + (log.durationMinutes || 0), 0);
    const totalHours = totalMinutes / 60;
    
    return {
      totalMinutes,
      totalHours: totalHours.toFixed(1),
      logsCount: monthlyLogs.length,
    };
  });

  // Výpočet downtime percentuálne (2.5% target z celkového pracovného času aktívnych strojov)
  downtimePercentage = computed(() => {
    const monthlyHours = parseFloat(this.monthlyDowntime().totalHours);
    
    // Spočítať pracovný čas len pre stroje v prevádzke alebo údržbe (vynechať offline)
    const activeDevices = this.devices().filter(d => d.status === 'operational' || d.status === 'maintenance');
    const workingHoursPerMonth = activeDevices.length * 160; // 160h na stroj (20 dní × 8h)
    
    const percentage = workingHoursPerMonth > 0 ? (monthlyHours / workingHoursPerMonth) * 100 : 0;
    const targetPercentage = 2.5;
    
    return {
      current: percentage.toFixed(2),
      target: targetPercentage.toFixed(1),
      isOverTarget: percentage > targetPercentage,
      workingHours: workingHoursPerMonth,
      activeDevicesCount: activeDevices.length,
    };
  });

  recentLogs = computed(() => this.logs().slice(0, 5));

  // Pomocná funkcia na konverziu maintenancePeriod na mesiace
  private getMaintenancePeriodMonths(period?: Device['maintenancePeriod']): number {
    switch (period) {
      case 'monthly': return 1;
      case 'quarterly': return 3;
      case 'semi-annually': return 6;
      case 'annually': return 12;
      default: return 0;
    }
  }

  // Zariadenia s plánovanou údržbou v aktuálnom mesiaci
  devicesWithScheduledMaintenance = computed(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return this.devices()
      .filter(device => {
        if (!device.nextMaintenance) {
          return false;
        }

        // Nezaradzovať stroje, ktoré sú mimo prevádzky (offline)
        if (device.status === 'offline') {
          return false;
        }
        
        const nextMaintenanceDate = new Date(device.nextMaintenance);
        return nextMaintenanceDate.getMonth() === currentMonth && 
               nextMaintenanceDate.getFullYear() === currentYear;
      })
      .map(device => {
        const nextMaintenanceDate = new Date(device.nextMaintenance!);
        
        return {
          ...device,
          lastMaintenanceDate: device.lastMaintenance,
          nextMaintenanceDate: device.nextMaintenance,
          daysUntilMaintenance: Math.ceil((nextMaintenanceDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        };
      })
      .sort((a, b) => a.daysUntilMaintenance - b.daysUntilMaintenance);
  });

  // Export metódy
  exportMaintenanceLogsToExcel(): void {
    const filename = `maintenance-logs-${new Date().getTime()}.xlsx`;
    this.exportService.exportMaintenanceLogsToExcel(this.logs(), this.devices(), filename);
  }
}
