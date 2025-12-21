import api from './api';

// Types
export enum ClientStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export interface Client {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  contactPerson?: string;
  notes?: string;
  status: ClientStatus;
  createdBy?: number;
  createdAt: string;
  updatedAt: string;
  creator?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface CreateClientRequest {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  contactPerson?: string;
  notes?: string;
  status?: ClientStatus;
}

export interface UpdateClientRequest {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  contactPerson?: string;
  notes?: string;
  status?: ClientStatus;
}

interface ApiResponse<T> {
  status: string;
  data?: T;
  message?: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const clientService = {
  // Get all clients with pagination and filters
  getClients: async (params?: {
    page?: number;
    limit?: number;
    status?: ClientStatus;
    search?: string;
  }): Promise<{ clients: Client[]; pagination: Pagination }> => {
    const response = await api.get<ApiResponse<{ clients: Client[]; pagination: Pagination }>>(
      '/clients',
      { params }
    );
    return {
      clients: response.data.data?.clients || [],
      pagination: response.data.data?.pagination || { total: 0, page: 1, limit: 50, totalPages: 0 },
    };
  },

  // Get client by ID
  getClientById: async (id: number): Promise<Client> => {
    const response = await api.get<ApiResponse<{ client: Client }>>(`/clients/${id}`);
    return response.data.data!.client;
  },

  // Create a new client
  createClient: async (data: CreateClientRequest): Promise<Client> => {
    const response = await api.post<ApiResponse<{ client: Client }>>('/clients', data);
    return response.data.data!.client;
  },

  // Update a client
  updateClient: async (id: number, data: UpdateClientRequest): Promise<Client> => {
    const response = await api.put<ApiResponse<{ client: Client }>>(`/clients/${id}`, data);
    return response.data.data!.client;
  },

  // Delete a client
  deleteClient: async (id: number): Promise<void> => {
    await api.delete(`/clients/${id}`);
  },
};
