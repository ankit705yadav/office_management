import React, { useRef } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { Download, Print } from '@mui/icons-material';
import { InventoryProduct } from '@/services/inventory.service';

interface BarcodeActionsProps {
  product: InventoryProduct;
}

const BarcodeActions: React.FC<BarcodeActionsProps> = ({ product }) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handleDownload = () => {
    if (!product.qrCode) return;

    // Create a download link
    const link = document.createElement('a');
    link.download = `barcode-${product.sku}.png`;
    link.href = product.qrCode;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    if (!product.qrCode) return;

    // Create a printable window
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups for this website to print barcodes');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Barcode - ${product.sku}</title>
          <style>
            @page {
              size: 2in 1in;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              font-family: Arial, sans-serif;
            }
            .barcode-container {
              text-align: center;
              padding: 10px;
            }
            .product-name {
              font-size: 12px;
              font-weight: bold;
              margin-bottom: 5px;
              max-width: 180px;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
            .barcode-image {
              max-width: 180px;
              height: auto;
            }
            .sku {
              font-size: 10px;
              color: #666;
              margin-top: 5px;
            }
            @media print {
              body {
                min-height: auto;
              }
            }
          </style>
        </head>
        <body>
          <div class="barcode-container">
            <div class="product-name">${product.name}</div>
            <img class="barcode-image" src="${product.qrCode}" alt="Barcode" />
            <div class="sku">${product.sku}</div>
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.close();
              }, 250);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (!product.qrCode) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography sx={{ color: 'var(--text-muted)' }}>
          No barcode available
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ textAlign: 'center' }}>
      {/* Barcode Preview */}
      <Box
        sx={{
          p: 2,
          backgroundColor: '#fff',
          borderRadius: 2,
          display: 'inline-block',
          mb: 2,
        }}
      >
        <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#000', mb: 1 }}>
          {product.name}
        </Typography>
        <img
          src={product.qrCode}
          alt={`Barcode for ${product.sku}`}
          style={{ maxWidth: '100%', height: 'auto' }}
        />
        <Typography sx={{ fontSize: '0.75rem', color: '#666', mt: 1 }}>
          {product.sku}
        </Typography>
      </Box>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
        <Button
          variant="outlined"
          startIcon={<Download />}
          onClick={handleDownload}
          sx={{
            color: 'var(--text-primary)',
            borderColor: 'var(--border)',
            '&:hover': {
              borderColor: 'var(--text-secondary)',
              backgroundColor: 'var(--sidebar-item-hover)',
            },
          }}
        >
          Download PNG
        </Button>
        <Button
          variant="outlined"
          startIcon={<Print />}
          onClick={handlePrint}
          sx={{
            color: 'var(--text-primary)',
            borderColor: 'var(--border)',
            '&:hover': {
              borderColor: 'var(--text-secondary)',
              backgroundColor: 'var(--sidebar-item-hover)',
            },
          }}
        >
          Print
        </Button>
      </Box>
    </Box>
  );
};

export default BarcodeActions;
