import API_CONFIG from '../app/config/api';
import { Company } from '../types/company';

class CompanyService {
  private baseUrl = `${API_CONFIG.BASE_URL}/api`;

  private toAbsoluteUrl(path?: string): string | undefined {
    if (!path) {
      return undefined;
    }
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    return `${API_CONFIG.BASE_URL}${path}`;
  }

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
    
    const company: Company = await response.json();
    return { ...company, logo: this.toAbsoluteUrl(company.logo) };
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

    const company: Company = await response.json();
    return { ...company, logo: this.toAbsoluteUrl(company.logo) };
  }

  async updateCompany(token: string, companyId: string, companyData: Partial<Company>, logoUri?: string | null): Promise<Company> {
    let requestBody: FormData | string;
    let headers: HeadersInit;

    if (logoUri) {
      // Use FormData for multipart/form-data
      const formData = new FormData();
      formData.append('title', companyData.title || '');
      if (companyData.description) formData.append('description', companyData.description);
      formData.append('email', companyData.email || '');
      if (companyData.foundedYear) formData.append('foundedYear', companyData.foundedYear.toString());
      
      // Add sector data if it exists
      if (companyData.sector) {
        formData.append('sector', JSON.stringify({
          phone1: companyData.sector.phone1 || null,
          phone2: companyData.sector.phone2 || null,
          website: companyData.sector.website || null,
          email2: companyData.sector.email2 || null,
        }));
      }

      // Add logo file
      const logoBlob = {
        uri: logoUri,
        type: 'image/jpeg',
        name: 'logo.jpg',
      } as any;
      formData.append('logo', logoBlob);

      requestBody = formData;
      headers = {
        'Authorization': `Bearer ${token}`,
      };
    } else {
      // Use JSON for regular update without logo
      requestBody = JSON.stringify(companyData);
      headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };
    }

    const response = await fetch(`${this.baseUrl}/company/current-user`, {
      method: 'PUT',
      headers,
      body: requestBody,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    const company: Company = await response.json();
    return { ...company, logo: this.toAbsoluteUrl(company.logo) };
  }
}

const companyService = new CompanyService();
export default companyService;
