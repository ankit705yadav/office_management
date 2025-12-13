import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Box,
  Typography,
  TextField,
  Button,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Alert,
  ImageList,
  ImageListItem,
  Chip,
  Autocomplete,
} from '@mui/material';
import { Close, Download, QrCode2 as BarcodeIcon, Cancel, Edit, Visibility } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { inventoryService, InventoryProduct, CreateProductRequest } from '../../services/inventory.service';
import ImageCapture from '../common/ImageCapture';

interface Props {
  open: boolean;
  onClose: () => void;
  product: InventoryProduct | null;
  onSave: () => void;
  viewOnly?: boolean;
  onEdit?: () => void;
}

const ProductFormDrawer: React.FC<Props> = ({ open, onClose, product, onSave, viewOnly = false, onEdit }) => {
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    category: '',
    brand: '',
    unit: 'pcs',
    unitPrice: undefined as number | undefined,
  });
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [imagesToRemove, setImagesToRemove] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      loadCategoriesAndBrands();
      setShowNewCategory(false);
      setNewCategoryName('');
      setImages([]);
      setImagesToRemove([]);
      if (product) {
        setFormData({
          sku: product.sku,
          name: product.name,
          description: product.description || '',
          category: product.category || '',
          brand: product.brand || '',
          unit: product.unit,
          unitPrice: product.unitPrice,
        });
        setExistingImages(product.images || []);
      } else {
        setFormData({
          sku: generateSKU(),
          name: '',
          description: '',
          category: '',
          brand: '',
          unit: 'pcs',
          unitPrice: undefined,
        });
        setExistingImages([]);
      }
    }
  }, [open, product]);

  const loadCategoriesAndBrands = async () => {
    try {
      const [cats, brds] = await Promise.all([
        inventoryService.getCategories(),
        inventoryService.getBrands(),
      ]);
      setCategories(cats);
      setBrands(brds);
    } catch (error) {
      console.error('Error loading categories/brands:', error);
    }
  };

  const generateSKU = () => {
    return `SKU-${Date.now().toString().slice(-8)}`;
  };

  const handleExistingImageRemove = (url: string) => {
    setExistingImages((prev) => prev.filter((img) => img !== url));
    setImagesToRemove((prev) => [...prev, url]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      toast.error('Name is required');
      return;
    }

    if (showNewCategory && !newCategoryName.trim()) {
      toast.error('Please enter a category name');
      return;
    }

    try {
      setSubmitting(true);
      const dataToSubmit = {
        ...formData,
        category: showNewCategory ? newCategoryName.trim() : formData.category,
      };

      if (product) {
        await inventoryService.updateProduct(product.id, {
          ...dataToSubmit,
          images: images.length > 0 ? images : undefined,
          imagesToRemove: imagesToRemove.length > 0 ? imagesToRemove : undefined,
        });
        toast.success('Product updated successfully');
      } else {
        await inventoryService.createProduct({
          ...dataToSubmit,
          isManualEntry: true,
          images: images.length > 0 ? images : undefined,
        });
        toast.success('Product created successfully');
      }
      onSave();
      onClose();
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast.error(error.response?.data?.message || 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadBarcode = () => {
    if (!product?.qrCode) return;

    const link = document.createElement('a');
    link.href = product.qrCode;
    link.download = `${product.sku}-barcode.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Barcode downloaded');
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100%', sm: 500 }, bgcolor: 'var(--surface)' } }}
    >
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {viewOnly ? <Visibility sx={{ color: 'var(--accent-primary)' }} /> : null}
            <Typography variant="h6" sx={{ color: 'var(--text-primary)' }}>
              {viewOnly ? 'Product Details' : product ? 'Edit Product' : 'Add Product'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {viewOnly && onEdit && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<Edit />}
                onClick={onEdit}
                sx={{ borderColor: 'var(--accent-primary)', color: 'var(--accent-primary)' }}
              >
                Edit
              </Button>
            )}
            <IconButton onClick={onClose} sx={{ color: 'var(--text-secondary)' }}>
              <Close />
            </IconButton>
          </Box>
        </Box>

        <Divider sx={{ mb: 3, borderColor: 'var(--border)' }} />

        {/* View Only Mode */}
        {viewOnly && product ? (
          <Box>
            {/* Barcode Display */}
            {product.qrCode && (
              <Box sx={{ textAlign: 'center', mb: 3, p: 2, bgcolor: 'var(--bg-elevated)', borderRadius: 1, border: '1px solid var(--border)' }}>
                <img
                  src={product.qrCode}
                  alt="Product Barcode"
                  style={{ maxWidth: '100%', height: 'auto' }}
                />
                <Button
                  size="small"
                  startIcon={<Download />}
                  onClick={handleDownloadBarcode}
                  sx={{ mt: 1, color: 'var(--accent-primary)' }}
                >
                  Download Barcode
                </Button>
              </Box>
            )}

            {/* Product Details Grid */}
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>SKU</Typography>
                <Typography variant="body1" fontWeight="medium" sx={{ color: 'var(--text-primary)' }}>{product.sku}</Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>Product Name</Typography>
                <Typography variant="body1" fontWeight="medium" sx={{ color: 'var(--text-primary)' }}>{product.name}</Typography>
              </Grid>

              {product.brand && (
                <Grid item xs={12}>
                  <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>Brand</Typography>
                  <Typography variant="body1" sx={{ color: 'var(--text-primary)' }}>{product.brand}</Typography>
                </Grid>
              )}

              {product.description && (
                <Grid item xs={12}>
                  <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>Description</Typography>
                  <Typography variant="body1" sx={{ color: 'var(--text-primary)' }}>{product.description}</Typography>
                </Grid>
              )}

              <Grid item xs={6}>
                <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>Category</Typography>
                <Typography variant="body1" sx={{ color: 'var(--text-primary)' }}>{product.category || '-'}</Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>Status</Typography>
                <Box>
                  <Chip
                    label={product.isActive ? 'Active' : 'Inactive'}
                    color={product.isActive ? 'success' : 'default'}
                    size="small"
                  />
                </Box>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>Current Quantity</Typography>
                <Box>
                  <Chip
                    label={product.quantity}
                    color={product.quantity > 0 ? 'success' : 'error'}
                    size="small"
                  />
                </Box>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>Unit</Typography>
                <Typography variant="body1" sx={{ color: 'var(--text-primary)' }}>{product.unit}</Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>Unit Price</Typography>
                <Typography variant="body1" sx={{ color: 'var(--text-primary)' }}>
                  {product.unitPrice ? `₹${Number(product.unitPrice).toFixed(2)}` : '-'}
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>Entry Type</Typography>
                <Box>
                  <Chip
                    label={product.isManualEntry ? 'Manual' : 'Scanned'}
                    size="small"
                    sx={{ backgroundColor: 'var(--bg-elevated)' }}
                  />
                </Box>
              </Grid>

              {product.barcode && (
                <Grid item xs={12}>
                  <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>Physical Barcode</Typography>
                  <Typography variant="body1" sx={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>{product.barcode}</Typography>
                </Grid>
              )}

              {/* Images Section */}
              {product.images && product.images.length > 0 && (
                <Grid item xs={12}>
                  <Divider sx={{ my: 1, borderColor: 'var(--border)' }} />
                  <Typography variant="caption" sx={{ mb: 1, display: 'block', color: 'var(--text-secondary)' }}>
                    Product Images
                  </Typography>
                  <ImageList cols={3} rowHeight={100} gap={8}>
                    {product.images.map((img, index) => (
                      <ImageListItem key={index}>
                        <img
                          src={img.startsWith('http') ? img : `${import.meta.env.VITE_API_URL?.replace('/api', '')}${img}`}
                          alt={`Product ${index + 1}`}
                          style={{ objectFit: 'cover', borderRadius: 4, height: '100%' }}
                        />
                      </ImageListItem>
                    ))}
                  </ImageList>
                </Grid>
              )}
            </Grid>

            <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button onClick={onClose} sx={{ color: 'var(--text-secondary)' }}>
                Close
              </Button>
            </Box>
          </Box>
        ) : (
          <>
            {/* Barcode Display for existing products */}
            {product?.qrCode && (
              <Box sx={{ textAlign: 'center', mb: 3, p: 2, bgcolor: 'var(--bg-elevated)', borderRadius: 1, border: '1px solid var(--border)' }}>
                <img
                  src={product.qrCode}
                  alt="Product Barcode"
                  style={{ maxWidth: '100%', height: 'auto' }}
                />
                <Button
                  size="small"
                  startIcon={<Download />}
                  onClick={handleDownloadBarcode}
                  sx={{ mt: 1, color: 'var(--accent-primary)' }}
                >
                  Download Barcode
                </Button>
              </Box>
            )}

            <form onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="SKU"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    disabled={!!product}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: 'var(--text-primary)',
                        '& fieldset': { borderColor: 'var(--border)' },
                        '&:hover fieldset': { borderColor: 'var(--text-secondary)' },
                        '&.Mui-focused fieldset': { borderColor: 'var(--accent-primary)' },
                        '&.Mui-disabled': {
                          '& fieldset': { borderColor: 'var(--border)' },
                          color: 'var(--text-secondary)',
                        },
                      },
                      '& .MuiInputLabel-root': { color: 'var(--text-secondary)' },
                      '& .MuiInputLabel-root.Mui-focused': { color: 'var(--accent-primary)' },
                      '& .Mui-disabled': { color: 'var(--text-secondary)', WebkitTextFillColor: 'var(--text-secondary)' },
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Product Name *"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: 'var(--text-primary)',
                        '& fieldset': { borderColor: 'var(--border)' },
                        '&:hover fieldset': { borderColor: 'var(--text-secondary)' },
                        '&.Mui-focused fieldset': { borderColor: 'var(--accent-primary)' },
                      },
                      '& .MuiInputLabel-root': { color: 'var(--text-secondary)' },
                      '& .MuiInputLabel-root.Mui-focused': { color: 'var(--accent-primary)' },
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Autocomplete
                    freeSolo
                    options={brands}
                    value={formData.brand}
                    onInputChange={(_, value) => setFormData({ ...formData, brand: value })}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Brand"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            color: 'var(--text-primary)',
                            '& fieldset': { borderColor: 'var(--border)' },
                            '&:hover fieldset': { borderColor: 'var(--text-secondary)' },
                            '&.Mui-focused fieldset': { borderColor: 'var(--accent-primary)' },
                          },
                          '& .MuiInputLabel-root': { color: 'var(--text-secondary)' },
                          '& .MuiInputLabel-root.Mui-focused': { color: 'var(--accent-primary)' },
                        }}
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
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    multiline
                    rows={2}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: 'var(--text-primary)',
                        '& fieldset': { borderColor: 'var(--border)' },
                        '&:hover fieldset': { borderColor: 'var(--text-secondary)' },
                        '&.Mui-focused fieldset': { borderColor: 'var(--accent-primary)' },
                      },
                      '& .MuiInputLabel-root': { color: 'var(--text-secondary)' },
                      '& .MuiInputLabel-root.Mui-focused': { color: 'var(--accent-primary)' },
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Autocomplete
                    freeSolo
                    options={[...categories, ...(showNewCategory ? [] : ['__new__'])]}
                    value={formData.category}
                    onInputChange={(_, value) => {
                      if (value === '__new__') {
                        setShowNewCategory(true);
                        setNewCategoryName('');
                      } else {
                        setFormData({ ...formData, category: value });
                      }
                    }}
                    getOptionLabel={(option) => option === '__new__' ? '+ Add New Category' : option}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Category"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            color: 'var(--text-primary)',
                            '& fieldset': { borderColor: 'var(--border)' },
                            '&:hover fieldset': { borderColor: 'var(--text-secondary)' },
                            '&.Mui-focused fieldset': { borderColor: 'var(--accent-primary)' },
                          },
                          '& .MuiInputLabel-root': { color: 'var(--text-secondary)' },
                          '& .MuiInputLabel-root.Mui-focused': { color: 'var(--accent-primary)' },
                        }}
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
                </Grid>

                {showNewCategory && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="New Category Name"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      autoFocus
                      placeholder="Enter category name"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: 'var(--text-primary)',
                          '& fieldset': { borderColor: 'var(--border)' },
                          '&:hover fieldset': { borderColor: 'var(--text-secondary)' },
                          '&.Mui-focused fieldset': { borderColor: 'var(--accent-primary)' },
                        },
                        '& .MuiInputLabel-root': { color: 'var(--text-secondary)' },
                        '& .MuiInputLabel-root.Mui-focused': { color: 'var(--accent-primary)' },
                      }}
                    />
                  </Grid>
                )}

                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Unit"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="pcs, kg, liters, etc."
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: 'var(--text-primary)',
                        '& fieldset': { borderColor: 'var(--border)' },
                        '&:hover fieldset': { borderColor: 'var(--text-secondary)' },
                        '&.Mui-focused fieldset': { borderColor: 'var(--accent-primary)' },
                      },
                      '& .MuiInputLabel-root': { color: 'var(--text-secondary)' },
                      '& .MuiInputLabel-root.Mui-focused': { color: 'var(--accent-primary)' },
                    }}
                  />
                </Grid>

                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Unit Price"
                    type="number"
                    value={formData.unitPrice || ''}
                    onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || undefined })}
                    inputProps={{ min: 0, step: 0.01 }}
                    InputProps={{ startAdornment: <span style={{ color: 'var(--text-secondary)', marginRight: 4 }}>₹</span> }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: 'var(--text-primary)',
                        '& fieldset': { borderColor: 'var(--border)' },
                        '&:hover fieldset': { borderColor: 'var(--text-secondary)' },
                        '&.Mui-focused fieldset': { borderColor: 'var(--accent-primary)' },
                      },
                      '& .MuiInputLabel-root': { color: 'var(--text-secondary)' },
                      '& .MuiInputLabel-root.Mui-focused': { color: 'var(--accent-primary)' },
                    }}
                  />
                </Grid>

                {/* Image Capture Section */}
                <Grid item xs={12}>
                  <Divider sx={{ my: 1, borderColor: 'var(--border)' }} />
                  <ImageCapture
                    images={images}
                    existingImages={existingImages}
                    onImagesChange={setImages}
                    onExistingImageRemove={handleExistingImageRemove}
                    maxImages={5}
                    disabled={submitting}
                  />
                </Grid>
              </Grid>

              <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button onClick={onClose} disabled={submitting} sx={{ color: 'var(--text-secondary)' }}>
                  Cancel
                </Button>
                <Button type="submit" variant="contained" disabled={submitting} sx={{ bgcolor: 'var(--accent-primary)', '&:hover': { bgcolor: 'var(--accent-hover)' } }}>
                  {submitting ? 'Saving...' : product ? 'Update' : 'Create'}
                </Button>
              </Box>
            </form>
          </>
        )}
      </Box>
    </Drawer>
  );
};

export default ProductFormDrawer;
