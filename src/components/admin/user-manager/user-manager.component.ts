import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { TranslationService } from '../../../services/translation.service';
import { NotificationService } from '../../../core/services/notification.service';

interface User {
  id: string;
  email: string;
  role: string;
  name: string;
  created_at: string;
}

@Component({
  selector: 'app-user-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-manager.component.html',
  styleUrl: './user-manager.component.css'
})
export class UserManagerComponent implements OnInit {
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  public t = inject(TranslationService);
  
  users = signal<User[]>([]);
  loading = signal(false);
  
  // Edit form
  showEditForm = signal(false);
  editingUser = signal<User | null>(null);
  editForm = {
    email: '',
    name: '',
    role: 'technician',
    password: ''
  };

  ngOnInit() {
    this.loadUsers();
  }

  async loadUsers() {
    try {
      this.loading.set(true);
      const data = await this.authService.getAllUsers();
      this.users.set(data);
    } catch (error) {
      this.notificationService.error('Chyba pri načítavaní používateľov');
    } finally {
      this.loading.set(false);
    }
  }

  openCreateForm() {
    this.editingUser.set(null);
    this.editForm = {
      email: '',
      name: '',
      role: 'technician',
      password: ''
    };
    this.showEditForm.set(true);
  }

  openEditForm(user: User) {
    this.editingUser.set(user);
    this.editForm = {
      email: user.email,
      name: user.name,
      role: user.role,
      password: '' // Don't prefill password
    };
    this.showEditForm.set(true);
  }

  async saveUser() {
    try {
      this.loading.set(true);
      
      if (this.editingUser()) {
        // Update existing user
        await this.authService.updateUser(this.editingUser()!.id, {
          email: this.editForm.email,
          name: this.editForm.name,
          role: this.editForm.role,
          password: this.editForm.password || undefined
        });
      } else {
        // Create new user
        if (!this.editForm.password) {
          this.notificationService.warning('Heslo je povinné pre nového používateľa');
          return;
        }
        await this.authService.createUser({
          email: this.editForm.email,
          name: this.editForm.name,
          role: this.editForm.role,
          password: this.editForm.password
        });
      }
      
      this.showEditForm.set(false);
      await this.loadUsers();
    } catch (error) {
      this.notificationService.error(`Chyba pri ukladaní používateľa: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
    } finally {
      this.loading.set(false);
    }
  }

  async deleteUser(userId: string) {
    if (!confirm('Naozaj chcete zmazať tohto používateľa?')) {
      return;
    }

    try {
      this.loading.set(true);
      await this.authService.deleteUser(userId);
      await this.loadUsers();
    } catch (error) {
      this.notificationService.error('Chyba pri mazaní používateľa');
    } finally {
      this.loading.set(false);
    }
  }
}
