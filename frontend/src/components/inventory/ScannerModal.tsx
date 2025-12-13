import React, { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Button,
  Alert,
  Snackbar,
  CircularProgress,
} from '@mui/material';
import {
  Close,
  QrCodeScanner,
  Edit,
  CheckCircle,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { Html5Qrcode } from 'html5-qrcode';

interface ScannerModalProps {
  open: boolean;
  onClose: () => void;
  mode: 'in' | 'out';
  onScanSuccess: (barcode: string, isNew: boolean, message?: string) => void;
  onNewProduct: (barcode: string) => void;
  onManualEntry: () => void;
}

const ScannerModal: React.FC<ScannerModalProps> = ({
  open,
  onClose,
  mode,
  onScanSuccess,
  onNewProduct,
  onManualEntry,
}) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [lastScannedBarcode, setLastScannedBarcode] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (open) {
      startScanner();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [open]);

  const startScanner = async () => {
    try {
      setError(null);
      const scannerId = 'barcode-scanner';

      // Wait for DOM element to be ready
      await new Promise((resolve) => setTimeout(resolve, 100));

      const element = document.getElementById(scannerId);
      if (!element) {
        setError('Scanner element not found');
        return;
      }

      scannerRef.current = new Html5Qrcode(scannerId);

      await scannerRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 300, height: 150 },
          aspectRatio: 1.5,
        },
        handleScanSuccess,
        handleScanError
      );

      setIsScanning(true);
    } catch (err: any) {
      console.error('Failed to start scanner:', err);
      setError(err.message || 'Failed to start camera. Please check permissions.');
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
    scannerRef.current = null;
    setIsScanning(false);
  };

  const handleScanSuccess = async (decodedText: string) => {
    // Prevent duplicate scans
    if (processing || decodedText === lastScannedBarcode) {
      return;
    }

    setProcessing(true);
    setLastScannedBarcode(decodedText);

    // Play beep sound
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2DioiGgn17f4GDg4KGiYuLi4mGhIKBf359fX5/gIKGiYuMjIqHhIKBgH5+fn+Ag4aJi4yMioiGhIKBf35+fn+Ag4aJi4yMioiGhIKAgH9/f4CBg4WIiouKiYiGhYOCgYCAf4CBgoSGh4mJiYmIh4aFhIKBgYGBgoOEhYaHiIiIh4aFhYSEg4ODgoKDg4SFhYaGhoaFhYSEhISEhISDg4SEhISEhISEhISEhISEhISEhISEhISEhISEhIQA');
    audio.play().catch(() => {});

    // Notify parent to process the scan
    onScanSuccess(decodedText, false);

    // Reset after delay to allow next scan
    setTimeout(() => {
      setLastScannedBarcode(null);
      setProcessing(false);
    }, 1500);
  };

  const handleScanError = (errorMessage: string) => {
    // Ignore common scanning errors (no barcode found in frame)
    if (!errorMessage.includes('NotFoundException')) {
      console.log('Scan error:', errorMessage);
    }
  };

  const handleClose = () => {
    stopScanner();
    onClose();
  };

  const handleManualEntry = () => {
    stopScanner();
    onManualEntry();
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        fullScreen
        PaperProps={{
          sx: {
            backgroundColor: 'var(--bg-primary)',
          },
        }}
      >
        <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Header */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 2,
              backgroundColor: mode === 'in' ? 'var(--accent-success)' : 'var(--accent-error)',
              color: '#fff',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <QrCodeScanner />
              <Typography variant="h6">
                {mode === 'in' ? 'Stock In' : 'Stock Out'} - Scan Barcode
              </Typography>
            </Box>
            <IconButton onClick={handleClose} sx={{ color: '#fff' }}>
              <Close />
            </IconButton>
          </Box>

          {/* Scanner Area */}
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              p: 2,
            }}
          >
            {error ? (
              <Box sx={{ textAlign: 'center' }}>
                <ErrorIcon sx={{ fontSize: 64, color: 'var(--accent-error)', mb: 2 }} />
                <Typography color="error" sx={{ mb: 2 }}>
                  {error}
                </Typography>
                <Button variant="contained" onClick={startScanner}>
                  Retry
                </Button>
              </Box>
            ) : (
              <>
                <Box
                  id="barcode-scanner"
                  sx={{
                    width: '100%',
                    maxWidth: 500,
                    height: 300,
                    backgroundColor: '#000',
                    borderRadius: 2,
                    overflow: 'hidden',
                  }}
                />
                {processing && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                    <CircularProgress size={20} />
                    <Typography sx={{ color: 'var(--text-secondary)' }}>Processing...</Typography>
                  </Box>
                )}
                <Typography
                  sx={{
                    mt: 3,
                    color: 'var(--text-secondary)',
                    textAlign: 'center',
                  }}
                >
                  Position the barcode within the frame to scan
                </Typography>
              </>
            )}
          </Box>

          {/* Footer with Manual Entry Option - Only for Stock In */}
          {mode === 'in' && (
            <Box
              sx={{
                p: 2,
                borderTop: '1px solid var(--border)',
                backgroundColor: 'var(--surface)',
              }}
            >
              <Button
                variant="outlined"
                fullWidth
                startIcon={<Edit />}
                onClick={handleManualEntry}
                sx={{
                  py: 1.5,
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border)',
                  '&:hover': {
                    borderColor: 'var(--text-secondary)',
                    backgroundColor: 'var(--sidebar-item-hover)',
                  },
                }}
              >
                Add Product Without Barcode
              </Button>
            </Box>
          )}
          {mode === 'out' && (
            <Box
              sx={{
                p: 2,
                borderTop: '1px solid var(--border)',
                backgroundColor: 'var(--surface)',
              }}
            >
              <Button
                variant="outlined"
                fullWidth
                startIcon={<Edit />}
                onClick={handleManualEntry}
                sx={{
                  py: 1.5,
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border)',
                  '&:hover': {
                    borderColor: 'var(--text-secondary)',
                    backgroundColor: 'var(--sidebar-item-hover)',
                  },
                }}
              >
                Search Products to Stock Out
              </Button>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Toast Notifications */}
      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setToast({ ...toast, open: false })}
          severity={toast.severity}
          sx={{ width: '100%' }}
          icon={toast.severity === 'success' ? <CheckCircle /> : undefined}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ScannerModal;
