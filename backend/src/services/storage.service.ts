import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import config from '../config/environment';

// Initialize S3 client
const s3Client = new S3Client({
  region: config.aws.region,
  credentials: {
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey,
  },
});

const BUCKET_NAME = config.aws.s3Bucket;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export interface UploadResult {
  s3Key: string;
  s3Url: string;
  fileSize: number;
  fileType: string;
  mimeType: string;
}

/**
 * Upload a file to S3
 */
export async function uploadToS3(
  file: Express.Multer.File,
  userId: number
): Promise<UploadResult> {
  // Generate unique key
  const fileExtension = file.originalname.split('.').pop() || '';
  const uniqueId = uuidv4();
  const s3Key = `users/${userId}/files/${uniqueId}-${file.originalname}`;

  // Upload to S3
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: s3Key,
    Body: file.buffer,
    ContentType: file.mimetype,
    Metadata: {
      originalName: file.originalname,
      uploadedBy: userId.toString(),
    },
  });

  await s3Client.send(command);

  // Generate the S3 URL
  const s3Url = `https://${BUCKET_NAME}.s3.${config.aws.region}.amazonaws.com/${s3Key}`;

  return {
    s3Key,
    s3Url,
    fileSize: file.size,
    fileType: fileExtension,
    mimeType: file.mimetype,
  };
}

/**
 * Delete a file from S3
 */
export async function deleteFromS3(s3Key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: s3Key,
  });

  await s3Client.send(command);
}

/**
 * Generate a pre-signed URL for downloading a file
 */
export async function getSignedDownloadUrl(
  s3Key: string,
  expiresIn: number = 3600 // 1 hour default
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: s3Key,
  });

  const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
  return signedUrl;
}

/**
 * Generate a unique public token for sharing files
 */
export function generatePublicToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
}

/**
 * Get file type category from mime type
 */
export function getFileTypeCategory(mimeType: string): string {
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
  return 'other';
}

/**
 * Validate file size
 */
export function validateFileSize(size: number): boolean {
  return size <= MAX_FILE_SIZE;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default {
  uploadToS3,
  deleteFromS3,
  getSignedDownloadUrl,
  generatePublicToken,
  getFileExtension,
  getFileTypeCategory,
  validateFileSize,
  formatFileSize,
  MAX_FILE_SIZE,
};
