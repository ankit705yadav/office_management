// Client API service

import api from './api';
import { Client, Pagination, ClientStatus } from '../types';

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

export interface UpdateClientRequest extends Partial<CreateClientRequest> {}

export interface ClientFilters {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

export interface ClientStats {
  total: number;
  active: number;
}

export const clientService = {
  /**
   * Get clients with pagination and filters
   */
  getClients: async (
    filters?: ClientFilters
  ): Promise<{ clients: Client[]; pagination: Pagination; stats: ClientStats }> => {
    const response = await api.get('/clients', { params: filters });
    const data = response.data.data;

    return {
      clients: data?.clients || [],
      pagination: data?.pagination || {
        total: 0,
        page: filters?.page || 1,
        limit: filters?.limit || 20,
        totalPages: 0,
      },
      stats: {
        total: data?.pagination?.total || 0,
        active: data?.clients?.filter((c: Client) => c.status === 'active').length || 0,
      },
    };
  },

  /**
   * Get client by ID
   */
  getClientById: async (id: number): Promise<Client> => {
    const response = await api.get(`/clients/${id}`);
    return response.data.data?.client || response.data.data;
  },

  /**
   * Create a new client
   */
  createClient: async (data: CreateClientRequest): Promise<Client> => {
    const response = await api.post('/clients', data);
    return response.data.data?.client || response.data.data;
  },

  /**
   * Update an existing client
   */
  updateClient: async (id: number, data: UpdateClientRequest): Promise<Client> => {
    const response = await api.put(`/clients/${id}`, data);
    return response.data.data?.client || response.data.data;
  },

  /**
   * Delete a client
   */
  deleteClient: async (id: number): Promise<void> => {
    await api.delete(`/clients/${id}`);
  },
};

export default clientService;
