import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Close as CloseIcon,
  Download as DownloadIcon,
  Image as ImageIcon,
  VideoFile as VideoIcon,
  AudioFile as AudioIcon,
  PictureAsPdf as PdfIcon,
  Description as DocumentIcon,
  InsertDriveFile as FileIcon,
} from '@mui/icons-material';
import storageService, { StorageFile } from '../../services/storage.service';

interface FilePreviewModalProps {
  open: boolean;
  file: StorageFile | null;
  onClose: () => void;
  onDownload: (file: StorageFile) => void;
}

const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  open,
  file,
  onClose,
  onDownload,
}) => {
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && file) {
      loadPreview();
    } else {
      setPreviewUrl(null);
      setTextContent(null);
      setError(null);
    }
  }, [open, file]);

  const loadPreview = async () => {
    if (!file) return;

    // Check if file type is previewable
    const isPreviewable = isFilePreviewable(file.mimeType);
    if (!isPreviewable) {
      setError('This file type cannot be previewed. Please download to view.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { downloadUrl } = await storageService.downloadFile(file.id);

      // For text files, fetch the content directly
      if (file.mimeType?.startsWith('text/')) {
        const response = await fetch(downloadUrl);
        const text = await response.text();
        setTextContent(text);
      } else {
        setPreviewUrl(downloadUrl);
      }
    } catch (err) {
      setError('Failed to load file preview');
      console.error('Error loading preview:', err);
    } finally {
      setLoading(false);
    }
  };

  const isFilePreviewable = (mimeType?: string): boolean => {
    if (!mimeType) return false;
    return (
      mimeType.startsWith('image/') ||
      mimeType.startsWith('video/') ||
      mimeType.startsWith('audio/') ||
      mimeType === 'application/pdf' ||
      mimeType.startsWith('text/')
    );
  };

  const renderPreview = () => {
    if (!file) return null;

    const mimeType = file.mimeType || '';

    // Handle text files first (they use textContent, not previewUrl)
    if (mimeType.startsWith('text/') && textContent !== null) {
      return (
        <Box
          sx={{
            height: '70vh',
            width: '100%',
            overflow: 'auto',
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 1,
          }}
        >
          <pre
            style={{
              margin: 0,
              padding: '16px',
              fontFamily: 'monospace',
              fontSize: '14px',
              color: 'var(--text-primary)',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {textContent}
          </pre>
        </Box>
      );
    }

    // For other file types, we need previewUrl
    if (!previewUrl) return null;

    if (mimeType.startsWith('image/')) {
      return (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            maxHeight: '70vh',
            overflow: 'auto',
          }}
        >
          <img
            src={previewUrl}
            alt={file.name}
            style={{
              maxWidth: '100%',
              maxHeight: '70vh',
              objectFit: 'contain',
            }}
          />
        </Box>
      );
    }

    if (mimeType.startsWith('video/')) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <video
            controls
            style={{ maxWidth: '100%', maxHeight: '70vh' }}
            src={previewUrl}
          >
            Your browser does not support video playback.
          </video>
        </Box>
      );
    }

    if (mimeType.startsWith('audio/')) {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            py: 4,
          }}
        >
          <AudioIcon sx={{ fontSize: 80, color: 'var(--accent-primary)' }} />
          <audio controls src={previewUrl} style={{ width: '100%' }}>
            Your browser does not support audio playback.
          </audio>
        </Box>
      );
    }

    if (mimeType === 'application/pdf') {
      return (
        <Box sx={{ height: '70vh', width: '100%' }}>
          <iframe
            src={previewUrl}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
            }}
            title={file.name}
          />
        </Box>
      );
    }

    return null;
  };

  const getFileIcon = () => {
    if (!file?.mimeType) return <FileIcon sx={{ fontSize: 60 }} />;

    if (file.mimeType.startsWith('image/')) return <ImageIcon sx={{ fontSize: 60, color: '#4caf50' }} />;
    if (file.mimeType.startsWith('video/')) return <VideoIcon sx={{ fontSize: 60, color: '#ff5722' }} />;
    if (file.mimeType.startsWith('audio/')) return <AudioIcon sx={{ fontSize: 60, color: '#9c27b0' }} />;
    if (file.mimeType === 'application/pdf') return <PdfIcon sx={{ fontSize: 60, color: '#f44336' }} />;
    if (file.mimeType.startsWith('text/')) return <DocumentIcon sx={{ fontSize: 60, color: '#2196f3' }} />;

    return <FileIcon sx={{ fontSize: 60, color: '#9e9e9e' }} />;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          minHeight: '50vh',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: 'var(--text-primary)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, overflow: 'hidden' }}>
          {getFileIcon()}
          <Box sx={{ overflow: 'hidden' }}>
            <Typography
              variant="h6"
              noWrap
              title={file?.name}
              sx={{ color: 'var(--text-primary)' }}
            >
              {file?.name}
            </Typography>
            <Typography variant="caption" sx={{ color: 'var(--text-muted)' }}>
              {file ? storageService.formatFileSize(file.fileSize) : ''}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'var(--text-secondary)' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 2 }}>
        {loading ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: 300,
            }}
          >
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 300,
              gap: 2,
            }}
          >
            {getFileIcon()}
            <Alert
              severity="info"
              sx={{
                backgroundColor: 'var(--bg-elevated)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
              }}
            >
              {error}
            </Alert>
          </Box>
        ) : (
          renderPreview()
        )}
      </DialogContent>

      <DialogActions
        sx={{
          borderTop: '1px solid var(--border)',
          p: 2,
        }}
      >
        <Button onClick={onClose} sx={{ color: 'var(--text-secondary)' }}>
          Close
        </Button>
        {file && (
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={() => onDownload(file)}
          >
            Download
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default FilePreviewModal;
