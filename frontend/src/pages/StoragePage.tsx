import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Breadcrumbs,
  Link,
  Grid,
  Card,
  CardContent,
  CardActions,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tab,
  Tabs,
  LinearProgress,
  Chip,
  Alert,
  Snackbar,
  Tooltip,
  CircularProgress,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  Folder as FolderIcon,
  InsertDriveFile as FileIcon,
  Image as ImageIcon,
  VideoFile as VideoIcon,
  AudioFile as AudioIcon,
  PictureAsPdf as PdfIcon,
  Description as DocumentIcon,
  TableChart as SpreadsheetIcon,
  FolderZip as ArchiveIcon,
  TextSnippet as TextIcon,
  CreateNewFolder as CreateFolderIcon,
  CloudUpload as UploadIcon,
  MoreVert as MoreIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  DriveFileMove as MoveIcon,
  Link as LinkIcon,
  NavigateNext as NavigateNextIcon,
  Home as HomeIcon,
  CloudQueue as CloudIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import storageService, {
  StorageFolder,
  StorageFile,
  StorageShare,
  StorageStats,
  BreadcrumbItem,
} from '../services/storage.service';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import FilePreviewModal from '../components/storage/FilePreviewModal';

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

const StoragePage: React.FC = () => {
  const { user: currentUser } = useAuth();

  // State
  const [tabValue, setTabValue] = useState(0);
  const [folders, setFolders] = useState<StorageFolder[]>([]);
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [sharedItems, setSharedItems] = useState<StorageShare[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<BreadcrumbItem[]>([]);
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFileName, setUploadingFileName] = useState('');
  const [uploadingFileIndex, setUploadingFileIndex] = useState(0);
  const [uploadingTotalFiles, setUploadingTotalFiles] = useState(0);

  // Menu state
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    type: 'folder' | 'file';
    item: StorageFolder | StorageFile;
  } | null>(null);

  // Dialog states
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameItem, setRenameItem] = useState<{ type: 'folder' | 'file'; item: StorageFolder | StorageFile } | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<{ type: 'folder' | 'file'; item: StorageFolder | StorageFile } | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareItem, setShareItem] = useState<{ type: 'folder' | 'file'; item: StorageFolder | StorageFile } | null>(null);
  const [shareUserId, setShareUserId] = useState<number | null>(null);
  const [sharePermission, setSharePermission] = useState<'view' | 'edit'>('view');
  const [existingShares, setExistingShares] = useState<StorageShare[]>([]);
  const [publicLinkOpen, setPublicLinkOpen] = useState(false);
  const [publicLinkItem, setPublicLinkItem] = useState<StorageFile | null>(null);
  const [publicLinkExpiry, setPublicLinkExpiry] = useState<number | ''>('');
  const [generatedPublicLink, setGeneratedPublicLink] = useState('');
  const [moveOpen, setMoveOpen] = useState(false);
  const [moveItem, setMoveItem] = useState<StorageFile | null>(null);
  const [moveFolders, setMoveFolders] = useState<StorageFolder[]>([]);
  const [moveTargetId, setMoveTargetId] = useState<number | null>(null);

  // Preview modal state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<StorageFile | null>(null);

  // Users for sharing
  const [users, setUsers] = useState<{ id: number; firstName: string; lastName: string; email: string }[]>([]);

  // Snackbar
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [foldersData, filesData, statsData] = await Promise.all([
        storageService.getFolders(currentFolderId),
        storageService.getFiles(currentFolderId),
        storageService.getStorageStats(),
      ]);
      setFolders(foldersData);
      setFiles(filesData);
      setStats(statsData);

      // Update breadcrumb
      if (currentFolderId) {
        const { breadcrumb: bc } = await storageService.getFolderById(currentFolderId);
        setBreadcrumb(bc);
      } else {
        setBreadcrumb([]);
      }
    } catch (error) {
      console.error('Error loading storage data:', error);
      setSnackbar({ open: true, message: 'Failed to load storage data', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [currentFolderId]);

  const loadSharedItems = useCallback(async () => {
    try {
      const data = await storageService.getSharedWithMe();
      setSharedItems(data);
    } catch (error) {
      console.error('Error loading shared items:', error);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      // Use storage/users endpoint which is accessible by all authenticated users
      const response = await api.get('/storage/users');
      const usersData = response.data?.data || response.data?.users || (Array.isArray(response.data) ? response.data : []);
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
    loadUsers();
  }, [loadData, loadUsers]);

  useEffect(() => {
    if (tabValue === 1) {
      loadSharedItems();
    }
  }, [tabValue, loadSharedItems]);

  // Handlers
  const handleFolderClick = (folder: StorageFolder) => {
    setCurrentFolderId(folder.id);
  };

  const handleBreadcrumbClick = (folderId: number | null) => {
    setCurrentFolderId(folderId);
  };

  const handleContextMenu = (
    event: React.MouseEvent,
    type: 'folder' | 'file',
    item: StorageFolder | StorageFile
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu({
      mouseX: event.clientX - 2,
      mouseY: event.clientY - 4,
      type,
      item,
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  // Create folder
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      await storageService.createFolder(newFolderName.trim(), currentFolderId);
      setCreateFolderOpen(false);
      setNewFolderName('');
      loadData();
      setSnackbar({ open: true, message: 'Folder created successfully', severity: 'success' });
    } catch (error: any) {
      setSnackbar({ open: true, message: error.response?.data?.message || 'Failed to create folder', severity: 'error' });
    }
  };

  // Upload file
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setUploading(true);
    setUploadProgress(0);
    setUploadingTotalFiles(selectedFiles.length);

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        setUploadingFileIndex(i + 1);
        setUploadingFileName(file.name);
        await storageService.uploadFile(file, currentFolderId, (progress) => {
          setUploadProgress(progress);
        });
      }
      loadData();
      setSnackbar({ open: true, message: 'File(s) uploaded successfully', severity: 'success' });
    } catch (error: any) {
      setSnackbar({ open: true, message: error.response?.data?.message || 'Failed to upload file', severity: 'error' });
    } finally {
      setUploading(false);
      setUploadProgress(0);
      setUploadingFileName('');
      setUploadingFileIndex(0);
      setUploadingTotalFiles(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Rename
  const handleRename = async () => {
    if (!renameItem || !renameValue.trim()) return;
    try {
      if (renameItem.type === 'folder') {
        await storageService.renameFolder(renameItem.item.id, renameValue.trim());
      } else {
        await storageService.renameFile(renameItem.item.id, renameValue.trim());
      }
      setRenameOpen(false);
      setRenameItem(null);
      setRenameValue('');
      loadData();
      setSnackbar({ open: true, message: 'Renamed successfully', severity: 'success' });
    } catch (error: any) {
      setSnackbar({ open: true, message: error.response?.data?.message || 'Failed to rename', severity: 'error' });
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      if (deleteItem.type === 'folder') {
        await storageService.deleteFolder(deleteItem.item.id);
      } else {
        await storageService.deleteFile(deleteItem.item.id);
      }
      setDeleteOpen(false);
      setDeleteItem(null);
      loadData();
      setSnackbar({ open: true, message: 'Deleted successfully', severity: 'success' });
    } catch (error: any) {
      setSnackbar({ open: true, message: error.response?.data?.message || 'Failed to delete', severity: 'error' });
    }
  };

  // Download - fetch file as blob to prevent URL exposure
  const handleDownload = async (file: StorageFile) => {
    try {
      setSnackbar({ open: true, message: 'Starting download...', severity: 'info' });
      const { downloadUrl } = await storageService.downloadFile(file.id);

      // Fetch the file as a blob to prevent URL exposure
      const response = await fetch(downloadUrl);
      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      // Create a temporary anchor element to force download
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the blob URL
      window.URL.revokeObjectURL(blobUrl);
      setSnackbar({ open: true, message: 'Download started', severity: 'success' });
    } catch (error) {
      console.error('Download error:', error);
      setSnackbar({ open: true, message: 'Failed to download file', severity: 'error' });
    }
  };

  // Open file preview
  const handleFilePreview = (file: StorageFile) => {
    setPreviewFile(file);
    setPreviewOpen(true);
  };

  // Share
  const openShareDialog = async (type: 'folder' | 'file', item: StorageFolder | StorageFile) => {
    setShareItem({ type, item });
    setShareOpen(true);
    try {
      const shares = await storageService.getSharesForItem(
        type === 'file' ? item.id : undefined,
        type === 'folder' ? item.id : undefined
      );
      setExistingShares(shares);
    } catch (error) {
      console.error('Error loading shares:', error);
    }
  };

  const handleShare = async () => {
    if (!shareItem || !shareUserId) return;
    try {
      await storageService.shareWithUser(
        shareItem.type === 'file' ? shareItem.item.id : undefined,
        shareItem.type === 'folder' ? shareItem.item.id : undefined,
        shareUserId,
        sharePermission
      );
      const shares = await storageService.getSharesForItem(
        shareItem.type === 'file' ? shareItem.item.id : undefined,
        shareItem.type === 'folder' ? shareItem.item.id : undefined
      );
      setExistingShares(shares);
      setShareUserId(null);
      setSnackbar({ open: true, message: 'Shared successfully', severity: 'success' });
    } catch (error: any) {
      setSnackbar({ open: true, message: error.response?.data?.message || 'Failed to share', severity: 'error' });
    }
  };

  const handleRemoveShare = async (shareId: number) => {
    try {
      await storageService.removeShare(shareId);
      setExistingShares(existingShares.filter((s) => s.id !== shareId));
      setSnackbar({ open: true, message: 'Share removed', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to remove share', severity: 'error' });
    }
  };

  // Public link
  const handleGeneratePublicLink = async () => {
    if (!publicLinkItem) return;
    try {
      const result = await storageService.generatePublicLink(
        publicLinkItem.id,
        publicLinkExpiry ? Number(publicLinkExpiry) : undefined
      );
      setGeneratedPublicLink(`${window.location.origin}/shared/${result.publicToken}`);
      loadData();
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to generate public link', severity: 'error' });
    }
  };

  const handleRevokePublicLink = async () => {
    if (!publicLinkItem) return;
    try {
      await storageService.revokePublicLink(publicLinkItem.id);
      setGeneratedPublicLink('');
      setPublicLinkOpen(false);
      loadData();
      setSnackbar({ open: true, message: 'Public link revoked', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to revoke public link', severity: 'error' });
    }
  };

  // Move
  const openMoveDialog = async (file: StorageFile) => {
    setMoveItem(file);
    setMoveTargetId(null); // Reset to root by default
    try {
      const allFolders = await storageService.getAllFolders();
      // Exclude the current folder (file's current location)
      const filteredFolders = allFolders.filter((folder) => folder.id !== file.folderId);
      setMoveFolders(filteredFolders);
    } catch (error) {
      console.error('Error loading folders:', error);
    }
    setMoveOpen(true);
  };

  const handleMove = async () => {
    if (!moveItem) return;
    try {
      await storageService.moveFile(moveItem.id, moveTargetId);
      setMoveOpen(false);
      setMoveItem(null);
      loadData();
      setSnackbar({ open: true, message: 'File moved successfully', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to move file', severity: 'error' });
    }
  };

  // Get file icon component
  const getFileIconComponent = (mimeType?: string) => {
    const iconType = storageService.getFileIcon(mimeType);
    switch (iconType) {
      case 'image':
        return <ImageIcon sx={{ fontSize: 48, color: '#4caf50' }} />;
      case 'video':
        return <VideoIcon sx={{ fontSize: 48, color: '#ff5722' }} />;
      case 'audio':
        return <AudioIcon sx={{ fontSize: 48, color: '#9c27b0' }} />;
      case 'pdf':
        return <PdfIcon sx={{ fontSize: 48, color: '#f44336' }} />;
      case 'document':
        return <DocumentIcon sx={{ fontSize: 48, color: '#2196f3' }} />;
      case 'spreadsheet':
        return <SpreadsheetIcon sx={{ fontSize: 48, color: '#4caf50' }} />;
      case 'presentation':
        return <PdfIcon sx={{ fontSize: 48, color: '#ff9800' }} />;
      case 'archive':
        return <ArchiveIcon sx={{ fontSize: 48, color: '#795548' }} />;
      case 'text':
        return <TextIcon sx={{ fontSize: 48, color: '#607d8b' }} />;
      default:
        return <FileIcon sx={{ fontSize: 48, color: '#9e9e9e' }} />;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <CloudIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" fontWeight="bold" sx={{ color: 'var(--text-primary)' }}>
            Storage
          </Typography>
          {stats && (
            <Chip
              label={`${stats.totalSizeFormatted} used - ${stats.fileCount} files, ${stats.folderCount} folders`}
              size="small"
              color="primary"
              variant="outlined"
            />
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => loadData()}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            startIcon={<CreateFolderIcon />}
            onClick={() => setCreateFolderOpen(true)}
          >
            New Folder
          </Button>
          <Button
            variant="contained"
            startIcon={<UploadIcon />}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            Upload
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileSelect}
            multiple
          />
        </Box>
      </Box>

      {/* Upload progress */}
      {uploading && (
        <Paper
          sx={{
            mb: 2,
            p: 2,
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <UploadIcon sx={{ color: 'var(--accent-primary)', animation: 'pulse 1.5s infinite' }} />
              <Typography variant="body2" sx={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                Uploading{uploadingTotalFiles > 1 ? ` (${uploadingFileIndex}/${uploadingTotalFiles})` : ''}
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: 'var(--text-muted)' }}>
              {uploadProgress}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={uploadProgress}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: 'var(--bg-elevated)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                backgroundColor: 'var(--accent-primary)',
              },
            }}
          />
          <Typography
            variant="caption"
            sx={{
              color: 'var(--text-muted)',
              mt: 0.5,
              display: 'block',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {uploadingFileName}
          </Typography>
        </Paper>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 2, backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          sx={{
            '& .MuiTab-root': { color: 'var(--text-secondary)' },
            '& .Mui-selected': { color: 'var(--accent-primary)' },
            '& .MuiTabs-indicator': { backgroundColor: 'var(--accent-primary)' }
          }}
        >
          <Tab label="My Files" />
          <Tab label="Shared with Me" />
        </Tabs>
      </Paper>

      {/* My Files Tab */}
      <TabPanel value={tabValue} index={0}>
        {/* Breadcrumb */}
        <Box sx={{ mb: 2 }}>
          <Breadcrumbs separator={<NavigateNextIcon fontSize="small" sx={{ color: 'var(--text-muted)' }} />}>
            <Link
              component="button"
              variant="body1"
              onClick={() => handleBreadcrumbClick(null)}
              underline="hover"
              sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', color: 'var(--accent-primary)' }}
            >
              <HomeIcon sx={{ mr: 0.5 }} fontSize="small" />
              My Drive
            </Link>
            {breadcrumb.map((item, index) => (
              <Link
                key={item.id}
                component="button"
                variant="body1"
                onClick={() => handleBreadcrumbClick(item.id)}
                underline={index < breadcrumb.length - 1 ? 'hover' : 'none'}
                sx={{
                  cursor: 'pointer',
                  color: index === breadcrumb.length - 1 ? 'var(--text-primary)' : 'var(--accent-primary)'
                }}
              >
                {item.name}
              </Link>
            ))}
          </Breadcrumbs>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : folders.length === 0 && files.length === 0 ? (
          <Alert
            severity="info"
            sx={{
              backgroundColor: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              '& .MuiAlert-icon': { color: 'var(--accent-primary)' }
            }}
          >
            This folder is empty. Create a new folder or upload files to get started.
          </Alert>
        ) : (
          <Grid container spacing={2} sx={{ alignItems: 'stretch' }}>
            {/* Folders */}
            {folders.map((folder) => (
              <Grid item xs={6} sm={4} md={3} lg={2} key={`folder-${folder.id}`}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    '&:hover': { boxShadow: 4 },
                    transition: 'box-shadow 0.2s',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    position: 'relative',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                  onDoubleClick={() => handleFolderClick(folder)}
                  onContextMenu={(e) => handleContextMenu(e, 'folder', folder)}
                >
                  <CardContent sx={{ textAlign: 'center', py: 2, px: 1, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                    <FolderIcon sx={{ fontSize: 48, color: '#ffc107', mb: 1 }} />
                    <Typography variant="body2" noWrap title={folder.name} sx={{ color: 'var(--text-primary)', width: '100%' }}>
                      {folder.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                      {folder.createdAt ? new Date(folder.createdAt).toLocaleDateString() : ''}
                    </Typography>
                  </CardContent>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleContextMenu(e, 'folder', folder);
                    }}
                    sx={{
                      color: 'var(--text-secondary)',
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      padding: '4px',
                    }}
                  >
                    <MoreIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Card>
              </Grid>
            ))}

            {/* Files */}
            {files.map((file) => (
              <Grid item xs={6} sm={4} md={3} lg={2} key={`file-${file.id}`}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    '&:hover': { boxShadow: 4 },
                    transition: 'box-shadow 0.2s',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    position: 'relative',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                  onDoubleClick={() => handleFilePreview(file)}
                  onContextMenu={(e) => handleContextMenu(e, 'file', file)}
                >
                  <CardContent sx={{ textAlign: 'center', py: 2, px: 1, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                    {React.cloneElement(getFileIconComponent(file.mimeType), { sx: { fontSize: 48, mb: 1 } })}
                    <Typography variant="body2" noWrap title={file.name} sx={{ color: 'var(--text-primary)', width: '100%' }}>
                      {file.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                      {storageService.formatFileSize(file.fileSize)}
                    </Typography>
                    {file.isPublic && (
                      <Chip label="Public" size="small" color="success" sx={{ mt: 0.5, height: 18, fontSize: '0.65rem' }} />
                    )}
                  </CardContent>
                  <Box sx={{ position: 'absolute', top: 4, right: 4, display: 'flex', gap: 0.5 }}>
                    <Tooltip title="Download">
                      <IconButton
                        size="small"
                        onClick={(e) => { e.stopPropagation(); handleDownload(file); }}
                        sx={{ color: 'var(--text-secondary)', padding: '4px' }}
                      >
                        <DownloadIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleContextMenu(e, 'file', file);
                      }}
                      sx={{ color: 'var(--text-secondary)', padding: '4px' }}
                    >
                      <MoreIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      {/* Shared with Me Tab */}
      <TabPanel value={tabValue} index={1}>
        {sharedItems.length === 0 ? (
          <Alert
            severity="info"
            sx={{
              backgroundColor: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              '& .MuiAlert-icon': { color: 'var(--accent-primary)' }
            }}
          >
            No files or folders have been shared with you yet.
          </Alert>
        ) : (
          <Grid container spacing={2} sx={{ alignItems: 'stretch' }}>
            {/* Shared Folders */}
            {sharedItems.filter(share => share.folder).map((share) => (
              <Grid item xs={6} sm={4} md={3} lg={2} key={`shared-folder-${share.id}`}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    '&:hover': { boxShadow: 4 },
                    transition: 'box-shadow 0.2s',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    position: 'relative',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <CardContent sx={{ textAlign: 'center', py: 2, px: 1, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                    <FolderIcon sx={{ fontSize: 48, color: '#ffc107', mb: 1 }} />
                    <Typography variant="body2" noWrap title={share.folder!.name} sx={{ color: 'var(--text-primary)', width: '100%' }}>
                      {share.folder!.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                      {share.sharedByUser?.firstName} {share.sharedByUser?.lastName}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}

            {/* Shared Files */}
            {sharedItems.filter(share => share.file).map((share) => (
              <Grid item xs={6} sm={4} md={3} lg={2} key={`shared-file-${share.id}`}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    '&:hover': { boxShadow: 4 },
                    transition: 'box-shadow 0.2s',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    position: 'relative',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                  onDoubleClick={() => handleFilePreview(share.file!)}
                >
                  <CardContent sx={{ textAlign: 'center', py: 2, px: 1, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                    {React.cloneElement(getFileIconComponent(share.file!.mimeType), { sx: { fontSize: 48, mb: 1 } })}
                    <Typography variant="body2" noWrap title={share.file!.name} sx={{ color: 'var(--text-primary)', width: '100%' }}>
                      {share.file!.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                      {storageService.formatFileSize(share.file!.fileSize)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>
                      from {share.sharedByUser?.firstName} {share.sharedByUser?.lastName}
                    </Typography>
                  </CardContent>
                  <Box sx={{ position: 'absolute', top: 4, right: 4, display: 'flex', gap: 0.5 }}>
                    <Tooltip title="Download">
                      <IconButton
                        size="small"
                        onClick={(e) => { e.stopPropagation(); handleDownload(share.file!); }}
                        sx={{ color: 'var(--text-secondary)', padding: '4px' }}
                      >
                        <DownloadIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      {/* Context Menu */}
      <Menu
        open={contextMenu !== null}
        onClose={handleCloseContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null ? { top: contextMenu.mouseY, left: contextMenu.mouseX } : undefined
        }
      >
        {contextMenu?.type === 'file' && (
          <MenuItem
            onClick={() => {
              handleDownload(contextMenu.item as StorageFile);
              handleCloseContextMenu();
            }}
          >
            <DownloadIcon sx={{ mr: 1 }} fontSize="small" /> Download
          </MenuItem>
        )}
        <MenuItem
          onClick={() => {
            setRenameItem({ type: contextMenu!.type, item: contextMenu!.item });
            setRenameValue(contextMenu!.item.name);
            setRenameOpen(true);
            handleCloseContextMenu();
          }}
        >
          <EditIcon sx={{ mr: 1 }} fontSize="small" /> Rename
        </MenuItem>
        <MenuItem
          onClick={() => {
            openShareDialog(contextMenu!.type, contextMenu!.item);
            handleCloseContextMenu();
          }}
        >
          <ShareIcon sx={{ mr: 1 }} fontSize="small" /> Share
        </MenuItem>
        {contextMenu?.type === 'file' && (
          <>
            <MenuItem
              onClick={() => {
                openMoveDialog(contextMenu.item as StorageFile);
                handleCloseContextMenu();
              }}
            >
              <MoveIcon sx={{ mr: 1 }} fontSize="small" /> Move
            </MenuItem>
            <MenuItem
              onClick={() => {
                setPublicLinkItem(contextMenu.item as StorageFile);
                setGeneratedPublicLink(
                  (contextMenu.item as StorageFile).isPublic
                    ? `${window.location.origin}/shared/${(contextMenu.item as StorageFile).publicToken}`
                    : ''
                );
                setPublicLinkOpen(true);
                handleCloseContextMenu();
              }}
            >
              <LinkIcon sx={{ mr: 1 }} fontSize="small" /> Public Link
            </MenuItem>
          </>
        )}
        <MenuItem
          onClick={() => {
            setDeleteItem({ type: contextMenu!.type, item: contextMenu!.item });
            setDeleteOpen(true);
            handleCloseContextMenu();
          }}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon sx={{ mr: 1 }} fontSize="small" /> Delete
        </MenuItem>
      </Menu>

      {/* Create Folder Dialog */}
      <Dialog
        open={createFolderOpen}
        onClose={() => setCreateFolderOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
          }
        }}
      >
        <DialogTitle sx={{ color: 'var(--text-primary)' }}>Create New Folder</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Folder Name"
            fullWidth
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
            sx={{
              '& .MuiInputLabel-root': { color: 'var(--text-muted)' },
              '& .MuiOutlinedInput-root': {
                color: 'var(--text-primary)',
                '& fieldset': { borderColor: 'var(--border)' },
                '&:hover fieldset': { borderColor: 'var(--text-muted)' },
                '&.Mui-focused fieldset': { borderColor: 'var(--accent-primary)' },
              },
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateFolderOpen(false)} sx={{ color: 'var(--text-secondary)' }}>Cancel</Button>
          <Button onClick={handleCreateFolder} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog
        open={renameOpen}
        onClose={() => setRenameOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
          }
        }}
      >
        <DialogTitle sx={{ color: 'var(--text-primary)' }}>Rename {renameItem?.type}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="New Name"
            fullWidth
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleRename()}
            sx={{
              '& .MuiInputLabel-root': { color: 'var(--text-muted)' },
              '& .MuiOutlinedInput-root': {
                color: 'var(--text-primary)',
                '& fieldset': { borderColor: 'var(--border)' },
                '&:hover fieldset': { borderColor: 'var(--text-muted)' },
                '&.Mui-focused fieldset': { borderColor: 'var(--accent-primary)' },
              },
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameOpen(false)} sx={{ color: 'var(--text-secondary)' }}>Cancel</Button>
          <Button onClick={handleRename} variant="contained">
            Rename
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        PaperProps={{
          sx: {
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
          }
        }}
      >
        <DialogTitle sx={{ color: 'var(--text-primary)' }}>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: 'var(--text-secondary)' }}>
            Are you sure you want to delete "{deleteItem?.item.name}"?
            {deleteItem?.type === 'folder' && ' This will also delete all files and subfolders inside.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)} sx={{ color: 'var(--text-secondary)' }}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Share Dialog */}
      <Dialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
          }
        }}
      >
        <DialogTitle sx={{ color: 'var(--text-primary)' }}>Share "{shareItem?.item.name}"</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', gap: 2, mb: 2, mt: 1 }}>
            <Autocomplete
              options={users.filter((u) => u.id !== currentUser?.id && !existingShares.some((s) => s.sharedWith === u.id))}
              getOptionLabel={(option) => `${option.firstName} ${option.lastName} (${option.email})`}
              onChange={(_, value) => setShareUserId(value?.id || null)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Share with user"
                  sx={{
                    '& .MuiInputLabel-root': { color: 'var(--text-muted)' },
                    '& .MuiOutlinedInput-root': {
                      color: 'var(--text-primary)',
                      '& fieldset': { borderColor: 'var(--border)' },
                      '&:hover fieldset': { borderColor: 'var(--text-muted)' },
                      '&.Mui-focused fieldset': { borderColor: 'var(--accent-primary)' },
                    },
                  }}
                />
              )}
              renderOption={(props, option) => (
                <li {...props} style={{ color: 'var(--text-primary)' }}>
                  {option.firstName} {option.lastName} ({option.email})
                </li>
              )}
              componentsProps={{
                paper: {
                  sx: {
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--border)',
                    '& .MuiAutocomplete-option': {
                      color: 'var(--text-primary)',
                      '&:hover': {
                        backgroundColor: 'var(--sidebar-item-hover)',
                      },
                      '&[aria-selected="true"]': {
                        backgroundColor: 'var(--accent-primary-light)',
                      },
                    },
                  },
                },
              }}
              sx={{ flexGrow: 1 }}
            />
            <Button variant="contained" onClick={handleShare} disabled={!shareUserId}>
              Share
            </Button>
          </Box>

          {existingShares.length > 0 && (
            <>
              <Typography variant="subtitle2" sx={{ mt: 2, color: 'var(--text-primary)' }}>
                Shared with:
              </Typography>
              <List dense>
                {existingShares.map((share) => (
                  <ListItem key={share.id}>
                    <ListItemText
                      primary={`${share.sharedWithUser?.firstName} ${share.sharedWithUser?.lastName}`}
                      secondary={share.sharedWithUser?.email}
                      primaryTypographyProps={{ sx: { color: 'var(--text-primary)' } }}
                      secondaryTypographyProps={{ sx: { color: 'var(--text-muted)' } }}
                    />
                    <ListItemSecondaryAction>
                      <IconButton edge="end" onClick={() => handleRemoveShare(share.id)} sx={{ color: 'var(--text-secondary)' }}>
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareOpen(false)} sx={{ color: 'var(--text-secondary)' }}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Public Link Dialog */}
      <Dialog
        open={publicLinkOpen}
        onClose={() => setPublicLinkOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
          }
        }}
      >
        <DialogTitle sx={{ color: 'var(--text-primary)' }}>Public Link for "{publicLinkItem?.name}"</DialogTitle>
        <DialogContent>
          {!publicLinkItem?.isPublic && !generatedPublicLink && (
            <Box sx={{ mb: 2 }}>
              <TextField
                margin="dense"
                label="Expires in (hours, optional)"
                type="number"
                fullWidth
                value={publicLinkExpiry}
                onChange={(e) => setPublicLinkExpiry(e.target.value ? Number(e.target.value) : '')}
                helperText="Leave empty for no expiration"
                sx={{
                  '& .MuiInputLabel-root': { color: 'var(--text-muted)' },
                  '& .MuiOutlinedInput-root': {
                    color: 'var(--text-primary)',
                    '& fieldset': { borderColor: 'var(--border)' },
                    '&:hover fieldset': { borderColor: 'var(--text-muted)' },
                    '&.Mui-focused fieldset': { borderColor: 'var(--accent-primary)' },
                  },
                  '& .MuiFormHelperText-root': { color: 'var(--text-muted)' },
                }}
              />
              <Button variant="contained" onClick={handleGeneratePublicLink} sx={{ mt: 2 }}>
                Generate Public Link
              </Button>
            </Box>
          )}

          {generatedPublicLink && (
            <Box>
              <TextField
                margin="dense"
                label="Public Link"
                fullWidth
                value={generatedPublicLink}
                InputProps={{ readOnly: true }}
                sx={{
                  '& .MuiInputLabel-root': { color: 'var(--text-muted)' },
                  '& .MuiOutlinedInput-root': {
                    color: 'var(--text-primary)',
                    '& fieldset': { borderColor: 'var(--border)' },
                  },
                }}
              />
              <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedPublicLink);
                    setSnackbar({ open: true, message: 'Link copied to clipboard', severity: 'success' });
                  }}
                >
                  Copy Link
                </Button>
                <Button variant="outlined" color="error" onClick={handleRevokePublicLink}>
                  Revoke Link
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPublicLinkOpen(false)} sx={{ color: 'var(--text-secondary)' }}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Move Dialog */}
      <Dialog
        open={moveOpen}
        onClose={() => setMoveOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
          }
        }}
      >
        <DialogTitle sx={{ color: 'var(--text-primary)' }}>Move "{moveItem?.name}"</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel sx={{ color: 'var(--text-muted)' }}>Move to folder</InputLabel>
            <Select
              value={moveTargetId || ''}
              label="Move to folder"
              onChange={(e) => setMoveTargetId(e.target.value === '' ? null : Number(e.target.value))}
              sx={{
                color: 'var(--text-primary)',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--border)' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--text-muted)' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--accent-primary)' },
              }}
            >
              {/* Only show Root option if file is not already in root */}
              {moveItem?.folderId !== null && (
                <MenuItem value="">Root (My Drive)</MenuItem>
              )}
              {moveFolders.map((folder) => (
                <MenuItem key={folder.id} value={folder.id}>
                  {folder.path}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMoveOpen(false)} sx={{ color: 'var(--text-secondary)' }}>Cancel</Button>
          <Button onClick={handleMove} variant="contained">
            Move
          </Button>
        </DialogActions>
      </Dialog>

      {/* File Preview Modal */}
      <FilePreviewModal
        open={previewOpen}
        file={previewFile}
        onClose={() => {
          setPreviewOpen(false);
          setPreviewFile(null);
        }}
        onDownload={handleDownload}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default StoragePage;
