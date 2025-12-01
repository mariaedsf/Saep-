import { toast } from 'react-toastify';

const API_BASE_URL = 'http://localhost:8000';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const token = localStorage.getItem('access_token');

    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    try {
      let response = await fetch(`${this.baseURL}${endpoint}`, { 
        ...defaultOptions, 
        ...options 
      });

      // ================================
      // 🔐 REFRESH DO TOKEN SE DER 401
      // ================================
      if (response.status === 401) {
        const refreshToken = localStorage.getItem('refresh_token');

        if (refreshToken) {
          try {
            const refreshResponse = await fetch(`${this.baseURL}/api/auth/token/refresh/`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refresh: refreshToken }),
            });

            if (refreshResponse.ok) {
              const data = await refreshResponse.json();
              localStorage.setItem('access_token', data.access);

              defaultOptions.headers.Authorization = `Bearer ${data.access}`;

              // tenta de novo com token novo
              response = await fetch(`${this.baseURL}${endpoint}`, { 
                ...defaultOptions, 
                ...options 
              });
            } else {
              throw new Error('Token inválido');
            }
          } catch (refreshError) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');
            throw refreshError;
          }
        } else {
          throw new Error('No refresh token');
        }
      }

      // ====================================================
      // ❌ SE NÃO FOR OK — TRATAR ERROS COM BODY OPCIONAL
      // ====================================================
      if (!response.ok) {
        const text = await response.text();
        let errorData = {};

        if (text) {
          try {
            errorData = JSON.parse(text);
          } catch {}
        }

        throw new Error(errorData.error || errorData.detail || 'Request failed');
      }

      // ====================================================
      // DELETE (204 No Content) → NÃO TEM JSON
      // ====================================================
      if (response.status === 204) {
        return true;
      }

      // ====================================================
      // SUCESSO → TENTAR LER JSON, MAS SEM QUEBRAR
      // ====================================================
      const text = await response.text();
      if (!text) return {};

      try {
        return JSON.parse(text);
      } catch {
        return {};
      }

    } catch (error) {
      if (error.message !== 'No refresh token') {
        toast.error(error.message || 'Erro na requisição');
      }
      throw error;
    }
  }

  // ================================================
  // AUTH
  // ================================================
  async login(email, password) {
    return this.request('/api/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(userData) {
    return this.request('/api/register/', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  // ================================================
  // PRODUTOS
  // ================================================
  async getProducts(searchTerm = '') {
    const params = new URLSearchParams();
    if (searchTerm) params.append('search', searchTerm);

    const queryString = params.toString();
    return this.request(`/api/produtos/${queryString ? '?' + queryString : ''}`);
  }

  async getProduct(id) {
    return this.request(`/api/produtos/${id}/`);
  }

  async createProduct(productData) {
    return this.request('/api/produtos/', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  }

  async updateProduct(id, productData) {
    return this.request(`/api/produtos/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  }

  async deleteProduct(id) {
    return this.request(`/api/produtos/${id}/`, {
      method: 'DELETE',
    });
  }

  // ================================================
  // MOVIMENTAÇÕES DE ESTOQUE
  // ================================================
  async getStockMovements() {
    return this.request('/api/movimentacoes/');
  }

  async createStockMovement(movementData) {
    return this.request('/api/movimentacoes/', {
      method: 'POST',
      body: JSON.stringify(movementData),
    });
  }

  // ================================================
  // ALERTAS
  // ================================================
  async getStockAlerts() {
    return this.request('/api/alertas/');
  }

  async markAlertAsRead(id) {
    return this.request(`/api/alertas/${id}/marcar_como_lido/`, {
      method: 'POST',
    });
  }

  // ================================================
  // DASHBOARD
  // ================================================
  async getDashboardData() {
    return this.request('/api/dashboard/');
  }
}

export default new ApiService();
