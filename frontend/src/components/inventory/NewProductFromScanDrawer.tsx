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
  Chip,
} from '@mui/material';
import { Close, QrCode, Save } from '@mui/icons-material';
import { inventoryService, ProductSuggestion } from '@/services/inventory.service';
import ImageCapture from '../common/ImageCapture';

interface NewProductFromScanDrawerProps {
  open: boolean;
  onClose: () => void;
  barcode: string;
  onProductCreated: () => void;
}

const NewProductFromScanDrawer: React.FC<NewProductFromScanDrawerProps> = ({
  open,
  onClose,
  barcode,
  onProductCreated,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    brand: '',
    unit: 'pcs',
    unitPrice: '',
  });
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<ProductSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      loadCategoriesAndBrands();
    }
  }, [open]);

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

    setLoading(true);
    setError(null);

    try {
      await inventoryService.createProduct({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        category: formData.category.trim() || undefined,
        brand: formData.brand.trim() || undefined,
        unit: formData.unit || 'pcs',
        unitPrice: formData.unitPrice ? parseFloat(formData.unitPrice) : undefined,
        barcode: barcode,
        isManualEntry: false,
        images,
      });

      onProductCreated();
      handleClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create product');
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
    });
    setImages([]);
    setError(null);
    setSuggestions([]);
    onClose();
  };

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
            backgroundColor: 'var(--surface)',
          }}
        >
          <Typography variant="h6" sx={{ color: 'var(--text-primary)' }}>
            New Product
          </Typography>
          <IconButton onClick={handleClose} sx={{ color: 'var(--text-secondary)' }}>
            <Close />
          </IconButton>
        </Box>

        {/* Scanned Barcode Display */}
        <Box
          sx={{
            p: 2,
            backgroundColor: 'var(--bg-elevated)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <QrCode sx={{ color: 'var(--accent-primary)' }} />
            <Typography sx={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Scanned Barcode:
            </Typography>
          </Box>
          <Chip
            label={barcode}
            sx={{
              mt: 1,
              backgroundColor: 'var(--accent-primary-light)',
              color: 'var(--accent-primary)',
              fontFamily: 'monospace',
            }}
          />
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

          {/* Unit and Price */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              label="Unit"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              sx={{ flex: 1 }}
              InputProps={{ sx: { color: 'var(--text-primary)' } }}
              InputLabelProps={{ sx: { color: 'var(--text-muted)' } }}
            />
            <TextField
              label="Price"
              type="number"
              value={formData.unitPrice}
              onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
              sx={{ flex: 1 }}
              InputProps={{ sx: { color: 'var(--text-primary)' } }}
              InputLabelProps={{ sx: { color: 'var(--text-muted)' } }}
            />
          </Box>

          {/* Image Capture */}
          <Typography sx={{ color: 'var(--text-secondary)', mb: 1 }}>
            Product Images (optional)
          </Typography>
          <ImageCapture images={images} setImages={setImages} maxImages={5} />
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
              backgroundColor: 'var(--accent-success)',
              '&:hover': { backgroundColor: 'var(--accent-success-hover, #2e7d32)' },
            }}
          >
            {loading ? 'Creating...' : 'Add to Inventory (Qty: 1)'}
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
};

export default NewProductFromScanDrawer;
