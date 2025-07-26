/**
 * Quick Fix: Update API Configuration
 * 
 * ISSUE: Frontend was using localhost:5000 which doesn't work in React Native
 * SOLUTION: Use local IP address 10.142.54.121:5000
 * 
 * Steps taken:
 * 1. Created config/api.ts with proper IP address
 * 2. Updated AuthContext to use new API helper
 * 3. Updated home and products pages
 * 
 * REMAINING: Update all other API calls to use the new configuration
 */

// The correct API configuration is now in config/api.ts:
export const API_CONFIG = {
  BASE_URL: 'http://10.142.54.121:5000/api', // Using local IP instead of localhost
  TIMEOUT: 10000,
};

// All pages need to:
// 1. Import: import { apiRequest, API_ENDPOINTS } from '../../config/api';
// 2. Replace fetch calls with apiRequest calls
// 3. Use API_ENDPOINTS constants instead of hardcoded URLs

/* 
MANUAL REPLACEMENTS NEEDED IN REMAINING FILES:

1. app/(tabs)/cart.tsx - Replace all fetch calls
2. app/checkout.tsx - Replace all fetch calls  
3. app/(tabs)/orders.tsx - Replace all fetch calls
4. app/order/[id].tsx - Replace all fetch calls
5. app/(tabs)/admin.tsx - Replace all fetch calls

Pattern to replace:
OLD: const API_BASE_URL = 'http://localhost:5000/api';
NEW: import { apiRequest, API_ENDPOINTS } from '../../config/api';

OLD: fetch(`${API_BASE_URL}/endpoint`, { headers: { 'Authorization': `Bearer ${token}` } })
NEW: apiRequest(API_ENDPOINTS.ENDPOINT, {}, token)

OLD: fetch(`${API_BASE_URL}/endpoint`, { method: 'POST', headers: {...}, body: JSON.stringify(data) })
NEW: apiRequest(API_ENDPOINTS.ENDPOINT, { method: 'POST', body: JSON.stringify(data) }, token)
*/