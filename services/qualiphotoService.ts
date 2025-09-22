import API_CONFIG from '@/app/config/api';

export type QualiPhotoItem = {
  id: string;
  id_project: string;
  id_zone: string;
  photo: string;
  commentaire: string | null;
  date_taken: string | null;
  voice_note: string | null;
  project_title?: string;
  zone_title?: string;
  latitude: number | null;
  longitude: number | null;
  id_qualiphoto_parent?: string | null;
  before?: number;
  after?: number;
  id_user?: string;
  user_name?: string;
  user_lastname?: string;
};

export type QualiPhotoListResponse = {
  items: QualiPhotoItem[];
  page: number;
  limit: number;
  total: number;
};

export type QualiProject = {
  id: string;
  title: string;
};

export type QualiZone = {
  id: string;
  title: string;
  code?: string;
  logo?: string | null;
};

type CreateQualiPhotoPayload = {
  id_project?: string;
  id_zone: string;
  commentaire?: string;
  date_taken?: string;
  photo: { uri: string; name: string; type: string };
  voice_note?: { uri: string; name: string; type: string };
  latitude?: number;
  longitude?: number;
  id_qualiphoto_parent?: string;
};

class QualiPhotoService {
  private baseUrl = API_CONFIG.BASE_URL;

  private async makeRequest<T>(endpoint: string, token: string, options: RequestInit = {}): Promise<T> {
    if (!token) throw new Error('Authentication token required');
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || 'Request failed');
    return data as T;
  }

  async list(params: { id_project?: string; id_zone?: string; page?: number; limit?: number }, token: string): Promise<QualiPhotoListResponse> {
    const url = new URL(`${this.baseUrl}/qualiphoto`);
    if (params.id_project) url.searchParams.set('id_project', params.id_project);
    if (params.id_zone) url.searchParams.set('id_zone', params.id_zone);
    url.searchParams.set('page', String(params.page ?? 1));
    url.searchParams.set('limit', String(params.limit ?? 30));
    return this.makeRequest<QualiPhotoListResponse>(url.toString().replace(this.baseUrl, ''), token);
  }

  async getChildren(parentId: string, token: string, sort: 'asc' | 'desc' = 'desc'): Promise<QualiPhotoItem[]> {
    const url = new URL(`${this.baseUrl}/qualiphoto`);
    url.searchParams.set('id_qualiphoto_parent', parentId);
    url.searchParams.set('sort', sort);
    url.searchParams.set('limit', '100'); // Get all children for now
    const response = await this.makeRequest<QualiPhotoListResponse>(url.toString().replace(this.baseUrl, ''), token);
    return response.items;
  }

  async getProjects(token: string): Promise<QualiProject[]> {
    // Reuse existing backend endpoint for company projects
    return this.makeRequest<QualiProject[]>(`/company-projects`, token, { method: 'GET' });
  }

  async getZonesByProject(projectId: string, token: string): Promise<QualiZone[]> {
    return this.makeRequest<QualiZone[]>(`/projects/${projectId}/zones`, token, { method: 'GET' });
  }

  async checkIfExists(projectId: string, zoneId: string, token: string): Promise<{ exists: boolean }> {
    const endpoint = `/qualiphoto/exists?id_project=${encodeURIComponent(projectId)}&id_zone=${encodeURIComponent(zoneId)}`;
    return this.makeRequest<{ exists: boolean }>(endpoint, token, { method: 'GET' });
  }

  async updateCommentaire2(id: string, commentaire2: string, token: string): Promise<{ success: boolean }> {
    return this.makeRequest<{ success: boolean }>(`/qualiphoto/${id}`, token, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commentaire2 }),
    });
  }

  async create(payload: CreateQualiPhotoPayload, token: string): Promise<Partial<QualiPhotoItem>> {
    const formData = new FormData();
    if (payload.id_project) formData.append('id_project', payload.id_project);
    formData.append('id_zone', payload.id_zone);
    if (payload.commentaire) formData.append('commentaire', payload.commentaire);
    if (payload.date_taken) formData.append('date_taken', payload.date_taken);
    if (payload.latitude) formData.append('latitude', String(payload.latitude));
    if (payload.longitude) formData.append('longitude', String(payload.longitude));
    if (payload.id_qualiphoto_parent) formData.append('id_qualiphoto_parent', payload.id_qualiphoto_parent);

    formData.append('photo', {
      uri: payload.photo.uri,
      name: payload.photo.name,
      type: payload.photo.type,
    } as any);

    if (payload.voice_note) {
      formData.append('voice_note', {
        uri: payload.voice_note.uri,
        name: payload.voice_note.name,
        type: payload.voice_note.type,
      } as any);
    }

    const res = await fetch(`${API_CONFIG.BASE_URL}/qualiphoto`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || 'Failed to create QualiPhoto');
    return data;
  }
}

export default new QualiPhotoService();


