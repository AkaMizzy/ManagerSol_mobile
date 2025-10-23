import API_CONFIG from '@/app/config/api';

export type Project = {
  id: string;
  title: string;
  id_company: string;
  dd: string; // start date (YYYY-MM-DD)
  df: string; // end date (YYYY-MM-DD)
  code: string | null;
  status: string | null;
  owner: string | null;
  control: string | null;
  technicien: string | null;
  project_type_id: string | null;
  project_type_title?: string | null;
};

type CreateProjectInput = {
  title: string;
  dd: string;
  df: string;
  status?: 0 | 1;
  owner?: string; // user id FK
  control: string; // user id FK
  technicien: string; // user id FK
  project_type_id?: string;
  id_project_type?: string;
};

export async function fetchUserProjects(token: string): Promise<Project[]> {
  const res = await fetch(`${API_CONFIG.BASE_URL}/user/projects`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to fetch projects');
  }
  return res.json();
}

export async function createUserProject(token: string, body: CreateProjectInput): Promise<{ message: string; id?: string }>{
  const res = await fetch(`${API_CONFIG.BASE_URL}/user/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to create project');
  }
  return data;
}

export async function updateUserProject(
  token: string,
  id: string | number,
  body: { status?: 0 | 1; owner?: string | null; control?: string | null; technicien?: string | null }
): Promise<{ message: string }>{
  const res = await fetch(`${API_CONFIG.BASE_URL}/user/projects/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to update project');
  }
  return data;
}


