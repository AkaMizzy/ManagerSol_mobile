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

export interface DeclarationAction {
  id: string;
  id_user: string;
  id_declaration: string;
  title?: string | null;
  description?: string | null;
  status?: string | number | null;
  date_planification?: string | null;
  date_execution?: string | null;
  sort_order?: number | null;
  id_user_validateur?: string | null;
  id_company?: string | null;
  photo?: string | null;
  created_at: string;
  creator_firstname?: string;
  creator_lastname?: string;
  validator_firstname?: string | null;
  validator_lastname?: string | null;
}

export interface CreateActionData {
  title?: string;
  description?: string;
  status?: number; // 1=pending,2=in_progress,3=done,4=validated
  date_planification?: string; // ISO date string
  date_execution?: string; // ISO date string
  sort_order?: number;
  id_user_validateur?: string;
  photo?: { uri: string; type: string; name: string };
}
