export interface ManifolderType {
  id: string;
  title: string;
  description?: string | null;
}

export interface CreateManifolderData {
  id_project: string;
  id_zone: string;
  date: string; // YYYY-MM-DD
  heur_d?: string; // HH:MM or HH:MM:SS
  heur_f?: string; // HH:MM or HH:MM:SS
  id_type: string;
  title: string;
  description?: string;
}

export interface ManifolderListItem {
  id: string;
  id_project: string;
  id_zone: string;
  date: string;
  heur_d?: string | null;
  heur_f?: string | null;
  id_type: string;
  id_code: string;
  title: string;
  description?: string | null;
  project_title?: string;
  zone_title?: string;
  zone_logo?: string | null;
  type_title?: string;
  type_description?: string | null;
  code_context?: string;
  code_prefix?: string;
  code_suffix?: string;
  code_counter?: number;
  code_formatted: string;
}

// Question types for manifolder detail workflow
export type QuestionType = 'text' | 'number' | 'date' | 'boolean' | 'file' | 'photo' | 'video' | 'GPS' | 'voice' | 'taux' | 'list' | 'long_text';

export interface ManifolderQuestion {
  id: string;
  title: string;
  description?: string | null;
  type: QuestionType;
  context: string;
  quantity?: boolean;
  order?: number;
  created_at: string;
  updated_at: string;
  // Added for frontend compatibility (set by backend as defaults)
  required: boolean;
  options?: any | null;
  placeholder?: string | null;
}

export interface ManifolderAnswer {
  questionId: string;
  value?: any;
  latitude?: number;
  longitude?: number;
  quantity?: number;
  zoneId?: string;
  status?: number; // Add status field (0-4)
}

export interface ManifolderAnswerWithDetails {
  id: string;
  questionId: string;
  questionTitle: string;
  questionType: QuestionType;
  questionDescription?: string | null;
  questionQuantity?: boolean;
  value: any;
  quantity?: number;
  zoneId?: string;
  status?: number; // Add status field (0-4)
  imageAnswer?: string | null;
  vocalAnswer?: string | null; // Add vocal answer field
  createdAt: string;
  updatedAt: string;
}

export interface Zone {
  id: string;
  title: string;
  code: string;
  level: number;
}

export interface ManifolderQuestionsResponse {
  manifolderId: string;
  manifolderType: string;
  projectId: string;
  projectTitle: string;
  defaultZoneId: string;
  availableZones: Zone[];
  questions: ManifolderQuestion[];
}
