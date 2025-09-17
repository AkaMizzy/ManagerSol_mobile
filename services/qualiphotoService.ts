import API_CONFIG from '@/app/config/api';

export type QualiPhotoItem = {
  id: string;
  id_project: string;
  id_zone: string;
  photo: string;
  commentaire?: string | null;
  date_taken?: string | null;
  project_title?: string;
  zone_title?: string;
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
    const url = new URL(`${this.baseUrl}/api/qualiphoto`);
    if (params.id_project) url.searchParams.set('id_project', params.id_project);
    if (params.id_zone) url.searchParams.set('id_zone', params.id_zone);
    url.searchParams.set('page', String(params.page ?? 1));
    url.searchParams.set('limit', String(params.limit ?? 30));
    return this.makeRequest<QualiPhotoListResponse>(url.toString().replace(this.baseUrl, ''), token);
  }

  async getProjects(token: string): Promise<QualiProject[]> {
    // Reuse existing backend endpoint for company projects
    return this.makeRequest<QualiProject[]>(`/company-projects`, token, { method: 'GET' });
  }

  async getZonesByProject(projectId: string, token: string): Promise<QualiZone[]> {
    return this.makeRequest<QualiZone[]>(`/api/projects/${projectId}/zones`, token, { method: 'GET' });
  }

  async create(params: { id_project?: string; id_zone: string; commentaire?: string; date_taken?: string; photo: { uri: string; name: string; type: string } }, token: string): Promise<any> {
    const form = new FormData();
    if (params.id_project) form.append('id_project', params.id_project);
    form.append('id_zone', params.id_zone);
    if (params.commentaire) form.append('commentaire', params.commentaire);
    if (params.date_taken) form.append('date_taken', params.date_taken);
    form.append('photo', params.photo as any);

    const res = await fetch(`${this.baseUrl}/api/qualiphoto`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || 'Failed to create QualiPhoto');
    return data;
  }
}

export default new QualiPhotoService();


