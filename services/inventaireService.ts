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

// New type for per-zone fetch (includes declaration metadata)
export interface InventaireByZoneItem {
  id: string;
  id_inventaire: string;
  id_zone: string | null;
  id_bloc: string | null;
  inventaire_title: string;
  declaration_type_title: string;
  declaration_description: string | null;
  declaration_date: string | null;
  declaration_company_name: string | null;
  declaration_latitude: number | null;
  declaration_longitude: number | null;
  item_qte?: number | null;
  item_valider?: 0 | 1 | boolean | null;
  zone_title: string | null;
  bloc_title: string | null;
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
      let errorMsg = 'Request failed';
      try {
        const error = await response.json();
        errorMsg = error.error || errorMsg;
      } catch {}
      throw new Error(errorMsg);
    }

    if (response.status === 204) return null as any;
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

  // Get inventaires linked to a specific zone
  async getInventairesByZone(zoneId: string, token: string): Promise<InventaireByZoneItem[]> {
    return this.makeRequest(`/api/inventaire/by-zone/${zoneId}`, token);
  }

  // Save inventaire_zone_item (qte, valider)
  async saveInventaireZoneItem(params: { id_inventaire_zone: string; qte: number | null; valider: boolean }, token: string): Promise<{ message: string; qte: number | null; valider: boolean }> {
    return this.makeRequest('/api/inventaire/item/save', token, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }
}

export default new InventaireService();
