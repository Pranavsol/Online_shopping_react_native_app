// API Configuration for the Shopping App
// Update this file when running the backend on different environments

// For development with local backend server
export const API_CONFIG = {
  // Use your local IP address instead of localhost for React Native/Expo
  BASE_URL: 'http://10.142.54.121:5000/api',
  
  // Alternative configurations for different environments:
  // For Android Emulator: 'http://10.0.2.2:5000/api'
  // For iOS Simulator: 'http://localhost:5000/api' 
  // For physical device: Use your actual IP address (shown above)
  
  TIMEOUT: 10000, // 10 seconds timeout
};

// API endpoints
export const API_ENDPOINTS = {
  // Authentication
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  PROFILE: '/auth/profile',
  CHANGE_PASSWORD: '/auth/change-password',
  
  // Products
  PRODUCTS: '/products',
  PRODUCT_BY_ID: (id: string | number) => `/products/${id}`,
  CATEGORIES: '/products/categories/list',
  
  // Cart
  CART: '/cart',
  CART_ITEM: (id: string | number) => `/cart/${id}`,
  
  // Orders
  ORDERS: '/orders',
  ORDER_BY_ID: (id: string | number) => `/orders/${id}`,
  CANCEL_ORDER: (id: string | number) => `/orders/${id}/cancel`,
  
  // Admin
  ADMIN_DASHBOARD: '/users/admin/dashboard',
  ADMIN_ORDERS: '/orders/admin/all',
  ADMIN_USERS: '/users',
  
  // Health check
  HEALTH: '/health',
};

// Helper function to create full URL
export const createApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Helper function for API requests with proper error handling
export const apiRequest = async (
  endpoint: string,
  options: RequestInit = {},
  token?: string
): Promise<any> => {
  const url = createApiUrl(endpoint);
  
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }
  
  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    timeout: API_CONFIG.TIMEOUT,
  };
  
  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`
      }));
      throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      // Network errors or fetch failures
      if (error.message.includes('Network request failed') || error.message.includes('fetch')) {
        throw new Error('Network error: Please check your internet connection and make sure the server is running');
      }
      throw error;
    }
    throw new Error('An unexpected error occurred');
  }
};