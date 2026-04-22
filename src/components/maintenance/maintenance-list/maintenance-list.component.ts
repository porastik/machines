import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { DataService } from '../../../services/data.service';
import { AuthService } from '../../../services/auth.service';
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
  authService = inject(AuthService);
  
  // Use signal directly from DataService that gets updated
  logs = computed(() => this.dataService.getMaintenanceLogsSignal()());
  filterType = signal<'all' | 'scheduled' | 'emergency'>('all');
  filterYear = signal<string>('all');

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
    
    return filtered;
  });

  setFilter(type: 'all' | 'scheduled' | 'emergency') {
    this.filterType.set(type);
  }

  setYearFilter(year: string) {
    this.filterYear.set(year);
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
