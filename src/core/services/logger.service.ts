import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

/**
 * Logger Service - Centralizované logovanie pre aplikáciu
 * 
 * V produkcii sú debug logy automaticky vypnuté.
 * Error logy zostávajú aktívne vždy pre monitoring.
 */
@Injectable({
  providedIn: 'root',
})
export class LoggerService {
  
  /**
   * Debug log - vypnuté v produkcii
   */
  debug(message: string, ...optionalParams: any[]): void {
    if (environment.enableLogging) {
      console.log(message, ...optionalParams);
    }
  }

  /**
   * Info log - vypnuté v produkcii
   */
  info(message: string, ...optionalParams: any[]): void {
    if (environment.enableLogging) {
      console.info(message, ...optionalParams);
    }
  }

  /**
   * Warning log - vždy aktívne
   */
  warn(message: string, ...optionalParams: any[]): void {
    if (environment.enableLogging) {
      console.warn(message, ...optionalParams);
    }
  }

  /**
   * Error log - vždy aktívne (pre monitoring)
   */
  error(message: string, ...optionalParams: any[]): void {
    // Errors sú vždy logované pre diagnostiku
    console.error(message, ...optionalParams);
    
    // Tu by sa dal pridať externý logging (napr. Sentry)
    // this.sendToExternalLogger(message, optionalParams);
  }

  /**
   * Group log - pre zoskupenie súvisiacich logov
   */
  group(label: string): void {
    if (environment.enableLogging) {
      console.group(label);
    }
  }

  /**
   * Group end
   */
  groupEnd(): void {
    if (environment.enableLogging) {
      console.groupEnd();
    }
  }

  /**
   * Table log - pre zobrazenie dát v tabuľke
   */
  table(data: any): void {
    if (environment.enableLogging) {
      console.table(data);
    }
  }
}
