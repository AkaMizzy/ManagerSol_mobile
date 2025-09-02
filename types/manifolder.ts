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
  project_title?: string;
  zone_title?: string;
  code_context?: string;
  code_prefix?: string;
  code_suffix?: string;
  code_counter?: number;
  code_formatted: string;
}


