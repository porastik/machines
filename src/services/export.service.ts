import { Injectable, inject } from '@angular/core';
import { Device, MaintenanceLog } from '../models';
import { TranslationService } from './translation.service';
import * as XLSX from 'xlsx';

@Injectable({
  providedIn: 'root'
})
export class ExportService {
  private translationService = inject(TranslationService);

  /**
   * Export devices to CSV file
   */
  exportDevicesToCsv(devices: Device[], filename: string = 'devices-export.csv'): void {
    if (!devices || devices.length === 0) {
      console.warn('No devices to export');
      return;
    }

    // CSV header
    const headers = [
      'ID zariadenia',
      'Názov',
      'Typ',
      'Umiestnenie',
      'Výrobca',
      'Stav',
      'Špecifikácie'
    ];

    // Convert devices to CSV rows
    const rows = devices.map(device => {
      // Format specifications as readable string
      let specificationsStr = '';
      if (device.specifications) {
        specificationsStr = Object.entries(device.specifications)
          .map(([key, value]) => `${key}: ${value}`)
          .join('; ');
      }

      return [
        this.escapeCSV(device.id),
        this.escapeCSV(device.name),
        this.escapeCSV(device.type),
        this.escapeCSV(device.location),
        this.escapeCSV(device.manufacturer || '-'),
        this.escapeCSV(this.getStatusLabel(device.status)),
        this.escapeCSV(specificationsStr || '-')
      ];
    });

    // Combine header and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Add BOM for proper UTF-8 encoding in Excel
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

    // Create download link and trigger download
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log(`✅ Exported ${devices.length} devices to ${filename}`);
  }

  /**
   * Escape CSV special characters
   */
  private escapeCSV(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  /**
   * Get human-readable status label
   */
  private getStatusLabel(status: Device['status']): string {
    switch (status) {
      case 'operational': return 'V prevádzke';
      case 'maintenance': return 'V údržbe';
      case 'offline': return 'Mimo prevádzky';
      default: return status;
    }
  }

  /**
   * Export Downtime Report to Excel with multiple sheets
   */
  exportDowntimeToExcel(
    stats: any[],
    totalStats: any,
    periodLabel: string,
    comparisonStats?: any[],
    comparisonTotalStats?: any,
    comparisonLabel?: string
  ): void {
    const workbook = XLSX.utils.book_new();
    const t = (key: string) => this.translationService.getTranslation(key);

    // Summary sheet
    const summaryData = [
      [t('DOWNTIME_TRACKING'), ''],
      [t('PERIOD'), periodLabel],
      [t('GENERATED'), new Date().toLocaleString()],
      ['', ''],
      [t('SUMMARY'), ''],
      [t('TOTAL_DOWNTIME'), `${totalStats.totalHours}h`],
      [t('AVERAGE_PERCENTAGE'), `${totalStats.averagePercentage}%`],
      [t('TARGET') + ' %', '2.5%'],
      [t('TOTAL_DEVICES'), totalStats.totalDevices],
      [t('DEVICES_IN_TARGET'), totalStats.devicesInTarget],
      [t('DEVICES_OVER_TARGET'), totalStats.devicesOverTarget],
    ];

    // Add comparison data if available
    if (comparisonStats && comparisonTotalStats && comparisonLabel) {
      const deltaHours = parseFloat(totalStats.totalHours) - parseFloat(comparisonTotalStats.totalHours);
      const deltaPercentage = parseFloat(totalStats.averagePercentage) - parseFloat(comparisonTotalStats.averagePercentage);
      const deltaDevicesOver = totalStats.devicesOverTarget - comparisonTotalStats.devicesOverTarget;

      summaryData.push(
        ['', ''],
        [t('COMPARISON_WITH'), comparisonLabel],
        [t('DOWNTIME_CHANGE'), `${deltaHours > 0 ? '+' : ''}${deltaHours.toFixed(1)}h`],
        [t('PERCENTAGE_CHANGE'), `${deltaPercentage > 0 ? '+' : ''}${deltaPercentage.toFixed(2)}%`],
        [t('DEVICES_OVER_TARGET_CHANGE'), `${deltaDevicesOver > 0 ? '+' : ''}${deltaDevicesOver}`],
        [t('DOWNTIME_STATUS'), deltaHours < 0 ? t('IMPROVEMENT') : t('DETERIORATION')],
        [t('PERCENTAGE_STATUS'), deltaPercentage < 0 ? t('BETTER') : t('WORSE')]
      );
    }

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, t('SUMMARY'));

    // Device details sheet
    const deviceHeaders = [
      'ID',
      t('DEVICE'),
      t('TYPE'),
      t('DOWNTIME') + ' (h)',
      t('DOWNTIME') + ' (min)',
      '%',
      t('TARGET') + ' %',
      t('STATUS'),
      t('SCHEDULED'),
      t('EMERGENCY')
    ];
    
    if (comparisonStats) {
      deviceHeaders.push(t('COMPARISON') + ' (h)', 'Δ (h)');
    }

    const deviceData = stats.map(stat => {
      const row = [
        stat.device.id,
        stat.device.name,
        stat.device.type,
        stat.totalHours,
        stat.totalMinutes,
        stat.currentPercentage,
        stat.targetPercentage,
        stat.isOverTarget ? t('OVER_TARGET') : t('IN_TARGET'),
        stat.scheduledCount,
        stat.emergencyCount
      ];

      if (comparisonStats) {
        const compStat = comparisonStats.find(cs => cs.device.id === stat.device.id);
        if (compStat) {
          const delta = parseFloat(stat.totalHours) - parseFloat(compStat.totalHours);
          row.push(compStat.totalHours, delta.toFixed(1));
        } else {
          row.push('—', '—');
        }
      }

      return row;
    });

    const deviceSheet = XLSX.utils.aoa_to_sheet([deviceHeaders, ...deviceData]);
    
    // Set column widths
    const wscols = [
      { wch: 12 }, // ID
      { wch: 25 }, // Device
      { wch: 20 }, // Type
      { wch: 12 }, // Downtime (h)
      { wch: 15 }, // Downtime (min)
      { wch: 8 },  // %
      { wch: 10 }, // Target %
      { wch: 12 }, // Status
      { wch: 18 }, // Scheduled
      { wch: 18 }, // Emergency
    ];

    if (comparisonStats) {
      wscols.push({ wch: 15 }); // Comparison
      wscols.push({ wch: 12 }); // Delta
    }

    deviceSheet['!cols'] = wscols;

    XLSX.utils.book_append_sheet(workbook, deviceSheet, t('DEVICES'));

    // Save
    const filename = `downtime-report-${periodLabel.replace(/\s+/g, '-').toLowerCase()}-${new Date().getTime()}.xlsx`;
    XLSX.writeFile(workbook, filename);
    console.log(`✅ Exported downtime report to ${filename}`);
  }

  /**
   * Export Maintenance Logs to Excel
   */
  exportMaintenanceLogsToExcel(logs: MaintenanceLog[], devices: Device[], filename: string = 'maintenance-logs.xlsx'): void {
    const workbook = XLSX.utils.book_new();
    const t = (key: string) => this.translationService.getTranslation(key);

    // Prepare data
    const headers = [t('DATE'), t('DEVICE'), t('DEVICE_TYPE'), t('MAINTENANCE_TYPE'), t('DURATION_MINUTES'), t('TECHNICIAN'), t('NOTES')];
    const data = logs.map(log => {
      const device = devices.find(d => d.id === log.deviceId);
      return [
        new Date(log.date).toLocaleString(),
        device?.name || log.deviceId,
        device?.type || log.deviceType || '-',
        log.type === 'scheduled' ? t('SCHEDULED') : t('EMERGENCY'),
        log.durationMinutes || 0,
        log.technician,
        log.notes || ''
      ];
    });

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
    
    // Set column widths
    worksheet['!cols'] = [
      { wch: 20 }, // Date
      { wch: 25 }, // Device
      { wch: 15 }, // Device Type
      { wch: 15 }, // Maintenance Type
      { wch: 15 }, // Duration
      { wch: 20 }, // Technician
      { wch: 40 }  // Notes
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, t('MAINTENANCE'));
    XLSX.writeFile(workbook, filename);
    console.log(`✅ Exported ${logs.length} maintenance logs to ${filename}`);
  }
}
