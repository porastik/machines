import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { DataService } from '../../../services/data.service';
import { AuthService } from '../../../services/auth.service';
import { ExportService } from '../../../services/export.service';
import { NotificationService } from '../../../core/services/notification.service';
import { TranslatePipe } from '../../../pipes/translate.pipe';

@Component({
  selector: 'app-maintenance-list',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe, FormsModule],
  templateUrl: './maintenance-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MaintenanceListComponent {
  private dataService = inject(DataService);
  private notificationService = inject(NotificationService);
  private exportService = inject(ExportService);
  authService = inject(AuthService);
  
  // Use signal directly from DataService that gets updated
  logs = computed(() => this.dataService.getMaintenanceLogsSignal()());
  devices = computed(() => this.dataService.getDevicesSignal()());
  filterType = signal<'all' | 'scheduled' | 'emergency'>('all');
  filterYear = signal<string>('all');
  filterMonth = signal<string>('all');

  availableMonths = [
    { value: '1', label: 'JANUARY' },
    { value: '2', label: 'FEBRUARY' },
    { value: '3', label: 'MARCH' },
    { value: '4', label: 'APRIL' },
    { value: '5', label: 'MAY' },
    { value: '6', label: 'JUNE' },
    { value: '7', label: 'JULY' },
    { value: '8', label: 'AUGUST' },
    { value: '9', label: 'SEPTEMBER' },
    { value: '10', label: 'OCTOBER' },
    { value: '11', label: 'NOVEMBER' },
    { value: '12', label: 'DECEMBER' }
  ];

  // Generate available years from logs + current year
  availableYears = computed(() => {
    const currentYear = new Date().getFullYear();
    const yearsFromLogs = new Set<number>();
    
    this.logs().forEach(log => {
      if (log.date) {
        const year = new Date(log.date).getFullYear();
        if (!isNaN(year)) {
          yearsFromLogs.add(year);
        }
      }
    });
    
    // Add current year if not present
    yearsFromLogs.add(currentYear);
    
    // Sort descending (newest first)
    return Array.from(yearsFromLogs).sort((a, b) => b - a);
  });

  constructor() {
    // Load logs on init
    this.dataService.getMaintenanceLogs().subscribe();
  }

  filteredLogs = computed(() => {
    let filtered = this.logs();
    
    // Filter by type
    const type = this.filterType();
    if (type !== 'all') {
      filtered = filtered.filter(log => log.type === type);
    }
    
    // Filter by year
    const year = this.filterYear();
    if (year !== 'all') {
      const yearNum = parseInt(year, 10);
      filtered = filtered.filter(log => {
        if (!log.date) return false;
        const logYear = new Date(log.date).getFullYear();
        return logYear === yearNum;
      });
    }

    // Filter by month
    const month = this.filterMonth();
    if (month !== 'all') {
      const monthNum = parseInt(month, 10); // 1-12
      filtered = filtered.filter(log => {
        if (!log.date) return false;
        const logMonth = new Date(log.date).getMonth() + 1; // getMonth() returns 0-11
        return logMonth === monthNum;
      });
    }
    
    return filtered;
  });

  setFilter(type: 'all' | 'scheduled' | 'emergency') {
    this.filterType.set(type);
  }

  setYearFilter(year: string) {
    this.filterYear.set(year);
  }

  setMonthFilter(month: string) {
    this.filterMonth.set(month);
  }

  exportFilteredLogs() {
    const logsToExport = this.filteredLogs();
    if (logsToExport.length === 0) {
      this.notificationService.warning('Žiadne záznamy na export.');
      return;
    }
    const filename = `filtered-maintenance-logs-${new Date().getTime()}.xlsx`;
    this.exportService.exportMaintenanceLogsToExcel(logsToExport, this.devices(), filename);
  }

  deleteLog(logId: string, deviceName: string) {
    if (!confirm(`Naozaj chcete vymazať záznam údržby pre zariadenie "${deviceName}"?`)) {
      return;
    }

    this.dataService.deleteMaintenanceLog(logId).subscribe({
      next: () => {
        this.notificationService.success('Záznam údržby bol úspešne vymazaný');
      },
      error: (err) => {
        this.notificationService.error('Chyba pri mazaní záznamu: ' + err.message);
      }
    });
  }
}
