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
  title: string;
  id_users: string;
  id_declaration_type: string;
  severite: number;
  id_zone: string;
  description: string;
  date_declaration: string;
  code_declaration: string;
  id_declarent?: string | null;
  id_project?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  declaration_type_title: string;
  zone_title: string;
  project_title?: string | null;
  company_title?: string | null;
  declarent_firstname?: string | null;
  declarent_lastname?: string | null;
  photo_count: number;
  chat_count: number;
  photos?: DeclarationPhoto[];
  chats?: ChatMessage[];
}

export interface CreateDeclarationData {
  title: string;
  id_declaration_type: string;
  severite: number;
  id_zone: string;
  description: string;
  date_declaration: string;
  code_declaration: string;
  id_declarent?: string;
  id_project?: string;
  latitude?: number;
  longitude?: number;
  photos?: { uri: string; type: string; name: string }[];
}

export interface Zone {
  id: string;
  title: string;
  code: string;
  logo?: string | null;
  id_zone?: string | null; // parent zone id
  level?: number | null;
}

export interface Project {
  id: string;
  title: string;
  code?: string | null;
  status?: string | null;
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
  assigned_to?: string | null;
  id_zone?: string | null;
  id_company?: string | null;
  photo?: string | null;
  created_at: string;
  creator_firstname?: string;
  creator_lastname?: string;
  assigned_firstname?: string | null;
  assigned_lastname?: string | null;
  company_title?: string | null;
  zone_title?: string | null;
  id_parent_action?: string | null; // For sub-actions
}

export interface CompanyUser {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  role?: string;
}

export interface CreateActionData {
  title?: string;
  description?: string;
  status?: number; // 1=pending,2=in_progress,3=done,4=validated
  date_planification?: string; // ISO date string
  date_execution?: string; // ISO date string
  sort_order?: number;
  assigned_to?: string;
  photo?: { uri: string; type: string; name: string };
  id_zone?: string; // zone for the action (defaults to declaration's zone)
}
