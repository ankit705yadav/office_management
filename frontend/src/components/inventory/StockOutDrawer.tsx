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
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Close, Remove, Search } from '@mui/icons-material';
import { inventoryService, GroupedProduct, InventoryProduct } from '@/services/inventory.service';
import { customerService, Customer } from '@/services/customer.service';

interface StockOutDrawerProps {
  open: boolean;
  onClose: () => void;
  onStockOutComplete: () => void;
}

const StockOutDrawer: React.FC<StockOutDrawerProps> = ({
  open,
  onClose,
  onStockOutComplete,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [groupedProducts, setGroupedProducts] = useState<GroupedProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<InventoryProduct | null>(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | ''>('');

  useEffect(() => {
    if (open) {
      loadProducts();
      loadCustomers();
    }
  }, [open]);

  const loadCustomers = async () => {
    try {
      const response = await customerService.getAllCustomers({ isActive: true, limit: 1000 });
      setCustomers(response.items);
    } catch (err) {
      console.error('Failed to load customers:', err);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (open) {
        loadProducts();
      }
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await inventoryService.getGroupedProducts({
        search: searchTerm || undefined,
      });
      setGroupedProducts(data);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProduct = (product: InventoryProduct) => {
    setSelectedProduct(product);
    setReason('');
    setSelectedCustomerId('');
    setError(null);
    setSuccess(null);
  };

  const handleStockOut = async () => {
    if (!selectedProduct) return;

    setSubmitting(true);
    setError(null);

    try {
      await inventoryService.recordStockMovement({
        productId: selectedProduct.id,
        movementType: 'out',
        quantity: 1,
        reason: reason.trim() || undefined,
        customerId: selectedCustomerId || undefined,
      });

      setSuccess(`Successfully removed ${selectedProduct.name} (${selectedProduct.sku})`);
      setSelectedProduct(null);
      setReason('');
      setSelectedCustomerId('');
      onStockOutComplete();
      loadProducts();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to stock out');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSearchTerm('');
    setSelectedProduct(null);
    setReason('');
    setSelectedCustomerId('');
    setError(null);
    setSuccess(null);
    onClose();
  };

  const handleBackToSearch = () => {
    setSelectedProduct(null);
    setReason('');
    setSelectedCustomerId('');
    setError(null);
    setSuccess(null);
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
            backgroundColor: 'var(--accent-error)',
            color: '#fff',
          }}
        >
          <Typography variant="h6">
            Stock Out - Select Product
          </Typography>
          <IconButton onClick={handleClose} sx={{ color: '#fff' }}>
            <Close />
          </IconButton>
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          {success && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          )}

          {!selectedProduct ? (
            // Product Search View
            <>
              <TextField
                fullWidth
                placeholder="Search products by name, SKU, or barcode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'var(--text-muted)' }} />,
                  sx: { color: 'var(--text-primary)' },
                }}
                sx={{ mb: 2 }}
              />

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : groupedProducts.filter(g => g.items.some(i => i.quantity > 0)).length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4, color: 'var(--text-muted)' }}>
                  <Typography>No products with stock available</Typography>
                </Box>
              ) : (
                <List disablePadding>
                  {groupedProducts
                    .filter((group) => group.items.some((item) => item.quantity > 0))
                    .map((group) => {
                      const availableItems = group.items.filter((item) => item.quantity > 0);
                      const availableQty = availableItems.reduce((sum, item) => sum + item.quantity, 0);

                      return (
                        <Paper
                          key={group.name}
                          sx={{
                            mb: 2,
                            backgroundColor: 'var(--surface)',
                            border: '1px solid var(--border)',
                            borderRadius: 2,
                            overflow: 'hidden',
                          }}
                        >
                          <Box sx={{ p: 2, backgroundColor: 'var(--bg-elevated)' }}>
                            <Typography
                              variant="subtitle1"
                              sx={{ color: 'var(--text-primary)', fontWeight: 600 }}
                            >
                              {group.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'var(--text-muted)' }}>
                              {group.brand && `${group.brand} • `}
                              {availableQty} item{availableQty !== 1 ? 's' : ''} available
                            </Typography>
                          </Box>
                          <Divider sx={{ borderColor: 'var(--border)' }} />
                          <List dense disablePadding>
                            {availableItems.map((item, index) => (
                              <ListItem
                                key={item.id}
                                component="div"
                                onClick={() => handleSelectProduct(item)}
                                sx={{
                                  px: 2,
                                  py: 1.5,
                                  cursor: 'pointer',
                                  '&:hover': { backgroundColor: 'var(--sidebar-item-hover)' },
                                  borderBottom: index < availableItems.length - 1 ? '1px solid var(--border)' : 'none',
                                }}
                              >
                                <ListItemText
                                  primary={
                                    <Typography sx={{ color: 'var(--text-primary)', fontSize: '0.875rem', fontFamily: 'monospace' }}>
                                      {item.sku}
                                    </Typography>
                                  }
                                  secondary={
                                    <Typography
                                      component="span"
                                      sx={{
                                        color: 'var(--accent-success)',
                                        fontWeight: 500,
                                        fontSize: '0.8rem',
                                      }}
                                    >
                                      Qty: {item.quantity}
                                    </Typography>
                                  }
                                />
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="error"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectProduct(item);
                                  }}
                                  sx={{ minWidth: 90 }}
                                >
                                  Stock Out
                                </Button>
                              </ListItem>
                            ))}
                          </List>
                        </Paper>
                      );
                    })}
                </List>
              )}
            </>
          ) : (
            // Stock Out Confirmation View
            <>
              <Button
                onClick={handleBackToSearch}
                sx={{ mb: 2, color: 'var(--text-secondary)' }}
              >
                &larr; Back to search
              </Button>

              <Paper
                sx={{
                  p: 3,
                  mb: 3,
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 2,
                }}
              >
                <Typography variant="h6" sx={{ color: 'var(--text-primary)', mb: 2 }}>
                  {selectedProduct.name}
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography sx={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                    SKU: {selectedProduct.sku}
                  </Typography>
                  {selectedProduct.brand && (
                    <Typography sx={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                      Brand: {selectedProduct.brand}
                    </Typography>
                  )}
                  {selectedProduct.category && (
                    <Typography sx={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                      Category: {selectedProduct.category}
                    </Typography>
                  )}
                </Box>
              </Paper>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel sx={{ color: 'var(--text-muted)' }}>Customer (optional)</InputLabel>
                <Select
                  value={selectedCustomerId}
                  label="Customer (optional)"
                  onChange={(e) => setSelectedCustomerId(e.target.value as number | '')}
                  sx={{ color: 'var(--text-primary)' }}
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

              <TextField
                label="Reason (optional)"
                fullWidth
                multiline
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                sx={{ mb: 2 }}
                InputProps={{ sx: { color: 'var(--text-primary)' } }}
                InputLabelProps={{ sx: { color: 'var(--text-muted)' } }}
                placeholder="e.g., Sold, Damaged, Returned to supplier..."
              />
            </>
          )}
        </Box>

        {/* Footer - Only show when product is selected */}
        {selectedProduct && (
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
              startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <Remove />}
              onClick={handleStockOut}
              disabled={submitting}
              sx={{
                py: 1.5,
                backgroundColor: 'var(--accent-error)',
                '&:hover': {
                  backgroundColor: 'var(--accent-error-hover, #c62828)',
                },
              }}
            >
              {submitting ? 'Removing...' : 'Remove This Item'}
            </Button>
          </Box>
        )}
      </Box>
    </Drawer>
  );
};

export default StockOutDrawer;
