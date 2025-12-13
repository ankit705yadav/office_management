import api from './api';

export interface Asset {
  id: number;
  assetTag: string;
  name: string;
  description?: string;
  category: string;
  images?: string[];
  status: 'available' | 'assigned' | 'under_maintenance' | 'retired';
  notes?: string;
  createdBy?: number;
  createdAt: string;
  updatedAt: string;
  creator?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  currentAssignment?: AssetAssignment;
}

export interface AssetAssignment {
  id: number;
  assetId: number;
  assignedTo: number;
  assignedBy: number;
  purpose?: string;
  assignedDate: string;
  dueDate?: string;
  returnedDate?: string;
  status: 'assigned' | 'overdue' | 'returned' | 'lost' | 'damaged';
  returnCondition?: 'good' | 'damaged' | 'lost';
  conditionNotes?: string;
  reminderSentBefore: boolean;
  reminderSentDue: boolean;
  lastOverdueReminder?: string;
  createdAt: string;
  updatedAt: string;
  asset?: Asset;
  assignee?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  assigner?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface EmployeeSearchResult {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  department?: {
    id: number;
    name: string;
  };
}

export interface CreateAssetRequest {
  name: string;
  description?: string;
  category: string;
  notes?: string;
}

export interface UpdateAssetRequest {
  name?: string;
  description?: string;
  category?: string;
  status?: 'available' | 'assigned' | 'under_maintenance' | 'retired';
  notes?: string;
}

export interface LendAssetRequest {
  assignedTo: number;
  purpose?: string;
  dueDate?: string;
}

export interface ReturnAssetRequest {
  returnCondition: 'good' | 'damaged' | 'lost';
  conditionNotes?: string;
}

export interface AssignmentStats {
  totalAssets: number;
  availableAssets: number;
  assignedAssets: number;
  overdueAssignments: number;
  lostAssets: number;
  damagedAssets: number;
  underMaintenanceAssets: number;
  retiredAssets: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: string;
}

export interface AssignmentFilterParams {
  page?: number;
  limit?: number;
  status?: string;
  assignedTo?: number;
}

// Asset Request interfaces
export interface AssetRequest {
  id: number;
  assetId: number;
  requestedBy: number;
  purpose: string;
  requestedDueDate?: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  reviewedBy?: number;
  reviewedAt?: string;
  reviewNotes?: string;
  createdAt: string;
  updatedAt: string;
  asset?: Asset;
  requester?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    role?: string;
  };
  reviewer?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface CreateAssetRequestData {
  assetId: number;
  purpose: string;
  requestedDueDate?: string;
}

export interface AssetRequestFilterParams {
  page?: number;
  limit?: number;
  status?: 'pending' | 'approved' | 'rejected' | 'cancelled';
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class AssetService {
  // Get all assets
  async getAllAssets(params?: PaginationParams): Promise<PaginatedResponse<Asset>> {
    const response = await api.get('/assets', { params });
    return response.data;
  }

  // Get asset by ID
  async getAssetById(id: number): Promise<Asset> {
    const response = await api.get(`/assets/${id}`);
    return response.data;
  }

  // Create asset (with optional images)
  async createAsset(data: CreateAssetRequest & { images?: File[] }): Promise<Asset> {
    const formData = new FormData();
    formData.append('name', data.name);
    if (data.description) formData.append('description', data.description);
    formData.append('category', data.category);
    if (data.notes) formData.append('notes', data.notes);

    // Append images (max 5)
    if (data.images) {
      data.images.slice(0, 5).forEach((image) => {
        formData.append('images', image);
      });
    }

    const response = await api.post('/assets', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  // Update asset (with optional images)
  async updateAsset(
    id: number,
    data: UpdateAssetRequest & { images?: File[]; imagesToRemove?: string[] }
  ): Promise<Asset> {
    const formData = new FormData();
    if (data.name) formData.append('name', data.name);
    if (data.description !== undefined) formData.append('description', data.description);
    if (data.category) formData.append('category', data.category);
    if (data.status) formData.append('status', data.status);
    if (data.notes !== undefined) formData.append('notes', data.notes);

    // Images to remove
    if (data.imagesToRemove && data.imagesToRemove.length > 0) {
      formData.append('imagesToRemove', JSON.stringify(data.imagesToRemove));
    }

    // New images (max 5 total)
    if (data.images) {
      data.images.forEach((image) => {
        formData.append('images', image);
      });
    }

    const response = await api.put(`/assets/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  // Delete (retire) asset
  async deleteAsset(id: number): Promise<{ message: string }> {
    const response = await api.delete(`/assets/${id}`);
    return response.data;
  }

  // Get unique categories for autocomplete
  async getCategories(): Promise<string[]> {
    const response = await api.get('/assets/meta/categories');
    return response.data;
  }

  // Get assignment statistics
  async getAssignmentStats(): Promise<AssignmentStats> {
    const response = await api.get('/assets/meta/stats');
    return response.data;
  }

  // Search employees for autocomplete
  async searchEmployees(search?: string): Promise<EmployeeSearchResult[]> {
    const response = await api.get('/assets/meta/employees', { params: { search } });
    return response.data;
  }

  // Lend asset to a user
  async lendAsset(assetId: number, data: LendAssetRequest): Promise<AssetAssignment> {
    const response = await api.post(`/assets/${assetId}/lend`, data);
    return response.data;
  }

  // Return an asset
  async returnAsset(assignmentId: number, data: ReturnAssetRequest): Promise<AssetAssignment> {
    const response = await api.patch(`/assets/assignments/${assignmentId}/return`, data);
    return response.data;
  }

  // Get all assignments (admin/manager view)
  async getAllAssignments(params?: AssignmentFilterParams): Promise<PaginatedResponse<AssetAssignment>> {
    const response = await api.get('/assets/assignments/all', { params });
    return response.data;
  }

  // Get current user's assigned assets
  async getMyAssets(): Promise<AssetAssignment[]> {
    const response = await api.get('/assets/my');
    return response.data;
  }

  // Get overdue assignments
  async getOverdueAssets(): Promise<AssetAssignment[]> {
    const response = await api.get('/assets/assignments/overdue');
    return response.data;
  }

  // Mark assignment as lost or damaged
  async markAsLostOrDamaged(
    assignmentId: number,
    data: { status: 'lost' | 'damaged'; conditionNotes?: string }
  ): Promise<AssetAssignment> {
    const response = await api.patch(`/assets/assignments/${assignmentId}/lost-damaged`, data);
    return response.data;
  }

  // ============================================
  // Asset Request Methods
  // ============================================

  // Get available assets (for employees to browse and request)
  async getAvailableAssets(params?: PaginationParams): Promise<PaginatedResponse<Asset>> {
    const response = await api.get('/assets/available', { params: { ...params, status: 'available' } });
    return response.data;
  }

  // Create asset request
  async createAssetRequest(data: CreateAssetRequestData): Promise<{ message: string; request: AssetRequest }> {
    const response = await api.post('/assets/requests', data);
    return response.data;
  }

  // Get all asset requests (admin/manager)
  async getAllAssetRequests(params?: AssetRequestFilterParams): Promise<{
    requests: AssetRequest[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const response = await api.get('/assets/requests/all', { params });
    return response.data;
  }

  // Get my asset requests (current user)
  async getMyAssetRequests(): Promise<AssetRequest[]> {
    const response = await api.get('/assets/requests/my');
    return response.data;
  }

  // Approve asset request (admin/manager)
  async approveAssetRequest(
    requestId: number,
    data?: { reviewNotes?: string; dueDate?: string }
  ): Promise<{ message: string; request: AssetRequest; assignment: AssetAssignment }> {
    const response = await api.patch(`/assets/requests/${requestId}/approve`, data || {});
    return response.data;
  }

  // Reject asset request (admin/manager)
  async rejectAssetRequest(
    requestId: number,
    data?: { reviewNotes?: string }
  ): Promise<{ message: string; request: AssetRequest }> {
    const response = await api.patch(`/assets/requests/${requestId}/reject`, data || {});
    return response.data;
  }

  // Cancel asset request (own request)
  async cancelAssetRequest(requestId: number): Promise<{ message: string; request: AssetRequest }> {
    const response = await api.patch(`/assets/requests/${requestId}/cancel`);
    return response.data;
  }

  // Get pending request count
  async getPendingRequestCount(): Promise<{ count: number }> {
    const response = await api.get('/assets/requests/pending-count');
    return response.data;
  }

  // Helper: Get request status color
  getRequestStatusColor(status: AssetRequest['status']): string {
    const colors: Record<string, string> = {
      pending: 'warning',
      approved: 'success',
      rejected: 'error',
      cancelled: 'default',
    };
    return colors[status] || 'default';
  }

  // Helper: Get request status label
  getRequestStatusLabel(status: AssetRequest['status']): string {
    const labels: Record<string, string> = {
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected',
      cancelled: 'Cancelled',
    };
    return labels[status] || status;
  }

  // Helper: Get status color
  getStatusColor(status: Asset['status'] | AssetAssignment['status']): string {
    const colors: Record<string, string> = {
      available: 'success',
      assigned: 'info',
      overdue: 'warning',
      returned: 'default',
      lost: 'error',
      damaged: 'error',
      under_maintenance: 'warning',
      retired: 'default',
    };
    return colors[status] || 'default';
  }

  // Helper: Get status label
  getStatusLabel(status: Asset['status'] | AssetAssignment['status']): string {
    const labels: Record<string, string> = {
      available: 'Available',
      assigned: 'Assigned',
      overdue: 'Overdue',
      returned: 'Returned',
      lost: 'Lost',
      damaged: 'Damaged',
      under_maintenance: 'Under Maintenance',
      retired: 'Retired',
    };
    return labels[status] || status;
  }

  // Helper: Format employee name
  formatEmployeeName(employee?: { firstName: string; lastName: string; email?: string }): string {
    if (!employee) return 'Unknown';
    return `${employee.firstName} ${employee.lastName}`;
  }
}

export const assetService = new AssetService();
