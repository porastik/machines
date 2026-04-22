import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '../core/services/supabase.service';
import { MaintenanceChecklist, ChecklistItem } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ChecklistService {
  private supabase = inject(SupabaseService);

  /**
   * Get all active checklists (optional: filter by device type)
   */
  async getChecklists(deviceType?: string): Promise<MaintenanceChecklist[]> {
    const tokenData = localStorage.getItem('supabase.auth.token');
    let accessToken = null;
    if (tokenData) {
      const parsed = JSON.parse(tokenData);
      accessToken = parsed.access_token;
    }

    let url = 'https://mplehgphscavhyxebzvo.supabase.co/rest/v1/maintenance_checklists?is_active=eq.true&order=device_type.asc,name.asc';
    if (deviceType) {
      url += `&device_type=eq.${deviceType}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wbGVoZ3Boc2Nhdmh5eGVienZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4NDIzMTksImV4cCI6MjA4MzQxODMxOX0.v-IcZBn3BbYFoUWMoZppKGVtr31FvYNmVJeSz0Klhlw',
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      const data = await response.json();
      console.error('Error fetching checklists:', data);
      throw new Error(data.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data as MaintenanceChecklist[];
  }

  /**
   * Get checklist with all its items
   */
  async getChecklistWithItems(checklistId: string): Promise<MaintenanceChecklist | null> {
    const tokenData = localStorage.getItem('supabase.auth.token');
    let accessToken = null;
    if (tokenData) {
      const parsed = JSON.parse(tokenData);
      accessToken = parsed.access_token;
    }

    // Get checklist
    const checklistResponse = await fetch(`https://mplehgphscavhyxebzvo.supabase.co/rest/v1/maintenance_checklists?id=eq.${checklistId}`, {
      method: 'GET',
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wbGVoZ3Boc2Nhdmh5eGVienZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4NDIzMTksImV4cCI6MjA4MzQxODMxOX0.v-IcZBn3BbYFoUWMoZppKGVtr31FvYNmVJeSz0Klhlw',
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!checklistResponse.ok) {
      console.error('Error fetching checklist');
      return null;
    }

    const checklistData = await checklistResponse.json();
    const checklist = Array.isArray(checklistData) ? checklistData[0] : checklistData;

    if (!checklist) {
      return null;
    }

    // Get checklist items
    const itemsResponse = await fetch(`https://mplehgphscavhyxebzvo.supabase.co/rest/v1/checklist_items?checklist_id=eq.${checklistId}&order=order_index.asc`, {
      method: 'GET',
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wbGVoZ3Boc2Nhdmh5eGVienZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4NDIzMTksImV4cCI6MjA4MzQxODMxOX0.v-IcZBn3BbYFoUWMoZppKGVtr31FvYNmVJeSz0Klhlw',
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const items = itemsResponse.ok ? await itemsResponse.json() : [];

    const result: MaintenanceChecklist = {
      ...(checklist as MaintenanceChecklist),
      items: items as ChecklistItem[]
    };

    return result;
  }

  /**
   * ADMIN: Get all checklists (including inactive)
   */
  async getAllChecklists(): Promise<MaintenanceChecklist[]> {
    console.log('Loading all checklists...');
    const tokenData = localStorage.getItem('supabase.auth.token');
    let accessToken = null;
    if (tokenData) {
      const parsed = JSON.parse(tokenData);
      accessToken = parsed.access_token;
    }

    const response = await fetch('https://mplehgphscavhyxebzvo.supabase.co/rest/v1/maintenance_checklists?order=device_type.asc,name.asc', {
      method: 'GET',
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wbGVoZ3Boc2Nhdmh5eGVienZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4NDIzMTksImV4cCI6MjA4MzQxODMxOX0.v-IcZBn3BbYFoUWMoZppKGVtr31FvYNmVJeSz0Klhlw',
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      const data = await response.json();
      console.error('Error fetching all checklists:', data);
      throw new Error(data.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log('Loaded checklists:', data.length, 'items');
    return data as MaintenanceChecklist[];
  }

  /**
   * ADMIN: Create new checklist
   */
  async createChecklist(checklist: any): Promise<MaintenanceChecklist> {
    console.log('Creating checklist with data:', checklist);
    
    // Get auth token from localStorage
    const tokenData = localStorage.getItem('supabase.auth.token');
    let accessToken = null;
    
    if (tokenData) {
      try {
        const parsed = JSON.parse(tokenData);
        accessToken = parsed.access_token;
        console.log('Found access token:', accessToken ? 'YES' : 'NO');
      } catch (e) {
        console.error('Error parsing token:', e);
      }
    } else {
      console.error('No auth token found in localStorage');
    }
    
    // Try direct REST API approach (like in login)
    try {
      console.log('Starting insert operation via REST API...');
      
      const response = await fetch('https://mplehgphscavhyxebzvo.supabase.co/rest/v1/maintenance_checklists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wbGVoZ3Boc2Nhdmh5eGVienZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4NDIzMTksImV4cCI6MjA4MzQxODMxOX0.v-IcZBn3BbYFoUWMoZppKGVtr31FvYNmVJeSz0Klhlw',
          'Authorization': `Bearer ${accessToken}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(checklist)
      });
      
      console.log('REST API response status:', response.status);
      const data = await response.json();
      console.log('REST API response data:', data);
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}: ${JSON.stringify(data)}`);
      }
      
      // Response is an array, get first item
      const result = Array.isArray(data) ? data[0] : data;
      console.log('Checklist created successfully:', result);
      return result as MaintenanceChecklist;
      
    } catch (err) {
      console.error('Exception in createChecklist:', err);
      throw err;
    }
  }

  /**
   * ADMIN: Update checklist
   */
  async updateChecklist(id: string, updates: Partial<MaintenanceChecklist>): Promise<void> {
    const tokenData = localStorage.getItem('supabase.auth.token');
    let accessToken = null;
    if (tokenData) {
      const parsed = JSON.parse(tokenData);
      accessToken = parsed.access_token;
    }

    const response = await fetch(`https://mplehgphscavhyxebzvo.supabase.co/rest/v1/maintenance_checklists?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wbGVoZ3Boc2Nhdmh5eGVienZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4NDIzMTksImV4cCI6MjA4MzQxODMxOX0.v-IcZBn3BbYFoUWMoZppKGVtr31FvYNmVJeSz0Klhlw',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || `HTTP ${response.status}`);
    }
  }

  /**
   * ADMIN: Delete checklist (will cascade delete items)
   */
  async deleteChecklist(id: string): Promise<void> {
    const tokenData = localStorage.getItem('supabase.auth.token');
    let accessToken = null;
    if (tokenData) {
      const parsed = JSON.parse(tokenData);
      accessToken = parsed.access_token;
    }

    const response = await fetch(`https://mplehgphscavhyxebzvo.supabase.co/rest/v1/maintenance_checklists?id=eq.${id}`, {
      method: 'DELETE',
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wbGVoZ3Boc2Nhdmh5eGVienZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4NDIzMTksImV4cCI6MjA4MzQxODMxOX0.v-IcZBn3BbYFoUWMoZppKGVtr31FvYNmVJeSz0Klhlw',
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || `HTTP ${response.status}`);
    }
  }

  /**
   * ADMIN: Add item to checklist
   */
  async addChecklistItem(item: Partial<ChecklistItem>): Promise<ChecklistItem> {
    const tokenData = localStorage.getItem('supabase.auth.token');
    let accessToken = null;
    if (tokenData) {
      const parsed = JSON.parse(tokenData);
      accessToken = parsed.access_token;
    }

    const response = await fetch('https://mplehgphscavhyxebzvo.supabase.co/rest/v1/checklist_items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wbGVoZ3Boc2Nhdmh5eGVienZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4NDIzMTksImV4cCI6MjA4MzQxODMxOX0.v-IcZBn3BbYFoUWMoZppKGVtr31FvYNmVJeSz0Klhlw',
        'Authorization': `Bearer ${accessToken}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(item)
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return (Array.isArray(data) ? data[0] : data) as ChecklistItem;
  }

  /**
   * ADMIN: Update checklist item
   */
  async updateChecklistItem(id: string, updates: Partial<ChecklistItem>): Promise<void> {
    const tokenData = localStorage.getItem('supabase.auth.token');
    let accessToken = null;
    if (tokenData) {
      const parsed = JSON.parse(tokenData);
      accessToken = parsed.access_token;
    }

    const response = await fetch(`https://mplehgphscavhyxebzvo.supabase.co/rest/v1/checklist_items?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wbGVoZ3Boc2Nhdmh5eGVienZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4NDIzMTksImV4cCI6MjA4MzQxODMxOX0.v-IcZBn3BbYFoUWMoZppKGVtr31FvYNmVJeSz0Klhlw',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || `HTTP ${response.status}`);
    }
  }

  /**
   * ADMIN: Delete checklist item
   */
  async deleteChecklistItem(id: string): Promise<void> {
    const tokenData = localStorage.getItem('supabase.auth.token');
    let accessToken = null;
    if (tokenData) {
      const parsed = JSON.parse(tokenData);
      accessToken = parsed.access_token;
    }

    const response = await fetch(`https://mplehgphscavhyxebzvo.supabase.co/rest/v1/checklist_items?id=eq.${id}`, {
      method: 'DELETE',
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wbGVoZ3Boc2Nhdmh5eGVienZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4NDIzMTksImV4cCI6MjA4MzQxODMxOX0.v-IcZBn3BbYFoUWMoZppKGVtr31FvYNmVJeSz0Klhlw',
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || `HTTP ${response.status}`);
    }
  }
}
