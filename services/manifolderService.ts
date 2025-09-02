import API_CONFIG from '@/app/config/api';
import { Project, Zone } from '@/types/declaration';
import { CreateManifolderData, ManifolderListItem, ManifolderType } from '@/types/manifolder';

class ManifolderService {
  private baseUrl = API_CONFIG.BASE_URL;

  private async request<T>(endpoint: string, token: string, options: RequestInit = {}): Promise<T> {
    if (!token) throw new Error('Authentication token required');
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });
    if (!response.ok) {
      let msg = 'Request failed';
      try { const j = await response.json(); msg = j.error || msg; } catch {}
      throw new Error(msg);
    }
    return response.json();
  }

  // Dropdown data
  getCompanyProjects(token: string): Promise<Project[]> {
    return this.request<Project[]>('/company-projects', token);
  }

  getZones(token: string): Promise<Zone[]> {
    return this.request<Zone[]>('/zones', token);
  }

  getManifolderTypes(token: string): Promise<ManifolderType[]> {
    return this.request<ManifolderType[]>('/manifolder-types', token);
  }

  // Create manifolder
  createManifolder(payload: CreateManifolderData, token: string): Promise<{ message: string; manifolderId: string | null; id_code: string; code_formatted: string; }> {
    return this.request('/manifolders', token, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // List (not required to show now, but useful later)
  getManifolders(params: { id_project?: string; id_zone?: string }, token: string): Promise<ManifolderListItem[]> {
    const search = new URLSearchParams();
    if (params.id_project) search.append('id_project', params.id_project);
    if (params.id_zone) search.append('id_zone', params.id_zone);
    const q = search.toString();
    return this.request<ManifolderListItem[]>(`/manifolders${q ? `?${q}` : ''}`, token);
  }
}

export default new ManifolderService();


