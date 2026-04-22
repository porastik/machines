import { Component, signal, inject, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../../services/data.service';
import { AuthService } from '../../../services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { Supplier } from '../../../models';

@Component({
  selector: 'app-supplier-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './supplier-list.component.html'
})
export class SupplierListComponent implements OnInit {
  private dataService = inject(DataService);
  private notificationService = inject(NotificationService);
  authService = inject(AuthService);

  suppliers = signal<Supplier[]>([]);
  showAddForm = signal(false);
  editingSupplier = signal<Supplier | null>(null);
  searchTerm = signal('');
  filterActive = signal<'all' | 'active' | 'inactive'>('active');

  ngOnInit() {
    this.loadSuppliers();
  }

  loadSuppliers() {
    this.dataService.loadSuppliers().subscribe({
      next: (data) => this.suppliers.set(data),
      error: (err) => console.error('Error loading suppliers:', err)
    });
  }

  filteredSuppliers = computed(() => {
    let filtered = this.suppliers();

    // Filter by active status
    if (this.filterActive() === 'active') {
      filtered = filtered.filter(s => s.isActive);
    } else if (this.filterActive() === 'inactive') {
      filtered = filtered.filter(s => !s.isActive);
    }

    // Filter by search term
    const search = this.searchTerm().toLowerCase();
    if (search) {
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(search) ||
        s.email?.toLowerCase().includes(search) ||
        s.phone?.toLowerCase().includes(search) ||
        s.contactPerson?.toLowerCase().includes(search)
      );
    }

    return filtered;
  });

  toggleAddForm() {
    this.showAddForm.update(v => !v);
    this.editingSupplier.set(null);
  }

  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
  }

  onFilterChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value as 'all' | 'active' | 'inactive';
    this.filterActive.set(value);
  }

  addSupplier(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);

    const newSupplier = {
      name: formData.get('name') as string,
      contactPerson: formData.get('contactPerson') as string || undefined,
      email: formData.get('email') as string || undefined,
      phone: formData.get('phone') as string || undefined,
      address: formData.get('address') as string || undefined,
      website: formData.get('website') as string || undefined,
      notes: formData.get('notes') as string || undefined,
      isActive: true
    };

    this.dataService.createSupplier(newSupplier).subscribe({
      next: () => {
        form.reset();
        this.showAddForm.set(false);
        this.loadSuppliers();
        this.notificationService.success('Dodávateľ bol úspešne pridaný');
      },
      error: (err) => {
        console.error('Error adding supplier:', err);
        this.notificationService.error('Chyba pri pridávaní dodávateľa');
      }
    });
  }

  editSupplier(supplier: Supplier) {
    this.editingSupplier.set(supplier);
    this.showAddForm.set(true);
  }

  updateSupplier(event: Event) {
    event.preventDefault();
    const supplier = this.editingSupplier();
    if (!supplier) return;

    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);

    const updates = {
      name: formData.get('name') as string,
      contactPerson: formData.get('contactPerson') as string || undefined,
      email: formData.get('email') as string || undefined,
      phone: formData.get('phone') as string || undefined,
      address: formData.get('address') as string || undefined,
      website: formData.get('website') as string || undefined,
      notes: formData.get('notes') as string || undefined,
      isActive: formData.get('isActive') === 'true'
    };

    this.dataService.updateSupplier(supplier.id, updates).subscribe({
      next: () => {
        form.reset();
        this.showAddForm.set(false);
        this.editingSupplier.set(null);
        this.loadSuppliers();
        this.notificationService.success('Dodávateľ bol úspešne aktualizovaný');
      },
      error: (err) => {
        console.error('Error updating supplier:', err);
        this.notificationService.error('Chyba pri aktualizácii dodávateľa');
      }
    });
  }

  toggleSupplierStatus(supplier: Supplier) {
    if (!confirm(`Naozaj chcete ${supplier.isActive ? 'deaktivovať' : 'aktivovať'} dodávateľa ${supplier.name}?`)) {
      return;
    }

    this.dataService.updateSupplier(supplier.id, { isActive: !supplier.isActive }).subscribe({
      next: () => {
        this.loadSuppliers();
        this.notificationService.success(`Dodávateľ bol ${supplier.isActive ? 'deaktivovaný' : 'aktivovaný'}`);
      },
      error: (err) => {
        console.error('Error toggling supplier status:', err);
        this.notificationService.error('Chyba pri zmene stavu dodávateľa');
      }
    });
  }

  deleteSupplier(supplier: Supplier) {
    if (!confirm(`Naozaj chcete vymazať dodávateľa ${supplier.name}? Táto akcia je nevratná.`)) {
      return;
    }

    this.dataService.deleteSupplier(supplier.id).subscribe({
      next: () => {
        this.loadSuppliers();
        this.notificationService.success('Dodávateľ bol vymazaný');
      },
      error: (err) => {
        console.error('Error deleting supplier:', err);
        this.notificationService.error('Chyba pri mazaní dodávateľa');
      }
    });
  }

  cancelEdit() {
    this.showAddForm.set(false);
    this.editingSupplier.set(null);
  }
}
