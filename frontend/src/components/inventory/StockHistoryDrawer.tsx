import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Box,
  Typography,
  Divider,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogContent,
  ImageList,
  ImageListItem,
} from '@mui/material';
import { Close, TrendingUp, TrendingDown, Edit, Image as ImageIcon } from '@mui/icons-material';
import { format } from 'date-fns';
import { inventoryService, InventoryProduct, InventoryMovement } from '../../services/inventory.service';

interface Props {
  open: boolean;
  onClose: () => void;
  product: InventoryProduct | null;
}

const StockHistoryDrawer: React.FC<Props> = ({ open, onClose, product }) => {
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  const apiBaseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || '';

  const handleViewImages = (images: string[]) => {
    setSelectedImages(images);
    setImageDialogOpen(true);
  };

  useEffect(() => {
    if (open && product) {
      loadHistory();
    }
  }, [open, product]);

  const loadHistory = async () => {
    if (!product) return;

    try {
      setLoading(true);
      const response = await inventoryService.getStockMovements({
        productId: product.id,
        limit: 100,
      });
      setMovements(response.items);
    } catch (error) {
      console.error('Error loading stock history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMovementIcon = (type: string): React.ReactElement | undefined => {
    switch (type) {
      case 'in':
        return <TrendingUp fontSize="small" />;
      case 'out':
        return <TrendingDown fontSize="small" />;
      case 'adjustment':
        return <Edit fontSize="small" />;
      default:
        return undefined;
    }
  };

  const getMovementColor = (type: string) => {
    switch (type) {
      case 'in':
        return 'success';
      case 'out':
        return 'warning';
      case 'adjustment':
        return 'info';
      default:
        return 'default';
    }
  };

  const getMovementLabel = (type: string) => {
    switch (type) {
      case 'in':
        return 'Stock In';
      case 'out':
        return 'Stock Out';
      case 'adjustment':
        return 'Adjustment';
      default:
        return type;
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100%', sm: 600 } } }}
    >
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Stock Movement History</Typography>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {product && (
          <Box sx={{ mb: 3 }}>
            <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
              <Typography variant="h6">{product.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                SKU: {product.sku}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Current Stock
                  </Typography>
                  <Typography variant="h6">
                    {product.quantity} {product.unit}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Min Level
                  </Typography>
                  <Typography variant="h6">{product.minStockLevel}</Typography>
                </Box>
              </Box>
            </Paper>
          </Box>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : movements.length === 0 ? (
          <Alert severity="info">No stock movements recorded for this product yet.</Alert>
        ) : (
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Date</strong></TableCell>
                  <TableCell><strong>Type</strong></TableCell>
                  <TableCell align="right"><strong>Quantity</strong></TableCell>
                  <TableCell align="right"><strong>Before</strong></TableCell>
                  <TableCell align="right"><strong>After</strong></TableCell>
                  <TableCell><strong>Details</strong></TableCell>
                  <TableCell align="center"><strong>Images</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {movements.map((movement) => {
                  const dateStr = movement.createdAt || movement.created_at;
                  const isValidDate = dateStr && !isNaN(new Date(dateStr).getTime());
                  const movementType = movement.movementType || movement.movement_type || 'adjustment';
                  const prevQty = movement.previousQuantity ?? movement.previous_quantity;
                  const newQty = movement.newQuantity ?? movement.new_quantity;

                  return (
                  <TableRow key={movement.id} hover>
                    <TableCell>
                      <Typography variant="body2">
                        {isValidDate ? format(new Date(dateStr), 'MMM dd, yyyy') : '-'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {isValidDate ? format(new Date(dateStr), 'hh:mm a') : ''}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getMovementIcon(movementType)}
                        label={getMovementLabel(movementType)}
                        color={getMovementColor(movementType) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="body2"
                        fontWeight="medium"
                        color={
                          movementType === 'in'
                            ? 'success.main'
                            : movementType === 'out'
                            ? 'warning.main'
                            : 'info.main'
                        }
                      >
                        {movementType === 'in' ? '+' : movementType === 'out' ? '-' : ''}
                        {movement.quantity}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" color="text.secondary">
                        {prevQty}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="medium">
                        {newQty}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        {(movement.referenceNumber || movement.reference_number) && (
                          <Typography variant="caption" display="block">
                            Ref: {movement.referenceNumber || movement.reference_number}
                          </Typography>
                        )}
                        {movement.reason && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            {movement.reason}
                          </Typography>
                        )}
                        {/* Vendor (for stock in) */}
                        {movementType === 'in' && movement.vendor && (
                          <Typography variant="caption" color="success.main" display="block" fontWeight="medium">
                            Vendor: {movement.vendor.name}
                            {movement.vendor.contactPerson && ` (${movement.vendor.contactPerson})`}
                          </Typography>
                        )}
                        {/* Customer (for stock out) */}
                        {movementType === 'out' && movement.customer && (
                          <Typography variant="caption" color="warning.main" display="block" fontWeight="medium">
                            Customer: {movement.customer.name}
                            {movement.customer.contactPerson && ` (${movement.customer.contactPerson})`}
                          </Typography>
                        )}
                        {/* Sender details (for stock in) */}
                        {movementType === 'in' && (movement.senderName || movement.sender_name) && (
                          <Typography variant="caption" color="primary.main" display="block">
                            From: {movement.senderName || movement.sender_name}
                            {(movement.senderCompany || movement.sender_company) && ` (${movement.senderCompany || movement.sender_company})`}
                          </Typography>
                        )}
                        {/* Receiver details (for stock out) */}
                        {movementType === 'out' && (movement.receiverName || movement.receiver_name) && (
                          <Typography variant="caption" color="warning.main" display="block">
                            To: {movement.receiverName || movement.receiver_name}
                            {(movement.receiverCompany || movement.receiver_company) && ` (${movement.receiverCompany || movement.receiver_company})`}
                          </Typography>
                        )}
                        {/* Delivery person */}
                        {(movement.deliveryPersonName || movement.delivery_person_name) && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            Delivery: {movement.deliveryPersonName || movement.delivery_person_name}
                          </Typography>
                        )}
                        {movement.creator && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            By: {movement.creator.firstName} {movement.creator.lastName}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      {movement.images && movement.images.length > 0 ? (
                        <IconButton
                          size="small"
                          onClick={() => handleViewImages(movement.images!)}
                          color="primary"
                        >
                          <ImageIcon fontSize="small" />
                          <Typography variant="caption" sx={{ ml: 0.5 }}>
                            {movement.images.length}
                          </Typography>
                        </IconButton>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          -
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Image Viewer Dialog */}
        <Dialog
          open={imageDialogOpen}
          onClose={() => setImageDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
            <Typography variant="h6">Movement Images</Typography>
            <IconButton onClick={() => setImageDialogOpen(false)}>
              <Close />
            </IconButton>
          </Box>
          <DialogContent>
            <ImageList cols={selectedImages.length === 1 ? 1 : 2} gap={8}>
              {selectedImages.map((url, index) => (
                <ImageListItem key={index}>
                  <img
                    src={`${apiBaseUrl}${url}`}
                    alt={`Movement image ${index + 1}`}
                    loading="lazy"
                    style={{ borderRadius: 4, maxHeight: 400, objectFit: 'contain' }}
                  />
                </ImageListItem>
              ))}
            </ImageList>
          </DialogContent>
        </Dialog>
      </Box>
    </Drawer>
  );
};

export default StockHistoryDrawer;
