import api from './api';

export interface Vendor {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gstNumber?: string;
  panNumber?: string;
  bankAccountNumber?: string;
  bankName?: string;
  bankIfscCode?: string;
  contactPerson?: string;
  contactPersonPhone?: string;
  category?: string;
  notes?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateVendorRequest {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gstNumber?: string;
  panNumber?: string;
  bankAccountNumber?: string;
  bankName?: string;
  bankIfscCode?: string;
  contactPerson?: string;
  contactPersonPhone?: string;
  category?: string;
  notes?: string;
}

export interface VendorListResponse {
  items: Vendor[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface VendorQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  isActive?: boolean;
}

export const vendorService = {
  // Get all vendors
  getAllVendors: async (params?: VendorQueryParams): Promise<VendorListResponse> => {
    const response = await api.get('/vendors', { params });
    return response.data;
  },

  // Get vendor by ID
  getVendorById: async (id: number): Promise<Vendor> => {
    const response = await api.get(`/vendors/${id}`);
    return response.data;
  },

  // Create vendor
  createVendor: async (data: CreateVendorRequest): Promise<Vendor> => {
    const response = await api.post('/vendors', data);
    return response.data;
  },

  // Update vendor
  updateVendor: async (id: number, data: Partial<CreateVendorRequest & { isActive?: boolean }>): Promise<Vendor> => {
    const response = await api.put(`/vendors/${id}`, data);
    return response.data;
  },

  // Delete vendor
  deleteVendor: async (id: number): Promise<void> => {
    await api.delete(`/vendors/${id}`);
  },

  // Toggle vendor status
  toggleVendorStatus: async (id: number): Promise<Vendor> => {
    const response = await api.patch(`/vendors/${id}/toggle-status`);
    return response.data;
  },

  // Get vendor categories
  getCategories: async (): Promise<string[]> => {
    const response = await api.get('/vendors/categories');
    return response.data;
  },
};

export default vendorService;
