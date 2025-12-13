import api from './api';

export interface Customer {
  id: number;
  name: string;
  companyName?: string;
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

export interface CreateCustomerRequest {
  name: string;
  companyName?: string;
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

export interface CustomerListResponse {
  items: Customer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CustomerQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  isActive?: boolean;
}

export const customerService = {
  // Get all customers
  getAllCustomers: async (params?: CustomerQueryParams): Promise<CustomerListResponse> => {
    const response = await api.get('/customers', { params });
    return response.data;
  },

  // Get customer by ID
  getCustomerById: async (id: number): Promise<Customer> => {
    const response = await api.get(`/customers/${id}`);
    return response.data;
  },

  // Create customer
  createCustomer: async (data: CreateCustomerRequest): Promise<Customer> => {
    const response = await api.post('/customers', data);
    return response.data;
  },

  // Update customer
  updateCustomer: async (id: number, data: Partial<CreateCustomerRequest & { isActive?: boolean }>): Promise<Customer> => {
    const response = await api.put(`/customers/${id}`, data);
    return response.data;
  },

  // Delete customer
  deleteCustomer: async (id: number): Promise<void> => {
    await api.delete(`/customers/${id}`);
  },

  // Toggle customer status
  toggleCustomerStatus: async (id: number): Promise<Customer> => {
    const response = await api.patch(`/customers/${id}/toggle-status`);
    return response.data;
  },

  // Get customer categories
  getCategories: async (): Promise<string[]> => {
    const response = await api.get('/customers/categories');
    return response.data;
  },
};

export default customerService;
