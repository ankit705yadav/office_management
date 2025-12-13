import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Autocomplete,
  CircularProgress,
  Divider,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Close, Save, ExpandMore, Download, Print } from '@mui/icons-material';
import { inventoryService, ProductSuggestion, BulkManualProductResponse } from '@/services/inventory.service';
import { vendorService, Vendor } from '@/services/vendor.service';
import ImageCapture from '../common/ImageCapture';
import JsBarcode from 'jsbarcode';

interface ManualEntryDrawerProps {
  open: boolean;
  onClose: () => void;
  mode: 'in' | 'out';
  onProductCreated: () => void;
}

interface CreatedProductItem {
  id: number;
  sku: string;
  name: string;
  qrCode: string;
}

const ManualEntryDrawer: React.FC<ManualEntryDrawerProps> = ({
  open,
  onClose,
  mode,
  onProductCreated,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    brand: '',
    unit: 'pcs',
    unitPrice: '',
    quantity: '1',
  });
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<ProductSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [createdProducts, setCreatedProducts] = useState<CreatedProductItem[] | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState<number | ''>('');

  useEffect(() => {
    if (open) {
      loadCategoriesAndBrands();
      loadVendors();
      setCreatedProducts(null);
      setSelectedVendorId('');
    }
  }, [open]);

  const loadVendors = async () => {
    try {
      const response = await vendorService.getAllVendors({ isActive: true, limit: 1000 });
      setVendors(response.items);
    } catch (err) {
      console.error('Failed to load vendors:', err);
    }
  };

  const loadCategoriesAndBrands = async () => {
    try {
      const [cats, brds] = await Promise.all([
        inventoryService.getCategories(),
        inventoryService.getBrands(),
      ]);
      setCategories(cats);
      setBrands(brds);
    } catch (err) {
      console.error('Failed to load categories/brands:', err);
    }
  };

  const handleNameChange = async (value: string) => {
    setFormData({ ...formData, name: value });

    if (value.length >= 2) {
      setLoadingSuggestions(true);
      try {
        const results = await inventoryService.getProductNameSuggestions(value);
        setSuggestions(results);
      } catch (err) {
        console.error('Failed to fetch suggestions:', err);
      } finally {
        setLoadingSuggestions(false);
      }
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionSelect = (suggestion: ProductSuggestion | null) => {
    if (suggestion) {
      setFormData({
        ...formData,
        name: suggestion.name,
        brand: suggestion.brand || formData.brand,
        category: suggestion.category || formData.category,
        unit: suggestion.unit || formData.unit,
        unitPrice: suggestion.unitPrice?.toString() || formData.unitPrice,
      });
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError('Product name is required');
      return;
    }

    const qty = parseInt(formData.quantity, 10);
    if (isNaN(qty) || qty < 1) {
      setError('Quantity must be at least 1');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use the bulk manual products endpoint which creates individual items
      const response = await inventoryService.createBulkManualProducts({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        category: formData.category.trim() || undefined,
        brand: formData.brand.trim() || undefined,
        unit: formData.unit || 'pcs',
        unitPrice: formData.unitPrice ? parseFloat(formData.unitPrice) : undefined,
        quantity: qty,
        vendorId: selectedVendorId || undefined,
        images,
      });

      setCreatedProducts(response.products);
      onProductCreated();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create products');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      brand: '',
      unit: 'pcs',
      unitPrice: '',
      quantity: '1',
    });
    setImages([]);
    setError(null);
    setSuggestions([]);
    setCreatedProducts(null);
    setSelectedVendorId('');
    onClose();
  };

  const handleAddAnother = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      brand: '',
      unit: 'pcs',
      unitPrice: '',
      quantity: '1',
    });
    setImages([]);
    setError(null);
    setCreatedProducts(null);
    setSelectedVendorId('');
  };

  // Generate barcode canvas for a SKU
  const generateBarcodeCanvas = (sku: string): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    JsBarcode(canvas, sku, {
      format: 'CODE128',
      width: 2,
      height: 60,
      displayValue: true,
      fontSize: 14,
      margin: 10,
    });
    return canvas;
  };

  // Download single barcode
  const handleDownloadBarcode = (product: CreatedProductItem) => {
    const canvas = generateBarcodeCanvas(product.sku);
    const link = document.createElement('a');
    link.download = `barcode-${product.sku}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // Download all barcodes as a single image
  const handleDownloadAllBarcodes = () => {
    if (!createdProducts || createdProducts.length === 0) return;

    const barcodeWidth = 320;
    const barcodeHeight = 100;
    const padding = 10;
    const cols = Math.min(3, createdProducts.length);
    const rows = Math.ceil(createdProducts.length / cols);

    const totalWidth = cols * barcodeWidth + (cols + 1) * padding;
    const totalHeight = rows * barcodeHeight + (rows + 1) * padding;

    const canvas = document.createElement('canvas');
    canvas.width = totalWidth;
    canvas.height = totalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, totalWidth, totalHeight);

    createdProducts.forEach((product, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = padding + col * (barcodeWidth + padding);
      const y = padding + row * (barcodeHeight + padding);

      const barcodeCanvas = generateBarcodeCanvas(product.sku);
      ctx.drawImage(barcodeCanvas, x, y, barcodeWidth, barcodeHeight);
    });

    const link = document.createElement('a');
    link.download = `barcodes-${createdProducts[0].name.replace(/\s+/g, '-')}-x${createdProducts.length}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // Print all barcodes
  const handlePrintAllBarcodes = () => {
    if (!createdProducts || createdProducts.length === 0) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const barcodeImages = createdProducts.map((product) => {
      const canvas = generateBarcodeCanvas(product.sku);
      return canvas.toDataURL('image/png');
    });

    printWindow.document.write(`
      <html>
        <head>
          <title>Print Barcodes - ${createdProducts[0].name}</title>
          <style>
            @page { margin: 10mm; }
            body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
            .barcode-grid { display: flex; flex-wrap: wrap; gap: 10px; justify-content: flex-start; }
            .barcode-item {
              border: 1px dashed #ccc;
              padding: 8px;
              text-align: center;
              page-break-inside: avoid;
            }
            .barcode-item img { max-width: 150px; height: auto; }
            .barcode-item .sku { font-size: 10px; color: #666; margin-top: 4px; }
            @media print {
              .barcode-item { border: 1px dashed #ccc; }
            }
          </style>
        </head>
        <body>
          <div class="barcode-grid">
            ${createdProducts.map((product, index) => `
              <div class="barcode-item">
                <img src="${barcodeImages[index]}" alt="${product.sku}" />
                <div class="sku">${product.sku}</div>
              </div>
            `).join('')}
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Show success state with all barcodes
  if (createdProducts && createdProducts.length > 0) {
    return (
      <Drawer
        anchor="right"
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 500 },
            backgroundColor: 'var(--bg-primary)',
          },
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Header */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 2,
              borderBottom: '1px solid var(--border)',
              backgroundColor: 'var(--accent-success)',
              color: '#fff',
            }}
          >
            <Typography variant="h6">
              {createdProducts.length} Product{createdProducts.length > 1 ? 's' : ''} Created!
            </Typography>
            <IconButton onClick={handleClose} sx={{ color: '#fff' }}>
              <Close />
            </IconButton>
          </Box>

          {/* Content */}
          <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
            <Typography variant="h6" sx={{ color: 'var(--text-primary)', mb: 1 }}>
              {createdProducts[0].name}
            </Typography>
            <Typography sx={{ color: 'var(--text-secondary)', mb: 3 }}>
              Created {createdProducts.length} individual item{createdProducts.length > 1 ? 's' : ''}, each with a unique barcode
            </Typography>

            {/* Bulk Actions */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Button
                variant="contained"
                startIcon={<Download />}
                onClick={handleDownloadAllBarcodes}
                fullWidth
                sx={{
                  backgroundColor: 'var(--accent-primary)',
                  '&:hover': { backgroundColor: 'var(--accent-primary-hover, #1565c0)' },
                }}
              >
                Download All ({createdProducts.length})
              </Button>
              <Button
                variant="outlined"
                startIcon={<Print />}
                onClick={handlePrintAllBarcodes}
                fullWidth
                sx={{
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border)',
                }}
              >
                Print All
              </Button>
            </Box>

            <Divider sx={{ my: 2, borderColor: 'var(--border)' }} />

            <Typography variant="subtitle2" sx={{ color: 'var(--text-secondary)', mb: 2 }}>
              Individual Barcodes
            </Typography>

            {/* Individual Barcodes List */}
            {createdProducts.map((product, index) => (
              <Accordion
                key={product.id}
                sx={{
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                  mb: 1,
                  '&:before': { display: 'none' },
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMore sx={{ color: 'var(--text-secondary)' }} />}
                  sx={{
                    '& .MuiAccordionSummary-content': {
                      alignItems: 'center',
                    },
                  }}
                >
                  <Typography sx={{ color: 'var(--text-primary)', flex: 1 }}>
                    Item #{index + 1}
                  </Typography>
                  <Typography sx={{ color: 'var(--text-muted)', fontSize: '0.875rem', mr: 2 }}>
                    {product.sku}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ textAlign: 'center', mb: 2 }}>
                    {product.qrCode && (
                      <img
                        src={product.qrCode}
                        alt={`Barcode for ${product.sku}`}
                        style={{ maxWidth: '100%', height: 'auto' }}
                      />
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      startIcon={<Download />}
                      onClick={() => handleDownloadBarcode(product)}
                      sx={{ color: 'var(--text-primary)' }}
                    >
                      Download
                    </Button>
                  </Box>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>

          {/* Footer */}
          <Box
            sx={{
              p: 2,
              borderTop: '1px solid var(--border)',
              backgroundColor: 'var(--surface)',
              display: 'flex',
              gap: 2,
            }}
          >
            <Button
              variant="outlined"
              fullWidth
              onClick={handleAddAnother}
              sx={{
                color: 'var(--text-primary)',
                borderColor: 'var(--border)',
              }}
            >
              Add More
            </Button>
            <Button
              variant="contained"
              fullWidth
              onClick={handleClose}
              sx={{
                backgroundColor: 'var(--accent-primary)',
              }}
            >
              Done
            </Button>
          </Box>
        </Box>
      </Drawer>
    );
  }

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={handleClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 450 },
          backgroundColor: 'var(--bg-primary)',
        },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 2,
            borderBottom: '1px solid var(--border)',
            backgroundColor: mode === 'in' ? 'var(--accent-success)' : 'var(--accent-error)',
            color: '#fff',
          }}
        >
          <Typography variant="h6">
            Manual Entry - {mode === 'in' ? 'Stock In' : 'Stock Out'}
          </Typography>
          <IconButton onClick={handleClose} sx={{ color: '#fff' }}>
            <Close />
          </IconButton>
        </Box>

        {/* Form */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          {error && (
            <Typography color="error" sx={{ mb: 2 }}>
              {error}
            </Typography>
          )}

          {/* Product Name with Auto-suggestions */}
          <Autocomplete
            freeSolo
            options={suggestions}
            getOptionLabel={(option) =>
              typeof option === 'string' ? option : option.name
            }
            inputValue={formData.name}
            onInputChange={(_, value) => handleNameChange(value)}
            onChange={(_, value) =>
              handleSuggestionSelect(typeof value === 'string' ? null : value)
            }
            loading={loadingSuggestions}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Product Name *"
                fullWidth
                sx={{ mb: 2 }}
                InputProps={{
                  ...params.InputProps,
                  sx: { color: 'var(--text-primary)' },
                  endAdornment: (
                    <>
                      {loadingSuggestions ? <CircularProgress size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
                InputLabelProps={{ sx: { color: 'var(--text-muted)' } }}
              />
            )}
            renderOption={(props, option) => (
              <li {...props} style={{ color: 'var(--text-primary)' }}>
                <Box>
                  <Typography>{option.name}</Typography>
                  {option.brand && (
                    <Typography variant="caption" sx={{ color: 'var(--text-muted)' }}>
                      Brand: {option.brand}
                    </Typography>
                  )}
                </Box>
              </li>
            )}
            componentsProps={{
              paper: {
                sx: {
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                },
              },
            }}
          />

          {/* Quantity */}
          <TextField
            label="Quantity *"
            type="number"
            fullWidth
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            sx={{ mb: 2 }}
            InputProps={{
              sx: { color: 'var(--text-primary)' },
              inputProps: { min: 1, max: 100 },
            }}
            InputLabelProps={{ sx: { color: 'var(--text-muted)' } }}
            helperText={parseInt(formData.quantity) > 1 ? `Will create ${formData.quantity} individual items, each with a unique barcode` : ''}
          />

          {/* Vendor Selection */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel sx={{ color: 'var(--text-muted)' }}>Vendor (optional)</InputLabel>
            <Select
              value={selectedVendorId}
              label="Vendor (optional)"
              onChange={(e) => setSelectedVendorId(e.target.value as number | '')}
              sx={{ color: 'var(--text-primary)' }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    bgcolor: 'var(--surface)',
                    border: '1px solid var(--border)',
                    '& .MuiMenuItem-root': {
                      color: 'var(--text-primary)',
                      '&:hover': { bgcolor: 'var(--bg-elevated)' },
                    },
                  },
                },
              }}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {vendors.map((vendor) => (
                <MenuItem key={vendor.id} value={vendor.id}>
                  {vendor.name}
                  {vendor.contactPerson && ` (${vendor.contactPerson})`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Brand */}
          <Autocomplete
            freeSolo
            options={brands}
            value={formData.brand}
            onInputChange={(_, value) => setFormData({ ...formData, brand: value })}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Brand"
                fullWidth
                sx={{ mb: 2 }}
                InputProps={{
                  ...params.InputProps,
                  sx: { color: 'var(--text-primary)' },
                }}
                InputLabelProps={{ sx: { color: 'var(--text-muted)' } }}
              />
            )}
            componentsProps={{
              paper: {
                sx: {
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                },
              },
            }}
          />

          {/* Category */}
          <Autocomplete
            freeSolo
            options={categories}
            value={formData.category}
            onInputChange={(_, value) => setFormData({ ...formData, category: value })}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Category"
                fullWidth
                sx={{ mb: 2 }}
                InputProps={{
                  ...params.InputProps,
                  sx: { color: 'var(--text-primary)' },
                }}
                InputLabelProps={{ sx: { color: 'var(--text-muted)' } }}
              />
            )}
            componentsProps={{
              paper: {
                sx: {
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                },
              },
            }}
          />

          {/* Description */}
          <TextField
            label="Description"
            fullWidth
            multiline
            rows={2}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            sx={{ mb: 2 }}
            InputProps={{ sx: { color: 'var(--text-primary)' } }}
            InputLabelProps={{ sx: { color: 'var(--text-muted)' } }}
          />

          {/* Price */}
          <TextField
            label="Price"
            type="number"
            fullWidth
            value={formData.unitPrice}
            onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
            sx={{ mb: 2 }}
            InputProps={{ sx: { color: 'var(--text-primary)' } }}
            InputLabelProps={{ sx: { color: 'var(--text-muted)' } }}
          />

          {/* Image Capture */}
          <Typography sx={{ color: 'var(--text-secondary)', mb: 1 }}>
            Product Images (optional)
          </Typography>
          <ImageCapture images={images} onImagesChange={setImages} maxImages={5} />

          <Paper
            elevation={0}
            sx={{
              mt: 2,
              p: 2,
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
            }}
          >
            <Typography sx={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              {parseInt(formData.quantity) > 1 ? (
                <>
                  <strong>{formData.quantity} unique barcodes</strong> will be generated - one for each item.
                  You can download or print them all after creation.
                </>
              ) : (
                'A unique barcode will be generated for this product. You can download or print it after creation.'
              )}
            </Typography>
          </Paper>
        </Box>

        {/* Footer */}
        <Box
          sx={{
            p: 2,
            borderTop: '1px solid var(--border)',
            backgroundColor: 'var(--surface)',
          }}
        >
          <Button
            variant="contained"
            fullWidth
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Save />}
            onClick={handleSubmit}
            disabled={loading || !formData.name.trim()}
            sx={{
              py: 1.5,
              backgroundColor: mode === 'in' ? 'var(--accent-success)' : 'var(--accent-error)',
              '&:hover': {
                backgroundColor: mode === 'in' ? 'var(--accent-success-hover, #2e7d32)' : 'var(--accent-error-hover, #c62828)',
              },
            }}
          >
            {loading ? 'Creating...' : `Create ${formData.quantity || 1} Item${parseInt(formData.quantity) > 1 ? 's' : ''}`}
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
};

export default ManualEntryDrawer;
