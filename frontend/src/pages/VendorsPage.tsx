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
  Business,
  Phone,
  Email,
  LocationOn,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import { vendorService, Vendor, CreateVendorRequest } from '../services/vendor.service';

const defaultCategories = ['IT Services', 'Office Supplies', 'Maintenance', 'Catering', 'Transport', 'Consulting', 'Other'];

const VendorsPage: React.FC = () => {
  const { user } = useAuth();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState<string[]>(defaultCategories);

  // Drawer state
  const [openDrawer, setOpenDrawer] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [vendorToDelete, setVendorToDelete] = useState<Vendor | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateVendorRequest>({
    name: '',
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

  const canManageVendors = user?.role === 'admin' || user?.role === 'manager';

  useEffect(() => {
    loadVendors();
    loadCategories();
  }, [searchTerm, categoryFilter]);

  const loadVendors = async () => {
    try {
      setLoading(true);
      const response = await vendorService.getAllVendors({
        search: searchTerm || undefined,
        category: categoryFilter || undefined,
        limit: 100,
      });
      setVendors(response.items);
    } catch (error) {
      toast.error('Failed to load vendors');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const cats = await vendorService.getCategories();
      if (cats.length > 0) {
        setCategories([...new Set([...defaultCategories, ...cats])]);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const handleOpenDrawer = (vendor?: Vendor) => {
    if (vendor) {
      setSelectedVendor(vendor);
      setFormData({
        name: vendor.name,
        email: vendor.email || '',
        phone: vendor.phone || '',
        address: vendor.address || '',
        city: vendor.city || '',
        state: vendor.state || '',
        pincode: vendor.pincode || '',
        gstNumber: vendor.gstNumber || '',
        panNumber: vendor.panNumber || '',
        bankAccountNumber: vendor.bankAccountNumber || '',
        bankName: vendor.bankName || '',
        bankIfscCode: vendor.bankIfscCode || '',
        contactPerson: vendor.contactPerson || '',
        contactPersonPhone: vendor.contactPersonPhone || '',
        category: vendor.category || '',
        notes: vendor.notes || '',
      });
    } else {
      setSelectedVendor(null);
      setFormData({
        name: '',
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
      setSelectedVendor(null);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Vendor name is required');
      return;
    }

    try {
      setSubmitting(true);
      if (selectedVendor) {
        await vendorService.updateVendor(selectedVendor.id, formData);
        toast.success('Vendor updated successfully');
      } else {
        await vendorService.createVendor(formData);
        toast.success('Vendor created successfully');
      }
      handleCloseDrawer();
      loadVendors();
      loadCategories();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save vendor');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!vendorToDelete) return;

    try {
      await vendorService.deleteVendor(vendorToDelete.id);
      toast.success('Vendor deleted successfully');
      setDeleteDialogOpen(false);
      setVendorToDelete(null);
      loadVendors();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete vendor');
    }
  };

  const handleToggleStatus = async (vendor: Vendor) => {
    try {
      await vendorService.toggleVendorStatus(vendor.id);
      toast.success(`Vendor ${vendor.isActive ? 'deactivated' : 'activated'} successfully`);
      loadVendors();
    } catch (error) {
      toast.error('Failed to update vendor status');
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Vendor Management</h1>
          <p className="text-sm text-text-secondary mt-1">Manage your vendors and suppliers</p>
        </div>
        {canManageVendors && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDrawer()}
            sx={{ bgcolor: 'var(--accent-primary)', '&:hover': { bgcolor: 'var(--accent-hover)' } }}
          >
            Add Vendor
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
                placeholder="Search vendors..."
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
                {vendors.length} vendor(s)
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Vendors Table */}
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
                  <TableCell sx={{ fontWeight: 600, color: 'var(--text-secondary)', borderColor: 'var(--border)' }}>Vendor</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'var(--text-secondary)', borderColor: 'var(--border)' }}>Contact</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'var(--text-secondary)', borderColor: 'var(--border)' }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'var(--text-secondary)', borderColor: 'var(--border)' }}>GST/PAN</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'var(--text-secondary)', borderColor: 'var(--border)' }}>Status</TableCell>
                  {canManageVendors && (
                    <TableCell align="center" sx={{ fontWeight: 600, color: 'var(--text-secondary)', borderColor: 'var(--border)' }}>Actions</TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {vendors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={canManageVendors ? 6 : 5} align="center" sx={{ py: 4, borderColor: 'var(--border)' }}>
                      <Business sx={{ fontSize: 48, color: 'var(--text-muted)', mb: 1 }} />
                      <Typography sx={{ color: 'var(--text-secondary)' }}>No vendors found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  vendors.map((vendor) => (
                    <TableRow key={vendor.id} hover sx={{ '&:hover': { bgcolor: 'var(--bg-elevated)' } }}>
                      <TableCell sx={{ borderColor: 'var(--border)' }}>
                        <Box>
                          <Typography variant="body2" fontWeight={500} sx={{ color: 'var(--text-primary)' }}>
                            {vendor.name}
                          </Typography>
                          {vendor.city && (
                            <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
                              <LocationOn sx={{ fontSize: 14, color: 'var(--text-muted)' }} />
                              <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
                                {vendor.city}{vendor.state ? `, ${vendor.state}` : ''}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ borderColor: 'var(--border)' }}>
                        <Box>
                          {vendor.contactPerson && (
                            <Typography variant="body2" sx={{ color: 'var(--text-primary)' }}>
                              {vendor.contactPerson}
                            </Typography>
                          )}
                          {vendor.phone && (
                            <Box display="flex" alignItems="center" gap={0.5}>
                              <Phone sx={{ fontSize: 14, color: 'var(--text-muted)' }} />
                              <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>{vendor.phone}</Typography>
                            </Box>
                          )}
                          {vendor.email && (
                            <Box display="flex" alignItems="center" gap={0.5}>
                              <Email sx={{ fontSize: 14, color: 'var(--text-muted)' }} />
                              <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>{vendor.email}</Typography>
                            </Box>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ borderColor: 'var(--border)' }}>
                        {vendor.category ? (
                          <Chip label={vendor.category} size="small" sx={{ bgcolor: '#6366F1', color: '#ffffff' }} />
                        ) : (
                          <Typography variant="body2" sx={{ color: 'var(--text-muted)' }}>-</Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ borderColor: 'var(--border)' }}>
                        <Box>
                          {vendor.gstNumber && (
                            <Typography variant="caption" sx={{ color: 'var(--text-secondary)', display: 'block' }}>
                              GST: {vendor.gstNumber}
                            </Typography>
                          )}
                          {vendor.panNumber && (
                            <Typography variant="caption" sx={{ color: 'var(--text-secondary)', display: 'block' }}>
                              PAN: {vendor.panNumber}
                            </Typography>
                          )}
                          {!vendor.gstNumber && !vendor.panNumber && (
                            <Typography variant="body2" sx={{ color: 'var(--text-muted)' }}>-</Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ borderColor: 'var(--border)' }}>
                        <Chip
                          label={vendor.isActive ? 'Active' : 'Inactive'}
                          size="small"
                          color={vendor.isActive ? 'success' : 'default'}
                          onClick={canManageVendors ? () => handleToggleStatus(vendor) : undefined}
                          sx={{ cursor: canManageVendors ? 'pointer' : 'default' }}
                        />
                      </TableCell>
                      {canManageVendors && (
                        <TableCell align="center" sx={{ borderColor: 'var(--border)' }}>
                          <Box display="flex" gap={0.5} justifyContent="center">
                            <Tooltip title="Edit">
                              <IconButton size="small" onClick={() => handleOpenDrawer(vendor)} sx={{ color: 'var(--accent-primary)' }}>
                                <Edit fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {user?.role === 'admin' && (
                              <Tooltip title="Delete">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => {
                                    setVendorToDelete(vendor);
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

      {/* Add/Edit Vendor Drawer */}
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
              {selectedVendor ? 'Edit Vendor' : 'Add Vendor'}
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
                fullWidth size="small" label="Vendor Name *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
              {submitting ? <CircularProgress size={24} /> : selectedVendor ? 'Update' : 'Create'}
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
        <DialogTitle sx={{ color: 'var(--text-primary)' }}>Delete Vendor</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: 'var(--text-secondary)' }}>
            Are you sure you want to delete <strong>{vendorToDelete?.name}</strong>? This action cannot be undone.
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

export default VendorsPage;
