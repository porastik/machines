import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChecklistService } from '../../../services/checklist.service';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { MaintenanceChecklist } from '../../../models';

@Component({
  selector: 'app-checklist',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './checklist.component.html',
  styleUrls: ['./checklist.component.css']
})
export class ChecklistComponent implements OnInit {
  @Input() deviceType!: string;

  private checklistService = inject(ChecklistService);

  checklist = signal<MaintenanceChecklist | undefined>(undefined);
  loading = signal(false);

  async ngOnInit() {
    await this.loadChecklist();
  }

  private async loadChecklist() {
    try {
      this.loading.set(true);
      console.log('Loading checklist for device type:', this.deviceType);
      const checklists = await this.checklistService.getChecklists(this.deviceType);
      console.log('Found checklists:', checklists);
      
      if (checklists && checklists.length > 0) {
        // Get first active checklist for this device type
        const checklistWithItems = await this.checklistService.getChecklistWithItems(checklists[0].id);
        console.log('Checklist with items:', checklistWithItems);
        this.checklist.set(checklistWithItems || undefined);
      } else {
        console.log('No checklist found for device type:', this.deviceType);
        this.checklist.set(undefined);
      }
    } catch (error) {
      console.error('Error loading checklist:', error);
      this.checklist.set(undefined);
    } finally {
      this.loading.set(false);
      console.log('Loading finished. Checklist:', this.checklist());
    }
  }
}
