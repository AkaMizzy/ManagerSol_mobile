import API_CONFIG from '../app/config/api';
import { CreateActionData, CreateDeclarationData, Declaration, DeclarationAction, DeclarationType, Zone } from '../types/declaration';

class DeclarationService {
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



  // Declaration Types
  async getDeclarationTypes(token: string): Promise<DeclarationType[]> {
    return this.makeRequest('/declaration-types', token);
  }

  // Declarations
  async getDeclarations(token: string): Promise<Declaration[]> {
    return this.makeRequest('/declarations', token);
  }

  async getDeclarationById(id: string, token: string): Promise<Declaration> {
    return this.makeRequest(`/declarations/${id}`, token);
  }

  async createDeclaration(data: CreateDeclarationData, token: string): Promise<{ message: string; declarationId: string }> {
    // First create the declaration
    const response = await this.makeRequest('/declarations', token, {
      method: 'POST',
      body: JSON.stringify({
        title: (data as any).title,
        id_declaration_type: data.id_declaration_type,
        severite: data.severite,
        id_zone: data.id_zone,
        description: data.description,
      }),
    });

    console.log('🔍 Declaration created, response:', response);

    // If there are photos, upload them
    if (data.photos && data.photos.length > 0) {
      const declarationId = response.declarationId;
      console.log('🔍 Photos to upload:', data.photos.length, 'for declaration:', declarationId);
      
      if (declarationId) {
        try {
          const formData = new FormData();
          data.photos.forEach((photo, index) => {
            console.log('🔍 Adding photo to FormData:', photo.name, photo.type);
            formData.append('photos', {
              uri: photo.uri,
              type: photo.type,
              name: photo.name,
            } as any);
          });

          console.log('🔍 Uploading photos to backend...');
          const uploadResult = await this.uploadPhotos(declarationId, formData, token);
          console.log('✅ Photos uploaded successfully:', uploadResult);
        } catch (error) {
          console.error('❌ Failed to upload photos:', error);
          // Don't fail the entire creation if photo upload fails
        }
      } else {
        console.error('❌ No declarationId received from backend');
      }
    } else {
      console.log('🔍 No photos to upload');
    }

    return response;
  }

  async updateDeclaration(id: string, data: Partial<CreateDeclarationData>, token: string): Promise<{ message: string }> {
    return this.makeRequest(`/declarations/${id}`, token, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteDeclaration(id: string, token: string): Promise<{ message: string }> {
    return this.makeRequest(`/declarations/${id}`, token, {
      method: 'DELETE',
    });
  }

  // Photos
  async uploadPhotos(declarationId: string, photos: FormData, token: string): Promise<{ message: string; count: number }> {
    if (!token) {
      throw new Error('Authentication token required');
    }
    
    console.log('🔍 Uploading photos to:', `${this.baseUrl}/declarations/${declarationId}/photos`);
    console.log('🔍 FormData contents:', photos);
    
    const response = await fetch(`${this.baseUrl}/declarations/${declarationId}/photos`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: photos,
    });

    console.log('🔍 Upload response status:', response.status);
    console.log('🔍 Upload response headers:', response.headers);

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Upload failed:', error);
      throw new Error(error.error || 'Upload failed');
    }

    const result = await response.json();
    console.log('✅ Upload successful:', result);
    return result;
  }

  async deletePhoto(declarationId: string, photoId: string, token: string): Promise<{ message: string }> {
    return this.makeRequest(`/declarations/${declarationId}/photos/${photoId}`, token, {
      method: 'DELETE',
    });
  }

  // Chat Messages
  async getChatMessages(declarationId: string, token: string): Promise<any[]> {
    return this.makeRequest(`/declarations/${declarationId}/chats`, token);
  }

  async addChatMessage(declarationId: string, data: { title?: string; description: string; photo?: { uri: string; type: string; name: string } }, token: string): Promise<{ message: string; chatId: string }> {
    if (data.photo) {
      // If there's a photo, we need to upload it using FormData
      const formData = new FormData();
      formData.append('title', data.title || '');
      formData.append('description', data.description);
      formData.append('photo', {
        uri: data.photo.uri,
        type: data.photo.type,
        name: data.photo.name,
      } as any);

      const response = await fetch(`${this.baseUrl}/declarations/${declarationId}/chats`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add chat message');
      }

      return response.json();
    } else {
      // No photo, use regular JSON request
      return this.makeRequest(`/declarations/${declarationId}/chats`, token, {
        method: 'POST',
        body: JSON.stringify({
          title: data.title,
          description: data.description,
        }),
      });
    }
  }

  async deleteChatMessage(declarationId: string, chatId: string, token: string): Promise<{ message: string }> {
    return this.makeRequest(`/declarations/${declarationId}/chats/${chatId}`, token, {
      method: 'DELETE',
    });
  }

  // Zones (for declaration creation)
  async getZones(token: string): Promise<Zone[]> {
    return this.makeRequest('/zones', token);
  }

  // Actions
  async getActions(declarationId: string, token: string): Promise<DeclarationAction[]> {
    return this.makeRequest(`/declarations/${declarationId}/actions`, token);
  }

  async createAction(declarationId: string, data: CreateActionData, token: string): Promise<{ message: string }> {
    if (data.photo) {
      const form = new FormData();
      if (data.title) form.append('title', data.title);
      if (data.description) form.append('description', data.description);
      if (data.status !== undefined) form.append('status', String(data.status));
      if (data.date_planification) form.append('date_planification', data.date_planification);
      if (data.date_execution) form.append('date_execution', data.date_execution);
      if (data.sort_order !== undefined) form.append('sort_order', String(data.sort_order));
      if (data.assigned_to) form.append('assigned_to', data.assigned_to);
      if (data.id_zone) form.append('id_zone', data.id_zone);
      form.append('photo', {
        uri: data.photo.uri,
        type: data.photo.type,
        name: data.photo.name,
      } as any);

      const response = await fetch(`${this.baseUrl}/declarations/${declarationId}/actions`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: form,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create action');
      }
      return response.json();
    } else {
      return this.makeRequest(`/declarations/${declarationId}/actions`, token, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    }
  }

  async updateAction(declarationId: string, actionId: string, data: CreateActionData, token: string): Promise<{ message: string }> {
    if (data.photo) {
      const form = new FormData();
      if (data.title !== undefined) form.append('title', data.title || '');
      if (data.description !== undefined) form.append('description', data.description || '');
      if (data.status !== undefined) form.append('status', String(data.status));
      if (data.date_planification !== undefined) form.append('date_planification', data.date_planification || '');
      if (data.date_execution !== undefined) form.append('date_execution', data.date_execution || '');
      if (data.sort_order !== undefined) form.append('sort_order', String(data.sort_order));
      if (data.assigned_to !== undefined) form.append('assigned_to', data.assigned_to || '');
      if (data.id_zone) form.append('id_zone', data.id_zone);
      form.append('photo', {
        uri: data.photo.uri,
        type: data.photo.type,
        name: data.photo.name,
      } as any);

      const response = await fetch(`${this.baseUrl}/declarations/${declarationId}/actions/${actionId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: form,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update action');
      }
      return response.json();
    } else {
      return this.makeRequest(`/declarations/${declarationId}/actions/${actionId}`, token, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    }
  }

  // Get actions created by the current user
  async getMyActions(token: string): Promise<DeclarationAction[]> {
    return this.makeRequest('/my-actions', token, {
      method: 'GET',
    });
  }

  // Get actions assigned to the current user
  async getAssignedActions(token: string): Promise<DeclarationAction[]> {
    return this.makeRequest('/assigned-actions', token, {
      method: 'GET',
    });
  }
}

export default new DeclarationService();
