import { Request, Response } from 'express';
import { Op } from 'sequelize';
import StorageFolder from '../models/StorageFolder';
import StorageFile from '../models/StorageFile';
import StorageShare from '../models/StorageShare';
import User from '../models/User';
import storageService from '../services/storage.service';

// ==================== FOLDER OPERATIONS ====================

/**
 * Get folders (with optional parent filter)
 */
export const getFolders = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { parentId } = req.query;

    const where: any = { ownerId: userId };
    if (parentId === 'null' || parentId === undefined) {
      where.parentId = null;
    } else if (parentId) {
      where.parentId = parseInt(parentId as string, 10);
    }

    const folders = await StorageFolder.findAll({
      where,
      order: [['name', 'ASC']],
    });

    res.json({ success: true, data: folders });
  } catch (error) {
    console.error('Error fetching folders:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch folders' });
  }
};

/**
 * Get all folders for the user (flat list)
 */
export const getAllFolders = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const folders = await StorageFolder.findAll({
      where: { ownerId: userId },
      order: [['path', 'ASC']],
    });

    res.json({ success: true, data: folders });
  } catch (error) {
    console.error('Error fetching all folders:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch folders' });
  }
};

/**
 * Get folder by ID with breadcrumb
 */
export const getFolderById = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const folder = await StorageFolder.findOne({
      where: { id: parseInt(id, 10), ownerId: userId },
    });

    if (!folder) {
      res.status(404).json({ success: false, message: 'Folder not found' });
      return;
    }

    // Build breadcrumb
    const breadcrumb: { id: number; name: string }[] = [];
    let currentFolder: StorageFolder | null = folder;
    while (currentFolder) {
      breadcrumb.unshift({ id: currentFolder.id, name: currentFolder.name });
      if (currentFolder.parentId) {
        currentFolder = await StorageFolder.findByPk(currentFolder.parentId);
      } else {
        currentFolder = null;
      }
    }

    res.json({ success: true, data: { folder, breadcrumb } });
  } catch (error) {
    console.error('Error fetching folder:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch folder' });
  }
};

/**
 * Create a new folder
 */
export const createFolder = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { name, parentId } = req.body;

    if (!name) {
      res.status(400).json({ success: false, message: 'Folder name is required' });
      return;
    }

    // Build path
    let path = `/${name}`;
    if (parentId) {
      const parentFolder = await StorageFolder.findOne({
        where: { id: parentId, ownerId: userId },
      });
      if (!parentFolder) {
        res.status(404).json({ success: false, message: 'Parent folder not found' });
        return;
      }
      path = `${parentFolder.path}/${name}`;
    }

    // Check for duplicate folder name in same location
    const existing = await StorageFolder.findOne({
      where: { name, parentId: parentId || null, ownerId: userId },
    });
    if (existing) {
      res.status(400).json({ success: false, message: 'A folder with this name already exists' });
      return;
    }

    const folder = await StorageFolder.create({
      name,
      parentId: parentId || null,
      ownerId: userId,
      path,
    });

    res.status(201).json({ success: true, data: folder });
  } catch (error) {
    console.error('Error creating folder:', error);
    res.status(500).json({ success: false, message: 'Failed to create folder' });
  }
};

/**
 * Rename a folder
 */
export const renameFolder = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
      res.status(400).json({ success: false, message: 'Folder name is required' });
      return;
    }

    const folder = await StorageFolder.findOne({
      where: { id: parseInt(id, 10), ownerId: userId },
    });

    if (!folder) {
      res.status(404).json({ success: false, message: 'Folder not found' });
      return;
    }

    // Check for duplicate name
    const existing = await StorageFolder.findOne({
      where: {
        name,
        parentId: folder.parentId,
        ownerId: userId,
        id: { [Op.ne]: parseInt(id, 10) },
      },
    });
    if (existing) {
      res.status(400).json({ success: false, message: 'A folder with this name already exists' });
      return;
    }

    // Update path
    const oldPath = folder.path;
    const pathParts = oldPath.split('/');
    pathParts[pathParts.length - 1] = name;
    const newPath = pathParts.join('/');

    await folder.update({ name, path: newPath });

    // Update paths of all child folders
    await StorageFolder.update(
      {
        path: StorageFolder.sequelize!.literal(`REPLACE(path, '${oldPath}/', '${newPath}/')`)
      } as any,
      {
        where: {
          ownerId: userId,
          path: { [Op.like]: `${oldPath}/%` },
        },
      }
    );

    res.json({ success: true, data: folder });
  } catch (error) {
    console.error('Error renaming folder:', error);
    res.status(500).json({ success: false, message: 'Failed to rename folder' });
  }
};

/**
 * Delete a folder and all its contents
 */
export const deleteFolder = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const folder = await StorageFolder.findOne({
      where: { id: parseInt(id, 10), ownerId: userId },
    });

    if (!folder) {
      res.status(404).json({ success: false, message: 'Folder not found' });
      return;
    }

    // Get all files in this folder and subfolders to delete from S3
    const allFolderIds = [folder.id];
    const subFolders = await StorageFolder.findAll({
      where: {
        ownerId: userId,
        path: { [Op.like]: `${folder.path}/%` },
      },
    });
    subFolders.forEach((sf) => allFolderIds.push(sf.id));

    const files = await StorageFile.findAll({
      where: { folderId: { [Op.in]: allFolderIds } },
    });

    // Delete files from S3
    for (const file of files) {
      try {
        await storageService.deleteFromS3(file.s3Key);
      } catch (err) {
        console.error(`Failed to delete file ${file.s3Key} from S3:`, err);
      }
    }

    // Delete folder (cascade will delete files and subfolders)
    await folder.destroy();

    res.json({ success: true, message: 'Folder deleted successfully' });
  } catch (error) {
    console.error('Error deleting folder:', error);
    res.status(500).json({ success: false, message: 'Failed to delete folder' });
  }
};

// ==================== FILE OPERATIONS ====================

/**
 * Get files in a folder or root
 */
export const getFiles = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { folderId } = req.query;

    const where: any = { ownerId: userId };
    if (folderId === 'null' || folderId === undefined) {
      where.folderId = null;
    } else if (folderId) {
      where.folderId = parseInt(folderId as string, 10);
    }

    const files = await StorageFile.findAll({
      where,
      order: [['name', 'ASC']],
    });

    res.json({ success: true, data: files });
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch files' });
  }
};

/**
 * Upload a file
 */
export const uploadFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { folderId } = req.body;
    const file = req.file;

    if (!file) {
      res.status(400).json({ success: false, message: 'No file uploaded' });
      return;
    }

    // Validate file size
    if (!storageService.validateFileSize(file.size)) {
      res.status(400).json({
        success: false,
        message: `File size exceeds maximum limit of ${storageService.formatFileSize(storageService.MAX_FILE_SIZE)}`,
      });
      return;
    }

    // Validate folder if provided
    if (folderId) {
      const folder = await StorageFolder.findOne({
        where: { id: folderId, ownerId: userId },
      });
      if (!folder) {
        res.status(404).json({ success: false, message: 'Folder not found' });
        return;
      }
    }

    // Upload to S3
    const uploadResult = await storageService.uploadToS3(file, userId);

    // Create file record
    const storageFile = await StorageFile.create({
      name: file.originalname,
      folderId: folderId || null,
      ownerId: userId,
      s3Key: uploadResult.s3Key,
      s3Url: uploadResult.s3Url,
      fileSize: uploadResult.fileSize,
      fileType: uploadResult.fileType,
      mimeType: uploadResult.mimeType,
      isPublic: false,
    });

    res.status(201).json({ success: true, data: storageFile });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ success: false, message: 'Failed to upload file' });
  }
};

/**
 * Rename a file
 */
export const renameFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
      res.status(400).json({ success: false, message: 'File name is required' });
      return;
    }

    const file = await StorageFile.findOne({
      where: { id: parseInt(id, 10), ownerId: userId },
    });

    if (!file) {
      res.status(404).json({ success: false, message: 'File not found' });
      return;
    }

    await file.update({ name });

    res.json({ success: true, data: file });
  } catch (error) {
    console.error('Error renaming file:', error);
    res.status(500).json({ success: false, message: 'Failed to rename file' });
  }
};

/**
 * Move a file to a different folder
 */
export const moveFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { folderId } = req.body;

    const file = await StorageFile.findOne({
      where: { id: parseInt(id, 10), ownerId: userId },
    });

    if (!file) {
      res.status(404).json({ success: false, message: 'File not found' });
      return;
    }

    // Validate target folder if provided
    if (folderId) {
      const folder = await StorageFolder.findOne({
        where: { id: folderId, ownerId: userId },
      });
      if (!folder) {
        res.status(404).json({ success: false, message: 'Target folder not found' });
        return;
      }
    }

    await file.update({ folderId: folderId || null });

    res.json({ success: true, data: file });
  } catch (error) {
    console.error('Error moving file:', error);
    res.status(500).json({ success: false, message: 'Failed to move file' });
  }
};

/**
 * Delete a file
 */
export const deleteFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const file = await StorageFile.findOne({
      where: { id: parseInt(id, 10), ownerId: userId },
    });

    if (!file) {
      res.status(404).json({ success: false, message: 'File not found' });
      return;
    }

    // Delete from S3
    try {
      await storageService.deleteFromS3(file.s3Key);
    } catch (err) {
      console.error(`Failed to delete file ${file.s3Key} from S3:`, err);
    }

    // Delete from database
    await file.destroy();

    res.json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ success: false, message: 'Failed to delete file' });
  }
};

/**
 * Get download URL for a file
 */
export const downloadFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    // Check if user owns the file or has it shared with them
    let file = await StorageFile.findOne({
      where: { id: parseInt(id, 10), ownerId: userId },
    });

    if (!file) {
      // Check if shared with user
      const share = await StorageShare.findOne({
        where: { fileId: parseInt(id, 10), sharedWith: userId },
        include: [{ model: StorageFile, as: 'file' }],
      });
      if (share && share.file) {
        file = share.file;
      }
    }

    if (!file) {
      res.status(404).json({ success: false, message: 'File not found' });
      return;
    }

    // Generate signed URL
    const downloadUrl = await storageService.getSignedDownloadUrl(file.s3Key);

    res.json({ success: true, data: { downloadUrl, fileName: file.name } });
  } catch (error) {
    console.error('Error getting download URL:', error);
    res.status(500).json({ success: false, message: 'Failed to get download URL' });
  }
};

// ==================== SHARING OPERATIONS ====================

/**
 * Share a file or folder with a user
 */
export const shareWithUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { fileId, folderId, sharedWith, permission = 'view' } = req.body;

    if (!fileId && !folderId) {
      res.status(400).json({ success: false, message: 'File ID or Folder ID is required' });
      return;
    }

    if (fileId && folderId) {
      res.status(400).json({ success: false, message: 'Provide either File ID or Folder ID, not both' });
      return;
    }

    if (!sharedWith) {
      res.status(400).json({ success: false, message: 'User to share with is required' });
      return;
    }

    // Can't share with yourself
    if (sharedWith === userId) {
      res.status(400).json({ success: false, message: 'Cannot share with yourself' });
      return;
    }

    // Validate target user exists
    const targetUser = await User.findByPk(sharedWith);
    if (!targetUser) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // Validate ownership
    if (fileId) {
      const file = await StorageFile.findOne({ where: { id: fileId, ownerId: userId } });
      if (!file) {
        res.status(404).json({ success: false, message: 'File not found' });
        return;
      }
    } else {
      const folder = await StorageFolder.findOne({ where: { id: folderId, ownerId: userId } });
      if (!folder) {
        res.status(404).json({ success: false, message: 'Folder not found' });
        return;
      }
    }

    // Check if already shared
    const existing = await StorageShare.findOne({
      where: { fileId: fileId || null, folderId: folderId || null, sharedWith },
    });
    if (existing) {
      // Update permission
      await existing.update({ permission });
      res.json({ success: true, data: existing, message: 'Share updated' });
      return;
    }

    // Create share
    const share = await StorageShare.create({
      fileId: fileId || undefined,
      folderId: folderId || undefined,
      sharedWith,
      sharedBy: userId,
      permission,
    });

    res.status(201).json({ success: true, data: share });
  } catch (error) {
    console.error('Error sharing:', error);
    res.status(500).json({ success: false, message: 'Failed to share' });
  }
};

/**
 * Remove a share
 */
export const removeShare = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const share = await StorageShare.findOne({
      where: { id: parseInt(id, 10), sharedBy: userId },
    });

    if (!share) {
      res.status(404).json({ success: false, message: 'Share not found' });
      return;
    }

    await share.destroy();

    res.json({ success: true, message: 'Share removed successfully' });
  } catch (error) {
    console.error('Error removing share:', error);
    res.status(500).json({ success: false, message: 'Failed to remove share' });
  }
};

/**
 * Get items shared with the current user
 */
export const getSharedWithMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const shares = await StorageShare.findAll({
      where: { sharedWith: userId },
      include: [
        {
          model: StorageFile,
          as: 'file',
          include: [{ model: User, as: 'owner', attributes: ['id', 'firstName', 'lastName', 'email'] }],
        },
        {
          model: StorageFolder,
          as: 'folder',
          include: [{ model: User, as: 'owner', attributes: ['id', 'firstName', 'lastName', 'email'] }],
        },
        { model: User, as: 'sharedByUser', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
      order: [['created_at', 'DESC']],
    });

    res.json({ success: true, data: shares });
  } catch (error) {
    console.error('Error fetching shared items:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch shared items' });
  }
};

/**
 * Get shares for a specific file or folder
 */
export const getSharesForItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { fileId, folderId } = req.query;

    if (!fileId && !folderId) {
      res.status(400).json({ success: false, message: 'File ID or Folder ID is required' });
      return;
    }

    const fileIdNum = fileId ? parseInt(fileId as string, 10) : undefined;
    const folderIdNum = folderId ? parseInt(folderId as string, 10) : undefined;

    // Validate ownership
    if (fileIdNum) {
      const file = await StorageFile.findOne({ where: { id: fileIdNum, ownerId: userId } });
      if (!file) {
        res.status(404).json({ success: false, message: 'File not found' });
        return;
      }
    } else if (folderIdNum) {
      const folder = await StorageFolder.findOne({ where: { id: folderIdNum, ownerId: userId } });
      if (!folder) {
        res.status(404).json({ success: false, message: 'Folder not found' });
        return;
      }
    }

    const shares = await StorageShare.findAll({
      where: fileIdNum ? { fileId: fileIdNum } : { folderId: folderIdNum },
      include: [{ model: User, as: 'sharedWithUser', attributes: ['id', 'firstName', 'lastName', 'email'] }],
    });

    res.json({ success: true, data: shares });
  } catch (error) {
    console.error('Error fetching shares:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch shares' });
  }
};

// ==================== PUBLIC LINK OPERATIONS ====================

/**
 * Generate a public download link for a file
 */
export const generatePublicLink = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { expiresIn } = req.body; // hours

    const file = await StorageFile.findOne({
      where: { id: parseInt(id, 10), ownerId: userId },
    });

    if (!file) {
      res.status(404).json({ success: false, message: 'File not found' });
      return;
    }

    const publicToken = storageService.generatePublicToken();
    const publicExpiresAt = expiresIn
      ? new Date(Date.now() + expiresIn * 60 * 60 * 1000)
      : null;

    await file.update({
      isPublic: true,
      publicToken,
      publicExpiresAt,
    } as any);

    res.json({
      success: true,
      data: {
        publicToken,
        publicUrl: `/api/storage/public/${publicToken}`,
        expiresAt: publicExpiresAt,
      },
    });
  } catch (error) {
    console.error('Error generating public link:', error);
    res.status(500).json({ success: false, message: 'Failed to generate public link' });
  }
};

/**
 * Revoke a public link
 */
export const revokePublicLink = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const file = await StorageFile.findOne({
      where: { id: parseInt(id, 10), ownerId: userId },
    });

    if (!file) {
      res.status(404).json({ success: false, message: 'File not found' });
      return;
    }

    await file.update({
      isPublic: false,
      publicToken: null,
      publicExpiresAt: null,
    } as any);

    res.json({ success: true, message: 'Public link revoked' });
  } catch (error) {
    console.error('Error revoking public link:', error);
    res.status(500).json({ success: false, message: 'Failed to revoke public link' });
  }
};

/**
 * Get public file info (no auth required) - does not expose S3 URL
 */
export const getPublicFileInfo = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;

    const file = await StorageFile.findOne({
      where: { publicToken: token, isPublic: true },
      include: [{ model: User, as: 'owner', attributes: ['id', 'firstName', 'lastName'] }],
    });

    if (!file) {
      res.status(404).json({ success: false, message: 'File not found or link expired' });
      return;
    }

    // Check expiration
    if (file.publicExpiresAt) {
      const expiresAt = new Date(file.publicExpiresAt);
      const now = new Date();
      if (expiresAt < now) {
        res.status(410).json({ success: false, message: 'Public link has expired' });
        return;
      }
    }

    // Return file info without exposing S3 URL
    res.json({
      success: true,
      data: {
        name: file.name,
        fileSize: file.fileSize,
        fileType: file.fileType,
        mimeType: file.mimeType,
        expiresAt: file.publicExpiresAt,
        sharedBy: file.owner ? `${file.owner.firstName} ${file.owner.lastName}` : 'Unknown',
        createdAt: file.createdAt,
      },
    });
  } catch (error) {
    console.error('Error getting public file info:', error);
    res.status(500).json({ success: false, message: 'Failed to get file info' });
  }
};

/**
 * Public download endpoint (no auth required) - returns signed URL for download
 */
export const publicDownload = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;

    const file = await StorageFile.findOne({
      where: { publicToken: token, isPublic: true },
    });

    if (!file) {
      res.status(404).json({ success: false, message: 'File not found or link expired' });
      return;
    }

    // Check expiration
    if (file.publicExpiresAt) {
      const expiresAt = new Date(file.publicExpiresAt);
      const now = new Date();
      if (expiresAt < now) {
        res.status(410).json({ success: false, message: 'Public link has expired' });
        return;
      }
    }

    // Generate signed URL for download
    const downloadUrl = await storageService.getSignedDownloadUrl(file.s3Key);

    res.json({ success: true, data: { downloadUrl, fileName: file.name } });
  } catch (error) {
    console.error('Error in public download:', error);
    res.status(500).json({ success: false, message: 'Failed to download file' });
  }
};

// ==================== STORAGE STATS ====================

/**
 * Get storage usage stats for current user
 */
export const getStorageStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const files = await StorageFile.findAll({
      where: { ownerId: userId },
      attributes: ['fileSize'],
    });

    const totalSize = files.reduce((sum, file) => sum + Number(file.fileSize), 0);
    const fileCount = files.length;

    const folderCount = await StorageFolder.count({ where: { ownerId: userId } });

    res.json({
      success: true,
      data: {
        totalSize,
        totalSizeFormatted: storageService.formatFileSize(totalSize),
        fileCount,
        folderCount,
      },
    });
  } catch (error) {
    console.error('Error getting storage stats:', error);
    res.status(500).json({ success: false, message: 'Failed to get storage stats' });
  }
};

/**
 * Get users list for sharing (accessible by all authenticated users)
 */
export const getUsersForSharing = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'firstName', 'lastName', 'email'],
      where: { status: 'active' },
      order: [['firstName', 'ASC'], ['lastName', 'ASC']],
    });

    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Error fetching users for sharing:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
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
  removeShare,
  getSharedWithMe,
  getSharesForItem,
  generatePublicLink,
  revokePublicLink,
  getPublicFileInfo,
  publicDownload,
  getStorageStats,
  getUsersForSharing,
};
