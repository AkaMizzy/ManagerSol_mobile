import API_CONFIG from '@/app/config/api';

export type QualiPhotoItem = {
  id: string;
  id_project: string;
  id_zone: string;
  photo: string;
  photo_comp?: string | null;
  title: string | null;
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

export type Comment = {
  id: string;
  commentaire_text: string;
  created_at: string;
  user_name?: string;
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
  title?: string;
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

  private toAbsoluteUrl(path: string | null | undefined): string | null {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    return `${this.baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  }

  private normalizeQualiPhotoItem(item: Partial<QualiPhotoItem>): Partial<QualiPhotoItem> {
    return {
      ...item,
      photo: this.toAbsoluteUrl(item.photo) ?? '',
      photo_comp: this.toAbsoluteUrl(item.photo_comp ?? null),
      voice_note: this.toAbsoluteUrl(item.voice_note),
    };
  }

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
    const response = await this.makeRequest<QualiPhotoListResponse>(url.toString().replace(this.baseUrl, ''), token);
    return {
      ...response,
      items: response.items.map(item => this.normalizeQualiPhotoItem(item) as QualiPhotoItem),
    };
  }

  async getChildren(parentId: string, token: string, sort: 'asc' | 'desc' = 'desc'): Promise<QualiPhotoItem[]> {
    const url = new URL(`${this.baseUrl}/qualiphoto`);
    url.searchParams.set('id_qualiphoto_parent', parentId);
    url.searchParams.set('sort', sort);
    url.searchParams.set('limit', '100'); // Get all children for now
    const response = await this.makeRequest<QualiPhotoListResponse>(url.toString().replace(this.baseUrl, ''), token);
    return response.items.map(item => this.normalizeQualiPhotoItem(item) as QualiPhotoItem);
  }

  async getProjects(token: string): Promise<QualiProject[]> {
    // Reuse existing backend endpoint for company projects
    return this.makeRequest<QualiProject[]>(`/company-projects`, token, { method: 'GET' });
  }

  async getZonesByProject(projectId: string, token: string): Promise<QualiZone[]> {
    const zones = await this.makeRequest<QualiZone[]>(`/projects/${projectId}/zones`, token, { method: 'GET' });
    return zones.map(zone => ({
      ...zone,
      logo: this.toAbsoluteUrl(zone.logo),
    }));
  }

  async checkIfExists(projectId: string, zoneId: string, token: string): Promise<{ exists: boolean }> {
    const endpoint = `/qualiphoto/exists?id_project=${encodeURIComponent(projectId)}&id_zone=${encodeURIComponent(zoneId)}`;
    return this.makeRequest<{ exists: boolean }>(endpoint, token, { method: 'GET' });
  }

  async getComments(qualiphotoId: string, token: string): Promise<Comment[]> {
    return this.makeRequest<Comment[]>(`/qualiphoto/${qualiphotoId}/comments`, token, { method: 'GET' });
  }

  async addComment(qualiphotoId: string, commentaire_text: string, token: string): Promise<{ success: boolean }> {
    return this.makeRequest<{ success: boolean }>(`/qualiphoto/${qualiphotoId}/comments`, token, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commentaire_text }),
    });
  }

  async generatePdf(qualiphotoId: string, token: string): Promise<{ fileUrl: string; filename: string }> {
    return this.makeRequest<{ fileUrl: string; filename: string }>(`/qualiphoto/generate-pdf/${qualiphotoId}`, token, {
      method: 'GET',
    });
  }

  async transcribeVoiceNote(voiceNote: { uri: string; name: string; type: string }, token: string): Promise<{ transcription: string }> {
    const formData = new FormData();
    formData.append('voice_note', {
      uri: voiceNote.uri,
      name: voiceNote.name,
      type: voiceNote.type,
    } as any);

    const res = await fetch(`${API_CONFIG.BASE_URL}/qualiphoto/transcribe`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        // 'Content-Type': 'multipart/form-data' is automatically set by fetch with FormData
      },
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error || 'Failed to transcribe voice note');
    }
    return data;
  }

  async create(payload: CreateQualiPhotoPayload, token: string): Promise<Partial<QualiPhotoItem>> {
    const formData = new FormData();
    if (payload.id_project) formData.append('id_project', payload.id_project);
    formData.append('id_zone', payload.id_zone);
    if (payload.title) formData.append('title', payload.title);
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
    return this.normalizeQualiPhotoItem(data);
  }

  async createComplementaire(params: { id_qualiphoto_parent: string; photo: { uri: string; name: string; type: string }; voice_note?: { uri: string; name: string; type: string }; commentaire?: string }, token: string): Promise<Partial<QualiPhotoItem>> {
    const formData = new FormData();
    formData.append('id_qualiphoto_parent', params.id_qualiphoto_parent);
    formData.append('photo', {
      uri: params.photo.uri,
      name: params.photo.name,
      type: params.photo.type,
    } as any);
    if (params.commentaire) {
      formData.append('commentaire', params.commentaire);
    }
    if (params.voice_note) {
      formData.append('voice_note', {
        uri: params.voice_note.uri,
        name: params.voice_note.name,
        type: params.voice_note.type,
      } as any);
    }

    const res = await fetch(`${API_CONFIG.BASE_URL}/qualiphoto/complementaire`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || 'Failed to create complementary QualiPhoto');
    return this.normalizeQualiPhotoItem(data);
  }
}

export default new QualiPhotoService();


