import API_CONFIG from '@/app/config/api';

export interface CalendarEvent {
  id: string;
  context: string;
  title: string;
  description?: string;
  date: string;
  heur_debut?: string;
  heur_fin?: string;
  module?: string;
  function?: string;
  id_user: string;
  id_company: string;
  created_at: string;
  updated_at: string;
  firstname?: string;
  lastname?: string;
}

export interface CreateEventData {
  context: string;
  title: string;
  description: string;
  date: string;
  heur_debut?: string;
  heur_fin?: string;
  module?: string;
  function?: string;
}

export interface CalendarFilters {
  date?: string;
  start_date?: string;
  end_date?: string;
  context?: string;
}

class CalendarService {
  private baseUrl = API_CONFIG.BASE_URL;

  private async makeRequest(
    endpoint: string,
    token: string,
    options: RequestInit = {}
  ): Promise<any> {
    if (!token) {
      throw new Error('Authentication token required');
    }

    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  // Get all calendar events
  async getEvents(token: string, filters?: CalendarFilters): Promise<CalendarEvent[]> {
    const params = new URLSearchParams();
    
    if (filters?.date) params.append('date', filters.date);
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);
    if (filters?.context) params.append('context', filters.context);

    const queryString = params.toString();
    const endpoint = `/calendar${queryString ? `?${queryString}` : ''}`;

    return this.makeRequest(endpoint, token);
  }

  // Get single event by ID
  async getEvent(token: string, eventId: string): Promise<CalendarEvent> {
    return this.makeRequest(`/calendar/${eventId}`, token);
  }

  // Create new event
  async createEvent(token: string, eventData: CreateEventData): Promise<{ message: string; event: CalendarEvent }> {
    return this.makeRequest('/calendar', token, {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  }

  // Update event
  async updateEvent(token: string, eventId: string, eventData: Partial<CreateEventData>): Promise<{ message: string }> {
    return this.makeRequest(`/calendar/${eventId}`, token, {
      method: 'PUT',
      body: JSON.stringify(eventData),
    });
  }

  // Delete event
  async deleteEvent(token: string, eventId: string): Promise<{ message: string }> {
    return this.makeRequest(`/calendar/${eventId}`, token, {
      method: 'DELETE',
    });
  }

  // Get available contexts
  async getContexts(): Promise<{ value: string; label: string; icon: string }[]> {
    // This endpoint doesn't require authentication
    const url = `${this.baseUrl}/calendar-contexts`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('Failed to fetch contexts:', error);
      throw error;
    }
  }
}

export default new CalendarService();
