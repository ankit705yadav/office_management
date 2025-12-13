import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
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
  Tabs,
  Tab,
  Autocomplete,
  ImageList,
  ImageListItem,
} from '@mui/material';
import {
  Add,
  Search,
  Close,
  Devices,
  Person,
  CalendarToday,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  Refresh,
  Edit,
  Delete,
  Assignment,
  PhotoCamera,
  Cancel,
  Send,
  ThumbUp,
  ThumbDown,
  Pending,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import {
  assetService,
  Asset,
  AssetAssignment,
  AssetRequest,
  EmployeeSearchResult,
  AssignmentStats,
} from '../services/asset.service';

const AssetsPage: React.FC = () => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Data
  const [assets, setAssets] = useState<Asset[]>([]);
  const [assignments, setAssignments] = useState<AssetAssignment[]>([]);
  const [myAssets, setMyAssets] = useState<AssetAssignment[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [stats, setStats] = useState<AssignmentStats | null>(null);

  // Drawer states
  const [assetDrawerOpen, setAssetDrawerOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Lend dialog
  const [lendDialogOpen, setLendDialogOpen] = useState(false);
  const [assetToLend, setAssetToLend] = useState<Asset | null>(null);
  const [employees, setEmployees] = useState<EmployeeSearchResult[]>([]);
  const [employeeSearchValue, setEmployeeSearchValue] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeSearchResult | null>(null);
  const [lendPurpose, setLendPurpose] = useState('');
  const [lendDueDate, setLendDueDate] = useState('');

  // Return dialog
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [assignmentToReturn, setAssignmentToReturn] = useState<AssetAssignment | null>(null);
  const [returnCondition, setReturnCondition] = useState<'good' | 'damaged' | 'lost'>('good');
  const [conditionNotes, setConditionNotes] = useState('');

  // Asset form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    notes: '',
  });
  const [formImages, setFormImages] = useState<File[]>([]);
  const [imagesToRemove, setImagesToRemove] = useState<string[]>([]);

  // Image viewer
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [viewerImages, setViewerImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Asset request states
  const [assetRequests, setAssetRequests] = useState<AssetRequest[]>([]);
  const [myRequests, setMyRequests] = useState<AssetRequest[]>([]);
  const [availableAssets, setAvailableAssets] = useState<Asset[]>([]);
  const [pendingRequestCount, setPendingRequestCount] = useState(0);

  // Request dialog
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [assetToRequest, setAssetToRequest] = useState<Asset | null>(null);
  const [requestPurpose, setRequestPurpose] = useState('');
  const [requestDueDate, setRequestDueDate] = useState('');

  // Review request dialog
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [requestToReview, setRequestToReview] = useState<AssetRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [approveDueDate, setApproveDueDate] = useState('');

  const canManageAssets = user?.role === 'admin' || user?.role === 'manager';

  // API base URL for images
  const apiBaseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

  useEffect(() => {
    loadData();
    loadCategories();
    if (canManageAssets) {
      loadStats();
      loadPendingRequestCount();
    }
    loadMyRequests();
  }, []);

  useEffect(() => {
    loadData();
  }, [tabValue, searchTerm, statusFilter, categoryFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (canManageAssets) {
        // Manager/Admin tabs
        if (tabValue === 0) {
          // Assets tab
          const response = await assetService.getAllAssets({
            search: searchTerm || undefined,
            status: statusFilter || undefined,
            category: categoryFilter || undefined,
            limit: 100,
          });
          setAssets(response.items);
        } else if (tabValue === 1) {
          // Assignments tab
          const response = await assetService.getAllAssignments({
            status: statusFilter || undefined,
            limit: 100,
          });
          setAssignments(response.items);
        } else if (tabValue === 2) {
          // Asset Requests tab (admin/manager)
          const response = await assetService.getAllAssetRequests({
            status: statusFilter as any || undefined,
          });
          setAssetRequests(response.requests);
        } else if (tabValue === 3) {
          // My Assets tab
          const data = await assetService.getMyAssets();
          setMyAssets(data);
        } else if (tabValue === 4) {
          // Browse Assets (for requesting)
          const response = await assetService.getAvailableAssets({
            search: searchTerm || undefined,
            category: categoryFilter || undefined,
          });
          setAvailableAssets(response.items);
        }
      } else {
        // Employee tabs
        if (tabValue === 0) {
          // My Assets tab
          const data = await assetService.getMyAssets();
          setMyAssets(data);
        } else if (tabValue === 1) {
          // Browse Assets (for requesting)
          const response = await assetService.getAvailableAssets({
            search: searchTerm || undefined,
            category: categoryFilter || undefined,
          });
          setAvailableAssets(response.items);
        } else if (tabValue === 2) {
          // My Requests tab
          const data = await assetService.getMyAssetRequests();
          setMyRequests(data);
        }
      }
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const cats = await assetService.getCategories();
      setCategories(cats);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await assetService.getAssignmentStats();
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadPendingRequestCount = async () => {
    try {
      const { count } = await assetService.getPendingRequestCount();
      setPendingRequestCount(count);
    } catch (error) {
      console.error('Failed to load pending count:', error);
    }
  };

  const loadMyRequests = async () => {
    try {
      const data = await assetService.getMyAssetRequests();
      setMyRequests(data);
    } catch (error) {
      console.error('Failed to load my requests:', error);
    }
  };

  const searchEmployees = useCallback(async (search: string) => {
    try {
      const results = await assetService.searchEmployees(search);
      setEmployees(results);
    } catch (error) {
      console.error('Failed to search employees:', error);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (lendDialogOpen) {
        searchEmployees(employeeSearchValue);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [employeeSearchValue, lendDialogOpen, searchEmployees]);

  // Asset form handlers
  const handleOpenAssetDrawer = (asset?: Asset) => {
    if (asset) {
      setSelectedAsset(asset);
      setFormData({
        name: asset.name,
        description: asset.description || '',
        category: asset.category,
        notes: asset.notes || '',
      });
      setFormImages([]);
      setImagesToRemove([]);
    } else {
      setSelectedAsset(null);
      setFormData({ name: '', description: '', category: '', notes: '' });
      setFormImages([]);
      setImagesToRemove([]);
    }
    setAssetDrawerOpen(true);
  };

  const handleCloseAssetDrawer = () => {
    if (!submitting) {
      setAssetDrawerOpen(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const existingCount = selectedAsset?.images?.length || 0;
      const currentCount = formImages.length;
      const removedCount = imagesToRemove.length;
      const totalAllowed = 5 - existingCount + removedCount - currentCount;

      const newFiles = Array.from(files).slice(0, Math.max(0, totalAllowed));
      if (newFiles.length < files.length) {
        toast.warning('Maximum 5 images allowed per asset');
      }
      setFormImages([...formImages, ...newFiles]);
    }
  };

  const handleRemoveNewImage = (index: number) => {
    setFormImages(formImages.filter((_, i) => i !== index));
  };

  const handleRemoveExistingImage = (imagePath: string) => {
    setImagesToRemove([...imagesToRemove, imagePath]);
  };

  const handleSubmitAsset = async () => {
    if (!formData.name.trim()) {
      toast.error('Please enter asset name');
      return;
    }
    if (!formData.category.trim()) {
      toast.error('Please enter category');
      return;
    }

    try {
      setSubmitting(true);
      if (selectedAsset) {
        await assetService.updateAsset(selectedAsset.id, {
          ...formData,
          images: formImages,
          imagesToRemove,
        });
        toast.success('Asset updated successfully');
      } else {
        await assetService.createAsset({
          ...formData,
          images: formImages,
        });
        toast.success('Asset created successfully');
      }
      handleCloseAssetDrawer();
      loadData();
      loadCategories();
      if (canManageAssets) loadStats();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save asset');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAsset = async (id: number) => {
    if (!window.confirm('Are you sure you want to retire this asset?')) {
      return;
    }
    try {
      await assetService.deleteAsset(id);
      toast.success('Asset retired successfully');
      loadData();
      if (canManageAssets) loadStats();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete asset');
    }
  };

  // Lend handlers
  const handleOpenLendDialog = (asset: Asset) => {
    setAssetToLend(asset);
    setSelectedEmployee(null);
    setLendPurpose('');
    setLendDueDate('');
    setEmployeeSearchValue('');
    searchEmployees('');
    setLendDialogOpen(true);
  };

  const handleLendAsset = async () => {
    if (!assetToLend || !selectedEmployee) {
      toast.error('Please select an employee');
      return;
    }

    try {
      setSubmitting(true);
      await assetService.lendAsset(assetToLend.id, {
        assignedTo: selectedEmployee.id,
        purpose: lendPurpose || undefined,
        dueDate: lendDueDate || undefined,
      });
      toast.success('Asset lent successfully');
      setLendDialogOpen(false);
      loadData();
      if (canManageAssets) loadStats();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to lend asset');
    } finally {
      setSubmitting(false);
    }
  };

  // Return handlers
  const handleOpenReturnDialog = (assignment: AssetAssignment) => {
    setAssignmentToReturn(assignment);
    setReturnCondition('good');
    setConditionNotes('');
    setReturnDialogOpen(true);
  };

  const handleReturnAsset = async () => {
    if (!assignmentToReturn) return;

    try {
      setSubmitting(true);
      await assetService.returnAsset(assignmentToReturn.id, {
        returnCondition,
        conditionNotes: conditionNotes || undefined,
      });
      toast.success('Asset returned successfully');
      setReturnDialogOpen(false);
      setAssignmentToReturn(null);
      loadData();
      if (canManageAssets) loadStats();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to return asset');
    } finally {
      setSubmitting(false);
    }
  };

  // Image viewer
  const handleOpenImageViewer = (images: string[], index: number = 0) => {
    setViewerImages(images);
    setCurrentImageIndex(index);
    setImageViewerOpen(true);
  };

  // Asset Request handlers
  const handleOpenRequestDialog = (asset: Asset) => {
    setAssetToRequest(asset);
    setRequestPurpose('');
    setRequestDueDate('');
    setRequestDialogOpen(true);
  };

  const handleSubmitRequest = async () => {
    if (!assetToRequest) return;
    if (!requestPurpose.trim()) {
      toast.error('Please enter purpose for requesting this asset');
      return;
    }

    try {
      setSubmitting(true);
      await assetService.createAssetRequest({
        assetId: assetToRequest.id,
        purpose: requestPurpose,
        requestedDueDate: requestDueDate || undefined,
      });
      toast.success('Asset request submitted successfully');
      setRequestDialogOpen(false);
      loadMyRequests();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelRequest = async (requestId: number) => {
    if (!window.confirm('Are you sure you want to cancel this request?')) return;

    try {
      await assetService.cancelAssetRequest(requestId);
      toast.success('Request cancelled');
      loadMyRequests();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to cancel request');
    }
  };

  // Review request handlers (admin/manager)
  const handleOpenReviewDialog = (request: AssetRequest) => {
    setRequestToReview(request);
    setReviewNotes('');
    setApproveDueDate(request.requestedDueDate || '');
    setReviewDialogOpen(true);
  };

  const handleApproveRequest = async () => {
    if (!requestToReview) return;

    try {
      setSubmitting(true);
      await assetService.approveAssetRequest(requestToReview.id, {
        reviewNotes: reviewNotes || undefined,
        dueDate: approveDueDate || undefined,
      });
      toast.success('Request approved');
      setReviewDialogOpen(false);
      loadData();
      loadPendingRequestCount();
      if (canManageAssets) loadStats();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to approve request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectRequest = async () => {
    if (!requestToReview) return;

    try {
      setSubmitting(true);
      await assetService.rejectAssetRequest(requestToReview.id, {
        reviewNotes: reviewNotes || undefined,
      });
      toast.success('Request rejected');
      setReviewDialogOpen(false);
      loadData();
      loadPendingRequestCount();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reject request');
    } finally {
      setSubmitting(false);
    }
  };

  // Request status chip
  const getRequestStatusChip = (status: AssetRequest['status']) => {
    const statusColors: Record<string, string> = {
      pending: '#F59E0B',
      approved: '#10B981',
      rejected: '#EF4444',
      cancelled: '#6B7280',
    };
    return (
      <Chip
        label={assetService.getRequestStatusLabel(status)}
        size="small"
        sx={{ bgcolor: statusColors[status] || '#6B7280', color: 'white' }}
      />
    );
  };

  // Status chip
  const getStatusChip = (status: string, dueDate?: string) => {
    if (status === 'assigned' && dueDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const due = new Date(dueDate);
      due.setHours(0, 0, 0, 0);
      const daysUntilDue = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntilDue < 0) {
        return <Chip label="Overdue" size="small" sx={{ bgcolor: '#EF4444', color: 'white' }} />;
      } else if (daysUntilDue === 0) {
        return <Chip label="Due Today" size="small" sx={{ bgcolor: '#F59E0B', color: 'white' }} />;
      } else if (daysUntilDue <= 3) {
        return <Chip label={`Due in ${daysUntilDue}d`} size="small" sx={{ bgcolor: '#F59E0B', color: 'white' }} />;
      }
    }

    const statusColors: Record<string, string> = {
      available: '#10B981',
      assigned: '#3B82F6',
      overdue: '#EF4444',
      returned: '#6B7280',
      lost: '#F97316',
      damaged: '#EAB308',
      under_maintenance: '#8B5CF6',
      retired: '#6B7280',
    };

    return (
      <Chip
        label={assetService.getStatusLabel(status as any)}
        size="small"
        sx={{ bgcolor: statusColors[status] || '#6B7280', color: 'white' }}
      />
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Styles
  const textFieldSx = {
    '& .MuiOutlinedInput-root': {
      backgroundColor: 'var(--bg-elevated)',
      '& fieldset': { borderColor: 'var(--border)' },
      '&:hover fieldset': { borderColor: 'var(--text-secondary)' },
      '&.Mui-focused fieldset': { borderColor: 'var(--accent-primary)' },
    },
    '& .MuiInputLabel-root': { color: 'var(--text-secondary)' },
    '& .MuiInputBase-input': { color: 'var(--text-primary)' },
  };

  const selectSx = {
    backgroundColor: 'var(--bg-elevated)',
    color: 'var(--text-primary)',
    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--border)' },
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--text-secondary)' },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--accent-primary)' },
    '& .MuiSvgIcon-root': { color: 'var(--text-secondary)' },
  };

  const menuProps = {
    PaperProps: {
      sx: {
        backgroundColor: 'var(--surface)',
        '& .MuiMenuItem-root': {
          color: 'var(--text-primary)',
          '&:hover': { backgroundColor: 'var(--bg-elevated)' },
          '&.Mui-selected': { backgroundColor: 'var(--bg-elevated)' },
        },
      },
    },
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <div>
          <Typography variant="h5" fontWeight={600} sx={{ color: 'var(--text-primary)' }}>
            Asset Management
          </Typography>
          <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mt: 0.5 }}>
            Track company assets and equipment lending
          </Typography>
        </div>
        {canManageAssets && tabValue === 0 && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenAssetDrawer()}
            sx={{
              bgcolor: 'var(--accent-primary)',
              '&:hover': { bgcolor: 'var(--accent-hover)' },
            }}
          >
            Add Asset
          </Button>
        )}
      </Box>

      {/* Stats Cards */}
      {stats && canManageAssets && (
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <Card sx={{ minWidth: 140, backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                Total Assets
              </Typography>
              <Typography variant="h5" sx={{ color: 'var(--text-primary)' }}>
                {stats.totalAssets}
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ minWidth: 140, backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                Available
              </Typography>
              <Typography variant="h5" sx={{ color: '#10B981' }}>
                {stats.availableAssets}
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ minWidth: 140, backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                Assigned
              </Typography>
              <Typography variant="h5" sx={{ color: '#3B82F6' }}>
                {stats.assignedAssets}
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ minWidth: 140, backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                Overdue
              </Typography>
              <Typography variant="h5" sx={{ color: '#EF4444' }}>
                {stats.overdueAssignments}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Tabs */}
      <Tabs
        value={tabValue}
        onChange={(_, newValue) => setTabValue(newValue)}
        sx={{
          mb: 3,
          '& .MuiTab-root': { color: 'var(--text-secondary)' },
          '& .Mui-selected': { color: 'var(--accent-primary)' },
          '& .MuiTabs-indicator': { backgroundColor: 'var(--accent-primary)' },
        }}
      >
        {canManageAssets && <Tab icon={<Devices />} iconPosition="start" label="Assets" />}
        {canManageAssets && <Tab icon={<Assignment />} iconPosition="start" label="All Assignments" />}
        {canManageAssets && (
          <Tab
            icon={<Pending />}
            iconPosition="start"
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                Requests
                {pendingRequestCount > 0 && (
                  <Chip label={pendingRequestCount} size="small" color="warning" sx={{ height: 20, fontSize: '0.75rem' }} />
                )}
              </Box>
            }
          />
        )}
        <Tab icon={<Person />} iconPosition="start" label="My Assets" />
        <Tab icon={<Search />} iconPosition="start" label="Browse Assets" />
        {!canManageAssets && <Tab icon={<Send />} iconPosition="start" label="My Requests" />}
      </Tabs>

      {/* Filters */}
      <Card sx={{ mb: 3, backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
        <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: 'var(--text-muted)' }} />
                    </InputAdornment>
                  ),
                }}
                sx={textFieldSx}
              />
            </Grid>
            {tabValue === 0 && canManageAssets && (
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ color: 'var(--text-secondary)' }}>Category</InputLabel>
                  <Select
                    value={categoryFilter}
                    label="Category"
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    sx={selectSx}
                    MenuProps={menuProps}
                  >
                    <MenuItem value="">All Categories</MenuItem>
                    {categories.map((cat) => (
                      <MenuItem key={cat} value={cat}>
                        {cat}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ color: 'var(--text-secondary)' }}>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value as string)}
                  sx={selectSx}
                  MenuProps={{
                    ...menuProps,
                    disablePortal: false,
                  }}
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  {tabValue === 0 && canManageAssets && (
                    <MenuItem value="available">Available</MenuItem>
                  )}
                  {tabValue === 0 && canManageAssets && (
                    <MenuItem value="assigned">Assigned</MenuItem>
                  )}
                  {tabValue === 0 && canManageAssets && (
                    <MenuItem value="under_maintenance">Under Maintenance</MenuItem>
                  )}
                  {tabValue === 0 && canManageAssets && (
                    <MenuItem value="retired">Retired</MenuItem>
                  )}
                  {!(tabValue === 0 && canManageAssets) && (
                    <MenuItem value="assigned">Assigned</MenuItem>
                  )}
                  {!(tabValue === 0 && canManageAssets) && (
                    <MenuItem value="overdue">Overdue</MenuItem>
                  )}
                  {!(tabValue === 0 && canManageAssets) && (
                    <MenuItem value="returned">Returned</MenuItem>
                  )}
                  {!(tabValue === 0 && canManageAssets) && (
                    <MenuItem value="lost">Lost</MenuItem>
                  )}
                  {!(tabValue === 0 && canManageAssets) && (
                    <MenuItem value="damaged">Damaged</MenuItem>
                  )}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Refresh />}
                onClick={loadData}
                sx={{
                  borderColor: 'var(--border)',
                  color: 'var(--text-secondary)',
                  '&:hover': { borderColor: 'var(--text-secondary)' },
                }}
              >
                Refresh
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Assets Tab */}
      {tabValue === 0 && canManageAssets && (
        <Grid container spacing={2}>
          {loading ? (
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            </Grid>
          ) : assets.length === 0 ? (
            <Grid item xs={12}>
              <Typography sx={{ textAlign: 'center', py: 4, color: 'var(--text-muted)' }}>
                No assets found
              </Typography>
            </Grid>
          ) : (
            assets.map((asset) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={asset.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--border)',
                    '&:hover': { borderColor: 'var(--accent-primary)' },
                  }}
                >
                  {asset.images && asset.images.length > 0 ? (
                    <CardMedia
                      component="img"
                      height="160"
                      image={`${apiBaseUrl}${asset.images[0]}`}
                      alt={asset.name}
                      sx={{ cursor: 'pointer', objectFit: 'cover' }}
                      onClick={() => handleOpenImageViewer(asset.images || [], 0)}
                    />
                  ) : (
                    <Box
                      sx={{
                        height: 160,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'var(--bg-elevated)',
                      }}
                    >
                      <Devices sx={{ fontSize: 64, color: 'var(--text-muted)' }} />
                    </Box>
                  )}
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant="caption" sx={{ color: 'var(--text-muted)' }}>
                        {asset.assetTag}
                      </Typography>
                      {getStatusChip(asset.status)}
                    </Box>
                    <Typography variant="subtitle1" fontWeight={600} sx={{ color: 'var(--text-primary)', mb: 0.5 }}>
                      {asset.name}
                    </Typography>
                    <Chip label={asset.category} size="small" variant="outlined" sx={{ mb: 1 }} />
                    {asset.description && (
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'var(--text-secondary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {asset.description}
                      </Typography>
                    )}
                  </CardContent>
                  <Divider sx={{ borderColor: 'var(--border)' }} />
                  <Box sx={{ p: 1, display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                    {asset.status === 'available' && (
                      <Tooltip title="Lend Asset">
                        <IconButton size="small" onClick={() => handleOpenLendDialog(asset)}>
                          <Assignment sx={{ color: 'var(--accent-primary)' }} />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => handleOpenAssetDrawer(asset)}>
                        <Edit sx={{ color: 'var(--text-secondary)' }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Retire">
                      <IconButton size="small" onClick={() => handleDeleteAsset(asset.id)}>
                        <Delete sx={{ color: '#EF4444' }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      )}

      {/* Assignments Tab */}
      {tabValue === 1 && canManageAssets && (
        <TableContainer
          component={Paper}
          sx={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'var(--bg-elevated)' }}>
                <TableCell sx={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Asset</TableCell>
                <TableCell sx={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Assigned To</TableCell>
                <TableCell sx={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Assigned Date</TableCell>
                <TableCell sx={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Due Date</TableCell>
                <TableCell sx={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={32} />
                  </TableCell>
                </TableRow>
              ) : assignments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'var(--text-muted)' }}>
                    No assignments found
                  </TableCell>
                </TableRow>
              ) : (
                assignments.map((assignment) => (
                  <TableRow
                    key={assignment.id}
                    sx={{ '&:hover': { backgroundColor: 'var(--bg-elevated)' } }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Devices sx={{ color: 'var(--text-muted)', fontSize: 20 }} />
                        <Box>
                          <Typography variant="body2" sx={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                            {assignment.asset?.name || 'Unknown Asset'}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'var(--text-muted)' }}>
                            {assignment.asset?.assetTag}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Person sx={{ color: 'var(--text-muted)', fontSize: 18 }} />
                        <Box>
                          <Typography variant="body2" sx={{ color: 'var(--text-primary)' }}>
                            {assignment.assignee?.firstName} {assignment.assignee?.lastName}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'var(--text-muted)' }}>
                            {assignment.assignee?.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: 'var(--text-primary)' }}>
                      {formatDate(assignment.assignedDate)}
                    </TableCell>
                    <TableCell sx={{ color: 'var(--text-primary)' }}>
                      {assignment.dueDate ? formatDate(assignment.dueDate) : 'No due date'}
                    </TableCell>
                    <TableCell>{getStatusChip(assignment.status, assignment.dueDate)}</TableCell>
                    <TableCell>
                      {['assigned', 'overdue'].includes(assignment.status) && (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<CheckCircle />}
                          onClick={() => handleOpenReturnDialog(assignment)}
                          sx={{
                            borderColor: '#10B981',
                            color: '#10B981',
                            '&:hover': {
                              borderColor: '#059669',
                              backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            },
                          }}
                        >
                          Return
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Asset Requests Tab (Admin/Manager) */}
      {tabValue === 2 && canManageAssets && (
        <TableContainer
          component={Paper}
          sx={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'var(--bg-elevated)' }}>
                <TableCell sx={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Asset</TableCell>
                <TableCell sx={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Requested By</TableCell>
                <TableCell sx={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Purpose</TableCell>
                <TableCell sx={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Requested Date</TableCell>
                <TableCell sx={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Due Date</TableCell>
                <TableCell sx={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={32} />
                  </TableCell>
                </TableRow>
              ) : assetRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'var(--text-muted)' }}>
                    No asset requests found
                  </TableCell>
                </TableRow>
              ) : (
                assetRequests.map((request) => (
                  <TableRow
                    key={request.id}
                    sx={{ '&:hover': { backgroundColor: 'var(--bg-elevated)' } }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Devices sx={{ color: 'var(--text-muted)', fontSize: 20 }} />
                        <Box>
                          <Typography variant="body2" sx={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                            {request.asset?.name || 'Unknown Asset'}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'var(--text-muted)' }}>
                            {request.asset?.assetTag}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Person sx={{ color: 'var(--text-muted)', fontSize: 18 }} />
                        <Box>
                          <Typography variant="body2" sx={{ color: 'var(--text-primary)' }}>
                            {request.requester?.firstName} {request.requester?.lastName}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'var(--text-muted)' }}>
                            {request.requester?.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: 'var(--text-primary)', maxWidth: 200 }}>
                      <Typography variant="body2" noWrap title={request.purpose}>
                        {request.purpose}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ color: 'var(--text-primary)' }}>
                      {formatDate(request.createdAt)}
                    </TableCell>
                    <TableCell sx={{ color: 'var(--text-primary)' }}>
                      {request.requestedDueDate ? formatDate(request.requestedDueDate) : 'Not specified'}
                    </TableCell>
                    <TableCell>{getRequestStatusChip(request.status)}</TableCell>
                    <TableCell>
                      {request.status === 'pending' && (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Review Request">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenReviewDialog(request)}
                              sx={{ color: 'var(--accent-primary)' }}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      )}
                      {request.status !== 'pending' && request.reviewNotes && (
                        <Tooltip title={request.reviewNotes}>
                          <Typography variant="caption" sx={{ color: 'var(--text-muted)', cursor: 'help' }}>
                            View notes
                          </Typography>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* My Assets Tab */}
      {((tabValue === 3 && canManageAssets) || (tabValue === 0 && !canManageAssets)) && (
        <TableContainer
          component={Paper}
          sx={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'var(--bg-elevated)' }}>
                <TableCell sx={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Asset</TableCell>
                <TableCell sx={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Purpose</TableCell>
                <TableCell sx={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Assigned Date</TableCell>
                <TableCell sx={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Due Date</TableCell>
                <TableCell sx={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={32} />
                  </TableCell>
                </TableRow>
              ) : myAssets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'var(--text-muted)' }}>
                    No assets assigned to you
                  </TableCell>
                </TableRow>
              ) : (
                myAssets.map((assignment) => (
                  <TableRow
                    key={assignment.id}
                    sx={{ '&:hover': { backgroundColor: 'var(--bg-elevated)' } }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Devices sx={{ color: 'var(--text-muted)', fontSize: 20 }} />
                        <Box>
                          <Typography variant="body2" sx={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                            {assignment.asset?.name || 'Unknown Asset'}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'var(--text-muted)' }}>
                            {assignment.asset?.assetTag}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: 'var(--text-primary)' }}>
                      {assignment.purpose || '-'}
                    </TableCell>
                    <TableCell sx={{ color: 'var(--text-primary)' }}>
                      {formatDate(assignment.assignedDate)}
                    </TableCell>
                    <TableCell sx={{ color: 'var(--text-primary)' }}>
                      {assignment.dueDate ? formatDate(assignment.dueDate) : 'No due date'}
                    </TableCell>
                    <TableCell>{getStatusChip(assignment.status, assignment.dueDate)}</TableCell>
                    <TableCell>
                      {['assigned', 'overdue'].includes(assignment.status) && (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<CheckCircle />}
                          onClick={() => handleOpenReturnDialog(assignment)}
                          sx={{
                            borderColor: '#10B981',
                            color: '#10B981',
                            '&:hover': {
                              borderColor: '#059669',
                              backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            },
                          }}
                        >
                          Return
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Browse Assets Tab */}
      {((tabValue === 4 && canManageAssets) || (tabValue === 1 && !canManageAssets)) && (
        <Grid container spacing={2}>
          {loading ? (
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            </Grid>
          ) : availableAssets.length === 0 ? (
            <Grid item xs={12}>
              <Typography sx={{ textAlign: 'center', py: 4, color: 'var(--text-muted)' }}>
                No available assets found
              </Typography>
            </Grid>
          ) : (
            availableAssets.map((asset) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={asset.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--border)',
                    '&:hover': { borderColor: 'var(--accent-primary)' },
                  }}
                >
                  {asset.images && asset.images.length > 0 ? (
                    <CardMedia
                      component="img"
                      height="140"
                      image={`${apiBaseUrl}${asset.images[0]}`}
                      alt={asset.name}
                      sx={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <Box
                      sx={{
                        height: 140,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'var(--bg-elevated)',
                      }}
                    >
                      <Devices sx={{ fontSize: 56, color: 'var(--text-muted)' }} />
                    </Box>
                  )}
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant="caption" sx={{ color: 'var(--text-muted)' }}>
                        {asset.assetTag}
                      </Typography>
                      <Chip label="Available" size="small" sx={{ bgcolor: '#10B981', color: 'white' }} />
                    </Box>
                    <Typography variant="subtitle1" fontWeight={600} sx={{ color: 'var(--text-primary)', mb: 0.5 }}>
                      {asset.name}
                    </Typography>
                    <Chip label={asset.category} size="small" variant="outlined" sx={{ mb: 1 }} />
                    {asset.description && (
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'var(--text-secondary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {asset.description}
                      </Typography>
                    )}
                  </CardContent>
                  <Divider sx={{ borderColor: 'var(--border)' }} />
                  <Box sx={{ p: 1.5 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<Send />}
                      onClick={() => handleOpenRequestDialog(asset)}
                      sx={{
                        bgcolor: 'var(--accent-primary)',
                        '&:hover': { bgcolor: 'var(--accent-hover)' },
                      }}
                    >
                      Request Asset
                    </Button>
                  </Box>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      )}

      {/* My Requests Tab (Employee) */}
      {((tabValue === 5 && canManageAssets) || (tabValue === 2 && !canManageAssets)) && (
        <TableContainer
          component={Paper}
          sx={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'var(--bg-elevated)' }}>
                <TableCell sx={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Asset</TableCell>
                <TableCell sx={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Purpose</TableCell>
                <TableCell sx={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Requested Date</TableCell>
                <TableCell sx={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Requested Due Date</TableCell>
                <TableCell sx={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Review Notes</TableCell>
                <TableCell sx={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={32} />
                  </TableCell>
                </TableRow>
              ) : myRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'var(--text-muted)' }}>
                    You haven't made any asset requests yet
                  </TableCell>
                </TableRow>
              ) : (
                myRequests.map((request) => (
                  <TableRow
                    key={request.id}
                    sx={{ '&:hover': { backgroundColor: 'var(--bg-elevated)' } }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Devices sx={{ color: 'var(--text-muted)', fontSize: 20 }} />
                        <Box>
                          <Typography variant="body2" sx={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                            {request.asset?.name || 'Unknown Asset'}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'var(--text-muted)' }}>
                            {request.asset?.assetTag}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: 'var(--text-primary)', maxWidth: 200 }}>
                      <Typography variant="body2" noWrap title={request.purpose}>
                        {request.purpose}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ color: 'var(--text-primary)' }}>
                      {formatDate(request.createdAt)}
                    </TableCell>
                    <TableCell sx={{ color: 'var(--text-primary)' }}>
                      {request.requestedDueDate ? formatDate(request.requestedDueDate) : 'Not specified'}
                    </TableCell>
                    <TableCell>{getRequestStatusChip(request.status)}</TableCell>
                    <TableCell sx={{ color: 'var(--text-secondary)', maxWidth: 150 }}>
                      <Typography variant="body2" noWrap title={request.reviewNotes || ''}>
                        {request.reviewNotes || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {request.status === 'pending' && (
                        <Tooltip title="Cancel Request">
                          <IconButton
                            size="small"
                            onClick={() => handleCancelRequest(request.id)}
                            sx={{ color: '#EF4444' }}
                          >
                            <Cancel fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Asset Form Drawer */}
      <Drawer
        anchor="right"
        open={assetDrawerOpen}
        onClose={handleCloseAssetDrawer}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 500 },
            backgroundColor: 'var(--surface)',
          },
        }}
      >
        <Box sx={{ p: 3 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ color: 'var(--text-primary)' }}>
              {selectedAsset ? 'Edit Asset' : 'Add New Asset'}
            </Typography>
            <IconButton onClick={handleCloseAssetDrawer} disabled={submitting}>
              <Close sx={{ color: 'var(--text-secondary)' }} />
            </IconButton>
          </Box>

          <Divider sx={{ mb: 3, borderColor: 'var(--border)' }} />

          {/* Form */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              fullWidth
              label="Name *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              sx={textFieldSx}
            />

            <Autocomplete
              freeSolo
              options={categories}
              value={formData.category}
              onInputChange={(_, value) => setFormData({ ...formData, category: value })}
              renderInput={(params) => (
                <TextField {...params} label="Category *" sx={textFieldSx} />
              )}
              sx={{
                '& .MuiAutocomplete-paper': {
                  backgroundColor: 'var(--surface)',
                },
              }}
            />

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              sx={textFieldSx}
            />

            <TextField
              fullWidth
              multiline
              rows={2}
              label="Notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              sx={textFieldSx}
            />

            {/* Images */}
            <Box>
              <Typography variant="subtitle2" sx={{ color: 'var(--text-primary)', mb: 1 }}>
                Images (max 5)
              </Typography>

              {/* Existing Images */}
              {selectedAsset?.images && selectedAsset.images.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Grid container spacing={1}>
                    {selectedAsset.images
                      .filter((img) => !imagesToRemove.includes(img))
                      .map((img, idx) => (
                        <Grid item xs={4} key={idx}>
                          <Box sx={{ position: 'relative' }}>
                            <img
                              src={`${apiBaseUrl}${img}`}
                              alt={`Asset ${idx + 1}`}
                              style={{
                                width: '100%',
                                height: 80,
                                objectFit: 'cover',
                                borderRadius: 4,
                              }}
                            />
                            <IconButton
                              size="small"
                              onClick={() => handleRemoveExistingImage(img)}
                              sx={{
                                position: 'absolute',
                                top: 2,
                                right: 2,
                                bgcolor: 'rgba(0,0,0,0.5)',
                                '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                              }}
                            >
                              <Cancel sx={{ fontSize: 16, color: 'white' }} />
                            </IconButton>
                          </Box>
                        </Grid>
                      ))}
                  </Grid>
                </Box>
              )}

              {/* New Images */}
              {formImages.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Grid container spacing={1}>
                    {formImages.map((file, idx) => (
                      <Grid item xs={4} key={idx}>
                        <Box sx={{ position: 'relative' }}>
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`New ${idx + 1}`}
                            style={{
                              width: '100%',
                              height: 80,
                              objectFit: 'cover',
                              borderRadius: 4,
                            }}
                          />
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveNewImage(idx)}
                            sx={{
                              position: 'absolute',
                              top: 2,
                              right: 2,
                              bgcolor: 'rgba(0,0,0,0.5)',
                              '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                            }}
                          >
                            <Cancel sx={{ fontSize: 16, color: 'white' }} />
                          </IconButton>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}

              <Button
                variant="outlined"
                component="label"
                startIcon={<PhotoCamera />}
                disabled={
                  (selectedAsset?.images?.length || 0) -
                    imagesToRemove.length +
                    formImages.length >=
                  5
                }
                sx={{
                  borderColor: 'var(--border)',
                  color: 'var(--text-secondary)',
                }}
              >
                Upload Images
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                />
              </Button>
            </Box>

            {/* Submit */}
            <Button
              fullWidth
              variant="contained"
              onClick={handleSubmitAsset}
              disabled={submitting}
              sx={{
                mt: 2,
                bgcolor: 'var(--accent-primary)',
                '&:hover': { bgcolor: 'var(--accent-hover)' },
              }}
            >
              {submitting ? (
                <CircularProgress size={24} color="inherit" />
              ) : selectedAsset ? (
                'Update Asset'
              ) : (
                'Create Asset'
              )}
            </Button>
          </Box>
        </Box>
      </Drawer>

      {/* Lend Asset Dialog */}
      <Dialog
        open={lendDialogOpen}
        onClose={() => !submitting && setLendDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { backgroundColor: 'var(--surface)' },
        }}
      >
        <DialogTitle sx={{ color: 'var(--text-primary)' }}>Lend Asset</DialogTitle>
        <DialogContent>
          {assetToLend && (
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                Lending:{' '}
                <strong style={{ color: 'var(--text-primary)' }}>{assetToLend.name}</strong> (
                {assetToLend.assetTag})
              </Typography>

              <Autocomplete
                options={employees}
                getOptionLabel={(option) =>
                  `${option.firstName} ${option.lastName} (${option.email})`
                }
                value={selectedEmployee}
                onChange={(_, value) => setSelectedEmployee(value)}
                onInputChange={(_, value) => setEmployeeSearchValue(value)}
                renderOption={(props, option) => (
                  <Box component="li" {...props}>
                    <Box>
                      <Typography variant="body2">
                        {option.firstName} {option.lastName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.email} • {option.role}
                      </Typography>
                    </Box>
                  </Box>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Assign To *"
                    placeholder="Search employee..."
                    sx={textFieldSx}
                  />
                )}
                sx={{
                  '& .MuiAutocomplete-paper': {
                    backgroundColor: 'var(--surface)',
                  },
                }}
              />

              <TextField
                fullWidth
                type="date"
                label="Due Date (Optional)"
                value={lendDueDate}
                onChange={(e) => setLendDueDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: new Date().toISOString().split('T')[0] }}
                helperText="Leave empty for indefinite lending"
                sx={textFieldSx}
              />

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Purpose"
                value={lendPurpose}
                onChange={(e) => setLendPurpose(e.target.value)}
                sx={textFieldSx}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setLendDialogOpen(false)}
            disabled={submitting}
            sx={{ color: 'var(--text-secondary)' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleLendAsset}
            disabled={submitting || !selectedEmployee}
            sx={{
              bgcolor: 'var(--accent-primary)',
              '&:hover': { bgcolor: 'var(--accent-hover)' },
            }}
          >
            {submitting ? <CircularProgress size={24} color="inherit" /> : 'Lend Asset'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Return Asset Dialog */}
      <Dialog
        open={returnDialogOpen}
        onClose={() => !submitting && setReturnDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { backgroundColor: 'var(--surface)' },
        }}
      >
        <DialogTitle sx={{ color: 'var(--text-primary)' }}>Return Asset</DialogTitle>
        <DialogContent>
          {assignmentToReturn && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mb: 2 }}>
                Returning:{' '}
                <strong style={{ color: 'var(--text-primary)' }}>
                  {assignmentToReturn.asset?.name}
                </strong>{' '}
                ({assignmentToReturn.asset?.assetTag})
              </Typography>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel sx={{ color: 'var(--text-secondary)' }}>Condition *</InputLabel>
                <Select
                  value={returnCondition}
                  label="Condition *"
                  onChange={(e) => setReturnCondition(e.target.value as 'good' | 'damaged' | 'lost')}
                  sx={selectSx}
                  MenuProps={menuProps}
                >
                  <MenuItem value="good">Good - No issues</MenuItem>
                  <MenuItem value="damaged">Damaged - Needs repair</MenuItem>
                  <MenuItem value="lost">Lost - Cannot return</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Condition Notes (optional)"
                placeholder="Describe any damage or issues..."
                value={conditionNotes}
                onChange={(e) => setConditionNotes(e.target.value)}
                sx={textFieldSx}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setReturnDialogOpen(false)}
            disabled={submitting}
            sx={{ color: 'var(--text-secondary)' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleReturnAsset}
            disabled={submitting}
            sx={{
              bgcolor: '#10B981',
              '&:hover': { bgcolor: '#059669' },
            }}
          >
            {submitting ? <CircularProgress size={24} color="inherit" /> : 'Confirm Return'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Image Viewer Dialog */}
      <Dialog
        open={imageViewerOpen}
        onClose={() => setImageViewerOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { backgroundColor: 'var(--surface)' },
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography sx={{ color: 'var(--text-primary)' }}>
            Image {currentImageIndex + 1} of {viewerImages.length}
          </Typography>
          <IconButton onClick={() => setImageViewerOpen(false)}>
            <Close sx={{ color: 'var(--text-secondary)' }} />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {viewerImages.length > 0 && (
            <Box sx={{ textAlign: 'center' }}>
              <img
                src={`${apiBaseUrl}${viewerImages[currentImageIndex]}`}
                alt={`Image ${currentImageIndex + 1}`}
                style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain' }}
              />
              {viewerImages.length > 1 && (
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 1 }}>
                  {viewerImages.map((img, idx) => (
                    <img
                      key={idx}
                      src={`${apiBaseUrl}${img}`}
                      alt={`Thumbnail ${idx + 1}`}
                      style={{
                        width: 60,
                        height: 60,
                        objectFit: 'cover',
                        cursor: 'pointer',
                        borderRadius: 4,
                        border: idx === currentImageIndex ? '2px solid var(--accent-primary)' : 'none',
                      }}
                      onClick={() => setCurrentImageIndex(idx)}
                    />
                  ))}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Request Asset Dialog */}
      <Dialog
        open={requestDialogOpen}
        onClose={() => !submitting && setRequestDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { backgroundColor: 'var(--surface)' },
        }}
      >
        <DialogTitle sx={{ color: 'var(--text-primary)' }}>Request Asset</DialogTitle>
        <DialogContent>
          {assetToRequest && (
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: 'var(--bg-elevated)', borderRadius: 1 }}>
                {assetToRequest.images && assetToRequest.images.length > 0 ? (
                  <img
                    src={`${apiBaseUrl}${assetToRequest.images[0]}`}
                    alt={assetToRequest.name}
                    style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 4 }}
                  />
                ) : (
                  <Box sx={{ width: 60, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'var(--surface)', borderRadius: 1 }}>
                    <Devices sx={{ color: 'var(--text-muted)' }} />
                  </Box>
                )}
                <Box>
                  <Typography variant="subtitle1" fontWeight={600} sx={{ color: 'var(--text-primary)' }}>
                    {assetToRequest.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'var(--text-muted)' }}>
                    {assetToRequest.assetTag} • {assetToRequest.category}
                  </Typography>
                </Box>
              </Box>

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Purpose *"
                placeholder="Why do you need this asset?"
                value={requestPurpose}
                onChange={(e) => setRequestPurpose(e.target.value)}
                sx={textFieldSx}
              />

              <TextField
                fullWidth
                type="date"
                label="Preferred Due Date (Optional)"
                value={requestDueDate}
                onChange={(e) => setRequestDueDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: new Date().toISOString().split('T')[0] }}
                helperText="When do you plan to return this asset?"
                sx={textFieldSx}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setRequestDialogOpen(false)}
            disabled={submitting}
            sx={{ color: 'var(--text-secondary)' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmitRequest}
            disabled={submitting || !requestPurpose.trim()}
            startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <Send />}
            sx={{
              bgcolor: 'var(--accent-primary)',
              '&:hover': { bgcolor: 'var(--accent-hover)' },
            }}
          >
            Submit Request
          </Button>
        </DialogActions>
      </Dialog>

      {/* Review Request Dialog (Admin/Manager) */}
      <Dialog
        open={reviewDialogOpen}
        onClose={() => !submitting && setReviewDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { backgroundColor: 'var(--surface)' },
        }}
      >
        <DialogTitle sx={{ color: 'var(--text-primary)' }}>Review Asset Request</DialogTitle>
        <DialogContent>
          {requestToReview && (
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {/* Asset info */}
              <Box sx={{ p: 2, bgcolor: 'var(--bg-elevated)', borderRadius: 1 }}>
                <Typography variant="subtitle2" sx={{ color: 'var(--text-muted)', mb: 1 }}>
                  Asset Requested
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Devices sx={{ color: 'var(--text-muted)' }} />
                  <Box>
                    <Typography variant="body1" fontWeight={600} sx={{ color: 'var(--text-primary)' }}>
                      {requestToReview.asset?.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'var(--text-muted)' }}>
                      {requestToReview.asset?.assetTag}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Requester info */}
              <Box sx={{ p: 2, bgcolor: 'var(--bg-elevated)', borderRadius: 1 }}>
                <Typography variant="subtitle2" sx={{ color: 'var(--text-muted)', mb: 1 }}>
                  Requested By
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Person sx={{ color: 'var(--text-muted)' }} />
                  <Box>
                    <Typography variant="body1" sx={{ color: 'var(--text-primary)' }}>
                      {requestToReview.requester?.firstName} {requestToReview.requester?.lastName}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'var(--text-muted)' }}>
                      {requestToReview.requester?.email}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Purpose */}
              <Box>
                <Typography variant="subtitle2" sx={{ color: 'var(--text-muted)', mb: 0.5 }}>
                  Purpose
                </Typography>
                <Typography variant="body2" sx={{ color: 'var(--text-primary)' }}>
                  {requestToReview.purpose}
                </Typography>
              </Box>

              {/* Requested due date */}
              <Box>
                <Typography variant="subtitle2" sx={{ color: 'var(--text-muted)', mb: 0.5 }}>
                  Requested Due Date
                </Typography>
                <Typography variant="body2" sx={{ color: 'var(--text-primary)' }}>
                  {requestToReview.requestedDueDate ? formatDate(requestToReview.requestedDueDate) : 'Not specified'}
                </Typography>
              </Box>

              <Divider sx={{ borderColor: 'var(--border)' }} />

              {/* Due date override (for approval) */}
              <TextField
                fullWidth
                type="date"
                label="Set Due Date (Optional)"
                value={approveDueDate}
                onChange={(e) => setApproveDueDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: new Date().toISOString().split('T')[0] }}
                helperText="Override the requested due date if needed"
                sx={textFieldSx}
              />

              {/* Review notes */}
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Review Notes (Optional)"
                placeholder="Add any notes for the requester..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                sx={textFieldSx}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'space-between' }}>
          <Button
            onClick={() => setReviewDialogOpen(false)}
            disabled={submitting}
            sx={{ color: 'var(--text-secondary)' }}
          >
            Cancel
          </Button>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              onClick={handleRejectRequest}
              disabled={submitting}
              startIcon={submitting ? <CircularProgress size={20} /> : <ThumbDown />}
              sx={{
                borderColor: '#EF4444',
                color: '#EF4444',
                '&:hover': { borderColor: '#DC2626', bgcolor: 'rgba(239, 68, 68, 0.1)' },
              }}
            >
              Reject
            </Button>
            <Button
              variant="contained"
              onClick={handleApproveRequest}
              disabled={submitting}
              startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <ThumbUp />}
              sx={{
                bgcolor: '#10B981',
                '&:hover': { bgcolor: '#059669' },
              }}
            >
              Approve
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AssetsPage;
