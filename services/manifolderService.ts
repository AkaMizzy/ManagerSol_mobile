import API_CONFIG from '@/app/config/api';
import { Project, Zone } from '@/types/declaration';
import { CreateManifolderData, ManifolderAnswer, ManifolderAnswerWithDetails, ManifolderListItem, ManifolderQuestionsResponse, ManifolderType } from '@/types/manifolder';

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

  // Get single manifolder by ID
  getManifolderById(manifolderId: string, token: string): Promise<ManifolderListItem> {
    return this.request<ManifolderListItem>(`/manifolders/${manifolderId}`, token);
  }

  // Question-related methods for manifolder detail workflow
  getManifolderQuestions(manifolderId: string, token: string): Promise<ManifolderQuestionsResponse> {
    return this.request(`/manifolder-details/questions/${manifolderId}`, token);
  }

  submitManifolderAnswers(payload: { manifolderId: string; answers: ManifolderAnswer[]; }, token: string): Promise<{ message: string; manifolderId: string; answersProcessed: number; }> {
    return this.request('/manifolder-details/answers', token, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  submitSingleAnswer(payload: { 
    manifolderId: string; 
    questionId: string; 
    value?: any; 
    latitude?: number; 
    longitude?: number; 
    quantity?: number; 
    zoneId: string; 
    status?: number; 
  }, token: string): Promise<{ message: string; manifolderId: string; questionId: string; answerId: string; }> {
    return this.request('/manifolder-details/answer', token, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  getManifolderAnswers(manifolderId: string, token: string): Promise<{ manifolderId: string; answers: ManifolderAnswerWithDetails[]; }> {
    return this.request(`/manifolder-details/answers/${manifolderId}`, token);
  }

  updateManifolderAnswer(answerId: string, payload: { value?: any; latitude?: number; longitude?: number; quantity?: number; }, token: string): Promise<{ message: string; answerId: string; }> {
    return this.request(`/manifolder-details/answers/${answerId}`, token, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  deleteManifolderAnswer(answerId: string, token: string): Promise<{ message: string; answerId: string; }> {
    return this.request(`/manifolder-details/answers/${answerId}`, token, {
      method: 'DELETE',
    });
  }

  // File upload method for manifolder questions
  async uploadManifolderFile(manifolderId: string, questionId: string, file: File | { uri: string; name: string; type: string }, token: string, zoneId: string): Promise<{ message: string; file: any; }> {
    if (!token) throw new Error('Authentication token required');
    
    const formData = new FormData();
    formData.append('manifolderId', manifolderId);
    formData.append('questionId', questionId);
    formData.append('zoneId', zoneId);
    
    // Handle both web File objects and React Native file objects
    if ('uri' in file) {
      // React Native file object
      formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.type,
      } as any);
    } else {
      // Web File object
      formData.append('file', file);
    }

    const response = await fetch(`${this.baseUrl}/manifolder-details/upload-file`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Don't set Content-Type header for FormData, let the browser set it
      },
      body: formData,
    });

    if (!response.ok) {
      let msg = 'File upload failed';
      try { 
        const j = await response.json(); 
        msg = j.error || msg; 
      } catch {}
      throw new Error(msg);
    }

    return response.json();
  }

  // Get file URL for serving uploaded files
  getFileUrl(filename: string): string {
    return `${this.baseUrl}/manifolder-details/file/${filename}`;
  }

  // Signature-related methods
  saveSignature(payload: {
    id_manifolder: string;
    signature_role: 'technicien' | 'control' | 'admin';
    signature: string;
    signer_email: string;
  }, token: string): Promise<{ message: string; signatureId: string; signature_role: string; signer_email: string; date_sign: string; }> {
    return this.request('/manifolder-signatures', token, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  getManifolderSignatures(manifolderId: string, token: string): Promise<{
    manifolderId: string;
    signatures: {
      technicien?: { id: string; email: string; date: string; createdAt: string; updatedAt: string; };
      control?: { id: string; email: string; date: string; createdAt: string; updatedAt: string; };
      admin?: { id: string; email: string; date: string; createdAt: string; updatedAt: string; };
    };
    signatureList: Array<{ id: string; role: string; email: string; date: string; createdAt: string; updatedAt: string; }>;
    totalSignatures: number;
    isComplete: boolean;
  }> {
    return this.request(`/manifolder-signatures/${manifolderId}`, token);
  }

  getSignatureStatus(manifolderId: string, token: string): Promise<{
    manifolderId: string;
    signatureStatus: string;
    signatureCount: number;
    isComplete: boolean;
    remainingSignatures: number;
  }> {
    return this.request(`/manifolder-signatures/status/${manifolderId}`, token);
  }
}

export default new ManifolderService();


