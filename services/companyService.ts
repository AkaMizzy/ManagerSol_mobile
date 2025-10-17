import API_CONFIG from '../app/config/api';
import { Company } from '../types/company';

class CompanyService {
  private baseUrl = `${API_CONFIG.BASE_URL}/api`;

  async getCurrentUserCompany(token: string): Promise<Company> {
    const response = await fetch(`${this.baseUrl}/company/current-user`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async getCompanyById(token: string, companyId: string): Promise<Company> {
    const response = await fetch(`${this.baseUrl}/companies/${companyId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async updateCompany(token: string, companyId: string, companyData: Partial<Company>): Promise<Company> {
    const response = await fetch(`${this.baseUrl}/company/current-user`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(companyData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }
}

const companyService = new CompanyService();
export default companyService;
