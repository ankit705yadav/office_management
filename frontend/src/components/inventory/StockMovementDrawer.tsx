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
  Alert,
  Paper,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { inventoryService, InventoryProduct, StockMovementRequest } from '../../services/inventory.service';
import { vendorService, Vendor } from '../../services/vendor.service';
import { customerService, Customer } from '../../services/customer.service';
import ImageCapture from '../common/ImageCapture';

interface Props {
  open: boolean;
  onClose: () => void;
  product: InventoryProduct | null;
  onRecorded: () => void;
}

/**
 * StockMovementDrawer - For bulk stock movements
 *
 * This drawer is used for recording bulk stock movements with detailed tracking.
 * For quick single-item scan operations, use the main ScannerModal instead.
 */
const StockMovementDrawer: React.FC<Props> = ({ open, onClose, product, onRecorded }) => {
  const [formData, setFormData] = useState<StockMovementRequest>({
    productId: 0,
    movementType: 'in',
    quantity: 0,
    reason: '',
    referenceNumber: '',
    // Vendor for stock in
    vendorId: undefined,
    // Customer for stock out
    customerId: undefined,
    // Sender details (for stock in)
    senderName: '',
    senderPhone: '',
    senderCompany: '',
    senderAddress: '',
    // Receiver details (for stock out)
    receiverName: '',
    receiverPhone: '',
    receiverCompany: '',
    receiverAddress: '',
    // Delivery person details
    deliveryPersonName: '',
    deliveryPersonPhone: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    if (open) {
      loadProducts();
      loadVendorsAndCustomers();
      setImages([]);
      if (product) {
        setFormData({
          productId: product.id,
          movementType: 'in',
          quantity: 0,
          reason: '',
          referenceNumber: '',
          vendorId: undefined,
          customerId: undefined,
          senderName: '',
          senderPhone: '',
          senderCompany: '',
          senderAddress: '',
          receiverName: '',
          receiverPhone: '',
          receiverCompany: '',
          receiverAddress: '',
          deliveryPersonName: '',
          deliveryPersonPhone: '',
        });
      } else {
        setFormData({
          productId: 0,
          movementType: 'in',
          quantity: 0,
          reason: '',
          referenceNumber: '',
          vendorId: undefined,
          customerId: undefined,
          senderName: '',
          senderPhone: '',
          senderCompany: '',
          senderAddress: '',
          receiverName: '',
          receiverPhone: '',
          receiverCompany: '',
          receiverAddress: '',
          deliveryPersonName: '',
          deliveryPersonPhone: '',
        });
      }
    }
  }, [open, product]);

  const loadProducts = async () => {
    try {
      setLoadingProducts(true);
      const response = await inventoryService.getAllProducts({ limit: 1000 });
      setProducts(response.items);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const loadVendorsAndCustomers = async () => {
    try {
      const [vendorsResponse, customersResponse] = await Promise.all([
        vendorService.getAllVendors({ isActive: true, limit: 1000 }),
        customerService.getAllCustomers({ isActive: true, limit: 1000 }),
      ]);
      setVendors(vendorsResponse.items);
      setCustomers(customersResponse.items);
    } catch (error) {
      console.error('Error loading vendors/customers:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.productId) {
      toast.error('Please select a product');
      return;
    }

    if (!formData.quantity || formData.quantity <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }

    try {
      setSubmitting(true);
      await inventoryService.recordStockMovement({
        ...formData,
        images: images.length > 0 ? images : undefined,
      });
      toast.success('Stock movement recorded successfully');
      onRecorded();
      onClose();
    } catch (error: any) {
      console.error('Error recording movement:', error);
      toast.error(error.response?.data?.message || 'Failed to record movement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleProductChange = (productId: number) => {
    setFormData({ ...formData, productId });
  };

  const currentProduct = product || products.find((p) => p.id === formData.productId);
  const maxQuantity = currentProduct && formData.movementType === 'out' ? currentProduct.quantity : undefined;

  // Common TextField styles for dark theme
  const textFieldSx = {
    '& .MuiOutlinedInput-root': {
      color: 'var(--text-primary)',
      '& fieldset': { borderColor: 'var(--border)' },
      '&:hover fieldset': { borderColor: 'var(--text-secondary)' },
      '&.Mui-focused fieldset': { borderColor: 'var(--accent-primary)' },
    },
    '& .MuiInputLabel-root': {
      color: 'var(--text-secondary)',
      '&.Mui-focused': { color: 'var(--accent-primary)' },
    },
    '& .MuiFormHelperText-root': {
      color: 'var(--text-secondary)',
    },
    '& input::placeholder, & textarea::placeholder': {
      color: 'var(--text-secondary)',
      opacity: 0.7,
    },
  };

  const selectSx = {
    color: 'var(--text-primary)',
    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--border)' },
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--text-secondary)' },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--accent-primary)' },
    '& .MuiSvgIcon-root': { color: 'var(--text-secondary)' },
  };

  const menuProps = {
    PaperProps: {
      sx: {
        bgcolor: 'var(--surface)',
        border: '1px solid var(--border)',
        '& .MuiMenuItem-root': {
          color: 'var(--text-primary)',
          '&:hover': { bgcolor: 'var(--bg-elevated)' },
          '&.Mui-selected': { bgcolor: 'var(--bg-elevated)' },
        },
      },
    },
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
          <Typography variant="h6" sx={{ color: 'var(--text-primary)' }}>
            Bulk Stock Movement
          </Typography>
          <IconButton onClick={onClose} sx={{ color: 'var(--text-secondary)' }}>
            <Close />
          </IconButton>
        </Box>

        <Alert
          severity="info"
          sx={{
            mb: 3,
            bgcolor: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            '& .MuiAlert-icon': { color: 'var(--accent-info)' },
            '& .MuiAlert-message': { color: 'var(--text-secondary)' },
          }}
        >
          Use this form for bulk quantity adjustments. For single-item scans, use the Stock In/Out buttons on the main page.
        </Alert>

        <Divider sx={{ mb: 3, borderColor: 'var(--border)' }} />

        {/* Selected Product Display */}
        {product && (
          <Alert
            severity="success"
            sx={{
              mb: 3,
              bgcolor: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              '& .MuiAlert-icon': { color: '#22C55E' },
            }}
          >
            <Typography variant="body2" fontWeight="medium" sx={{ color: '#22C55E' }}>
              {product.name}
            </Typography>
            <Typography variant="caption" sx={{ color: 'var(--text-primary)' }}>
              SKU: {product.sku} | Current Stock: {product.quantity} {product.unit}
              {product.brand && ` | Brand: ${product.brand}`}
            </Typography>
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            {/* Manual Product Selection */}
            {!product && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: 'var(--text-secondary)', '&.Mui-focused': { color: 'var(--accent-primary)' } }}>
                    Select Product
                  </InputLabel>
                  <Select
                    value={formData.productId || ''}
                    onChange={(e) => handleProductChange(Number(e.target.value))}
                    label="Select Product"
                    disabled={loadingProducts}
                    sx={selectSx}
                    MenuProps={menuProps}
                  >
                    <MenuItem value="">
                      <em>Select a product</em>
                    </MenuItem>
                    {products.map((p) => (
                      <MenuItem key={p.id} value={p.id}>
                        {p.name} ({p.sku}) - Stock: {p.quantity}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            {/* Current Stock Info */}
            {currentProduct && (
              <Grid item xs={12}>
                <Paper sx={{ p: 2, bgcolor: 'var(--bg-elevated)', border: '1px solid var(--border)', backgroundImage: 'none' }}>
                  <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
                    Current Stock
                  </Typography>
                  <Typography variant="h6" sx={{ color: 'var(--text-primary)' }}>
                    {currentProduct.quantity} {currentProduct.unit}
                  </Typography>
                </Paper>
              </Grid>
            )}

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: 'var(--text-secondary)', '&.Mui-focused': { color: 'var(--accent-primary)' } }}>
                  Movement Type
                </InputLabel>
                <Select
                  value={formData.movementType}
                  onChange={(e) => setFormData({ ...formData, movementType: e.target.value as any })}
                  label="Movement Type"
                  sx={selectSx}
                  MenuProps={menuProps}
                >
                  <MenuItem value="in">Stock In</MenuItem>
                  <MenuItem value="out">Stock Out</MenuItem>
                  <MenuItem value="adjustment">Adjustment</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Quantity"
                type="number"
                value={formData.quantity || ''}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                required
                inputProps={{
                  min: 1,
                  max: maxQuantity,
                }}
                helperText={
                  formData.movementType === 'out' && maxQuantity
                    ? `Maximum available: ${maxQuantity}`
                    : ''
                }
                sx={textFieldSx}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Reference Number"
                value={formData.referenceNumber || ''}
                onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                placeholder="PO#, Invoice#, etc."
                sx={textFieldSx}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Reason / Notes"
                value={formData.reason || ''}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                multiline
                rows={3}
                placeholder="Optional notes about this movement"
                sx={textFieldSx}
              />
            </Grid>

            {/* Vendor Selection (for Stock In) */}
            {formData.movementType === 'in' && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: 'var(--text-secondary)', '&.Mui-focused': { color: 'var(--accent-primary)' } }}>
                    Vendor (optional)
                  </InputLabel>
                  <Select
                    value={formData.vendorId || ''}
                    onChange={(e) => setFormData({ ...formData, vendorId: e.target.value ? Number(e.target.value) : undefined })}
                    label="Vendor (optional)"
                    sx={selectSx}
                    MenuProps={menuProps}
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
              </Grid>
            )}

            {/* Sender Details Section (for Stock In) */}
            {formData.movementType === 'in' && (
              <>
                <Grid item xs={12}>
                  <Divider sx={{ my: 1, borderColor: 'var(--border)' }} />
                  <Typography variant="subtitle2" sx={{ mt: 1, color: 'var(--text-secondary)' }}>
                    Sender Details (Who sent the inventory)
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Sender Name"
                    value={formData.senderName || ''}
                    onChange={(e) => setFormData({ ...formData, senderName: e.target.value })}
                    placeholder="Person/Company name"
                    sx={textFieldSx}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Sender Phone"
                    value={formData.senderPhone || ''}
                    onChange={(e) => setFormData({ ...formData, senderPhone: e.target.value })}
                    placeholder="Phone number"
                    sx={textFieldSx}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Sender Company/Organization"
                    value={formData.senderCompany || ''}
                    onChange={(e) => setFormData({ ...formData, senderCompany: e.target.value })}
                    placeholder="Company or organization name"
                    sx={textFieldSx}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Sender Address"
                    value={formData.senderAddress || ''}
                    onChange={(e) => setFormData({ ...formData, senderAddress: e.target.value })}
                    multiline
                    rows={2}
                    placeholder="Full address (optional)"
                    sx={textFieldSx}
                  />
                </Grid>
              </>
            )}

            {/* Customer Selection (for Stock Out) */}
            {formData.movementType === 'out' && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: 'var(--text-secondary)', '&.Mui-focused': { color: 'var(--accent-primary)' } }}>
                    Customer (optional)
                  </InputLabel>
                  <Select
                    value={formData.customerId || ''}
                    onChange={(e) => setFormData({ ...formData, customerId: e.target.value ? Number(e.target.value) : undefined })}
                    label="Customer (optional)"
                    sx={selectSx}
                    MenuProps={menuProps}
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {customers.map((customer) => (
                      <MenuItem key={customer.id} value={customer.id}>
                        {customer.name}
                        {customer.companyName && ` (${customer.companyName})`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            {/* Receiver Details Section (for Stock Out) */}
            {formData.movementType === 'out' && (
              <>
                <Grid item xs={12}>
                  <Divider sx={{ my: 1, borderColor: 'var(--border)' }} />
                  <Typography variant="subtitle2" sx={{ mt: 1, color: 'var(--text-secondary)' }}>
                    Receiver Details (Who receives the inventory)
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Receiver Name"
                    value={formData.receiverName || ''}
                    onChange={(e) => setFormData({ ...formData, receiverName: e.target.value })}
                    placeholder="Person/Company name"
                    sx={textFieldSx}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Receiver Phone"
                    value={formData.receiverPhone || ''}
                    onChange={(e) => setFormData({ ...formData, receiverPhone: e.target.value })}
                    placeholder="Phone number"
                    sx={textFieldSx}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Receiver Company/Organization"
                    value={formData.receiverCompany || ''}
                    onChange={(e) => setFormData({ ...formData, receiverCompany: e.target.value })}
                    placeholder="Company or organization name"
                    sx={textFieldSx}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Receiver Address"
                    value={formData.receiverAddress || ''}
                    onChange={(e) => setFormData({ ...formData, receiverAddress: e.target.value })}
                    multiline
                    rows={2}
                    placeholder="Full address (optional)"
                    sx={textFieldSx}
                  />
                </Grid>
              </>
            )}

            {/* Delivery Person Section (for Stock In and Stock Out) */}
            {(formData.movementType === 'in' || formData.movementType === 'out') && (
              <>
                <Grid item xs={12}>
                  <Divider sx={{ my: 1, borderColor: 'var(--border)' }} />
                  <Typography variant="subtitle2" sx={{ mt: 1, color: 'var(--text-secondary)' }}>
                    Delivery Person Details
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Delivery Person Name"
                    value={formData.deliveryPersonName || ''}
                    onChange={(e) => setFormData({ ...formData, deliveryPersonName: e.target.value })}
                    placeholder="Delivery person name"
                    sx={textFieldSx}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Delivery Person Phone"
                    value={formData.deliveryPersonPhone || ''}
                    onChange={(e) => setFormData({ ...formData, deliveryPersonPhone: e.target.value })}
                    placeholder="Phone number"
                    sx={textFieldSx}
                  />
                </Grid>
              </>
            )}

            {/* New Quantity Preview */}
            {currentProduct && formData.quantity > 0 && (
              <Grid item xs={12}>
                <Paper sx={{ p: 2, bgcolor: 'var(--accent-primary)', backgroundImage: 'none' }}>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    New Stock Level
                  </Typography>
                  <Typography variant="h6" sx={{ color: '#fff' }}>
                    {formData.movementType === 'in'
                      ? currentProduct.quantity + formData.quantity
                      : formData.movementType === 'out'
                      ? currentProduct.quantity - formData.quantity
                      : formData.quantity}{' '}
                    {currentProduct.unit}
                  </Typography>
                </Paper>
              </Grid>
            )}

            {/* Image Capture Section */}
            <Grid item xs={12}>
              <Divider sx={{ my: 1, borderColor: 'var(--border)' }} />
              <ImageCapture
                images={images}
                onImagesChange={setImages}
                maxImages={5}
                disabled={submitting}
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button onClick={onClose} disabled={submitting} sx={{ color: 'var(--text-secondary)' }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting || !formData.productId}
              sx={{ bgcolor: 'var(--accent-primary)', '&:hover': { bgcolor: 'var(--accent-hover)' } }}
            >
              {submitting ? 'Recording...' : 'Record Movement'}
            </Button>
          </Box>
        </form>
      </Box>
    </Drawer>
  );
};

export default StockMovementDrawer;
