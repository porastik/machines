import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { DataService } from '../../../services/data.service';
import { AuthService } from '../../../services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { TranslatePipe } from '../../../pipes/translate.pipe';

@Component({
  selector: 'app-part-list',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './part-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PartListComponent {
  private dataService = inject(DataService);
  private notificationService = inject(NotificationService);
  authService = inject(AuthService);
  
  // Use the signal directly from DataService that gets updated
  parts = computed(() => this.dataService.getPartsSignal()());
  devices = computed(() => this.dataService.getDevicesSignal()());
  searchTerm = signal('');
  showAddForm = signal(false);
  partsWithHistory = signal<any[]>([]);
  stockFilter = signal<'all' | 'below-min' | 'low' | 'ok'>('all');

  constructor() {
    // Load parts and devices on init
    this.dataService.getParts().subscribe(() => {
      // Po načítaní dielov načítaj históriu pre každý
      this.loadPartsHistory();
    });
    this.dataService.loadDevices().subscribe();
  }

  private loadPartsHistory() {
    const parts = this.parts();
    const partsWithHistory: any[] = [];
    
    parts.forEach(part => {
      this.dataService.getPartLastChange(part.id).subscribe(history => {
        partsWithHistory.push({
          ...part,
          lastChange: history ? {
            date: history.created_at,
            changedBy: history.changed_by,
            notes: history.notes,
            changeType: history.change_type,
            quantityBefore: history.quantity_before,
            quantityAfter: history.quantity_after,
          } : undefined
        });
        
        if (partsWithHistory.length === parts.length) {
          this.partsWithHistory.set(partsWithHistory);
        }
      });
    });
  }

  filteredParts = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const filter = this.stockFilter();
    const partsToFilter = this.partsWithHistory().length > 0 ? this.partsWithHistory() : this.parts();
    
    let filtered = partsToFilter;
    
    // Apply stock filter
    if (filter === 'below-min') {
      filtered = filtered.filter((part: any) => part.quantity < part.minQuantity);
    } else if (filter === 'low') {
      filtered = filtered.filter((part: any) => 
        part.quantity >= part.minQuantity && part.quantity < part.minQuantity * 1.5
      );
    } else if (filter === 'ok') {
      filtered = filtered.filter((part: any) => part.quantity >= part.minQuantity * 1.5);
    }
    
    // Apply search term
    if (term) {
      filtered = filtered.filter((part: any) => 
        part.name.toLowerCase().includes(term) ||
        part.sku.toLowerCase().includes(term) ||
        part.location.toLowerCase().includes(term) ||
        (part.deviceName && part.deviceName.toLowerCase().includes(term))
      );
    }
    
    return filtered;
  });
  
  onSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  onFilterChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.stockFilter.set(select.value as any);
  }

  getQuantityClass(quantity: number, minQuantity: number = 10): string {
    if (quantity < minQuantity) return 'text-red-600 font-bold';
    if (quantity < minQuantity * 1.5) return 'text-yellow-600';
    return 'text-gray-800';
  }

  toggleAddForm() {
    this.showAddForm.update(v => !v);
  }

  increaseQuantity(partId: string, currentQuantity: number) {
    const notes = prompt('Dôvod zvýšenia množstva (POVINNÉ - napr. nákup, dodávka):');
    if (!notes || notes.trim() === '') {
      this.notificationService.warning('Poznámka je povinná pri zvýšení množstva');
      return;
    }
    
    this.dataService.updatePartQuantity(partId, currentQuantity + 1, notes, 'increase').subscribe({
      next: () => {
        this.notificationService.success('Množstvo bolo zvýšené');
        setTimeout(() => this.loadPartsHistory(), 500);
      },
      error: (err) => {
        console.error('Error increasing quantity:', err);
        this.notificationService.error('Chyba pri aktualizácii množstva: ' + err.message);
      }
    });
  }

  decreaseQuantity(partId: string, currentQuantity: number) {
    if (currentQuantity <= 0) {
      this.notificationService.warning('Množstvo nemôže byť záporné');
      return;
    }
    
    const notes = prompt('Dôvod zníženia množstva (POVINNÉ - napr. použité pri oprave CNC Fréza):');
    if (!notes || notes.trim() === '') {
      this.notificationService.warning('Poznámka je povinná pri znížení množstva');
      return;
    }
    
    this.dataService.updatePartQuantity(partId, currentQuantity - 1, notes, 'decrease').subscribe({
      next: () => {
        this.notificationService.success('Množstvo bolo znížené');
        setTimeout(() => this.loadPartsHistory(), 500);
      },
      error: (err) => {
        console.error('Error decreasing quantity:', err);
        this.notificationService.error('Chyba pri aktualizácii množstva: ' + err.message);
      }
    });
  }

  setQuantity(partId: string, currentQuantity: number) {
    const input = prompt('Zadajte nové množstvo:');
    if (input === null) return;
    
    const quantity = parseInt(input);
    if (isNaN(quantity) || quantity < 0) {
      this.notificationService.warning('Zadajte platné kladné číslo');
      return;
    }

    const notes = prompt('Dôvod zmeny množstva (POVINNÉ - napr. inventúra, korekcia):');
    if (!notes || notes.trim() === '') {
      this.notificationService.warning('Poznámka je povinná pri zmene množstva');
      return;
    }
    
    this.dataService.updatePartQuantity(partId, quantity, notes, 'set').subscribe({
      next: () => {
        this.notificationService.success('Množstvo bolo nastavené');
        setTimeout(() => this.loadPartsHistory(), 500);
      },
      error: (err) => {
        console.error('Error setting quantity:', err);
        this.notificationService.error('Chyba pri aktualizácii množstva: ' + err.message);
      }
    });
  }

  addPart(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const deviceId = formData.get('deviceId') as string;
    const selectedDevice = deviceId ? this.devices().find(d => d.id === deviceId) : undefined;
    
    const minQtyValue = formData.get('minQuantity') as string;
    const minQuantity = minQtyValue !== null && minQtyValue !== '' ? parseInt(minQtyValue, 10) : 0;
    
    const newPart = {
      name: formData.get('name') as string,
      sku: formData.get('sku') as string,
      quantity: parseInt(formData.get('quantity') as string, 10),
      minQuantity: minQuantity,
      location: formData.get('location') as string,
      deviceId: deviceId || undefined,
      deviceName: selectedDevice?.name || undefined,
    };

    this.dataService.addPart(newPart).subscribe({
      next: () => {
        this.notificationService.success('Náhradný diel bol úspešne pridaný');
        this.showAddForm.set(false);
        form.reset();
        this.dataService.getParts().subscribe(() => {
          this.loadPartsHistory();
        });
      },
      error: (err) => {
        console.error('Error adding part:', err);
        let errorMessage = 'Chyba pri pridávaní dielu';
        if (err.message) {
          if (err.message.includes('SKU už existuje')) {
            errorMessage = 'SKU už existuje v databáze. Zadajte jedinečné SKU.';
          } else {
            errorMessage = err.message;
          }
        }
        this.notificationService.error(errorMessage);
      }
    });
  }

  deletePart(partId: string, partName: string) {
    const confirmMessage = `Naozaj chcete vymazať náhradný diel "${partName}"?\n\nTáto akcia sa nedá vrátiť späť a vymaže aj všetku históriu zmien tohto dielu.`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    this.dataService.deletePart(partId).subscribe({
      next: () => {
        this.notificationService.success(`Náhradný diel "${partName}" bol úspešne vymazaný.`);
        this.dataService.getParts().subscribe(() => {
          this.loadPartsHistory();
        });
      },
      error: (err) => {
        console.error('Error deleting part:', err);
        this.notificationService.error(`Chyba pri vymazávaní dielu: ${err.message}`);
      }
    });
  }
}
