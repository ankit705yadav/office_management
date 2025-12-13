import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  ImageList,
  ImageListItem,
} from '@mui/material';
import { Close, ChevronLeft, ChevronRight } from '@mui/icons-material';

interface ImageViewerDialogProps {
  open: boolean;
  onClose: () => void;
  images: string[];
  productName: string;
}

const ImageViewerDialog: React.FC<ImageViewerDialogProps> = ({
  open,
  onClose,
  images,
  productName,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

  const getImageUrl = (imagePath: string) => {
    if (imagePath.startsWith('http')) return imagePath;
    // Remove leading slash if present to avoid double slashes
    const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
    return `${baseUrl}/${cleanPath}`;
  };

  const handlePrevious = () => {
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  if (!images || images.length === 0) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border)',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border)',
          color: 'var(--text-primary)',
        }}
      >
        <Typography variant="h6">{productName} - Images</Typography>
        <IconButton onClick={onClose} sx={{ color: 'var(--text-secondary)' }}>
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 0 }}>
        {/* Main Image View */}
        <Box
          sx={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#000',
            minHeight: 400,
          }}
        >
          {images.length > 1 && (
            <IconButton
              onClick={handlePrevious}
              sx={{
                position: 'absolute',
                left: 8,
                backgroundColor: 'rgba(255,255,255,0.1)',
                color: '#fff',
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' },
              }}
            >
              <ChevronLeft />
            </IconButton>
          )}

          <Box
            component="img"
            src={getImageUrl(images[selectedIndex])}
            alt={`${productName} - Image ${selectedIndex + 1}`}
            sx={{
              maxWidth: '100%',
              maxHeight: 400,
              objectFit: 'contain',
            }}
          />

          {images.length > 1 && (
            <IconButton
              onClick={handleNext}
              sx={{
                position: 'absolute',
                right: 8,
                backgroundColor: 'rgba(255,255,255,0.1)',
                color: '#fff',
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' },
              }}
            >
              <ChevronRight />
            </IconButton>
          )}

          {/* Image Counter */}
          <Typography
            sx={{
              position: 'absolute',
              bottom: 8,
              right: 8,
              backgroundColor: 'rgba(0,0,0,0.6)',
              color: '#fff',
              px: 1.5,
              py: 0.5,
              borderRadius: 1,
              fontSize: '0.875rem',
            }}
          >
            {selectedIndex + 1} / {images.length}
          </Typography>
        </Box>

        {/* Thumbnail Strip */}
        {images.length > 1 && (
          <Box
            sx={{
              p: 2,
              borderTop: '1px solid var(--border)',
              backgroundColor: 'var(--surface)',
            }}
          >
            <ImageList cols={Math.min(images.length, 6)} gap={8} sx={{ m: 0 }}>
              {images.map((image, index) => (
                <ImageListItem
                  key={index}
                  onClick={() => setSelectedIndex(index)}
                  sx={{
                    cursor: 'pointer',
                    border: index === selectedIndex ? '2px solid var(--accent-primary)' : '2px solid transparent',
                    borderRadius: 1,
                    overflow: 'hidden',
                    transition: 'border-color 0.2s',
                    '&:hover': {
                      borderColor: 'var(--accent-primary)',
                    },
                  }}
                >
                  <Box
                    component="img"
                    src={getImageUrl(image)}
                    alt={`Thumbnail ${index + 1}`}
                    sx={{
                      width: '100%',
                      height: 80,
                      objectFit: 'cover',
                    }}
                  />
                </ImageListItem>
              ))}
            </ImageList>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ImageViewerDialog;
