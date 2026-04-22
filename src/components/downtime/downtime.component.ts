import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { DataService } from '../../services/data.service';
import { ExportService } from '../../services/export.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-downtime',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './downtime.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DowntimeComponent {
  private dataService = inject(DataService);
  private exportService = inject(ExportService);

  Math = Math;
  parseFloat = parseFloat;

  // Aktuálny dátum pre výber mesiaca
  private now = new Date();
  selectedYear = signal(this.now.getFullYear());
  selectedMonth = signal(this.now.getMonth());

  // Režim zobrazenia (mesačný alebo ročný)
  viewMode = signal<'monthly' | 'yearly'>('monthly');

  // Režim porovnania
  comparisonMode = signal<'none' | 'month' | 'year'>('none');
  
  // Porovnávacie obdobie
  comparisonYear = signal(this.now.getFullYear());
  comparisonMonth = signal(this.now.getMonth() - 1 >= 0 ? this.now.getMonth() - 1 : 11);

  // Generovať mesiace pre dropdown (posledných 12 mesiacov)
  availableMonths = computed(() => {
    const months = [];
    const currentDate = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      months.push({
        year: date.getFullYear(),
        month: date.getMonth(),
        label: date.toLocaleDateString('sk-SK', { month: 'long', year: 'numeric' }),
        value: `${date.getFullYear()}-${date.getMonth()}`
      });
    }
    
    return months;
  });

  // Generovať roky pre dropdown (posledných 10 rokov)
  availableYears = computed(() => {
    const years = [];
    const currentYear = new Date().getFullYear();
    
    for (let i = 0; i < 10; i++) {
      years.push(currentYear - i);
    }
    
    return years;
  });

  // Aktuálny mesiac ako string pre zobrazenie
  currentMonthLabel = computed(() => {
    const date = new Date(this.selectedYear(), this.selectedMonth(), 1);
    return date.toLocaleDateString('sk-SK', { month: 'long', year: 'numeric' });
  });

  // Aktuálne obdobie (mesiac alebo rok) pre zobrazenie
  currentPeriodLabel = computed(() => {
    if (this.viewMode() === 'monthly') {
      const date = new Date(this.selectedYear(), this.selectedMonth(), 1);
      return date.toLocaleDateString('sk-SK', { month: 'long', year: 'numeric' });
    } else {
      return `rok ${this.selectedYear()}`;
    }
  });

  // Porovnávacie obdobie ako string
  comparisonMonthLabel = computed(() => {
    const date = new Date(this.comparisonYear(), this.comparisonMonth(), 1);
    return date.toLocaleDateString('sk-SK', { month: 'long', year: 'numeric' });
  });

  comparisonYearLabel = computed(() => {
    return this.comparisonYear().toString();
  });

  devices = toSignal(this.dataService.loadDevices(), { initialValue: [] });
  logs = toSignal(this.dataService.getMaintenanceLogs(), { initialValue: [] });

  // Metóda na zmenu vybratého mesiaca
  onMonthChange(value: string) {
    const [year, month] = value.split('-').map(Number);
    this.selectedYear.set(year);
    this.selectedMonth.set(month);
  }

  // Metóda na zmenu porovnávacieho mesiaca
  onComparisonMonthChange(value: string) {
    const [year, month] = value.split('-').map(Number);
    this.comparisonYear.set(year);
    this.comparisonMonth.set(month);
  }

  // Prepnutie režimu porovnania
  toggleComparisonMode(mode: 'none' | 'month' | 'year') {
    this.comparisonMode.set(mode);
  }

  // Prepnutie režimu zobrazenia
  toggleViewMode(mode: 'monthly' | 'yearly') {
    this.viewMode.set(mode);
  }

  // Vypočítať downtime pre každý stroj samostatne (len aktívne zariadenia, len neodkladná údržba)
  deviceDowntimeStats = computed(() => {
    const currentMonth = this.selectedMonth();
    const currentYear = this.selectedYear();
    const mode = this.viewMode();
    
    // Filtrovať len aktívne zariadenia (vynechať offline)
    const activeDevices = this.devices().filter(d => d.status === 'operational' || d.status === 'maintenance');
    
    console.log('📊 Computing downtime stats for devices:', activeDevices.length);
    console.log('📋 Total logs:', this.logs().length);
    console.log('📅 Selected period:', currentYear, '-', currentMonth + 1);
    console.log('🔍 View mode:', mode);
    
    return activeDevices.map(device => {
      // Nájsť všetky záznamy údržby pre tento stroj vo vybratom období
      const deviceLogs = this.logs().filter(log => {
        const logDate = new Date(log.date);
        if (mode === 'monthly') {
          return log.deviceId === device.id && 
                 logDate.getMonth() === currentMonth && 
                 logDate.getFullYear() === currentYear;
        } else {
          // Yearly mode
          return log.deviceId === device.id && 
                 logDate.getFullYear() === currentYear;
        }
      });
      
      // Filtrovať len neodkladnú údržbu pre downtime výpočet
      const emergencyLogs = deviceLogs.filter(log => log.type === 'emergency');
      
      console.log(`Device ${device.name} (${device.id}):`, deviceLogs.length, 'logs found,', emergencyLogs.length, 'emergency');

      // Spočítať celkový downtime LEN Z NEODKLADNEJ údržby
      const totalMinutes = emergencyLogs.reduce((acc, log) => {
        console.log(`  Emergency log ${log.id}: durationMinutes =`, log.durationMinutes);
        return acc + (log.durationMinutes || 0);
      }, 0);
      const totalHours = totalMinutes / 60;
      console.log(`  Total downtime (emergency only): ${totalMinutes} min = ${totalHours.toFixed(1)}h`);

      // Vypočítať percentá (160h pracovného času mesačne alebo 1920h ročne, 2.5% target)
      const workingHours = mode === 'monthly' ? 160 : 160 * 12; // 160h/mesiac * 12 mesiacov = 1920h/rok
      const targetPercentage = 2.5;
      const targetHours = (workingHours * targetPercentage) / 100;
      const currentPercentage = (totalHours / workingHours) * 100;
      const isOverTarget = currentPercentage > targetPercentage;

      return {
        device,
        totalMinutes,
        totalHours: totalHours.toFixed(1),
        logsCount: deviceLogs.length,
        workingHours: workingHours,
        currentPercentage: currentPercentage.toFixed(2),
        targetPercentage: targetPercentage.toFixed(1),
        targetHours: targetHours.toFixed(1),
        isOverTarget,
        scheduledCount: deviceLogs.filter(l => l.type === 'scheduled').length,
        emergencyCount: deviceLogs.filter(l => l.type === 'emergency').length,
      };
    });
  });

  // Štatistiky pre porovnávacie obdobie
  comparisonDowntimeStats = computed(() => {
    const mode = this.comparisonMode();
    if (mode === 'none') return [];

    const activeDevices = this.devices().filter(d => d.status === 'operational' || d.status === 'maintenance');
    
    return activeDevices.map(device => {
      let deviceLogs;
      
      if (mode === 'month') {
        // Porovnanie konkrétneho mesiaca
        const compMonth = this.comparisonMonth();
        const compYear = this.comparisonYear();
        deviceLogs = this.logs().filter(log => {
          const logDate = new Date(log.date);
          return log.deviceId === device.id && 
                 logDate.getMonth() === compMonth && 
                 logDate.getFullYear() === compYear;
        });
      } else {
        // Porovnanie celého roka
        const compYear = this.comparisonYear();
        deviceLogs = this.logs().filter(log => {
          const logDate = new Date(log.date);
          return log.deviceId === device.id && 
                 logDate.getFullYear() === compYear;
        });
      }

      const emergencyLogs = deviceLogs.filter(log => log.type === 'emergency');
      const totalMinutes = emergencyLogs.reduce((acc, log) => acc + (log.durationMinutes || 0), 0);
      const totalHours = totalMinutes / 60;
      
      const workingHoursPerMonth = mode === 'month' ? 160 : 160 * 12;
      const targetPercentage = 2.5;
      const targetHours = (workingHoursPerMonth * targetPercentage) / 100;
      const currentPercentage = (totalHours / workingHoursPerMonth) * 100;
      const isOverTarget = currentPercentage > targetPercentage;

      return {
        device,
        totalMinutes,
        totalHours: totalHours.toFixed(1),
        logsCount: deviceLogs.length,
        workingHours: workingHoursPerMonth,
        currentPercentage: currentPercentage.toFixed(2),
        targetPercentage: targetPercentage.toFixed(1),
        targetHours: targetHours.toFixed(1),
        isOverTarget,
        scheduledCount: deviceLogs.filter(l => l.type === 'scheduled').length,
        emergencyCount: deviceLogs.filter(l => l.type === 'emergency').length,
      };
    });
  });

  // Celkový prehľad
  totalStats = computed(() => {
    const stats = this.deviceDowntimeStats();
    const totalHours = stats.reduce((acc, s) => acc + parseFloat(s.totalHours), 0);
    const totalDevices = stats.length;
    const devicesOverTarget = stats.filter(s => s.isOverTarget).length;
    const totalLogs = stats.reduce((acc, s) => acc + s.logsCount, 0);

    return {
      totalHours: totalHours.toFixed(1),
      totalDevices,
      devicesOverTarget,
      devicesInTarget: totalDevices - devicesOverTarget,
      totalLogs,
      averagePercentage: totalDevices > 0 ? (stats.reduce((acc, s) => acc + parseFloat(s.currentPercentage), 0) / totalDevices).toFixed(2) : '0.00',
    };
  });

  // Celkový prehľad pre porovnávacie obdobie
  comparisonTotalStats = computed(() => {
    const stats = this.comparisonDowntimeStats();
    if (stats.length === 0) return null;
    
    const totalHours = stats.reduce((acc, s) => acc + parseFloat(s.totalHours), 0);
    const totalDevices = stats.length;
    const devicesOverTarget = stats.filter(s => s.isOverTarget).length;
    const totalLogs = stats.reduce((acc, s) => acc + s.logsCount, 0);

    return {
      totalHours: totalHours.toFixed(1),
      totalDevices,
      devicesOverTarget,
      devicesInTarget: totalDevices - devicesOverTarget,
      totalLogs,
      averagePercentage: totalDevices > 0 ? (stats.reduce((acc, s) => acc + parseFloat(s.currentPercentage), 0) / totalDevices).toFixed(2) : '0.00',
    };
  });

  // Porovnanie zmien (delta)
  comparisonDelta = computed(() => {
    const current = this.totalStats();
    const comparison = this.comparisonTotalStats();
    if (!comparison) return null;

    const deltaHours = parseFloat(current.totalHours) - parseFloat(comparison.totalHours);
    const deltaPercentage = parseFloat(current.averagePercentage) - parseFloat(comparison.averagePercentage);
    const deltaDevicesOver = current.devicesOverTarget - comparison.devicesOverTarget;

    return {
      hours: deltaHours.toFixed(1),
      percentage: deltaPercentage.toFixed(2),
      devicesOver: deltaDevicesOver,
      hoursImproved: deltaHours < 0,
      percentageImproved: deltaPercentage < 0,
      devicesImproved: deltaDevicesOver < 0,
    };
  });

  getStatusClass(isOverTarget: boolean): string {
    return isOverTarget ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800';
  }

  getProgressBarColor(isOverTarget: boolean): string {
    return isOverTarget ? 'bg-red-500' : 'bg-green-500';
  }

  // Dynamický informačný text podľa viewMode
  infoText = computed(() => {
    const mode = this.viewMode();
    if (mode === 'monthly') {
      return 'Pracovný čas: 160 hodín/mesiac na zariadenie (20 pracovných dní × 8 hodín). Cieľový prestoj: 2.5% = 4 hodiny/mesiac. Do prestojov sa počíta len neodkladná údržba. Minimálne trvanie údržby: 15 minút.';
    } else {
      return 'Pracovný čas: 1920 hodín/rok na zariadenie (160h/mesiac × 12 mesiacov). Cieľový prestoj: 2.5% = 48 hodín/rok. Do prestojov sa počíta len neodkladná údržba. Minimálne trvanie údržby: 15 minút.';
    }
  });

  // Export metóda
  exportToExcel(): void {
    const stats = this.deviceDowntimeStats();
    const total = this.totalStats();
    const periodLabel = this.currentPeriodLabel();
    
    if (this.comparisonMode() !== 'none') {
      const compStats = this.comparisonDowntimeStats();
      const compTotal = this.comparisonTotalStats();
      const compLabel = this.comparisonMode() === 'month' 
        ? this.comparisonMonthLabel() 
        : `rok ${this.comparisonYearLabel()}`;
      
      this.exportService.exportDowntimeToExcel(stats, total, periodLabel, compStats, compTotal, compLabel);
    } else {
      this.exportService.exportDowntimeToExcel(stats, total, periodLabel);
    }
  }
}
