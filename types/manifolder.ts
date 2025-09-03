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
  code_context?: string;
  code_prefix?: string;
  code_suffix?: string;
  code_counter?: number;
  code_formatted: string;
}

// Question types for manifolder detail workflow
export type QuestionType = 'text' | 'number' | 'date' | 'boolean' | 'file' | 'photo' | 'video' | 'GPS' | 'voice' | 'taux';

export interface ManifolderQuestion {
  id: string;
  title: string;
  description?: string | null;
  type: QuestionType;
  context: string;
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
}

export interface ManifolderAnswerWithDetails {
  id: string;
  questionId: string;
  questionTitle: string;
  questionType: QuestionType;
  questionDescription?: string | null;
  value: any;
  createdAt: string;
  updatedAt: string;
}

export interface UploadedFile {
  filename: string;
  originalName: string;
  path: string;
  size: number;
  mimetype: string;
}
