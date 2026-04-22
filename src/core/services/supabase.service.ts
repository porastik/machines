import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

export interface Database {
  public: {
    Tables: {
      devices: {
        Row: {
          id: string;
          name: string;
          type: string;
          location: string;
          status: 'operational' | 'maintenance' | 'offline';
          manual_url: string | null;
          last_maintenance: string | null;
          next_maintenance: string;
          downtime: number;
          last_status_change: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['devices']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['devices']['Insert']>;
      };
      spare_parts: {
        Row: {
          id: string;
          name: string;
          sku: string;
          quantity: number;
          location: string;
          supplier_id: string | null;
          current_price: number | null;
          currency: string | null;
          serial_number: string | null;
          batch_number: string | null;
          expiry_date: string | null;
          manufacturing_date: string | null;
          warranty_months: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['spare_parts']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['spare_parts']['Insert']>;
      };
      suppliers: {
        Row: {
          id: string;
          name: string;
          contact_person: string | null;
          email: string | null;
          phone: string | null;
          address: string | null;
          website: string | null;
          notes: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['suppliers']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['suppliers']['Insert']>;
      };
      part_price_history: {
        Row: {
          id: string;
          part_id: string;
          price: number;
          currency: string;
          supplier_id: string | null;
          effective_date: string;
          notes: string | null;
          changed_by: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['part_price_history']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['part_price_history']['Insert']>;
      };
      maintenance_logs: {
        Row: {
          id: string;
          device_id: string;
          device_name: string;
          date: string;
          technician: string;
          notes: string;
          type: 'scheduled' | 'emergency';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['maintenance_logs']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['maintenance_logs']['Insert']>;
      };
      users: {
        Row: {
          id: string;
          email: string;
          role: 'admin' | 'technician';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          role: 'admin' | 'technician';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
    };
  };
}

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private supabase: SupabaseClient<Database>;

  constructor() {
    this.supabase = createClient<Database>(
      environment.supabase.url,
      environment.supabase.anonKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storage: window.localStorage,
          storageKey: 'supabase.auth.token',
        },
      }
    );
  }

  /**
   * Získať Supabase klienta
   */
  getClient(): SupabaseClient<Database> {
    return this.supabase;
  }

  /**
   * Získať auth klienta
   */
  get auth() {
    return this.supabase.auth;
  }

  /**
   * Získať database klienta
   */
  get db() {
    return this.supabase;
  }

  /**
   * Získať storage klienta (pre upload súborov - manuály, fotky)
   */
  get storage() {
    return this.supabase.storage;
  }

  /**
   * Real-time subscriptions (pre live updates)
   */
  subscribeToTable<T extends keyof Database['public']['Tables']>(
    table: T,
    callback: (payload: any) => void
  ) {
    return this.supabase
      .channel(`public:${table}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: table },
        callback
      )
      .subscribe();
  }

  /**
   * Odpojenie od real-time канала
   */
  unsubscribe(subscription: any) {
    this.supabase.removeChannel(subscription);
  }
}
