export interface Sector {
  id: string;
  phone1?: string;
  phone2?: string;
  website?: string;
  email2?: string;
}

export interface Company {
  id: string;
  title: string;
  description?: string;
  email: string;
  foundedYear?: number;
  sector_id?: string; // This will be mapped from the 'sector' field in the database
  sector?: Sector;
  logo?: string;
  nb_users?: number;
  status?: string;
}
