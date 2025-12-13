import api from './api';

export interface InventoryProduct {
  id: number;
  sku: string;
  name: string;
  description?: string;
  category?: string;
  brand?: string;
  quantity: number;
  unit: string;
  unitPrice?: number;
  qrCode?: string;
  barcode?: string;
  barcodeType?: string;
  isManualEntry: boolean;
  images?: string[];
  isActive: boolean;
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

export interface GroupedProduct {
  name: string;
  totalQuantity: number;
  brand?: string;
  category?: string;
  items: InventoryProduct[];
}

export interface ProductSuggestion {
  name: string;
  brand?: string;
  category?: string;
  unitPrice?: number;
  unit?: string;
}

export interface InventoryMovement {
  id: number;
  productId: number;
  movementType: 'in' | 'out' | 'adjustment';
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reason?: string;
  referenceNumber?: string;
  images?: string[];
  // Vendor for stock in
  vendorId?: number;
  // Customer for stock out
  customerId?: number;
  // Sender details (for stock in)
  senderName?: string;
  senderPhone?: string;
  senderCompany?: string;
  senderAddress?: string;
  // Receiver details (for stock out)
  receiverName?: string;
  receiverPhone?: string;
  receiverCompany?: string;
  receiverAddress?: string;
  // Delivery person details
  deliveryPersonName?: string;
  deliveryPersonPhone?: string;
  createdBy?: number;
  createdAt: string;
  // Snake case alternatives from backend
  product_id?: number;
  movement_type?: 'in' | 'out' | 'adjustment';
  previous_quantity?: number;
  new_quantity?: number;
  reference_number?: string;
  vendor_id?: number;
  customer_id?: number;
  sender_name?: string;
  sender_phone?: string;
  sender_company?: string;
  sender_address?: string;
  receiver_name?: string;
  receiver_phone?: string;
  receiver_company?: string;
  receiver_address?: string;
  delivery_person_name?: string;
  delivery_person_phone?: string;
  created_by?: number;
  created_at?: string;
  product?: {
    id: number;
    sku: string;
    name: string;
    unit: string;
    brand?: string;
  };
  creator?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  vendor?: {
    id: number;
    name: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
  };
  customer?: {
    id: number;
    name: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
  };
}

export interface CreateProductRequest {
  sku?: string;
  name: string;
  description?: string;
  category?: string;
  brand?: string;
  quantity?: number;
  unit?: string;
  unitPrice?: number;
  barcode?: string;
  isManualEntry?: boolean;
}

export interface UpdateProductRequest {
  sku?: string;
  name?: string;
  description?: string;
  category?: string;
  brand?: string;
  unit?: string;
  unitPrice?: number;
  isActive?: boolean;
}

export interface StockMovementRequest {
  productId: number;
  movementType: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason?: string;
  referenceNumber?: string;
  // Vendor for stock in
  vendorId?: number;
  // Customer for stock out
  customerId?: number;
  // Sender details (for stock in)
  senderName?: string;
  senderPhone?: string;
  senderCompany?: string;
  senderAddress?: string;
  // Receiver details (for stock out)
  receiverName?: string;
  receiverPhone?: string;
  receiverCompany?: string;
  receiverAddress?: string;
  // Delivery person details
  deliveryPersonName?: string;
  deliveryPersonPhone?: string;
}

export interface ScanStockInResponse {
  isNew: boolean;
  barcode?: string;
  product?: InventoryProduct;
  previousQuantity?: number;
  newQuantity?: number;
  message?: string;
}

export interface ScanStockOutResponse {
  product: InventoryProduct;
  previousQuantity: number;
  newQuantity: number;
  message: string;
}

export interface BulkManualProductResponse {
  message: string;
  products: Array<{
    id: number;
    sku: string;
    name: string;
    qrCode: string;
  }>;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  brand?: string;
}

export interface MovementFilterParams {
  page?: number;
  limit?: number;
  productId?: number;
  movementType?: string;
  startDate?: string;
  endDate?: string;
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

class InventoryService {
  // Get all products
  async getAllProducts(params?: PaginationParams): Promise<PaginatedResponse<InventoryProduct>> {
    const response = await api.get('/inventory/products', { params });
    return response.data;
  }

  // Get products grouped by name
  async getGroupedProducts(params?: { search?: string; category?: string; brand?: string }): Promise<GroupedProduct[]> {
    const response = await api.get('/inventory/products/grouped', { params });
    return response.data;
  }

  // Get product by ID
  async getProductById(id: number): Promise<InventoryProduct> {
    const response = await api.get(`/inventory/products/${id}`);
    return response.data;
  }

  // Get product by physical barcode
  async getProductByBarcode(barcode: string): Promise<InventoryProduct | null> {
    try {
      const response = await api.get(`/inventory/products/by-barcode/${encodeURIComponent(barcode)}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  // Get product by QR code (legacy support)
  async getProductByQR(qrData: string): Promise<InventoryProduct> {
    const response = await api.get(`/inventory/products/scan/${encodeURIComponent(qrData)}`);
    return response.data;
  }

  // Get product name suggestions for auto-complete
  async getProductNameSuggestions(query: string): Promise<ProductSuggestion[]> {
    const response = await api.get('/inventory/products/suggestions', { params: { query } });
    return response.data;
  }

  // Quick scan stock-in (increment by 1)
  async scanStockIn(barcode: string): Promise<ScanStockInResponse> {
    const response = await api.post('/inventory/scan-stock-in', { barcode });
    return response.data;
  }

  // Quick scan stock-out (decrement by 1)
  async scanStockOut(barcode: string): Promise<ScanStockOutResponse> {
    const response = await api.post('/inventory/scan-stock-out', { barcode });
    return response.data;
  }

  // Create product (with optional images)
  async createProduct(data: CreateProductRequest & { images?: File[] }): Promise<InventoryProduct> {
    const formData = new FormData();
    if (data.sku) formData.append('sku', data.sku);
    formData.append('name', data.name);
    if (data.description) formData.append('description', data.description);
    if (data.category) formData.append('category', data.category);
    if (data.brand) formData.append('brand', data.brand);
    if (data.quantity !== undefined) formData.append('quantity', data.quantity.toString());
    if (data.unit) formData.append('unit', data.unit);
    if (data.unitPrice !== undefined) formData.append('unitPrice', data.unitPrice.toString());
    if (data.barcode) formData.append('barcode', data.barcode);
    if (data.isManualEntry !== undefined) formData.append('isManualEntry', data.isManualEntry.toString());

    // Append images
    if (data.images) {
      data.images.forEach((image) => {
        formData.append('images', image);
      });
    }

    const response = await api.post('/inventory/products', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  // Update product (with optional images)
  async updateProduct(
    id: number,
    data: UpdateProductRequest & { images?: File[]; imagesToRemove?: string[] }
  ): Promise<InventoryProduct> {
    const formData = new FormData();
    if (data.sku) formData.append('sku', data.sku);
    if (data.name) formData.append('name', data.name);
    if (data.description !== undefined) formData.append('description', data.description);
    if (data.category !== undefined) formData.append('category', data.category);
    if (data.brand !== undefined) formData.append('brand', data.brand);
    if (data.unit) formData.append('unit', data.unit);
    if (data.unitPrice !== undefined) formData.append('unitPrice', data.unitPrice.toString());
    if (data.isActive !== undefined) formData.append('isActive', data.isActive.toString());

    // Images to remove
    if (data.imagesToRemove && data.imagesToRemove.length > 0) {
      formData.append('imagesToRemove', JSON.stringify(data.imagesToRemove));
    }

    // New images
    if (data.images) {
      data.images.forEach((image) => {
        formData.append('images', image);
      });
    }

    const response = await api.put(`/inventory/products/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  // Delete product
  async deleteProduct(id: number): Promise<{ message: string }> {
    const response = await api.delete(`/inventory/products/${id}`);
    return response.data;
  }

  // Create multiple individual products for manual entry (each with quantity = 1)
  async createBulkManualProducts(data: {
    name: string;
    description?: string;
    category?: string;
    brand?: string;
    quantity: number;
    unit?: string;
    unitPrice?: number;
    vendorId?: number;
    images?: File[];
  }): Promise<BulkManualProductResponse> {
    const formData = new FormData();
    formData.append('name', data.name);
    if (data.description) formData.append('description', data.description);
    if (data.category) formData.append('category', data.category);
    if (data.brand) formData.append('brand', data.brand);
    formData.append('quantity', data.quantity.toString());
    if (data.unit) formData.append('unit', data.unit);
    if (data.unitPrice !== undefined) formData.append('unitPrice', data.unitPrice.toString());
    if (data.vendorId) formData.append('vendorId', data.vendorId.toString());

    // Append images
    if (data.images) {
      data.images.forEach((image) => {
        formData.append('images', image);
      });
    }

    const response = await api.post('/inventory/products/bulk-manual', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  // Record stock movement (with optional images)
  async recordStockMovement(data: StockMovementRequest & { images?: File[] }): Promise<{ movement: InventoryMovement; product: InventoryProduct }> {
    const formData = new FormData();
    formData.append('productId', data.productId.toString());
    formData.append('movementType', data.movementType);
    formData.append('quantity', data.quantity.toString());
    if (data.reason) formData.append('reason', data.reason);
    if (data.referenceNumber) formData.append('referenceNumber', data.referenceNumber);

    // Vendor for stock in
    if (data.vendorId) formData.append('vendorId', data.vendorId.toString());
    // Customer for stock out
    if (data.customerId) formData.append('customerId', data.customerId.toString());

    // Sender details (for stock in)
    if (data.senderName) formData.append('senderName', data.senderName);
    if (data.senderPhone) formData.append('senderPhone', data.senderPhone);
    if (data.senderCompany) formData.append('senderCompany', data.senderCompany);
    if (data.senderAddress) formData.append('senderAddress', data.senderAddress);

    // Receiver details (for stock out)
    if (data.receiverName) formData.append('receiverName', data.receiverName);
    if (data.receiverPhone) formData.append('receiverPhone', data.receiverPhone);
    if (data.receiverCompany) formData.append('receiverCompany', data.receiverCompany);
    if (data.receiverAddress) formData.append('receiverAddress', data.receiverAddress);

    // Delivery person details
    if (data.deliveryPersonName) formData.append('deliveryPersonName', data.deliveryPersonName);
    if (data.deliveryPersonPhone) formData.append('deliveryPersonPhone', data.deliveryPersonPhone);

    // Append images
    if (data.images) {
      data.images.forEach((image) => {
        formData.append('images', image);
      });
    }

    const response = await api.post('/inventory/movements', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  // Get stock movements
  async getStockMovements(params?: MovementFilterParams): Promise<PaginatedResponse<InventoryMovement>> {
    const response = await api.get('/inventory/movements', { params });
    return response.data;
  }

  // Get categories
  async getCategories(): Promise<string[]> {
    const response = await api.get('/inventory/categories');
    return response.data;
  }

  // Get brands
  async getBrands(): Promise<string[]> {
    const response = await api.get('/inventory/brands');
    return response.data;
  }

  // Helper: Format file size for display
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export const inventoryService = new InventoryService();
