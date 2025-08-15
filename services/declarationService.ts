import API_CONFIG from '../app/config/api';
import { CreateDeclarationData, Declaration, DeclarationType, Zone } from '../types/declaration';

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
        id_declaration_type: data.id_declaration_type,
        severite: data.severite,
        id_zone: data.id_zone,
        description: data.description,
      }),
    });

    // If there are photos, upload them
    if (data.photos && data.photos.length > 0) {
      const declarationId = response.declarationId || response.id;
      if (declarationId) {
        try {
          const formData = new FormData();
          data.photos.forEach((photo, index) => {
            formData.append('photos', {
              uri: photo.uri,
              type: photo.type,
              name: photo.name,
            } as any);
          });

          await this.uploadPhotos(declarationId, formData, token);
        } catch (error) {
          console.error('Failed to upload photos:', error);
          // Don't fail the entire creation if photo upload fails
        }
      }
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
    
    const response = await fetch(`${this.baseUrl}/declarations/${declarationId}/photos`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: photos,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }

    return response.json();
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
}

export default new DeclarationService();
