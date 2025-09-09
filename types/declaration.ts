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
  id_manifold?: string | null;
  id_manifold_detail?: string | null;
  declaration_type_title: string;
  zone_title: string;
  project_title?: string | null;
  company_title?: string | null;
  declarent_firstname?: string | null;
  declarent_lastname?: string | null;
  manifolder_title?: string | null;
  manifolder_description?: string | null;
  manifolder_type_title?: string | null;
  manifolder_question_title?: string | null;
  manifolder_question_type?: string | null;
  photo_count: number;
  chat_count: number;
  photos?: DeclarationPhoto[];
  chats?: ChatMessage[];
  manifolderInfo?: {
    manifolderId: string;
    manifolderDetailId: string;
    manifolderTitle: string;
    manifolderDescription?: string;
    manifolderType: string;
    question: {
      title: string;
      type: string;
      description?: string;
    };
    answer: {
      text?: string;
      file?: string;
      vocal?: string;
      latitude?: number;
      longitude?: number;
      quantity?: number;
      status?: number;
    };
  };
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
  id_manifold?: string;
  id_manifold_detail?: string;
  photos?: { uri: string; type: string; name: string }[];
}

export interface Zone {
  id: string;
  title: string;
  code: string;
  logo?: string | null;
  id_zone?: string | null; // parent zone id
  level?: number | null;
  id_project?: string | null;
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

export interface ManifolderDetailsForDeclaration {
  manifolder: {
    id: string;
    title: string;
    description?: string;
    projectId: string;
    projectTitle: string;
    defaultZoneId: string;
    zoneTitle: string;
    manifolderType: string;
  };
  manifolderDetail: {
    id: string;
    questionId: string;
    questionTitle: string;
    questionType: string;
    questionDescription?: string;
    answer: {
      text?: string;
      file?: string;
      vocal?: string;
      latitude?: number;
      longitude?: number;
      quantity?: number;
      status?: number;
    };
  };
  availableZones: Zone[];
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
