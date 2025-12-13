import api from './api';

// ==================== INTERFACES ====================

export interface StorageFolder {
  id: number;
  name: string;
  parentId: number | null;
  ownerId: number;
  path: string;
  createdAt: string;
  updatedAt: string;
  owner?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface StorageFile {
  id: number;
  name: string;
  folderId: number | null;
  ownerId: number;
  s3Key: string;
  s3Url?: string;
  fileSize: number;
  fileType?: string;
  mimeType?: string;
  isPublic: boolean;
  publicToken?: string;
  publicExpiresAt?: string;
  createdAt: string;
  updatedAt: string;
  owner?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface StorageShare {
  id: number;
  fileId?: number;
  folderId?: number;
  file?: StorageFile;
  folder?: StorageFolder;
  sharedWith: number;
  sharedBy: number;
  sharedWithUser?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  sharedByUser?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  permission: 'view' | 'edit';
  createdAt: string;
}

export interface StorageStats {
  totalSize: number;
  totalSizeFormatted: string;
  fileCount: number;
  folderCount: number;
}

export interface BreadcrumbItem {
  id: number;
  name: string;
}

// ==================== FOLDER API ====================

export const getFolders = async (parentId?: number | null): Promise<StorageFolder[]> => {
  const params = parentId !== undefined ? { parentId: parentId === null ? 'null' : parentId } : {};
  const response = await api.get('/storage/folders', { params });
  return response.data.data;
};

export const getAllFolders = async (): Promise<StorageFolder[]> => {
  const response = await api.get('/storage/folders/all');
  return response.data.data;
};

export const getFolderById = async (id: number): Promise<{ folder: StorageFolder; breadcrumb: BreadcrumbItem[] }> => {
  const response = await api.get(`/storage/folders/${id}`);
  return response.data.data;
};

export const createFolder = async (name: string, parentId?: number | null): Promise<StorageFolder> => {
  const response = await api.post('/storage/folders', { name, parentId });
  return response.data.data;
};

export const renameFolder = async (id: number, name: string): Promise<StorageFolder> => {
  const response = await api.patch(`/storage/folders/${id}`, { name });
  return response.data.data;
};

export const deleteFolder = async (id: number): Promise<void> => {
  await api.delete(`/storage/folders/${id}`);
};

// ==================== FILE API ====================

export const getFiles = async (folderId?: number | null): Promise<StorageFile[]> => {
  const params = folderId !== undefined ? { folderId: folderId === null ? 'null' : folderId } : {};
  const response = await api.get('/storage/files', { params });
  return response.data.data;
};

export const uploadFile = async (
  file: File,
  folderId?: number | null,
  onProgress?: (progress: number) => void
): Promise<StorageFile> => {
  const formData = new FormData();
  formData.append('file', file);
  if (folderId) {
    formData.append('folderId', String(folderId));
  }

  const response = await api.post('/storage/files/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(progress);
      }
    },
  });

  return response.data.data;
};

export const renameFile = async (id: number, name: string): Promise<StorageFile> => {
  const response = await api.patch(`/storage/files/${id}`, { name });
  return response.data.data;
};

export const moveFile = async (id: number, folderId: number | null): Promise<StorageFile> => {
  const response = await api.patch(`/storage/files/${id}/move`, { folderId });
  return response.data.data;
};

export const deleteFile = async (id: number): Promise<void> => {
  await api.delete(`/storage/files/${id}`);
};

export const downloadFile = async (id: number): Promise<{ downloadUrl: string; fileName: string }> => {
  const response = await api.get(`/storage/files/${id}/download`);
  return response.data.data;
};

// ==================== SHARING API ====================

export const shareWithUser = async (
  fileId: number | undefined,
  folderId: number | undefined,
  sharedWith: number,
  permission: 'view' | 'edit' = 'view'
): Promise<StorageShare> => {
  const response = await api.post('/storage/share', { fileId, folderId, sharedWith, permission });
  return response.data.data;
};

export const getSharesForItem = async (
  fileId?: number,
  folderId?: number
): Promise<StorageShare[]> => {
  const params = fileId ? { fileId } : { folderId };
  const response = await api.get('/storage/shares', { params });
  return response.data.data;
};

export const removeShare = async (id: number): Promise<void> => {
  await api.delete(`/storage/share/${id}`);
};

export const getSharedWithMe = async (): Promise<StorageShare[]> => {
  const response = await api.get('/storage/shared-with-me');
  return response.data.data;
};

// ==================== PUBLIC LINK API ====================

export const generatePublicLink = async (
  fileId: number,
  expiresIn?: number
): Promise<{ publicToken: string; publicUrl: string; expiresAt: string | null }> => {
  const response = await api.post(`/storage/files/${fileId}/public`, { expiresIn });
  return response.data.data;
};

export const revokePublicLink = async (fileId: number): Promise<void> => {
  await api.delete(`/storage/files/${fileId}/public`);
};

export const publicDownload = async (
  token: string
): Promise<{ downloadUrl: string; fileName: string }> => {
  const response = await api.get(`/storage/public/${token}`);
  return response.data.data;
};

// ==================== STATS API ====================

export const getStorageStats = async (): Promise<StorageStats> => {
  const response = await api.get('/storage/stats');
  return response.data.data;
};

// ==================== UTILITY FUNCTIONS ====================

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getFileIcon = (mimeType?: string, fileType?: string): string => {
  if (!mimeType) return 'file';
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType === 'application/pdf') return 'pdf';
  if (
    mimeType === 'application/msword' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  )
    return 'document';
  if (
    mimeType === 'application/vnd.ms-excel' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  )
    return 'spreadsheet';
  if (
    mimeType === 'application/vnd.ms-powerpoint' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  )
    return 'presentation';
  if (
    mimeType === 'application/zip' ||
    mimeType === 'application/x-rar-compressed' ||
    mimeType === 'application/x-7z-compressed'
  )
    return 'archive';
  if (mimeType.startsWith('text/')) return 'text';
  return 'file';
};

export default {
  getFolders,
  getAllFolders,
  getFolderById,
  createFolder,
  renameFolder,
  deleteFolder,
  getFiles,
  uploadFile,
  renameFile,
  moveFile,
  deleteFile,
  downloadFile,
  shareWithUser,
  getSharesForItem,
  removeShare,
  getSharedWithMe,
  generatePublicLink,
  revokePublicLink,
  publicDownload,
  getStorageStats,
  formatFileSize,
  getFileIcon,
};
