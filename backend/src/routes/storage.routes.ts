import express from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth';
import storageController from '../controllers/storage.controller';

const router = express.Router();

// Configure multer for memory storage (files will be uploaded to S3)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
});

// ==================== FOLDER ROUTES ====================

// Get all folders (with optional parent filter)
router.get('/folders', authenticate, storageController.getFolders);

// Get all folders (flat list for move dialog)
router.get('/folders/all', authenticate, storageController.getAllFolders);

// Get folder by ID with breadcrumb
router.get('/folders/:id', authenticate, storageController.getFolderById);

// Create a new folder
router.post('/folders', authenticate, storageController.createFolder);

// Rename a folder
router.patch('/folders/:id', authenticate, storageController.renameFolder);

// Delete a folder
router.delete('/folders/:id', authenticate, storageController.deleteFolder);

// ==================== FILE ROUTES ====================

// Get files (with optional folder filter)
router.get('/files', authenticate, storageController.getFiles);

// Upload a file
router.post('/files/upload', authenticate, upload.single('file'), storageController.uploadFile);

// Rename a file
router.patch('/files/:id', authenticate, storageController.renameFile);

// Move a file to different folder
router.patch('/files/:id/move', authenticate, storageController.moveFile);

// Delete a file
router.delete('/files/:id', authenticate, storageController.deleteFile);

// Get download URL for a file
router.get('/files/:id/download', authenticate, storageController.downloadFile);

// ==================== SHARING ROUTES ====================

// Share a file or folder with a user
router.post('/share', authenticate, storageController.shareWithUser);

// Get shares for a specific file or folder
router.get('/shares', authenticate, storageController.getSharesForItem);

// Remove a share
router.delete('/share/:id', authenticate, storageController.removeShare);

// Get items shared with current user
router.get('/shared-with-me', authenticate, storageController.getSharedWithMe);

// ==================== PUBLIC LINK ROUTES ====================

// Generate a public download link
router.post('/files/:id/public', authenticate, storageController.generatePublicLink);

// Revoke a public link
router.delete('/files/:id/public', authenticate, storageController.revokePublicLink);

// Get public file info (no auth required) - for UI display
router.get('/public/:token/info', storageController.getPublicFileInfo);

// Public download endpoint (no auth required) - returns signed URL
router.get('/public/:token/download', storageController.publicDownload);

// Legacy route - redirect to info for backward compatibility
router.get('/public/:token', storageController.getPublicFileInfo);

// ==================== STATS ====================

// Get storage usage stats
router.get('/stats', authenticate, storageController.getStorageStats);

// ==================== USERS FOR SHARING ====================

// Get users list for sharing
router.get('/users', authenticate, storageController.getUsersForSharing);

export default router;
