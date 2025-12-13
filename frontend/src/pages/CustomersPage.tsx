import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  IconButton,
  Chip,
  Drawer,
  Divider,
  Grid,
  CircularProgress,
  Tooltip,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Search,
  Close,
  People,
  Phone,
  Email,
  LocationOn,
  Business,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import { customerService, Customer, CreateCustomerRequest } from '../services/customer.service';

const defaultCategories = ['Retail', 'Wholesale', 'Corporate', 'Government', 'Individual', 'Other'];

const CustomersPage: React.FC = () => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState<string[]>(defaultCategories);

  // Drawer state
  const [openDrawer, setOpenDrawer] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateCustomerRequest>({
    name: '',
    companyName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    gstNumber: '',
    panNumber: '',
    bankAccountNumber: '',
    bankName: '',
    bankIfscCode: '',
    contactPerson: '',
    contactPersonPhone: '',
    category: '',
    notes: '',
  });

  const canManageCustomers = user?.role === 'admin' || user?.role === 'manager';

  useEffect(() => {
    loadCustomers();
    loadCategories();
  }, [searchTerm, categoryFilter]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const response = await customerService.getAllCustomers({
        search: searchTerm || undefined,
        category: categoryFilter || undefined,
        limit: 100,
      });
      setCustomers(response.items);
    } catch (error) {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const cats = await customerService.getCategories();
      if (cats.length > 0) {
        setCategories([...new Set([...defaultCategories, ...cats])]);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const handleOpenDrawer = (customer?: Customer) => {
    if (customer) {
      setSelectedCustomer(customer);
      setFormData({
        name: customer.name,
        companyName: customer.companyName || '',
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address || '',
        city: customer.city || '',
        state: customer.state || '',
        pincode: customer.pincode || '',
        gstNumber: customer.gstNumber || '',
        panNumber: customer.panNumber || '',
        bankAccountNumber: customer.bankAccountNumber || '',
        bankName: customer.bankName || '',
        bankIfscCode: customer.bankIfscCode || '',
        contactPerson: customer.contactPerson || '',
        contactPersonPhone: customer.contactPersonPhone || '',
        category: customer.category || '',
        notes: customer.notes || '',
      });
    } else {
      setSelectedCustomer(null);
      setFormData({
        name: '',
        companyName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        gstNumber: '',
        panNumber: '',
        bankAccountNumber: '',
        bankName: '',
        bankIfscCode: '',
        contactPerson: '',
        contactPersonPhone: '',
        category: '',
        notes: '',
      });
    }
    setOpenDrawer(true);
  };

  const handleCloseDrawer = () => {
    if (!submitting) {
      setOpenDrawer(false);
      setSelectedCustomer(null);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Customer name is required');
      return;
    }

    try {
      setSubmitting(true);
      if (selectedCustomer) {
        await customerService.updateCustomer(selectedCustomer.id, formData);
        toast.success('Customer updated successfully');
      } else {
        await customerService.createCustomer(formData);
        toast.success('Customer created successfully');
      }
      handleCloseDrawer();
      loadCustomers();
      loadCategories();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save customer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!customerToDelete) return;

    try {
      await customerService.deleteCustomer(customerToDelete.id);
      toast.success('Customer deleted successfully');
      setDeleteDialogOpen(false);
      setCustomerToDelete(null);
      loadCustomers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete customer');
    }
  };

  const handleToggleStatus = async (customer: Customer) => {
    try {
      await customerService.toggleCustomerStatus(customer.id);
      toast.success(`Customer ${customer.isActive ? 'deactivated' : 'activated'} successfully`);
      loadCustomers();
    } catch (error) {
      toast.error('Failed to update customer status');
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Customer Management</h1>
          <p className="text-sm text-text-secondary mt-1">Manage your customers and clients</p>
        </div>
        {canManageCustomers && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDrawer()}
            sx={{ bgcolor: 'var(--accent-primary)', '&:hover': { bgcolor: 'var(--accent-hover)' } }}
          >
            Add Customer
          </Button>
        )}
      </Box>

      {/* Search and Filters */}
      <Card sx={{ mb: 3, bgcolor: 'var(--surface)', border: '1px solid var(--border)' }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: 'var(--text-secondary)' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: 'var(--text-primary)',
                    '& fieldset': { borderColor: 'var(--border)' },
                    '&:hover fieldset': { borderColor: 'var(--text-secondary)' },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ color: 'var(--text-secondary)' }}>Category</InputLabel>
                <Select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  label="Category"
                  sx={{
                    color: 'var(--text-primary)',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--border)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--text-secondary)' },
                    '& .MuiSvgIcon-root': { color: 'var(--text-secondary)' },
                  }}
                  MenuProps={{
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
                  }}
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {categories.map((cat) => (
                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                {customers.length} customer(s)
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Customers Table */}
      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress sx={{ color: 'var(--accent-primary)' }} />
        </Box>
      ) : (
        <Card sx={{ bgcolor: 'var(--surface)', border: '1px solid var(--border)' }}>
          <TableContainer component={Paper} variant="outlined" sx={{ border: 'none', bgcolor: 'var(--surface)', backgroundImage: 'none' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'var(--bg-elevated)' }}>
                  <TableCell sx={{ fontWeight: 600, color: 'var(--text-secondary)', borderColor: 'var(--border)' }}>Customer</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'var(--text-secondary)', borderColor: 'var(--border)' }}>Contact</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'var(--text-secondary)', borderColor: 'var(--border)' }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'var(--text-secondary)', borderColor: 'var(--border)' }}>GST/PAN</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'var(--text-secondary)', borderColor: 'var(--border)' }}>Status</TableCell>
                  {canManageCustomers && (
                    <TableCell align="center" sx={{ fontWeight: 600, color: 'var(--text-secondary)', borderColor: 'var(--border)' }}>Actions</TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {customers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={canManageCustomers ? 6 : 5} align="center" sx={{ py: 4, borderColor: 'var(--border)' }}>
                      <People sx={{ fontSize: 48, color: 'var(--text-muted)', mb: 1 }} />
                      <Typography sx={{ color: 'var(--text-secondary)' }}>No customers found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  customers.map((customer) => (
                    <TableRow key={customer.id} hover sx={{ '&:hover': { bgcolor: 'var(--bg-elevated)' } }}>
                      <TableCell sx={{ borderColor: 'var(--border)' }}>
                        <Box>
                          <Typography variant="body2" fontWeight={500} sx={{ color: 'var(--text-primary)' }}>
                            {customer.name}
                          </Typography>
                          {customer.companyName && (
                            <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
                              <Business sx={{ fontSize: 14, color: 'var(--text-muted)' }} />
                              <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
                                {customer.companyName}
                              </Typography>
                            </Box>
                          )}
                          {customer.city && (
                            <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
                              <LocationOn sx={{ fontSize: 14, color: 'var(--text-muted)' }} />
                              <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
                                {customer.city}{customer.state ? `, ${customer.state}` : ''}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ borderColor: 'var(--border)' }}>
                        <Box>
                          {customer.contactPerson && (
                            <Typography variant="body2" sx={{ color: 'var(--text-primary)' }}>
                              {customer.contactPerson}
                            </Typography>
                          )}
                          {customer.phone && (
                            <Box display="flex" alignItems="center" gap={0.5}>
                              <Phone sx={{ fontSize: 14, color: 'var(--text-muted)' }} />
                              <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>{customer.phone}</Typography>
                            </Box>
                          )}
                          {customer.email && (
                            <Box display="flex" alignItems="center" gap={0.5}>
                              <Email sx={{ fontSize: 14, color: 'var(--text-muted)' }} />
                              <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>{customer.email}</Typography>
                            </Box>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ borderColor: 'var(--border)' }}>
                        {customer.category ? (
                          <Chip label={customer.category} size="small" sx={{ bgcolor: '#10B981', color: '#ffffff' }} />
                        ) : (
                          <Typography variant="body2" sx={{ color: 'var(--text-muted)' }}>-</Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ borderColor: 'var(--border)' }}>
                        <Box>
                          {customer.gstNumber && (
                            <Typography variant="caption" sx={{ color: 'var(--text-secondary)', display: 'block' }}>
                              GST: {customer.gstNumber}
                            </Typography>
                          )}
                          {customer.panNumber && (
                            <Typography variant="caption" sx={{ color: 'var(--text-secondary)', display: 'block' }}>
                              PAN: {customer.panNumber}
                            </Typography>
                          )}
                          {!customer.gstNumber && !customer.panNumber && (
                            <Typography variant="body2" sx={{ color: 'var(--text-muted)' }}>-</Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ borderColor: 'var(--border)' }}>
                        <Chip
                          label={customer.isActive ? 'Active' : 'Inactive'}
                          size="small"
                          color={customer.isActive ? 'success' : 'default'}
                          onClick={canManageCustomers ? () => handleToggleStatus(customer) : undefined}
                          sx={{ cursor: canManageCustomers ? 'pointer' : 'default' }}
                        />
                      </TableCell>
                      {canManageCustomers && (
                        <TableCell align="center" sx={{ borderColor: 'var(--border)' }}>
                          <Box display="flex" gap={0.5} justifyContent="center">
                            <Tooltip title="Edit">
                              <IconButton size="small" onClick={() => handleOpenDrawer(customer)} sx={{ color: 'var(--accent-primary)' }}>
                                <Edit fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {user?.role === 'admin' && (
                              <Tooltip title="Delete">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => {
                                    setCustomerToDelete(customer);
                                    setDeleteDialogOpen(true);
                                  }}
                                >
                                  <Delete fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Add/Edit Customer Drawer */}
      <Drawer
        anchor="right"
        open={openDrawer}
        onClose={handleCloseDrawer}
        PaperProps={{
          sx: { width: { xs: '100%', sm: 480 }, bgcolor: 'var(--surface)' },
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, borderBottom: '1px solid var(--border)' }}>
            <Typography variant="h6" fontWeight={600} sx={{ color: 'var(--text-primary)' }}>
              {selectedCustomer ? 'Edit Customer' : 'Add Customer'}
            </Typography>
            <IconButton onClick={handleCloseDrawer} size="small" sx={{ color: 'var(--text-secondary)' }}>
              <Close />
            </IconButton>
          </Box>

          <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="subtitle2" sx={{ color: 'var(--accent-primary)', fontWeight: 600 }}>Basic Info</Typography>
              <Divider sx={{ borderColor: 'var(--border)' }} />
              <TextField
                fullWidth size="small" label="Customer Name *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={submitting}
              />
              <TextField
                fullWidth size="small" label="Company Name"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                disabled={submitting}
              />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField fullWidth size="small" label="Email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={submitting}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField fullWidth size="small" label="Phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    disabled={submitting}
                  />
                </Grid>
              </Grid>
              <FormControl fullWidth size="small">
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  label="Category"
                  disabled={submitting}
                >
                  {categories.map((cat) => (
                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Typography variant="subtitle2" sx={{ color: 'var(--accent-primary)', fontWeight: 600, mt: 1 }}>Contact Person</Typography>
              <Divider sx={{ borderColor: 'var(--border)' }} />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField fullWidth size="small" label="Contact Person"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    disabled={submitting}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField fullWidth size="small" label="Contact Phone"
                    value={formData.contactPersonPhone}
                    onChange={(e) => setFormData({ ...formData, contactPersonPhone: e.target.value })}
                    disabled={submitting}
                  />
                </Grid>
              </Grid>

              <Typography variant="subtitle2" sx={{ color: 'var(--accent-primary)', fontWeight: 600, mt: 1 }}>Address</Typography>
              <Divider sx={{ borderColor: 'var(--border)' }} />
              <TextField fullWidth size="small" label="Address" multiline rows={2}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                disabled={submitting}
              />
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <TextField fullWidth size="small" label="City"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    disabled={submitting}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField fullWidth size="small" label="State"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    disabled={submitting}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField fullWidth size="small" label="Pincode"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    disabled={submitting}
                  />
                </Grid>
              </Grid>

              <Typography variant="subtitle2" sx={{ color: 'var(--accent-primary)', fontWeight: 600, mt: 1 }}>Tax Details</Typography>
              <Divider sx={{ borderColor: 'var(--border)' }} />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField fullWidth size="small" label="GST Number"
                    value={formData.gstNumber}
                    onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value.toUpperCase() })}
                    disabled={submitting}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField fullWidth size="small" label="PAN Number"
                    value={formData.panNumber}
                    onChange={(e) => setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })}
                    disabled={submitting}
                  />
                </Grid>
              </Grid>

              <Typography variant="subtitle2" sx={{ color: 'var(--accent-primary)', fontWeight: 600, mt: 1 }}>Bank Details</Typography>
              <Divider sx={{ borderColor: 'var(--border)' }} />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField fullWidth size="small" label="Bank Name"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    disabled={submitting}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField fullWidth size="small" label="IFSC Code"
                    value={formData.bankIfscCode}
                    onChange={(e) => setFormData({ ...formData, bankIfscCode: e.target.value.toUpperCase() })}
                    disabled={submitting}
                  />
                </Grid>
              </Grid>
              <TextField fullWidth size="small" label="Bank Account Number"
                value={formData.bankAccountNumber}
                onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                disabled={submitting}
              />

              <Typography variant="subtitle2" sx={{ color: 'var(--accent-primary)', fontWeight: 600, mt: 1 }}>Notes</Typography>
              <Divider sx={{ borderColor: 'var(--border)' }} />
              <TextField fullWidth size="small" label="Notes" multiline rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                disabled={submitting}
              />
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, p: 2, borderTop: '1px solid var(--border)', bgcolor: 'var(--bg-elevated)' }}>
            <Button fullWidth variant="outlined" onClick={handleCloseDrawer} disabled={submitting}
              sx={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}>
              Cancel
            </Button>
            <Button fullWidth variant="contained" onClick={handleSubmit} disabled={submitting || !formData.name.trim()}
              sx={{ bgcolor: 'var(--accent-primary)', '&:hover': { bgcolor: 'var(--accent-hover)' } }}>
              {submitting ? <CircularProgress size={24} /> : selectedCustomer ? 'Update' : 'Create'}
            </Button>
          </Box>
        </Box>
      </Drawer>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: 'var(--surface)',
            border: '1px solid var(--border)',
          },
        }}
      >
        <DialogTitle sx={{ color: 'var(--text-primary)' }}>Delete Customer</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: 'var(--text-secondary)' }}>
            Are you sure you want to delete <strong>{customerToDelete?.name}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid var(--border)', p: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ color: 'var(--text-secondary)' }}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomersPage;
