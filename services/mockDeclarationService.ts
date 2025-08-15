import { Declaration, DeclarationType, Zone } from '@/types/declaration';

// Mock data for testing
const mockDeclarationTypes: DeclarationType[] = [
  { id: '1', title: 'Maintenance' },
  { id: '2', title: 'Incident' },
  { id: '3', title: 'Request' },
  { id: '4', title: 'Complaint' },
  { id: '5', title: 'Suggestion' },
];

const mockZones: Zone[] = [
  { id: '1', title: 'Zone A - Main Building', code: 'ZA' },
  { id: '2', title: 'Zone B - Parking Lot', code: 'ZB' },
  { id: '3', title: 'Zone C - Garden Area', code: 'ZC' },
  { id: '4', title: 'Zone D - Storage', code: 'ZD' },
];

const mockDeclarations: Declaration[] = [
  {
    id: '1',
    id_users: 'user1',
    id_declaration_type: '1',
    severite: 8,
    id_zone: '1',
    description: 'Urgent maintenance required for the main entrance door. The door is not closing properly and poses a security risk. Please fix this as soon as possible.',
    date_declaration: '2024-01-15T10:30:00Z',
    declaration_type_title: 'Maintenance',
    zone_title: 'Zone A - Main Building',
    photo_count: 2,
    chat_count: 3,
    photos: [
      {
        id: 'photo1',
        declaration_id: '1',
        photo: '/uploads/door-issue.jpg',
        uploaded_at: '2024-01-15T10:35:00Z',
      },
      {
        id: 'photo2',
        declaration_id: '1',
        photo: '/uploads/door-closeup.jpg',
        uploaded_at: '2024-01-15T10:36:00Z',
      },
    ],
    chats: [
      {
        id: 'chat1',
        id_user: 'user1',
        id_declaration: '1',
        date_chat: '2024-01-15T11:00:00Z',
        title: 'Update',
        description: 'Maintenance team has been notified. They will arrive within 2 hours.',
        photos: undefined,
        firstname: 'John',
        lastname: 'Doe',
      },
      {
        id: 'chat2',
        id_user: 'user2',
        id_declaration: '1',
        date_chat: '2024-01-15T11:30:00Z',
        title: 'Status',
        description: 'Technician is on the way. Estimated arrival time: 1 hour.',
        photos: undefined,
        firstname: 'Jane',
        lastname: 'Smith',
      },
    ],
  },
  {
    id: '2',
    id_users: 'user1',
    id_declaration_type: '2',
    severite: 5,
    id_zone: '2',
    description: 'Several parking spots are blocked by construction materials. This is causing inconvenience for employees and visitors.',
    date_declaration: '2024-01-14T14:20:00Z',
    declaration_type_title: 'Incident',
    zone_title: 'Zone B - Parking Lot',
    photo_count: 1,
    chat_count: 1,
    photos: [
      {
        id: 'photo3',
        declaration_id: '2',
        photo: '/uploads/parking-blocked.jpg',
        uploaded_at: '2024-01-14T14:25:00Z',
      },
    ],
    chats: [
      {
        id: 'chat3',
        id_user: 'user3',
        id_declaration: '2',
        date_chat: '2024-01-14T15:00:00Z',
        title: 'Resolution',
        description: 'Construction materials have been moved. Parking spots are now available.',
        photos: undefined,
        firstname: 'Mike',
        lastname: 'Johnson',
      },
    ],
  },
  {
    id: '3',
    id_users: 'user1',
    id_declaration_type: '3',
    severite: 3,
    id_zone: '3',
    description: 'Request for additional seating in the garden area. The current benches are not sufficient for the number of employees who use this space during breaks.',
    date_declaration: '2024-01-13T09:15:00Z',
    declaration_type_title: 'Request',
    zone_title: 'Zone C - Garden Area',
    photo_count: 0,
    chat_count: 2,
    photos: [],
    chats: [
      {
        id: 'chat4',
        id_user: 'user4',
        id_declaration: '3',
        date_chat: '2024-01-13T10:00:00Z',
        title: 'Approved',
        description: 'Request approved. New benches will be installed next week.',
        photos: undefined,
        firstname: 'Sarah',
        lastname: 'Wilson',
      },
      {
        id: 'chat5',
        id_user: 'user1',
        id_declaration: '3',
        date_chat: '2024-01-13T10:30:00Z',
        title: 'Thank you',
        description: 'Thank you for the quick approval. Looking forward to the new seating.',
        photos: undefined,
        firstname: 'John',
        lastname: 'Doe',
      },
    ],
  },
  {
    id: '4',
    id_users: 'user1',
    id_declaration_type: '4',
    severite: 7,
    id_zone: '4',
    description: 'Complaint about the storage area organization. Items are not properly labeled and it\'s difficult to find specific materials. This is affecting work efficiency.',
    date_declaration: '2024-01-12T16:45:00Z',
    declaration_type_title: 'Complaint',
    zone_title: 'Zone D - Storage',
    photo_count: 3,
    chat_count: 0,
    photos: [
      {
        id: 'photo4',
        declaration_id: '4',
        photo: '/uploads/storage-mess.jpg',
        uploaded_at: '2024-01-12T16:50:00Z',
      },
      {
        id: 'photo5',
        declaration_id: '4',
        photo: '/uploads/storage-labels.jpg',
        uploaded_at: '2024-01-12T16:51:00Z',
      },
      {
        id: 'photo6',
        declaration_id: '4',
        photo: '/uploads/storage-overview.jpg',
        uploaded_at: '2024-01-12T16:52:00Z',
      },
    ],
    chats: [],
  },
];

class MockDeclarationService {
  // Simulate API delay
  private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getDeclarationTypes(): Promise<DeclarationType[]> {
    await this.delay(500);
    return mockDeclarationTypes;
  }

  async getDeclarations(): Promise<Declaration[]> {
    await this.delay(800);
    return mockDeclarations;
  }

  async getDeclarationById(id: string): Promise<Declaration> {
    await this.delay(300);
    const declaration = mockDeclarations.find(d => d.id === id);
    if (!declaration) {
      throw new Error('Declaration not found');
    }
    return declaration;
  }

  async createDeclaration(data: any): Promise<{ message: string; declarationId: string }> {
    await this.delay(1000);
    return {
      message: 'Declaration created successfully',
      declarationId: 'new-id-' + Date.now(),
    };
  }

  async updateDeclaration(id: string, data: any): Promise<{ message: string }> {
    await this.delay(600);
    return { message: 'Declaration updated successfully' };
  }

  async deleteDeclaration(id: string): Promise<{ message: string }> {
    await this.delay(400);
    return { message: 'Declaration deleted successfully' };
  }

  async uploadPhotos(declarationId: string, photos: FormData): Promise<{ message: string; count: number }> {
    await this.delay(1500);
    return {
      message: 'Photos uploaded successfully',
      count: 2,
    };
  }

  async deletePhoto(declarationId: string, photoId: string): Promise<{ message: string }> {
    await this.delay(300);
    return { message: 'Photo deleted successfully' };
  }

  async getChatMessages(declarationId: string): Promise<any[]> {
    await this.delay(400);
    const declaration = mockDeclarations.find(d => d.id === declarationId);
    return declaration?.chats || [];
  }

  async addChatMessage(declarationId: string, data: { title?: string; description: string; photos?: string }): Promise<{ message: string; chatId: string }> {
    await this.delay(600);
    return {
      message: 'Chat message added successfully',
      chatId: 'chat-' + Date.now(),
    };
  }

  async deleteChatMessage(declarationId: string, chatId: string): Promise<{ message: string }> {
    await this.delay(300);
    return { message: 'Chat message deleted successfully' };
  }

  async getZones(): Promise<Zone[]> {
    await this.delay(400);
    return mockZones;
  }
}

export default new MockDeclarationService();
