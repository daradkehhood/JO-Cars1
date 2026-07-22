import { API_URL } from './constants';
import { getToken } from './auth';

interface RequestOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  params?: Record<string, any>;
}

async function buildUrl(endpoint: string, params?: Record<string, any>): Promise<string> {
  const url = new URL(`${API_URL}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.append(key, String(value));
      }
    });
  }
  return url.toString();
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = 'GET', body, headers = {}, params } = options;
  const token = await getToken();

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (token) {
    requestHeaders['Authorization'] = `Bearer ${token}`;
  }

  const url = await buildUrl(endpoint, params);

  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || 'حدث خطأ');
  }

  return data;
}

export async function apiUpload<T = any>(
  endpoint: string,
  formData: FormData
): Promise<T> {
  const token = await getToken();

  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || 'حدث خطأ في رفع الملف');
  }

  return data;
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    apiRequest('/api/auth/login', { method: 'POST', body: { email, password } }),
  register: (data: any) =>
    apiRequest('/api/auth/register', { method: 'POST', body: data }),
  getProfile: () =>
    apiRequest('/api/auth/profile'),
  updateProfile: (data: any) =>
    apiRequest('/api/auth/profile', { method: 'PUT', body: data }),

  // Cars
  getCars: (params?: any) =>
    apiRequest('/api/cars', { params }),
  getCar: (id: string) =>
    apiRequest(`/api/cars/${id}`),
  createCar: (data: any) =>
    apiRequest('/api/cars', { method: 'POST', body: data }),
  updateCar: (id: string, data: any) =>
    apiRequest(`/api/cars/${id}`, { method: 'PUT', body: data }),
  deleteCar: (id: string) =>
    apiRequest(`/api/cars/${id}`, { method: 'DELETE' }),
  getMyCars: (params?: any) =>
    apiRequest('/api/cars/my', { params }),
  markAsSold: (id: string) =>
    apiRequest(`/api/cars/${id}/sold`, { method: 'POST' }),

  // Favorites
  getFavorites: (params?: any) =>
    apiRequest('/api/cars/favorites', { params }),
  toggleFavorite: (carId: string) =>
    apiRequest('/api/cars/favorites', { method: 'POST', body: { carId } }),

  // Comments
  getComments: (carId: string) =>
    apiRequest(`/api/cars/${carId}/comments`),
  addComment: (carId: string, content: string) =>
    apiRequest(`/api/cars/${carId}/comments`, { method: 'POST', body: { content } }),

  // Brands
  getBrands: () =>
    apiRequest('/api/cars/brands'),
  getModels: (brandId: string) =>
    apiRequest('/api/cars/models', { params: { brandId } }),

  // Cities
  getCities: () =>
    apiRequest('/api/cars/cities'),

  // Messages
  getConversations: () =>
    apiRequest('/api/conversations'),
  getMessages: (conversationId: string) =>
    apiRequest(`/api/conversations/${conversationId}/messages`),
  sendMessage: (conversationId: string, content: string) =>
    apiRequest(`/api/conversations/${conversationId}/messages`, { method: 'POST', body: { content } }),
  createConversation: (data: any) =>
    apiRequest('/api/conversations', { method: 'POST', body: data }),

  // Notifications
  getNotifications: () =>
    apiRequest('/api/notifications'),
  markNotificationsRead: () =>
    apiRequest('/api/notifications', { method: 'PUT' }),

  // AI
  aiChat: (message: string) =>
    apiRequest('/api/ai/chat', { method: 'POST', body: { message } }),
  aiMarketPrice: (data: any) =>
    apiRequest('/api/ai/market-price', { method: 'POST', body: data }),
  aiPriceEstimate: (data: any) =>
    apiRequest('/api/ai/price-estimate', { method: 'POST', body: data }),
  aiSmartSearch: (query: string) =>
    apiRequest('/api/ai/smart-search', { method: 'POST', body: { query } }),

  // Car Finder
  carFinder: (data: any) =>
    apiRequest('/api/car-finder', { method: 'POST', body: data }),

  // Financing
  financingCalculate: (data: any) =>
    apiRequest('/api/financing/calculate', { method: 'POST', body: data }),

  // Resale Value
  resaleValue: (data: any) =>
    apiRequest('/api/resale-value', { method: 'POST', body: data }),

  // Price Alerts
  getPriceAlerts: () =>
    apiRequest('/api/price-alerts'),
  createPriceAlert: (data: any) =>
    apiRequest('/api/price-alerts', { method: 'POST', body: data }),
  deletePriceAlert: (id: string) =>
    apiRequest(`/api/price-alerts/${id}`, { method: 'DELETE' }),

  // Parts
  getParts: (params?: any) =>
    apiRequest('/api/parts', { params }),
  getPart: (id: string) =>
    apiRequest(`/api/parts/${id}`),
  createPart: (data: any) =>
    apiRequest('/api/parts', { method: 'POST', body: data }),

  // Plates
  getPlates: (params?: any) =>
    apiRequest('/api/plates', { params }),
  getPlate: (id: string) =>
    apiRequest(`/api/plates/${id}`),
  createPlate: (data: any) =>
    apiRequest('/api/plates', { method: 'POST', body: data }),

  // Wanted
  getWantedAds: (params?: any) =>
    apiRequest('/api/wanted', { params }),
  getWantedAd: (id: string) =>
    apiRequest(`/api/wanted/${id}`),
  createWantedAd: (data: any) =>
    apiRequest('/api/wanted', { method: 'POST', body: data }),

  // Forum
  getForumCategories: () =>
    apiRequest('/api/forum/categories'),
  getForumTopics: (params?: any) =>
    apiRequest('/api/forum/topics', { params }),
  getForumTopic: (id: string) =>
    apiRequest(`/api/forum/topics/${id}`),
  createForumTopic: (data: any) =>
    apiRequest('/api/forum/topics', { method: 'POST', body: data }),
  createForumPost: (data: any) =>
    apiRequest('/api/forum/posts', { method: 'POST', body: data }),

  // Articles
  getArticles: (params?: any) =>
    apiRequest('/api/articles', { params }),
  getArticle: (slug: string) =>
    apiRequest(`/api/articles/${slug}`),

  // Dealers
  getDealers: (params?: any) =>
    apiRequest('/api/dealers', { params }),

  // Maintenance
  getMaintenance: (params?: any) =>
    apiRequest('/api/maintenance', { params }),
  createMaintenance: (data: any) =>
    apiRequest('/api/maintenance', { method: 'POST', body: data }),

  // Garage
  getGarage: () =>
    apiRequest('/api/garage'),
  addGarageCar: (data: any) =>
    apiRequest('/api/garage', { method: 'POST', body: data }),
  getGarageExpenses: (garageId: string) =>
    apiRequest(`/api/expenses`, { params: { garageId } }),
  addExpense: (data: any) =>
    apiRequest('/api/expenses', { method: 'POST', body: data }),

  // Reminders
  getReminders: () =>
    apiRequest('/api/car-reminders'),
  createReminder: (data: any) =>
    apiRequest('/api/car-reminders', { method: 'POST', body: data }),

  // Tickets
  getTickets: () =>
    apiRequest('/api/tickets'),
  getTicket: (id: string) =>
    apiRequest(`/api/tickets/${id}`),
  createTicket: (data: any) =>
    apiRequest('/api/tickets', { method: 'POST', body: data }),
  replyTicket: (id: string, content: string) =>
    apiRequest(`/api/tickets/${id}`, { method: 'PUT', body: { content } }),

  // Ratings
  getUserRatings: (userId: string) =>
    apiRequest(`/api/ratings/user/${userId}`),
  createRating: (data: any) =>
    apiRequest('/api/ratings', { method: 'POST', body: data }),

  // Upload
  uploadImage: (formData: FormData) =>
    apiUpload('/api/upload', formData),

  // Reports
  reportCar: (carId: string, reason: string, description: string) =>
    apiRequest(`/api/cars/${carId}/report`, { method: 'POST', body: { reason, description } }),

  // Admin
  request: (endpoint: string, options?: RequestOptions) =>
    apiRequest(endpoint, options),
  getAdminStats: () =>
    apiRequest('/api/admin/stats'),
  getAdminUsers: (params?: any) =>
    apiRequest('/api/admin/users', { params }),
  getAdminCars: (params?: any) =>
    apiRequest('/api/admin/cars', { params }),
};
