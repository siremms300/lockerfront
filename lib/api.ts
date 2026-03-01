 
// /lib/api.ts
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// export const authAPI = {
//   login: (data: { email: string; password: string }) =>
//     api.post('/auth/login', data),
//   register: (data: any) => api.post('/auth/register', data),
// }


// // lib/api.ts - Add logout function


// // export const authAPI = {
// //   login: (data: { email: string; password: string }) =>
// //     api.post('/auth/login', data),
// //   register: (data: any) => api.post('/auth/register', data),
// //   logout: () => api.post('/auth/logout'), // Add this
// //   logoutAll: () => api.post('/auth/logout-all'), // Optional
// // };


// export const authAPI = {
//   login: (data: { email: string; password: string }) =>
//     api.post('/auth/login', data),
//   register: (data: any) => api.post('/auth/register', data),
//   logout: () => api.post('/auth/logout'),
// }


// lib/api.ts - Make sure logout is exported
export const authAPI = {
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  register: (data: any) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'), // Make sure this exists
  logoutAll: () => api.post('/auth/logout-all'),
}



export const merchantAPI = {
  getProfile: () => api.get('/merchant/profile'),
  updateProfile: (data: any) => api.put('/merchant/profile', data),
  getBilling: () => api.get('/merchant/billing'),
  generateApiKey: () => api.post('/merchant/api-key'),
}

export const parcelAPI = {
  create: (data: any) => api.post('/parcels', data),
  getAll: (params?: any) => api.get('/parcels', { params }),
  getById: (id: string) => api.get(`/parcels/${id}`),
  update: (id: string, data: any) => api.put(`/parcels/${id}`, data),
  delete: (id: string) => api.delete(`/parcels/${id}`),
  analytics: () => api.get('/parcels/analytics'),
}

export const analyticsAPI = {
  dashboard: () => api.get('/analytics/dashboard'),
}


// Add locationAPI
export const locationAPI = {
  getAll: (params?: any) => api.get('/locations', { params }),
  getById: (id: string) => api.get(`/locations/${id}`),
  create: (data: any) => api.post('/locations', data),
  update: (id: string, data: any) => api.put(`/locations/${id}`, data),
  delete: (id: string) => api.delete(`/locations/${id}`),
  getStats: (id: string) => api.get(`/locations/${id}/stats`),
}



// lib/api.ts - Add customerAPI
export const customerAPI = {
  getAll: (params?: any) => api.get('/customers', { params }),
  getById: (id: string) => api.get(`/customers/${id}`),
  create: (data: any) => api.post('/customers', data),
  update: (id: string, data: any) => api.put(`/customers/${id}`, data),
  delete: (id: string) => api.delete(`/customers/${id}`),
  getPickups: (id: string) => api.get(`/customers/${id}/pickups`),
  getAnalytics: () => api.get('/customers/analytics'),
}



// lib/api.ts - Add driverAPI
export const driverAPI = {
  // Auth
  login: (data: { phone: string; pin: string }) => api.post('/driver/login', data),
  
  // Deliveries
  getTodayDeliveries: () => api.get('/driver/deliveries/today'),
  
  // Scanning
  scanParcel: (data: { trackingNumber: string; scanType?: string; locationId?: string }) => 
    api.post('/driver/scan', data),
  
  // Offline sync
  syncOfflineData: (data: { scans?: any[]; parcels?: any[] }) => api.post('/driver/sync', data),
  
  // Location tracking
  updateLocation: (data: { lat: number; lng: number }) => api.post('/driver/location', data),
  
  // Profile
  getProfile: () => api.get('/driver/profile'),
  updateProfile: (data: any) => api.put('/driver/profile', data),
  
  // Admin/Merchant endpoints (for managing drivers)
  getAll: (params?: any) => api.get('/drivers', { params }),
  getById: (id: string) => api.get(`/drivers/${id}`),
  create: (data: any) => api.post('/drivers', data),
  update: (id: string, data: any) => api.put(`/drivers/${id}`, data),
  delete: (id: string) => api.delete(`/drivers/${id}`),
  getDeliveries: (id: string) => api.get(`/drivers/${id}/deliveries`),
  getAnalytics: () => api.get('/drivers/analytics'),
}



// lib/api.ts - Add billingAPI
export const billingAPI = {
  // Wallet
  getWallet: () => api.get('/billing/wallet'),
  updateWallet: (data: any) => api.put('/billing/wallet', data),
  
  // Top-up with Paystack
  initializeTopUp: (data: { amount: number; email: string }) => 
    api.post('/billing/wallet/topup/initialize', data),
  verifyTopUp: (reference: string) => 
    api.get(`/billing/wallet/topup/verify/${reference}`),
  
  // Auto top-up
  setupAutoTopUp: (data: { enabled: boolean; threshold: number }) => 
    api.post('/billing/wallet/autotopup', data),
  
  // Invoices
  getInvoices: (params?: any) => api.get('/billing/invoices', { params }),
  getInvoiceById: (id: string) => api.get(`/billing/invoices/${id}`),
  
  // Transactions
  getTransactions: (params?: any) => api.get('/billing/transactions', { params }),
  
  // COD
  getCODSummary: () => api.get('/billing/cod/summary'),
  
  // Analytics
  getAnalytics: () => api.get('/billing/analytics'),
}


// lib/api.ts - Add admin endpoints
// lib/api.ts - Add/update adminAPI
export const adminAPI = {
  // Dashboard
  getDashboardStats: () => api.get('/admin/dashboard/stats'),
  
  // Merchants
  getMerchants: (params?: any) => api.get('/admin/merchants', { params }),
  getMerchantById: (id: string) => api.get(`/admin/merchants/${id}`),
  updateMerchant: (id: string, data: any) => api.put(`/admin/merchants/${id}`, data),
  updateMerchantStatus: (id: string, data: { isActive: boolean }) => 
    api.patch(`/admin/merchants/${id}/status`, data),
  deleteMerchant: (id: string) => api.delete(`/admin/merchants/${id}`),
  
  // Customers
  getCustomers: (params?: any) => api.get('/admin/customers', { params }),
  getCustomerById: (id: string) => api.get(`/admin/customers/${id}`),
  createCustomer: (data: any) => api.post('/admin/customers', data),
  updateCustomer: (id: string, data: any) => api.put(`/admin/customers/${id}`, data),
  updateCustomerStatus: (id: string, data: { status: string }) => 
    api.patch(`/admin/customers/${id}/status`, data),
  deleteCustomer: (id: string) => api.delete(`/admin/customers/${id}`),
  
  // Invitations
  inviteMerchant: (data: { email: string; businessName: string; phone: string; role?: string }) => 
    api.post('/admin/invitations', data),
};


export default api






