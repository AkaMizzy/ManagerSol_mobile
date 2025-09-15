import API_CONFIG from '../app/config/api';

export interface UserZone {
  id: string;
  id_user: string;
  id_zone: string | null;
  id_bloc: string | null;
  zone_title: string | null;
  zone_id: string | null;
  zone_logo?: string | null;
  zone_latitude?: number | null;
  zone_longitude?: number | null;
  bloc_title: string | null;
  bloc_id: string | null;
  created_at: string;
}

export interface InventaireDeclaration {
  id: string;
  title: string;
  created_at: string;
  declaration_type_title: string;
}

export interface InventaireZone {
  id: string;
  id_inventaire: string;
  id_zone: string | null;
  id_bloc: string | null;
  inventaire_title: string;
  zone_title: string | null;
  bloc_title: string | null;
  created_at: string;
}

export interface CreateInventaireData {
  id_zone?: string;
  id_bloc?: string;
  id_inventaire: string;
}

class InventaireService {
  private baseUrl = API_CONFIG.BASE_URL;

  private async makeRequest(endpoint: string, token: string, options: RequestInit = {}) {
    if (!token) {
      throw new Error('Authentication token required');
    }
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
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

  // Get zones linked to current user
  async getUserZones(token: string): Promise<UserZone[]> {
    return this.makeRequest('/api/inventaire/zones', token);
  }

  // Get inventaire-type declarations
  async getInventaireDeclarations(token: string): Promise<InventaireDeclaration[]> {
    return this.makeRequest('/api/inventaire/declarations', token);
  }

  // Create new inventaire_zone entry
  async createInventaireZone(data: CreateInventaireData, token: string): Promise<{ message: string; id: string }> {
    return this.makeRequest('/api/inventaire/create', token, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Get inventaire zones for current user
  async getUserInventaires(token: string): Promise<InventaireZone[]> {
    return this.makeRequest('/api/inventaire/user-inventaires', token);
  }
}

export default new InventaireService();
