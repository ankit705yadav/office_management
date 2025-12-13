import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  Button,
  IconButton,
  Typography,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ImageList,
  ImageListItem,
  ImageListItemBar,
} from '@mui/material';
import {
  CameraAlt,
  Upload,
  Close,
  Delete,
  PhotoCamera,
  SwitchCamera,
} from '@mui/icons-material';

interface ImageCaptureProps {
  images: File[];
  existingImages?: string[];
  onImagesChange: (files: File[]) => void;
  onExistingImageRemove?: (url: string) => void;
  maxImages?: number;
  disabled?: boolean;
}

const ImageCapture: React.FC<ImageCaptureProps> = ({
  images,
  existingImages = [],
  onImagesChange,
  onExistingImageRemove,
  maxImages = 5,
  disabled = false,
}) => {
  const [cameraOpen, setCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalImages = images.length + existingImages.length;
  const canAddMore = totalImages < maxImages;

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setCameraOpen(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Failed to access camera. Please check permissions.');
    }
  };

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setCameraOpen(false);
  }, [stream]);

  const switchCamera = async () => {
    stopCamera();
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacingMode);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newFacingMode },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setCameraOpen(true);
    } catch (error) {
      console.error('Error switching camera:', error);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const file = new File([blob], `capture-${Date.now()}.jpg`, {
              type: 'image/jpeg',
            });
            onImagesChange([...images, file]);
            stopCamera();
          }
        },
        'image/jpeg',
        0.9
      );
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const remaining = maxImages - totalImages;
    const filesToAdd = Array.from(files).slice(0, remaining);

    onImagesChange([...images, ...filesToAdd]);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  const removeExistingImage = (url: string) => {
    if (onExistingImageRemove) {
      onExistingImageRemove(url);
    }
  };

  const getImagePreview = (file: File): string => {
    return URL.createObjectURL(file);
  };

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1, color: 'var(--text-secondary)' }}>
        Images ({totalImages}/{maxImages})
      </Typography>

      {/* Action Buttons */}
      {canAddMore && !disabled && (
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Button
            variant="outlined"
            startIcon={<CameraAlt />}
            onClick={startCamera}
            size="small"
            sx={{
              borderColor: 'var(--accent-primary)',
              color: 'var(--accent-primary)',
              '&:hover': { borderColor: 'var(--accent-hover)', bgcolor: 'rgba(241, 78, 30, 0.1)' },
            }}
          >
            Camera
          </Button>
          <Button
            variant="outlined"
            startIcon={<Upload />}
            onClick={() => fileInputRef.current?.click()}
            size="small"
            sx={{
              borderColor: 'var(--accent-primary)',
              color: 'var(--accent-primary)',
              '&:hover': { borderColor: 'var(--accent-hover)', bgcolor: 'rgba(241, 78, 30, 0.1)' },
            }}
          >
            Upload
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            multiple
            style={{ display: 'none' }}
          />
        </Box>
      )}

      {/* Image Previews */}
      {(images.length > 0 || existingImages.length > 0) && (
        <Paper variant="outlined" sx={{ p: 1, bgcolor: 'var(--bg-elevated)', borderColor: 'var(--border)', backgroundImage: 'none' }}>
          <ImageList cols={3} rowHeight={100} gap={8}>
            {/* Existing Images */}
            {existingImages.map((url, index) => (
              <ImageListItem key={`existing-${index}`}>
                <img
                  src={`${import.meta.env.VITE_API_URL?.replace('/api', '')}${url}`}
                  alt={`Existing ${index + 1}`}
                  loading="lazy"
                  style={{ objectFit: 'cover', height: '100%', borderRadius: 4 }}
                />
                {!disabled && (
                  <ImageListItemBar
                    position="top"
                    actionIcon={
                      <IconButton
                        size="small"
                        onClick={() => removeExistingImage(url)}
                        sx={{ color: 'white' }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    }
                    sx={{ background: 'rgba(0,0,0,0.5)' }}
                  />
                )}
              </ImageListItem>
            ))}
            {/* New Images */}
            {images.map((file, index) => (
              <ImageListItem key={`new-${index}`}>
                <img
                  src={getImagePreview(file)}
                  alt={`New ${index + 1}`}
                  loading="lazy"
                  style={{ objectFit: 'cover', height: '100%', borderRadius: 4 }}
                />
                {!disabled && (
                  <ImageListItemBar
                    position="top"
                    actionIcon={
                      <IconButton
                        size="small"
                        onClick={() => removeImage(index)}
                        sx={{ color: 'white' }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    }
                    sx={{ background: 'rgba(0,0,0,0.5)' }}
                  />
                )}
              </ImageListItem>
            ))}
          </ImageList>
        </Paper>
      )}

      {/* Camera Dialog */}
      <Dialog
        open={cameraOpen}
        onClose={stopCamera}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { bgcolor: 'var(--surface)', border: '1px solid var(--border)' } }}
      >
        <DialogTitle sx={{ color: 'var(--text-primary)', display: 'flex', justifyContent: 'space-between' }}>
          <span>Take Photo</span>
          <IconButton onClick={stopCamera} sx={{ color: 'var(--text-secondary)' }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, position: 'relative', bgcolor: '#000' }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            style={{ width: '100%', display: 'block' }}
          />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', py: 2, bgcolor: 'var(--bg-elevated)' }}>
          <IconButton onClick={switchCamera} sx={{ color: 'var(--text-secondary)' }}>
            <SwitchCamera />
          </IconButton>
          <IconButton
            onClick={capturePhoto}
            sx={{
              bgcolor: 'var(--accent-primary)',
              mx: 2,
              '&:hover': { bgcolor: 'var(--accent-hover)' },
              width: 64,
              height: 64,
            }}
          >
            <PhotoCamera sx={{ fontSize: 32, color: 'white' }} />
          </IconButton>
          <Box sx={{ width: 40 }} />
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ImageCapture;
