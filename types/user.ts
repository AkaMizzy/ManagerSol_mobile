export interface CompanyUser {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  phone1?: string;
  phone2?: string;
  email_second?: string;
  role: 'user' | 'admin';
  status: 'active' | 'inactive';
  photo?: string;
  company_id: string;
}

export interface CreateUserData {
  firstname: string;
  lastname: string;
  email: string;
  phone1?: string;
  phone2?: string;
  email_second?: string;
  role?: 'user' | 'admin';
}

export interface CreateUserResponse {
  message: string;
  user: CompanyUser;
  password: string;
}

export interface UpdateUserData {
  firstname?: string;
  lastname?: string;
  email?: string;
  phone1?: string;
  phone2?: string;
  email_second?: string;
  role?: 'user' | 'admin';
  status?: 'active' | 'inactive';
}
