import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DataService } from '../../../services/data.service';
import { AuthService } from '../../../services/auth.service';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { Device, SparePart, MaintenanceLog, Supplier } from '../../../models';

interface BackupData {
  version: string;
  exportDate: string;
  exportedBy: string;
  data: {
    devices: Device[];
    spareParts: SparePart[];
    maintenanceLogs: MaintenanceLog[];
    suppliers: Supplier[];
  };
}

@Component({
  selector: 'app-backup-restore',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './backup-restore.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BackupRestoreComponent {
  private dataService = inject(DataService);
  private authService = inject(AuthService);
  private router = inject(Router);

  isLoading = signal(false);
  message = signal<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  lastBackupInfo = signal<{ date: string; size: string } | null>(null);
  
  // Štatistiky pre import preview
  importPreview = signal<{
    devices: number;
    spareParts: number;
    maintenanceLogs: number;
    suppliers: number;
  } | null>(null);
  
  selectedFile = signal<File | null>(null);
  backupDataToRestore = signal<BackupData | null>(null);

  // Možnosti importu
  importOptions = signal({
    devices: true,
    spareParts: true,
    maintenanceLogs: true,
    suppliers: true,
    replaceExisting: false // true = nahradiť, false = pridať k existujúcim
  });

  constructor() {
    // Overiť admin práva - použiť iba role-based kontrolu
    if (!this.authService.isAdmin()) {
      this.router.navigate(['/dashboard']);
    }
  }

  /**
   * Exportovať všetky dáta do JSON súboru
   */
  async exportBackup() {
    this.isLoading.set(true);
    this.message.set({ type: 'info', text: 'Pripravujem zálohu...' });

    try {
      // Načítať všetky dáta
      const [devices, spareParts, logs, suppliers] = await Promise.all([
        this.loadDevicesAsync(),
        this.loadSparePartsAsync(),
        this.loadMaintenanceLogsAsync(),
        this.loadSuppliersAsync()
      ]);

      const backupData: BackupData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        exportedBy: this.authService.currentUser()?.email || 'unknown',
        data: {
          devices,
          spareParts,
          maintenanceLogs: logs,
          suppliers
        }
      };

      // Vytvoriť a stiahnuť súbor
      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `mainthub-backup-${dateStr}.json`;
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      this.lastBackupInfo.set({
        date: new Date().toLocaleString('sk-SK'),
        size: this.formatBytes(blob.size)
      });

      this.message.set({ 
        type: 'success', 
        text: `Záloha úspešne vytvorená: ${filename} (${this.formatBytes(blob.size)})` 
      });

    } catch (error) {
      console.error('Export error:', error);
      this.message.set({ type: 'error', text: 'Chyba pri vytváraní zálohy: ' + (error as Error).message });
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Spracovať vybraný súbor pre import
   */
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      this.selectedFile.set(null);
      this.importPreview.set(null);
      this.backupDataToRestore.set(null);
      return;
    }

    const file = input.files[0];
    this.selectedFile.set(file);
    
    // Načítať a validovať súbor
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const backupData = JSON.parse(content) as BackupData;
        
        // Validovať štruktúru
        if (!backupData.version || !backupData.data) {
          throw new Error('Neplatný formát zálohy');
        }

        this.backupDataToRestore.set(backupData);
        this.importPreview.set({
          devices: backupData.data.devices?.length || 0,
          spareParts: backupData.data.spareParts?.length || 0,
          maintenanceLogs: backupData.data.maintenanceLogs?.length || 0,
          suppliers: backupData.data.suppliers?.length || 0
        });

        this.message.set({ 
          type: 'info', 
          text: `Súbor načítaný. Záloha z: ${new Date(backupData.exportDate).toLocaleString('sk-SK')}` 
        });

      } catch (error) {
        console.error('Parse error:', error);
        this.message.set({ type: 'error', text: 'Neplatný súbor zálohy: ' + (error as Error).message });
        this.selectedFile.set(null);
        this.importPreview.set(null);
        this.backupDataToRestore.set(null);
      }
    };
    
    reader.readAsText(file);
  }

  /**
   * Obnoviť dáta zo zálohy
   */
  async restoreBackup() {
    const backupData = this.backupDataToRestore();
    if (!backupData) {
      this.message.set({ type: 'error', text: 'Najprv vyberte súbor zálohy' });
      return;
    }

    const options = this.importOptions();
    
    // Potvrdenie
    const confirmMsg = options.replaceExisting 
      ? 'POZOR: Táto akcia NAHRADÍ existujúce dáta! Pokračovať?'
      : 'Dáta zo zálohy budú PRIDANÉ k existujúcim. Pokračovať?';
    
    if (!confirm(confirmMsg)) {
      return;
    }

    this.isLoading.set(true);
    this.message.set({ type: 'info', text: 'Obnovujem dáta...' });

    try {
      let importedCount = { devices: 0, spareParts: 0, maintenanceLogs: 0, suppliers: 0 };

      // Importovať zariadenia
      if (options.devices && backupData.data.devices?.length > 0) {
        for (const device of backupData.data.devices) {
          await this.importDevice(device, options.replaceExisting);
          importedCount.devices++;
        }
      }

      // Importovať náhradné diely
      if (options.spareParts && backupData.data.spareParts?.length > 0) {
        for (const part of backupData.data.spareParts) {
          await this.importSparePart(part, options.replaceExisting);
          importedCount.spareParts++;
        }
      }

      // Importovať záznamy údržby
      if (options.maintenanceLogs && backupData.data.maintenanceLogs?.length > 0) {
        for (const log of backupData.data.maintenanceLogs) {
          await this.importMaintenanceLog(log, options.replaceExisting);
          importedCount.maintenanceLogs++;
        }
      }

      // Importovať dodávateľov
      if (options.suppliers && backupData.data.suppliers?.length > 0) {
        for (const supplier of backupData.data.suppliers) {
          await this.importSupplier(supplier, options.replaceExisting);
          importedCount.suppliers++;
        }
      }

      this.message.set({ 
        type: 'success', 
        text: `Obnova dokončená! Importované: ${importedCount.devices} zariadení, ${importedCount.spareParts} náhradných dielov, ${importedCount.maintenanceLogs} záznamov údržby, ${importedCount.suppliers} dodávateľov.` 
      });

      // Reset formulára
      this.selectedFile.set(null);
      this.importPreview.set(null);
      this.backupDataToRestore.set(null);

    } catch (error) {
      console.error('Restore error:', error);
      this.message.set({ type: 'error', text: 'Chyba pri obnove: ' + (error as Error).message });
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Aktualizovať možnosti importu
   */
  updateImportOption(option: keyof typeof this.importOptions extends () => infer R ? R : never, value: boolean) {
    this.importOptions.update(opts => ({ ...opts, [option]: value }));
  }

  /**
   * Pomocné metódy pre načítanie dát
   */
  private loadDevicesAsync(): Promise<Device[]> {
    return new Promise((resolve, reject) => {
      this.dataService.loadDevices().subscribe({
        next: (devices) => resolve(devices),
        error: (err) => reject(err)
      });
    });
  }

  private loadSparePartsAsync(): Promise<SparePart[]> {
    return new Promise((resolve, reject) => {
      this.dataService.getParts().subscribe({
        next: (parts) => resolve(parts),
        error: (err) => reject(err)
      });
    });
  }

  private loadMaintenanceLogsAsync(): Promise<MaintenanceLog[]> {
    return new Promise((resolve, reject) => {
      this.dataService.getMaintenanceLogs().subscribe({
        next: (logs) => resolve(logs),
        error: (err) => reject(err)
      });
    });
  }

  private loadSuppliersAsync(): Promise<Supplier[]> {
    return new Promise((resolve, reject) => {
      this.dataService.loadSuppliers().subscribe({
        next: (suppliers) => resolve(suppliers),
        error: (err) => reject(err)
      });
    });
  }

  /**
   * Import metódy pre jednotlivé entity
   */
  private async importDevice(device: Device, replace: boolean): Promise<void> {
    return new Promise((resolve, reject) => {
      // Pre zariadenia vždy pridávame (addDevice)
      // Ak replace=true a záznam s ID existuje, môže zlyhať kvôli unique constraint
      this.dataService.addDevice(device).subscribe({
        next: () => resolve(),
        error: (err) => {
          // Pri chybe pri replace len pokračujeme
          if (replace) {
            console.log('Device already exists, skipping:', device.id);
            resolve();
          } else {
            reject(err);
          }
        }
      });
    });
  }

  private async importSparePart(part: SparePart, replace: boolean): Promise<void> {
    return new Promise((resolve, reject) => {
      // Pre náhradné diely vždy pridávame
      this.dataService.addPart(part).subscribe({
        next: () => resolve(),
        error: (err) => {
          if (replace) {
            console.log('Spare part already exists, skipping:', part.id);
            resolve();
          } else {
            reject(err);
          }
        }
      });
    });
  }

  private async importMaintenanceLog(log: MaintenanceLog, replace: boolean): Promise<void> {
    return new Promise((resolve, reject) => {
      // Pre maintenance logy vždy pridávame nové (bez replace)
      this.dataService.addMaintenanceLog(log).subscribe({
        next: () => resolve(),
        error: (err) => reject(err)
      });
    });
  }

  private async importSupplier(supplier: Supplier, replace: boolean): Promise<void> {
    return new Promise((resolve, reject) => {
      if (replace && supplier.id) {
        // Pokúsiť sa aktualizovať existujúceho
        this.dataService.updateSupplier(supplier.id, supplier).subscribe({
          next: () => resolve(),
          error: () => {
            // Ak zlyhal update, skúsiť vytvoriť nového
            this.dataService.createSupplier(supplier).subscribe({
              next: () => resolve(),
              error: (err) => reject(err)
            });
          }
        });
      } else {
        this.dataService.createSupplier(supplier).subscribe({
          next: () => resolve(),
          error: (err) => {
            if (replace) {
              console.log('Supplier already exists, skipping:', supplier.id);
              resolve();
            } else {
              reject(err);
            }
          }
        });
      }
    });
  }

  /**
   * Formátovať veľkosť súboru
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Zrušiť výber súboru
   */
  clearSelectedFile() {
    this.selectedFile.set(null);
    this.importPreview.set(null);
    this.backupDataToRestore.set(null);
    this.message.set(null);
  }
}
