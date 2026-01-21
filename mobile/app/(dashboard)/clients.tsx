// Clients screen - Client Management

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  Modal as RNModal,
  Linking,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  useTheme,
  Chip,
  TextInput,
  ActivityIndicator,
  IconButton,
  Divider,
  Avatar,
  Searchbar,
  Menu,
  FAB,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { clientService, CreateClientRequest, UpdateClientRequest, ClientStats } from '../../services/client.service';
import { Client, Pagination, ClientStatus } from '../../types';

// Status colors
const getStatusColor = (status: string): string => {
  switch (status) {
    case 'active':
      return '#10B981';
    case 'inactive':
      return '#6B7280';
    default:
      return '#6B7280';
  }
};

// Format date safely
const safeFormatDate = (dateStr: string | undefined | null, formatStr: string): string => {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '-';
    return format(date, formatStr);
  } catch {
    return '-';
  }
};

// Stat Card Component
const StatCard = ({
  title,
  value,
  color,
  theme,
}: {
  title: string;
  value: string | number;
  color: string;
  theme: any;
}) => (
  <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
    <Text style={[styles.statTitle, { color }]}>{title}</Text>
    <Text style={[styles.statValue, { color: theme.colors.onSurface }]}>{value}</Text>
  </View>
);

// Client Card Component
const ClientCard = ({
  client,
  onView,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
  theme,
}: {
  client: Client;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  canEdit: boolean;
  canDelete: boolean;
  theme: any;
}) => {
  const statusColor = getStatusColor(client.status);

  return (
    <Card style={[styles.clientCard, { backgroundColor: theme.colors.surface }]}>
      <TouchableOpacity onPress={onView} activeOpacity={0.7}>
        <Card.Content>
          <View style={styles.clientHeader}>
            <View style={styles.clientInfo}>
              <Avatar.Text
                size={48}
                label={client.name.slice(0, 2).toUpperCase()}
                style={{ backgroundColor: theme.colors.primary }}
              />
              <View style={styles.clientDetails}>
                <Text style={[styles.clientName, { color: theme.colors.primary }]}>
                  {client.name}
                </Text>
                {client.email && (
                  <View style={styles.infoRow}>
                    <IconButton icon="email-outline" size={14} style={styles.infoIcon} />
                    <Text style={[styles.infoText, { color: theme.colors.onSurfaceVariant }]} numberOfLines={1}>
                      {client.email}
                    </Text>
                  </View>
                )}
                {client.contactPerson && (
                  <View style={styles.infoRow}>
                    <IconButton icon="account-outline" size={14} style={styles.infoIcon} />
                    <Text style={[styles.infoText, { color: theme.colors.onSurfaceVariant }]} numberOfLines={1}>
                      {client.contactPerson}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.clientActions}>
              <Chip
                mode="flat"
                textStyle={{ fontSize: 10, color: '#fff', textDecorationLine: 'none' }}
                style={[styles.statusChip, { backgroundColor: statusColor }]}
                compact
              >
                {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
              </Chip>
            </View>
          </View>

          <Divider style={{ marginVertical: 12 }} />

          <View style={styles.clientFooter}>
            {client.phone && (
              <View style={styles.footerItem}>
                <IconButton icon="phone-outline" size={14} style={styles.footerIcon} />
                <Text style={[styles.footerText, { color: theme.colors.onSurfaceVariant }]}>
                  {client.phone}
                </Text>
              </View>
            )}
            <View style={styles.actionButtonsRow}>
              <IconButton
                icon="eye-outline"
                size={20}
                iconColor={theme.colors.primary}
                onPress={onView}
              />
              {canEdit && (
                <IconButton
                  icon="pencil-outline"
                  size={20}
                  iconColor="#F59E0B"
                  onPress={onEdit}
                />
              )}
              {canDelete && (
                <IconButton
                  icon="delete-outline"
                  size={20}
                  iconColor="#EF4444"
                  onPress={onDelete}
                />
              )}
            </View>
          </View>
        </Card.Content>
      </TouchableOpacity>
    </Card>
  );
};

// View Client Modal
const ViewClientModal = ({
  visible,
  client,
  onDismiss,
  onEdit,
  canEdit,
  theme,
}: {
  visible: boolean;
  client: Client | null;
  onDismiss: () => void;
  onEdit: () => void;
  canEdit: boolean;
  theme: any;
}) => {
  if (!client) return null;

  const statusColor = getStatusColor(client.status);

  const handleOpenWebsite = () => {
    if (client.website) {
      let url = client.website;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      Linking.openURL(url);
    }
  };

  return (
    <RNModal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onDismiss}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.viewModalContainer, { backgroundColor: theme.colors.surface }]}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.modalHeader}>
              <Text variant="titleLarge" style={{ fontWeight: '600', color: theme.colors.onSurface }}>
                Client Details
              </Text>
              <IconButton icon="close" onPress={onDismiss} />
            </View>

            <Divider style={{ marginBottom: 16 }} />

            {/* Profile Header */}
            <View style={styles.profileHeader}>
              <Avatar.Text
                size={80}
                label={client.name.slice(0, 2).toUpperCase()}
                style={{ backgroundColor: theme.colors.primary }}
              />
              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, { color: theme.colors.onSurface }]}>
                  {client.name}
                </Text>
                <Chip
                  mode="flat"
                  textStyle={{ fontSize: 11, color: '#fff', textDecorationLine: 'none' }}
                  style={[styles.profileStatusChip, { backgroundColor: statusColor }]}
                >
                  {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                </Chip>
              </View>
            </View>

            {/* Contact Information */}
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}>
              Contact Information
            </Text>
            <Divider style={{ marginBottom: 12 }} />

            {client.email && (
              <View style={styles.detailRow}>
                <IconButton icon="email" size={18} style={styles.detailIcon} />
                <Text style={[styles.detailText, { color: theme.colors.onSurface }]}>
                  {client.email}
                </Text>
              </View>
            )}
            {client.phone && (
              <View style={styles.detailRow}>
                <IconButton icon="phone" size={18} style={styles.detailIcon} />
                <Text style={[styles.detailText, { color: theme.colors.onSurface }]}>
                  {client.phone}
                </Text>
              </View>
            )}
            {client.contactPerson && (
              <View style={styles.detailRow}>
                <IconButton icon="account" size={18} style={styles.detailIcon} />
                <Text style={[styles.detailText, { color: theme.colors.onSurface }]}>
                  {client.contactPerson}
                </Text>
              </View>
            )}
            {client.website && (
              <TouchableOpacity style={styles.detailRow} onPress={handleOpenWebsite}>
                <IconButton icon="web" size={18} style={styles.detailIcon} />
                <Text style={[styles.detailText, { color: theme.colors.primary, textDecorationLine: 'underline' }]}>
                  {client.website}
                </Text>
              </TouchableOpacity>
            )}
            {client.address && (
              <View style={styles.detailRow}>
                <IconButton icon="map-marker" size={18} style={styles.detailIcon} />
                <Text style={[styles.detailText, { color: theme.colors.onSurface }]}>
                  {client.address}
                </Text>
              </View>
            )}

            {/* Notes */}
            {client.notes && (
              <>
                <Text style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant, marginTop: 16 }]}>
                  Notes
                </Text>
                <Divider style={{ marginBottom: 12 }} />
                <View style={[styles.notesContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
                  <Text style={[styles.notesText, { color: theme.colors.onSurface }]}>
                    {client.notes}
                  </Text>
                </View>
              </>
            )}

            {/* Metadata */}
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant, marginTop: 16 }]}>
              Additional Info
            </Text>
            <Divider style={{ marginBottom: 12 }} />

            <View style={styles.detailGrid}>
              <View style={styles.detailGridItem}>
                <Text style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Created
                </Text>
                <Text style={[styles.detailValue, { color: theme.colors.onSurface }]}>
                  {safeFormatDate(client.createdAt, 'MMM dd, yyyy')}
                </Text>
              </View>
              {client.creator && (
                <View style={styles.detailGridItem}>
                  <Text style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>
                    Created By
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.colors.onSurface }]}>
                    {client.creator.firstName} {client.creator.lastName}
                  </Text>
                </View>
              )}
            </View>

            {/* Actions */}
            <View style={styles.viewModalActions}>
              <Button
                mode="outlined"
                onPress={onDismiss}
                style={{ flex: 1, marginRight: 8 }}
              >
                Close
              </Button>
              {canEdit && (
                <Button
                  mode="contained"
                  onPress={onEdit}
                  icon="pencil"
                  style={{ flex: 1 }}
                >
                  Edit
                </Button>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </RNModal>
  );
};

// Add/Edit Client Modal
const ClientFormModal = ({
  visible,
  client,
  onDismiss,
  onSubmit,
  submitting,
  theme,
  isEditMode,
}: {
  visible: boolean;
  client: Client | null;
  onDismiss: () => void;
  onSubmit: (data: CreateClientRequest | UpdateClientRequest) => void;
  submitting: boolean;
  theme: any;
  isEditMode: boolean;
}) => {
  const [formData, setFormData] = useState<CreateClientRequest>({
    name: '',
    email: '',
    phone: '',
    contactPerson: '',
    website: '',
    address: '',
    notes: '',
    status: 'active' as ClientStatus,
  });

  const [showStatusPicker, setShowStatusPicker] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (visible) {
      if (isEditMode && client) {
        setFormData({
          name: client.name,
          email: client.email || '',
          phone: client.phone || '',
          contactPerson: client.contactPerson || '',
          website: client.website || '',
          address: client.address || '',
          notes: client.notes || '',
          status: client.status,
        });
      } else {
        setFormData({
          name: '',
          email: '',
          phone: '',
          contactPerson: '',
          website: '',
          address: '',
          notes: '',
          status: 'active' as ClientStatus,
        });
      }
    }
  }, [visible, isEditMode, client]);

  const handleSubmit = () => {
    // Validation
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Client name is required');
      return;
    }

    // Clean up empty fields
    const submitData: any = { ...formData };
    Object.keys(submitData).forEach(key => {
      if (submitData[key] === '') {
        delete submitData[key];
      }
    });

    // Always include name
    submitData.name = formData.name.trim();

    onSubmit(submitData);
  };

  const statuses = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ];

  return (
    <RNModal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onDismiss}
    >
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalKeyboardView}
        >
          <View style={[styles.formModalContainer, { backgroundColor: theme.colors.surface }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text variant="titleLarge" style={{ fontWeight: '600', color: theme.colors.onSurface }}>
                  {isEditMode ? 'Edit Client' : 'Add New Client'}
                </Text>
                <IconButton icon="close" onPress={onDismiss} disabled={submitting} />
              </View>

              <Divider style={{ marginBottom: 16 }} />

              {/* Client Information */}
              <Text style={[styles.formSectionTitle, { color: theme.colors.onSurfaceVariant }]}>
                Basic Information
              </Text>

              <TextInput
                mode="outlined"
                label="Client Name *"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                disabled={submitting}
                style={styles.formInput}
              />

              <TextInput
                mode="outlined"
                label="Email"
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
                disabled={submitting}
                style={styles.formInput}
              />

              <TextInput
                mode="outlined"
                label="Phone"
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                keyboardType="phone-pad"
                disabled={submitting}
                style={styles.formInput}
              />

              <TextInput
                mode="outlined"
                label="Contact Person"
                value={formData.contactPerson}
                onChangeText={(text) => setFormData({ ...formData, contactPerson: text })}
                disabled={submitting}
                style={styles.formInput}
              />

              <TextInput
                mode="outlined"
                label="Website"
                value={formData.website}
                onChangeText={(text) => setFormData({ ...formData, website: text })}
                autoCapitalize="none"
                disabled={submitting}
                style={styles.formInput}
                left={<TextInput.Icon icon="web" />}
              />

              <TextInput
                mode="outlined"
                label="Address"
                value={formData.address}
                onChangeText={(text) => setFormData({ ...formData, address: text })}
                multiline
                numberOfLines={2}
                disabled={submitting}
                style={styles.formInput}
              />

              <TextInput
                mode="outlined"
                label="Notes"
                value={formData.notes}
                onChangeText={(text) => setFormData({ ...formData, notes: text })}
                multiline
                numberOfLines={3}
                disabled={submitting}
                style={styles.formInput}
              />

              {/* Status Picker (only for edit mode) */}
              {isEditMode && (
                <>
                  <Text style={[styles.formSectionTitle, { color: theme.colors.onSurfaceVariant, marginTop: 16 }]}>
                    Status
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowStatusPicker(true)}
                    disabled={submitting}
                  >
                    <TextInput
                      mode="outlined"
                      label="Status"
                      value={statuses.find(s => s.value === formData.status)?.label || ''}
                      editable={false}
                      right={<TextInput.Icon icon="chevron-down" />}
                      style={styles.formInput}
                    />
                  </TouchableOpacity>
                </>
              )}

              {/* Actions */}
              <View style={styles.formActions}>
                <Button
                  mode="outlined"
                  onPress={onDismiss}
                  disabled={submitting}
                  style={{ flex: 1, marginRight: 8 }}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleSubmit}
                  loading={submitting}
                  disabled={submitting}
                  style={{ flex: 1 }}
                >
                  {isEditMode ? 'Update' : 'Create'}
                </Button>
              </View>
            </ScrollView>

            {/* Status Picker Modal */}
            <RNModal
              visible={showStatusPicker}
              animationType="fade"
              transparent={true}
              onRequestClose={() => setShowStatusPicker(false)}
            >
              <TouchableOpacity
                style={styles.pickerOverlay}
                activeOpacity={1}
                onPress={() => setShowStatusPicker(false)}
              >
                <View style={[styles.pickerModal, { backgroundColor: theme.colors.surface }]}>
                  <Text variant="titleMedium" style={{ marginBottom: 16, fontWeight: '600', color: theme.colors.onSurface }}>
                    Select Status
                  </Text>
                  {statuses.map((status) => (
                    <TouchableOpacity
                      key={status.value}
                      style={[
                        styles.pickerItem,
                        formData.status === status.value && { backgroundColor: theme.colors.primaryContainer },
                      ]}
                      onPress={() => {
                        setFormData({ ...formData, status: status.value as ClientStatus });
                        setShowStatusPicker(false);
                      }}
                    >
                      <Text style={{ color: theme.colors.onSurface }}>{status.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </TouchableOpacity>
            </RNModal>
          </View>
        </KeyboardAvoidingView>
      </View>
    </RNModal>
  );
};

// Main Clients Screen
export default function ClientsScreen() {
  const theme = useTheme();
  const { user } = useAuth();

  // State
  const [clients, setClients] = useState<Client[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });
  const [stats, setStats] = useState<ClientStats>({
    total: 0,
    active: 0,
  });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showStatusFilter, setShowStatusFilter] = useState(false);

  // Modals
  const [showViewModal, setShowViewModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Check permissions
  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';
  const canCreate = isAdmin || isManager;
  const canEdit = isAdmin || isManager;
  const canDelete = isAdmin;

  // Load clients
  const loadClients = useCallback(async (page: number = 1, append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const response = await clientService.getClients({
        page,
        limit: 20,
        search: searchQuery || undefined,
        status: filterStatus || undefined,
      });

      if (append) {
        setClients(prev => [...prev, ...response.clients]);
      } else {
        setClients(response.clients);
      }
      setPagination(response.pagination);
      setStats(response.stats);
    } catch (error) {
      console.error('Failed to load clients:', error);
      Alert.alert('Error', 'Failed to load clients');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [searchQuery, filterStatus]);

  // Initial load
  useEffect(() => {
    loadClients(1);
  }, []);

  // Reload when filters change
  useEffect(() => {
    loadClients(1);
  }, [searchQuery, filterStatus]);

  // Refresh handler
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadClients(1);
    setRefreshing(false);
  };

  // Load more handler
  const handleLoadMore = () => {
    if (!loadingMore && pagination.page < pagination.totalPages) {
      loadClients(pagination.page + 1, true);
    }
  };

  // View client
  const handleViewClient = async (client: Client) => {
    try {
      const fullClient = await clientService.getClientById(client.id);
      setSelectedClient(fullClient);
      setShowViewModal(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to load client details');
    }
  };

  // Edit client
  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setIsEditMode(true);
    setShowViewModal(false);
    setShowFormModal(true);
  };

  // Add client
  const handleAddClient = () => {
    setSelectedClient(null);
    setIsEditMode(false);
    setShowFormModal(true);
  };

  // Delete client
  const handleDeleteClient = (client: Client) => {
    Alert.alert(
      'Delete Client',
      `Are you sure you want to delete "${client.name}"?\n\nThis action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await clientService.deleteClient(client.id);
              Alert.alert('Success', 'Client deleted successfully');
              loadClients(1);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete client');
            }
          },
        },
      ]
    );
  };

  // Submit form
  const handleFormSubmit = async (data: CreateClientRequest | UpdateClientRequest) => {
    try {
      setSubmitting(true);

      if (isEditMode && selectedClient) {
        await clientService.updateClient(selectedClient.id, data as UpdateClientRequest);
        Alert.alert('Success', 'Client updated successfully');
      } else {
        await clientService.createClient(data as CreateClientRequest);
        Alert.alert('Success', 'Client created successfully');
      }

      setShowFormModal(false);
      setSelectedClient(null);
      loadClients(1);
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to save client';
      Alert.alert('Error', message);
    } finally {
      setSubmitting(false);
    }
  };

  // Status filter options
  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ];

  // Render client item
  const renderClient = ({ item }: { item: Client }) => (
    <ClientCard
      client={item}
      onView={() => handleViewClient(item)}
      onEdit={() => handleEditClient(item)}
      onDelete={() => handleDeleteClient(item)}
      canEdit={canEdit}
      canDelete={canDelete}
      theme={theme}
    />
  );

  // Footer component
  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoading}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <Text variant="headlineSmall" style={{ fontWeight: '600' }}>
          Client Management
        </Text>
      </View>

      {/* Search and Filters */}
      <View style={[styles.filterSection, { backgroundColor: theme.colors.surface }]}>
        <Searchbar
          placeholder="Search by name, email, or contact..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchBar}
          inputStyle={{ fontSize: 14 }}
        />
        <View style={styles.filterRow}>
          {/* Status Filter */}
          <Menu
            visible={showStatusFilter}
            onDismiss={() => setShowStatusFilter(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setShowStatusFilter(true)}
                icon="filter-variant"
                compact
                style={styles.filterButton}
              >
                {filterStatus ? statusOptions.find(s => s.value === filterStatus)?.label : 'Status'}
              </Button>
            }
          >
            {statusOptions.map(option => (
              <Menu.Item
                key={option.value}
                onPress={() => {
                  setFilterStatus(option.value);
                  setShowStatusFilter(false);
                }}
                title={option.label}
              />
            ))}
          </Menu>

          {/* Clear Filters */}
          {filterStatus && (
            <IconButton
              icon="close-circle"
              size={20}
              onPress={() => {
                setFilterStatus('');
              }}
            />
          )}
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <StatCard title="Total Clients" value={stats.total} color={theme.colors.primary} theme={theme} />
        <StatCard title="Active" value={stats.active} color="#10B981" theme={theme} />
      </View>

      {/* Client List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={clients}
          renderItem={renderClient}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <IconButton icon="domain" size={48} iconColor={theme.colors.onSurfaceVariant} />
              <Text style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
                No clients found
              </Text>
              {canCreate && (
                <Button
                  mode="contained"
                  onPress={handleAddClient}
                  icon="plus"
                  style={{ marginTop: 16 }}
                >
                  Add Client
                </Button>
              )}
            </View>
          }
        />
      )}

      {/* FAB for Add Client (Manager/Admin only) */}
      {canCreate && clients.length > 0 && (
        <FAB
          icon="plus"
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          onPress={handleAddClient}
          color="#fff"
        />
      )}

      {/* View Client Modal */}
      <ViewClientModal
        visible={showViewModal}
        client={selectedClient}
        onDismiss={() => {
          setShowViewModal(false);
          setSelectedClient(null);
        }}
        onEdit={() => {
          if (selectedClient) {
            handleEditClient(selectedClient);
          }
        }}
        canEdit={canEdit}
        theme={theme}
      />

      {/* Add/Edit Client Modal */}
      <ClientFormModal
        visible={showFormModal}
        client={selectedClient}
        onDismiss={() => {
          setShowFormModal(false);
          setSelectedClient(null);
        }}
        onSubmit={handleFormSubmit}
        submitting={submitting}
        theme={theme}
        isEditMode={isEditMode}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  filterSection: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  searchBar: {
    marginBottom: 8,
    elevation: 0,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterButton: {
    borderRadius: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statTitle: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  listContent: {
    padding: 12,
    paddingBottom: 80,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  footerLoading: {
    padding: 16,
    alignItems: 'center',
  },
  clientCard: {
    marginBottom: 12,
    borderRadius: 12,
  },
  clientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  clientInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  clientDetails: {
    marginLeft: 12,
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  infoIcon: {
    margin: 0,
    marginLeft: -8,
    marginRight: -4,
  },
  infoText: {
    fontSize: 13,
    flex: 1,
  },
  clientActions: {
    alignItems: 'flex-end',
  },
  statusChip: {
    height: 24,
  },
  clientFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerIcon: {
    margin: 0,
    marginLeft: -8,
    marginRight: -4,
  },
  footerText: {
    fontSize: 13,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalKeyboardView: {
    maxHeight: '90%',
  },
  viewModalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    paddingBottom: 32,
    maxHeight: '90%',
  },
  formModalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    paddingBottom: 32,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  profileInfo: {
    marginLeft: 16,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  profileStatusChip: {
    height: 28,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailIcon: {
    margin: 0,
    marginRight: 4,
  },
  detailText: {
    fontSize: 14,
    flex: 1,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  detailGridItem: {
    width: '50%',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  notesContainer: {
    padding: 12,
    borderRadius: 8,
  },
  notesText: {
    fontSize: 14,
    lineHeight: 20,
  },
  viewModalActions: {
    flexDirection: 'row',
    marginTop: 24,
  },
  formSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  formInput: {
    marginBottom: 12,
  },
  formActions: {
    flexDirection: 'row',
    marginTop: 24,
    marginBottom: 16,
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerModal: {
    width: '85%',
    borderRadius: 16,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  pickerItem: {
    padding: 14,
    borderRadius: 8,
    marginBottom: 4,
  },
});
