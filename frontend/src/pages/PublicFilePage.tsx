import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  IconButton,
} from '@mui/material';
import {
  Download,
  InsertDriveFile,
  Image as ImageIcon,
  PictureAsPdf,
  Description,
  VideoFile,
  AudioFile,
  Folder,
  Error as ErrorIcon,
  Schedule,
  Person,
  DarkMode,
  LightMode,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useTheme } from '@/contexts/ThemeContext';
import logoImage from '@/assets/logo_1.png';

interface PublicFileInfo {
  name: string;
  fileSize: number;
  fileType: string;
  mimeType: string;
  expiresAt: string | null;
  sharedBy: string;
  createdAt: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const PublicFilePage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const { theme, toggleTheme } = useTheme();
  const [fileInfo, setFileInfo] = useState<PublicFileInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Check if file type supports preview
  const canPreview = (mimeType: string): boolean => {
    if (!mimeType) return false;
    return (
      mimeType.startsWith('image/') ||
      mimeType === 'application/pdf' ||
      mimeType.startsWith('video/') ||
      mimeType.startsWith('audio/') ||
      mimeType.startsWith('text/')
    );
  };

  useEffect(() => {
    const fetchFileInfo = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/storage/public/${token}/info`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.message || 'Failed to load file');
          return;
        }

        setFileInfo(data.data);

        // Auto-load preview for supported file types
        if (canPreview(data.data.mimeType)) {
          loadPreview();
        }
      } catch (err) {
        setError('Failed to load file information');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchFileInfo();
    }
  }, [token]);

  const loadPreview = async () => {
    try {
      setPreviewLoading(true);
      const response = await fetch(`${API_URL}/storage/public/${token}/download`);
      const data = await response.json();

      if (response.ok && data.data?.downloadUrl) {
        setPreviewUrl(data.data.downloadUrl);
      }
    } catch (err) {
      console.error('Failed to load preview:', err);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);

      // Get the signed URL
      const response = await fetch(`${API_URL}/storage/public/${token}/download`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Failed to download file');
        return;
      }

      // Fetch the actual file as blob to avoid exposing URL
      const fileResponse = await fetch(data.data.downloadUrl);
      const blob = await fileResponse.blob();

      // Create blob URL and trigger download
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = data.data.fileName || fileInfo?.name || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Cleanup blob URL
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      setError('Failed to download file');
    } finally {
      setDownloading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string, fileType: string) => {
    if (mimeType?.startsWith('image/')) return <ImageIcon sx={{ fontSize: 64, color: 'var(--accent-info)' }} />;
    if (mimeType?.startsWith('video/')) return <VideoFile sx={{ fontSize: 64, color: 'var(--accent-error)' }} />;
    if (mimeType?.startsWith('audio/')) return <AudioFile sx={{ fontSize: 64, color: 'var(--accent-warning)' }} />;
    if (mimeType === 'application/pdf') return <PictureAsPdf sx={{ fontSize: 64, color: 'var(--accent-error)' }} />;
    if (mimeType?.includes('word') || mimeType?.includes('document')) return <Description sx={{ fontSize: 64, color: 'var(--accent-info)' }} />;
    if (mimeType?.includes('spreadsheet') || mimeType?.includes('excel')) return <Description sx={{ fontSize: 64, color: 'var(--accent-success)' }} />;
    if (fileType === 'folder') return <Folder sx={{ fontSize: 64, color: 'var(--accent-warning)' }} />;
    return <InsertDriveFile sx={{ fontSize: 64, color: 'var(--text-secondary)' }} />;
  };

  const renderPreview = () => {
    if (!fileInfo || !previewUrl) return null;

    const { mimeType } = fileInfo;

    // Image preview
    if (mimeType?.startsWith('image/')) {
      return (
        <Box
          sx={{
            width: '100%',
            maxHeight: '60vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden',
            borderRadius: 2,
            backgroundColor: 'var(--bg-elevated)',
            mb: 3,
          }}
        >
          <img
            src={previewUrl}
            alt={fileInfo.name}
            style={{
              maxWidth: '100%',
              maxHeight: '60vh',
              objectFit: 'contain',
            }}
          />
        </Box>
      );
    }

    // PDF preview
    if (mimeType === 'application/pdf') {
      return (
        <Box
          sx={{
            width: '100%',
            height: '70vh',
            borderRadius: 2,
            overflow: 'hidden',
            mb: 3,
          }}
        >
          <iframe
            src={`${previewUrl}#toolbar=0&navpanes=0`}
            title={fileInfo.name}
            width="100%"
            height="100%"
            style={{ border: 'none' }}
          />
        </Box>
      );
    }

    // Video preview
    if (mimeType?.startsWith('video/')) {
      return (
        <Box
          sx={{
            width: '100%',
            maxHeight: '60vh',
            borderRadius: 2,
            overflow: 'hidden',
            mb: 3,
          }}
        >
          <video
            src={previewUrl}
            controls
            style={{
              width: '100%',
              maxHeight: '60vh',
            }}
          />
        </Box>
      );
    }

    // Audio preview
    if (mimeType?.startsWith('audio/')) {
      return (
        <Box sx={{ width: '100%', mb: 3 }}>
          <audio src={previewUrl} controls style={{ width: '100%' }} />
        </Box>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--bg-primary)',
        }}
      >
        <CircularProgress sx={{ color: 'var(--accent-primary)' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--bg-primary)',
          p: 3,
        }}
      >
        {/* Theme Toggle */}
        <Box sx={{ position: 'fixed', top: 16, right: 16 }}>
          <IconButton
            onClick={toggleTheme}
            size="small"
            sx={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              '&:hover': { backgroundColor: 'var(--sidebar-item-hover)' },
            }}
          >
            {theme === 'dark' ? (
              <LightMode sx={{ fontSize: 20, color: 'var(--text-secondary)' }} />
            ) : (
              <DarkMode sx={{ fontSize: 20, color: 'var(--text-secondary)' }} />
            )}
          </IconButton>
        </Box>

        <Paper
          sx={{
            p: 4,
            maxWidth: 400,
            width: '100%',
            textAlign: 'center',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
          }}
        >
          <ErrorIcon sx={{ fontSize: 64, color: 'var(--accent-error)', mb: 2 }} />
          <Typography variant="h5" sx={{ mb: 1, color: 'var(--text-primary)' }}>
            {error.includes('expired') ? 'Link Expired' : 'File Not Found'}
          </Typography>
          <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
            {error}
          </Typography>
        </Paper>
      </Box>
    );
  }

  const hasPreview = fileInfo && canPreview(fileInfo.mimeType) && previewUrl;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: 'var(--bg-primary)',
        p: 3,
        pt: 2,
      }}
    >
      {/* Header with Logo and Theme Toggle */}
      <Box
        sx={{
          width: '100%',
          maxWidth: hasPreview ? 900 : 450,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <img src={logoImage} alt="Elisrun" style={{ height: 36 }} />
        <IconButton
          onClick={toggleTheme}
          size="small"
          sx={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            '&:hover': { backgroundColor: 'var(--sidebar-item-hover)' },
          }}
        >
          {theme === 'dark' ? (
            <LightMode sx={{ fontSize: 20, color: 'var(--text-secondary)' }} />
          ) : (
            <DarkMode sx={{ fontSize: 20, color: 'var(--text-secondary)' }} />
          )}
        </IconButton>
      </Box>

      <Paper
        sx={{
          p: 3,
          maxWidth: hasPreview ? 900 : 450,
          width: '100%',
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 2,
        }}
      >
        {/* Preview Area */}
        {previewLoading ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              py: 8,
            }}
          >
            <CircularProgress sx={{ color: 'var(--accent-primary)' }} />
          </Box>
        ) : hasPreview ? (
          renderPreview()
        ) : (
          /* File Icon for non-previewable files */
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            {fileInfo && getFileIcon(fileInfo.mimeType, fileInfo.fileType)}
          </Box>
        )}

        {/* File Info and Download */}
        <Box sx={{ textAlign: 'center' }}>
          {/* File Name */}
          <Typography
            variant="h6"
            sx={{
              mb: 1,
              color: 'var(--text-primary)',
              wordBreak: 'break-word',
            }}
          >
            {fileInfo?.name}
          </Typography>

          {/* File Details */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mb: 0.5 }}>
              {formatFileSize(fileInfo?.fileSize || 0)} • {fileInfo?.fileType?.toUpperCase()}
            </Typography>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0.5,
                color: 'var(--text-muted)',
                mt: 1,
              }}
            >
              <Person sx={{ fontSize: 16 }} />
              <Typography variant="caption">
                Shared by {fileInfo?.sharedBy}
              </Typography>
            </Box>

            {fileInfo?.expiresAt && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 0.5,
                  color: 'var(--text-muted)',
                  mt: 0.5,
                }}
              >
                <Schedule sx={{ fontSize: 16 }} />
                <Typography variant="caption">
                  Expires {format(new Date(fileInfo.expiresAt), 'MMM dd, yyyy h:mm a')}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Download Button */}
          <Button
            variant="contained"
            size="large"
            startIcon={downloading ? <CircularProgress size={20} color="inherit" /> : <Download />}
            onClick={handleDownload}
            disabled={downloading}
            sx={{
              py: 1.5,
              px: 4,
              backgroundColor: 'var(--accent-primary)',
              '&:hover': { backgroundColor: 'var(--accent-primary-hover)' },
            }}
          >
            {downloading ? 'Downloading...' : 'Download File'}
          </Button>
        </Box>
      </Paper>

      {/* Footer */}
      <Typography
        variant="caption"
        sx={{ mt: 3, color: 'var(--text-muted)' }}
      >
        Powered by Elisrun Operation Management
      </Typography>
    </Box>
  );
};

export default PublicFilePage;
