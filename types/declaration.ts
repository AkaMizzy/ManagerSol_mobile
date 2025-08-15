export interface DeclarationType {
  id: string;
  title: string;
}

export interface DeclarationPhoto {
  id: string;
  declaration_id: string;
  photo: string;
  uploaded_at: string;
}

export interface ChatMessage {
  id: string;
  id_user: string;
  id_declaration: string;
  date_chat: string;
  title?: string;
  description: string;
  photo?: string;
  firstname: string;
  lastname: string;
}

export interface Declaration {
  id: string;
  id_users: string;
  id_declaration_type: string;
  severite: number;
  id_zone: string;
  description: string;
  date_declaration: string;
  declaration_type_title: string;
  zone_title: string;
  photo_count: number;
  chat_count: number;
  photos?: DeclarationPhoto[];
  chats?: ChatMessage[];
}

export interface CreateDeclarationData {
  id_declaration_type: string;
  severite: number;
  id_zone: string;
  description: string;
  photos?: { uri: string; type: string; name: string }[];
}

export interface Zone {
  id: string;
  title: string;
  code: string;
}
