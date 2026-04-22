import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, TranslatePipe, FormsModule],
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  authService = inject(AuthService);
  notificationService = inject(NotificationService);

  email = signal('');
  password = signal('');
  isLoading = signal(false);

  login() {
    const emailValue = this.email().trim();
    const passwordValue = this.password().trim();

    if (!emailValue || !passwordValue) {
      this.notificationService.error('Vyplňte email a heslo');
      return;
    }

    this.isLoading.set(true);

    // Prihlásenie cez email - rola sa načíta z Supabase
    this.authService.loginWithEmail(emailValue, passwordValue).subscribe({
      next: (success) => {
        this.isLoading.set(false);
        if (success) {
          this.notificationService.success('Prihlásenie úspešné');
        } else {
          this.notificationService.error('Nesprávne prihlasovacie údaje');
        }
      },
      error: (error) => {
        this.isLoading.set(false);
        console.error('Login error:', error);
        this.notificationService.error('Chyba pri prihlasovaní');
      }
    });
  }
}
