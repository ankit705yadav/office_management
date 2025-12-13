import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tab,
  Tabs,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Search,
  Add,
  Remove,
  History,
  Edit,
  Delete,
  ArrowDownward,
  ArrowUpward,
  SwapVert,
  Inventory,
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import {
  inventoryService,
  InventoryProduct,
  InventoryMovement,
  GroupedProduct,
} from '@/services/inventory.service';
import { format } from 'date-fns';

// Import components
import ScannerModal from '@/components/inventory/ScannerModal';
import NewProductFromScanDrawer from '@/components/inventory/NewProductFromScanDrawer';
import ManualEntryDrawer from '@/components/inventory/ManualEntryDrawer';
import StockOutDrawer from '@/components/inventory/StockOutDrawer';
import ProductGroupList from '@/components/inventory/ProductGroupList';
import ProductFormDrawer from '@/components/inventory/ProductFormDrawer';
import StockHistoryDrawer from '@/components/inventory/StockHistoryDrawer';
import ImageViewerDialog from '@/components/inventory/ImageViewerDialog';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

const InventoryPage: React.FC = () => {
  const { user } = useAuth();
  const canManage = user?.role === 'admin' || user?.role === 'manager';

  // Tab state
  const [tabValue, setTabValue] = useState(0);

  // Products state
  const [groupedProducts, setGroupedProducts] = useState<GroupedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);

  // Movement log state
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [movementsLoading, setMovementsLoading] = useState(false);
  const [movementTypeFilter, setMovementTypeFilter] = useState('');

  // Scanner state
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanMode, setScanMode] = useState<'in' | 'out'>('in');

  // Drawer states
  const [newProductDrawerOpen, setNewProductDrawerOpen] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [manualEntryDrawerOpen, setManualEntryDrawerOpen] = useState(false);
  const [stockOutDrawerOpen, setStockOutDrawerOpen] = useState(false);
  const [productFormDrawerOpen, setProductFormDrawerOpen] = useState(false);
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<InventoryProduct | null>(null);

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<InventoryProduct | null>(null);

  // Image viewer
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [imageViewerProduct, setImageViewerProduct] = useState<InventoryProduct | null>(null);

  // Toast notifications
  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Load data
  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await inventoryService.getGroupedProducts({
        search: searchTerm || undefined,
        category: categoryFilter || undefined,
        brand: brandFilter || undefined,
      });
      setGroupedProducts(data);
    } catch (error) {
      console.error('Failed to load products:', error);
      setToast({
        open: true,
        message: 'Failed to load products',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [searchTerm, categoryFilter, brandFilter]);

  const loadCategoriesAndBrands = async () => {
    try {
      const [cats, brds] = await Promise.all([
        inventoryService.getCategories(),
        inventoryService.getBrands(),
      ]);
      setCategories(cats);
      setBrands(brds);
    } catch (error) {
      console.error('Failed to load categories/brands:', error);
    }
  };

  const loadMovements = async () => {
    try {
      setMovementsLoading(true);
      const response = await inventoryService.getStockMovements({
        movementType: movementTypeFilter || undefined,
        limit: 100,
      });
      setMovements(response.items);
    } catch (error) {
      console.error('Failed to load movements:', error);
    } finally {
      setMovementsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
    loadCategoriesAndBrands();
  }, [loadProducts]);

  useEffect(() => {
    if (tabValue === 1) {
      loadMovements();
    }
  }, [tabValue, movementTypeFilter]);

  // Scanner handlers
  const handleOpenScanner = (mode: 'in' | 'out') => {
    setScanMode(mode);
    setScannerOpen(true);
  };

  const handleScanSuccess = async (barcode: string) => {
    try {
      if (scanMode === 'in') {
        const result = await inventoryService.scanStockIn(barcode);
        if (result.isNew) {
          // New product - open drawer
          setScannedBarcode(barcode);
          setScannerOpen(false);
          setNewProductDrawerOpen(true);
        } else {
          // Existing product - show success
          setToast({
            open: true,
            message: result.message || `Added 1x ${result.product?.name}`,
            severity: 'success',
          });
          loadProducts();
        }
      } else {
        // Stock out
        const result = await inventoryService.scanStockOut(barcode);
        setToast({
          open: true,
          message: result.message,
          severity: 'success',
        });
        loadProducts();
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Scan failed';
      setToast({
        open: true,
        message,
        severity: 'error',
      });
    }
  };

  const handleNewProduct = (barcode: string) => {
    setScannedBarcode(barcode);
    setScannerOpen(false);
    setNewProductDrawerOpen(true);
  };

  const handleManualEntry = () => {
    setScannerOpen(false);
    if (scanMode === 'in') {
      setManualEntryDrawerOpen(true);
    } else {
      setStockOutDrawerOpen(true);
    }
  };

  const handleProductCreated = () => {
    loadProducts();
    loadCategoriesAndBrands();
    setToast({
      open: true,
      message: 'Product added successfully',
      severity: 'success',
    });
  };

  // Product actions
  const handleEditProduct = (product: InventoryProduct) => {
    setSelectedProduct(product);
    setProductFormDrawerOpen(true);
  };

  const handleViewHistory = (product: InventoryProduct) => {
    setSelectedProduct(product);
    setHistoryDrawerOpen(true);
  };

  const handleViewImages = (product: InventoryProduct) => {
    setImageViewerProduct(product);
    setImageViewerOpen(true);
  };

  const handlePrintBarcode = (product: InventoryProduct) => {
    if (!product.qrCode) return;

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
            body { margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: Arial; }
            .container { text-align: center; padding: 20px; }
            .name { font-size: 14px; font-weight: bold; margin-bottom: 5px; }
            img { max-width: 200px; }
            .sku { font-size: 11px; color: #666; margin-top: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="name">${product.name}</div>
            <img src="${product.qrCode}" alt="Barcode" />
            <div class="sku">${product.sku}</div>
          </div>
          <script>
            window.onload = function() { setTimeout(function() { window.print(); window.close(); }, 250); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDeleteClick = (product: InventoryProduct) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;

    try {
      await inventoryService.deleteProduct(productToDelete.id);
      setToast({
        open: true,
        message: 'Product deleted successfully',
        severity: 'success',
      });
      loadProducts();
    } catch (error) {
      setToast({
        open: true,
        message: 'Failed to delete product',
        severity: 'error',
      });
    } finally {
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'in':
        return <ArrowDownward sx={{ color: 'var(--accent-success)' }} />;
      case 'out':
        return <ArrowUpward sx={{ color: 'var(--accent-error)' }} />;
      default:
        return <SwapVert sx={{ color: 'var(--accent-warning)' }} />;
    }
  };

  const getMovementColor = (type: string) => {
    switch (type) {
      case 'in':
        return 'success';
      case 'out':
        return 'error';
      default:
        return 'warning';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ color: 'var(--text-primary)', mb: 1 }}>
          Inventory
        </Typography>
        <Typography sx={{ color: 'var(--text-secondary)' }}>
          Manage products with barcode scan-first approach
        </Typography>
      </Box>

      {/* Stock In / Stock Out Buttons */}
      {canManage && (
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<Add />}
            onClick={() => handleOpenScanner('in')}
            sx={{
              flex: 1,
              py: 2,
              backgroundColor: 'var(--accent-success)',
              '&:hover': { backgroundColor: '#2e7d32' },
              fontSize: '1.1rem',
            }}
          >
            Stock In
          </Button>
          <Button
            variant="contained"
            size="large"
            startIcon={<Remove />}
            onClick={() => handleOpenScanner('out')}
            sx={{
              flex: 1,
              py: 2,
              backgroundColor: 'var(--accent-error)',
              '&:hover': { backgroundColor: '#c62828' },
              fontSize: '1.1rem',
            }}
          >
            Stock Out
          </Button>
        </Box>
      )}

      {/* Tabs */}
      <Paper sx={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          sx={{
            borderBottom: '1px solid var(--border)',
            '& .MuiTab-root': { color: 'var(--text-secondary)' },
            '& .Mui-selected': { color: 'var(--accent-primary)' },
          }}
        >
          <Tab icon={<Inventory />} label="Products" iconPosition="start" />
          <Tab icon={<History />} label="Stock Log" iconPosition="start" />
        </Tabs>

        {/* Products Tab */}
        <TabPanel value={tabValue} index={0}>
          {/* Filters */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3, px: 2 }}>
            <TextField
              placeholder="Search products..."
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: 'var(--text-muted)' }} />
                  </InputAdornment>
                ),
                sx: { color: 'var(--text-primary)' },
              }}
              sx={{ flex: 1 }}
            />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel sx={{ color: 'var(--text-muted)' }}>Category</InputLabel>
              <Select
                value={categoryFilter}
                label="Category"
                onChange={(e) => setCategoryFilter(e.target.value)}
                sx={{ color: 'var(--text-primary)' }}
              >
                <MenuItem value="">All</MenuItem>
                {categories.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel sx={{ color: 'var(--text-muted)' }}>Brand</InputLabel>
              <Select
                value={brandFilter}
                label="Brand"
                onChange={(e) => setBrandFilter(e.target.value)}
                sx={{ color: 'var(--text-primary)' }}
              >
                <MenuItem value="">All</MenuItem>
                {brands.map((brand) => (
                  <MenuItem key={brand} value={brand}>
                    {brand}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Product List */}
          <Box sx={{ px: 2, pb: 2 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <ProductGroupList
                groups={groupedProducts}
                onEditProduct={handleEditProduct}
                onDeleteProduct={handleDeleteClick}
                onViewHistory={handleViewHistory}
                onPrintBarcode={handlePrintBarcode}
                onViewImages={handleViewImages}
              />
            )}
          </Box>
        </TabPanel>

        {/* Stock Log Tab */}
        <TabPanel value={tabValue} index={1}>
          {/* Filters */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3, px: 2 }}>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel sx={{ color: 'var(--text-muted)' }}>Movement Type</InputLabel>
              <Select
                value={movementTypeFilter}
                label="Movement Type"
                onChange={(e) => setMovementTypeFilter(e.target.value)}
                sx={{ color: 'var(--text-primary)' }}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="in">Stock In</MenuItem>
                <MenuItem value="out">Stock Out</MenuItem>
                <MenuItem value="adjustment">Adjustment</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Movements Table */}
          <TableContainer sx={{ px: 2, pb: 2 }}>
            {movementsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : movements.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4, color: 'var(--text-muted)' }}>
                <History sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                <Typography>No stock movements found</Typography>
              </Box>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: 'var(--text-secondary)' }}>Date & Time</TableCell>
                    <TableCell sx={{ color: 'var(--text-secondary)' }}>Product</TableCell>
                    <TableCell sx={{ color: 'var(--text-secondary)' }}>Type</TableCell>
                    <TableCell align="center" sx={{ color: 'var(--text-secondary)' }}>
                      Qty
                    </TableCell>
                    <TableCell sx={{ color: 'var(--text-secondary)' }}>Previous</TableCell>
                    <TableCell sx={{ color: 'var(--text-secondary)' }}>New</TableCell>
                    <TableCell sx={{ color: 'var(--text-secondary)' }}>Vendor/Customer</TableCell>
                    <TableCell sx={{ color: 'var(--text-secondary)' }}>Reason</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {movements.map((movement) => {
                    const movementType = movement.movementType || movement.movement_type || '';
                    return (
                    <TableRow key={movement.id}>
                      <TableCell sx={{ color: 'var(--text-primary)' }}>
                        {format(new Date(movement.createdAt || movement.created_at || ''), 'MMM dd, yyyy HH:mm')}
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ color: 'var(--text-primary)' }}>
                          {movement.product?.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'var(--text-muted)' }}>
                          {movement.product?.sku}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getMovementIcon(movementType)}
                          label={movementType.toUpperCase()}
                          size="small"
                          color={getMovementColor(movementType) as any}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          fontWeight: 600,
                          color:
                            movementType === 'in'
                              ? 'var(--accent-success)'
                              : 'var(--accent-error)',
                        }}
                      >
                        {movementType === 'in' ? '+' : '-'}
                        {movement.quantity}
                      </TableCell>
                      <TableCell sx={{ color: 'var(--text-muted)' }}>
                        {movement.previousQuantity ?? movement.previous_quantity}
                      </TableCell>
                      <TableCell sx={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                        {movement.newQuantity ?? movement.new_quantity}
                      </TableCell>
                      <TableCell>
                        {movementType === 'in' && movement.vendor ? (
                          <Typography variant="body2" sx={{ color: 'var(--accent-success)' }}>
                            {movement.vendor.name}
                          </Typography>
                        ) : movementType === 'out' && movement.customer ? (
                          <Typography variant="body2" sx={{ color: 'var(--accent-warning, #f59e0b)' }}>
                            {movement.customer.name}
                          </Typography>
                        ) : (
                          <Typography variant="body2" sx={{ color: 'var(--text-muted)' }}>
                            -
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ color: 'var(--text-secondary)' }}>
                        {movement.reason || '-'}
                      </TableCell>
                    </TableRow>
                  );
                  })}
                </TableBody>
              </Table>
            )}
          </TableContainer>
        </TabPanel>
      </Paper>

      {/* Scanner Modal */}
      <ScannerModal
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        mode={scanMode}
        onScanSuccess={handleScanSuccess}
        onNewProduct={handleNewProduct}
        onManualEntry={handleManualEntry}
      />

      {/* New Product from Scan Drawer */}
      <NewProductFromScanDrawer
        open={newProductDrawerOpen}
        onClose={() => setNewProductDrawerOpen(false)}
        barcode={scannedBarcode}
        onProductCreated={handleProductCreated}
      />

      {/* Manual Entry Drawer (Stock In only) */}
      <ManualEntryDrawer
        open={manualEntryDrawerOpen}
        onClose={() => setManualEntryDrawerOpen(false)}
        mode="in"
        onProductCreated={handleProductCreated}
      />

      {/* Stock Out Drawer */}
      <StockOutDrawer
        open={stockOutDrawerOpen}
        onClose={() => setStockOutDrawerOpen(false)}
        onStockOutComplete={() => {
          loadProducts();
          setToast({
            open: true,
            message: 'Stock out completed successfully',
            severity: 'success',
          });
        }}
      />

      {/* Product Form Drawer (Edit) */}
      <ProductFormDrawer
        open={productFormDrawerOpen}
        onClose={() => {
          setProductFormDrawerOpen(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
        onSave={() => {
          loadProducts();
          loadCategoriesAndBrands();
        }}
        viewOnly={false}
      />

      {/* Stock History Drawer */}
      <StockHistoryDrawer
        open={historyDrawerOpen}
        onClose={() => {
          setHistoryDrawerOpen(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: {
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
          },
        }}
      >
        <DialogTitle sx={{ color: 'var(--text-primary)' }}>Delete Product</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: 'var(--text-secondary)' }}>
            Are you sure you want to delete "{productToDelete?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            sx={{ color: 'var(--text-secondary)' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Image Viewer Dialog */}
      <ImageViewerDialog
        open={imageViewerOpen}
        onClose={() => {
          setImageViewerOpen(false);
          setImageViewerProduct(null);
        }}
        images={imageViewerProduct?.images || []}
        productName={imageViewerProduct?.name || ''}
      />

      {/* Toast Notifications */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setToast({ ...toast, open: false })}
          severity={toast.severity}
          sx={{ width: '100%' }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default InventoryPage;
