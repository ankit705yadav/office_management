import React, { useState } from 'react';
import {
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@mui/material';
import {
  ExpandMore,
  Edit,
  Delete,
  History,
  Print,
  QrCode,
  Inventory,
  Image as ImageIcon,
} from '@mui/icons-material';
import { GroupedProduct, InventoryProduct } from '@/services/inventory.service';

interface ProductGroupListProps {
  groups: GroupedProduct[];
  onEditProduct: (product: InventoryProduct) => void;
  onDeleteProduct: (product: InventoryProduct) => void;
  onViewHistory: (product: InventoryProduct) => void;
  onPrintBarcode: (product: InventoryProduct) => void;
  onViewImages?: (product: InventoryProduct) => void;
}

const ProductGroupList: React.FC<ProductGroupListProps> = ({
  groups,
  onEditProduct,
  onDeleteProduct,
  onViewHistory,
  onPrintBarcode,
  onViewImages,
}) => {
  const [expandedGroup, setExpandedGroup] = useState<string | false>(false);

  const handleAccordionChange = (groupName: string) => (
    event: React.SyntheticEvent,
    isExpanded: boolean
  ) => {
    setExpandedGroup(isExpanded ? groupName : false);
  };

  const formatPrice = (price?: number) => {
    if (price === undefined || price === null) return '-';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (groups.length === 0) {
    return (
      <Box
        sx={{
          textAlign: 'center',
          py: 6,
          color: 'var(--text-muted)',
        }}
      >
        <Inventory sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
        <Typography>No products found</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {groups.map((group) => (
        <Accordion
          key={group.name}
          expanded={expandedGroup === group.name}
          onChange={handleAccordionChange(group.name)}
          sx={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '8px !important',
            mb: 1,
            '&:before': { display: 'none' },
            '&.Mui-expanded': {
              margin: '0 0 8px 0',
            },
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMore sx={{ color: 'var(--text-secondary)' }} />}
            sx={{
              '&:hover': { backgroundColor: 'var(--sidebar-item-hover)' },
              minHeight: 64,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                pr: 2,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography
                  variant="subtitle1"
                  sx={{ color: 'var(--text-primary)', fontWeight: 500 }}
                >
                  {group.name}
                </Typography>
                {group.brand && (
                  <Chip
                    label={group.brand}
                    size="small"
                    sx={{
                      backgroundColor: 'var(--accent-info-light, rgba(33, 150, 243, 0.1))',
                      color: 'var(--accent-info)',
                      height: 22,
                      fontSize: '0.75rem',
                    }}
                  />
                )}
                {group.category && (
                  <Chip
                    label={group.category}
                    size="small"
                    sx={{
                      backgroundColor: 'var(--bg-elevated)',
                      color: 'var(--text-secondary)',
                      height: 22,
                      fontSize: '0.75rem',
                    }}
                  />
                )}
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Chip
                  label={`${group.totalQuantity} items`}
                  sx={{
                    backgroundColor:
                      group.totalQuantity > 0
                        ? 'var(--accent-success-light, rgba(76, 175, 80, 0.1))'
                        : 'var(--accent-error-light, rgba(244, 67, 54, 0.1))',
                    color:
                      group.totalQuantity > 0
                        ? 'var(--accent-success)'
                        : 'var(--accent-error)',
                    fontWeight: 600,
                  }}
                />
                <Typography sx={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  {group.items.length} SKU{group.items.length > 1 ? 's' : ''}
                </Typography>
              </Box>
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 0 }}>
            <Table size="small">
              <TableBody>
                {group.items.map((product) => (
                  <TableRow
                    key={product.id}
                    sx={{
                      '&:hover': { backgroundColor: 'var(--sidebar-item-hover)' },
                      '&:last-child td': { borderBottom: 0 },
                    }}
                  >
                    <TableCell sx={{ color: 'var(--text-secondary)', minWidth: 180, whiteSpace: 'nowrap' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {product.isManualEntry ? (
                          <Tooltip title="Manual Entry (System Barcode)">
                            <QrCode sx={{ fontSize: 16, color: 'var(--accent-warning)', flexShrink: 0 }} />
                          </Tooltip>
                        ) : (
                          <Tooltip title="Physical Barcode">
                            <QrCode sx={{ fontSize: 16, color: 'var(--accent-info)', flexShrink: 0 }} />
                          </Tooltip>
                        )}
                        <Typography
                          variant="body2"
                          sx={{
                            fontFamily: 'monospace',
                            fontSize: '0.8rem',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {product.sku}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {product.barcode ? (
                        <Tooltip title={`Barcode: ${product.barcode}`}>
                          <span>{product.barcode.length > 20 ? `${product.barcode.substring(0, 20)}...` : product.barcode}</span>
                        </Tooltip>
                      ) : (
                        <span style={{ fontStyle: 'italic' }}>No physical barcode</span>
                      )}
                    </TableCell>
                    <TableCell align="right" sx={{ color: 'var(--text-secondary)', width: 100 }}>
                      {formatPrice(product.unitPrice)}
                    </TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditProduct(product);
                          }}
                          sx={{ color: 'var(--text-secondary)' }}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="View History">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewHistory(product);
                          }}
                          sx={{ color: 'var(--text-secondary)' }}
                        >
                          <History fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {product.images && product.images.length > 0 && onViewImages && (
                        <Tooltip title={`View Images (${product.images.length})`}>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewImages(product);
                            }}
                            sx={{ color: 'var(--accent-info)' }}
                          >
                            <ImageIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {product.isManualEntry && product.qrCode && (
                        <Tooltip title="Print Barcode">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              onPrintBarcode(product);
                            }}
                            sx={{ color: 'var(--text-secondary)' }}
                          >
                            <Print fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteProduct(product);
                          }}
                          sx={{ color: 'var(--accent-error)' }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
};

export default ProductGroupList;
