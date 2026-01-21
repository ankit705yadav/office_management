// Employees screen - Employee Management

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
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { employeeService, CreateEmployeeData, UpdateEmployeeData, EmployeeWithDetails, EmployeeStats } from '../../services/employee.service';
import { User, Department, Pagination, UserRole, UserStatus } from '../../types';

// Role colors
const getRoleColor = (role: string): string => {
  switch (role) {
    case 'admin':
      return '#8B5CF6';
    case 'manager':
      return '#3B82F6';
    case 'employee':
      return '#10B981';
    default:
      return '#6B7280';
  }
};

// Status colors
const getStatusColor = (status: string): string => {
  switch (status) {
    case 'active':
      return '#10B981';
    case 'on_leave':
      return '#F59E0B';
    case 'terminated':
      return '#EF4444';
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

// Employee Card Component
const EmployeeCard = ({
  employee,
  onView,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
  theme,
}: {
  employee: User;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  canEdit: boolean;
  canDelete: boolean;
  theme: any;
}) => {
  const roleColor = getRoleColor(employee.role);
  const statusColor = getStatusColor(employee.status);

  return (
    <Card style={[styles.employeeCard, { backgroundColor: theme.colors.surface }]}>
      <TouchableOpacity onPress={onView} activeOpacity={0.7}>
        <Card.Content>
          <View style={styles.employeeHeader}>
            <View style={styles.employeeInfo}>
              <Avatar.Text
                size={48}
                label={`${employee.firstName[0]}${employee.lastName?.[0] || ''}`}
                style={{ backgroundColor: roleColor }}
              />
              <View style={styles.employeeDetails}>
                <Text style={[styles.employeeName, { color: theme.colors.onSurface }]}>
                  {employee.firstName} {employee.lastName}
                </Text>
                <Text style={[styles.employeeEmail, { color: theme.colors.onSurfaceVariant }]}>
                  {employee.email}
                </Text>
                <View style={styles.chipRow}>
                  <Chip
                    mode="flat"
                    textStyle={{ fontSize: 12, color: '#fff', textDecorationLine: 'none', lineHeight: 16 }}
                    style={[styles.roleChip, { backgroundColor: roleColor }]}
                  >
                    {employee.role.charAt(0).toUpperCase() + employee.role.slice(1)}
                  </Chip>
                  <Chip
                    mode="flat"
                    textStyle={{ fontSize: 12, color: '#fff', textDecorationLine: 'none', lineHeight: 16 }}
                    style={[styles.statusChip, { backgroundColor: statusColor }]}
                  >
                    {employee.status.replace('_', ' ')}
                  </Chip>
                </View>
              </View>
            </View>
            <View style={styles.employeeActions}>
              {canEdit && (
                <IconButton
                  icon="pencil"
                  size={20}
                  iconColor="#F59E0B"
                  onPress={onEdit}
                />
              )}
              {canDelete && employee.status === 'active' && (
                <IconButton
                  icon="delete"
                  size={20}
                  iconColor="#EF4444"
                  onPress={onDelete}
                />
              )}
            </View>
          </View>

          <Divider style={{ marginVertical: 12 }} />

          <View style={styles.employeeFooter}>
            <View style={styles.footerItem}>
              <Text style={[styles.footerLabel, { color: theme.colors.onSurfaceVariant }]}>
                Department
              </Text>
              <Text style={[styles.footerValue, { color: theme.colors.onSurface }]}>
                {employee.department?.name || 'N/A'}
              </Text>
            </View>
            <View style={styles.footerItem}>
              <Text style={[styles.footerLabel, { color: theme.colors.onSurfaceVariant }]}>
                Joined
              </Text>
              <Text style={[styles.footerValue, { color: theme.colors.onSurface }]}>
                {safeFormatDate(employee.dateOfJoining, 'MMM dd, yyyy')}
              </Text>
            </View>
          </View>
        </Card.Content>
      </TouchableOpacity>
    </Card>
  );
};

// View Employee Modal
const ViewEmployeeModal = ({
  visible,
  employee,
  onDismiss,
  onEdit,
  canEdit,
  theme,
}: {
  visible: boolean;
  employee: EmployeeWithDetails | null;
  onDismiss: () => void;
  onEdit: () => void;
  canEdit: boolean;
  theme: any;
}) => {
  if (!employee) return null;

  const roleColor = getRoleColor(employee.role);

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
                Employee Details
              </Text>
              <IconButton icon="close" onPress={onDismiss} />
            </View>

            <Divider style={{ marginBottom: 16 }} />

            {/* Profile Header */}
            <View style={styles.profileHeader}>
              <Avatar.Text
                size={80}
                label={`${employee.firstName[0]}${employee.lastName?.[0] || ''}`}
                style={{ backgroundColor: roleColor }}
              />
              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, { color: theme.colors.onSurface }]}>
                  {employee.firstName} {employee.lastName}
                </Text>
                <Chip
                  mode="flat"
                  textStyle={{ fontSize: 11, color: '#fff', textDecorationLine: 'none' }}
                  style={[styles.profileRoleChip, { backgroundColor: roleColor }]}
                >
                  {employee.role.charAt(0).toUpperCase() + employee.role.slice(1)}
                </Chip>
              </View>
            </View>

            {/* Contact Information */}
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}>
              Contact Information
            </Text>
            <Divider style={{ marginBottom: 12 }} />

            <View style={styles.detailRow}>
              <IconButton icon="email" size={18} style={styles.detailIcon} />
              <Text style={[styles.detailText, { color: theme.colors.onSurface }]}>
                {employee.email}
              </Text>
            </View>
            {employee.phone && (
              <View style={styles.detailRow}>
                <IconButton icon="phone" size={18} style={styles.detailIcon} />
                <Text style={[styles.detailText, { color: theme.colors.onSurface }]}>
                  {employee.phone}
                </Text>
              </View>
            )}
            {employee.address && (
              <View style={styles.detailRow}>
                <IconButton icon="map-marker" size={18} style={styles.detailIcon} />
                <Text style={[styles.detailText, { color: theme.colors.onSurface }]}>
                  {employee.address}
                </Text>
              </View>
            )}

            {/* Employment Details */}
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant, marginTop: 16 }]}>
              Employment Details
            </Text>
            <Divider style={{ marginBottom: 12 }} />

            <View style={styles.detailGrid}>
              <View style={styles.detailGridItem}>
                <Text style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Department
                </Text>
                <Text style={[styles.detailValue, { color: theme.colors.onSurface }]}>
                  {employee.department?.name || 'N/A'}
                </Text>
              </View>
              <View style={styles.detailGridItem}>
                <Text style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Status
                </Text>
                <Chip
                  mode="flat"
                  textStyle={{ fontSize: 10, color: '#fff', textDecorationLine: 'none' }}
                  style={{ backgroundColor: getStatusColor(employee.status) }}
                  compact
                >
                  {employee.status.replace('_', ' ')}
                </Chip>
              </View>
              <View style={styles.detailGridItem}>
                <Text style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Date of Joining
                </Text>
                <Text style={[styles.detailValue, { color: theme.colors.onSurface }]}>
                  {safeFormatDate(employee.dateOfJoining, 'MMMM dd, yyyy')}
                </Text>
              </View>
              <View style={styles.detailGridItem}>
                <Text style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Date of Birth
                </Text>
                <Text style={[styles.detailValue, { color: theme.colors.onSurface }]}>
                  {safeFormatDate(employee.dateOfBirth, 'MMMM dd, yyyy')}
                </Text>
              </View>
            </View>

            {employee.manager && (
              <View style={styles.managerSection}>
                <Text style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Reports To
                </Text>
                <Text style={[styles.detailValue, { color: theme.colors.onSurface }]}>
                  {employee.manager.firstName} {employee.manager.lastName}
                </Text>
              </View>
            )}

            {/* Identity Documents */}
            {(employee.panNumber || employee.aadharNumber) && (
              <>
                <Text style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant, marginTop: 16 }]}>
                  Identity Documents
                </Text>
                <Divider style={{ marginBottom: 12 }} />
                {employee.panNumber && (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant, width: 80 }]}>
                      PAN:
                    </Text>
                    <Text style={[styles.detailText, { color: theme.colors.onSurface }]}>
                      {employee.panNumber}
                    </Text>
                  </View>
                )}
                {employee.aadharNumber && (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant, width: 80 }]}>
                      Aadhar:
                    </Text>
                    <Text style={[styles.detailText, { color: theme.colors.onSurface }]}>
                      {employee.aadharNumber}
                    </Text>
                  </View>
                )}
              </>
            )}

            {/* Emergency Contact */}
            {(employee.emergencyContactName || employee.emergencyContactPhone) && (
              <>
                <Text style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant, marginTop: 16 }]}>
                  Emergency Contact
                </Text>
                <Divider style={{ marginBottom: 12 }} />
                {employee.emergencyContactName && (
                  <View style={styles.detailRow}>
                    <IconButton icon="account-alert" size={18} style={styles.detailIcon} />
                    <Text style={[styles.detailText, { color: theme.colors.onSurface }]}>
                      {employee.emergencyContactName}
                    </Text>
                  </View>
                )}
                {employee.emergencyContactPhone && (
                  <View style={styles.detailRow}>
                    <IconButton icon="phone-alert" size={18} style={styles.detailIcon} />
                    <Text style={[styles.detailText, { color: theme.colors.onSurface }]}>
                      {employee.emergencyContactPhone}
                    </Text>
                  </View>
                )}
              </>
            )}

            {/* Leave Balance */}
            {employee.leaveBalances && employee.leaveBalances.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant, marginTop: 16 }]}>
                  Leave Balance ({new Date().getFullYear()})
                </Text>
                <Divider style={{ marginBottom: 12 }} />
                <View style={styles.leaveBalanceGrid}>
                  {employee.leaveBalances[0].sickLeave !== undefined && (
                    <View style={[styles.leaveBalanceItem, { backgroundColor: theme.colors.surfaceVariant }]}>
                      <Text style={[styles.leaveBalanceLabel, { color: theme.colors.onSurfaceVariant }]}>Sick</Text>
                      <Text style={[styles.leaveBalanceValue, { color: '#EF4444' }]}>
                        {employee.leaveBalances[0].sickLeave}
                      </Text>
                    </View>
                  )}
                  {employee.leaveBalances[0].casualLeave !== undefined && (
                    <View style={[styles.leaveBalanceItem, { backgroundColor: theme.colors.surfaceVariant }]}>
                      <Text style={[styles.leaveBalanceLabel, { color: theme.colors.onSurfaceVariant }]}>Casual</Text>
                      <Text style={[styles.leaveBalanceValue, { color: '#3B82F6' }]}>
                        {employee.leaveBalances[0].casualLeave}
                      </Text>
                    </View>
                  )}
                  {employee.leaveBalances[0].earnedLeave !== undefined && (
                    <View style={[styles.leaveBalanceItem, { backgroundColor: theme.colors.surfaceVariant }]}>
                      <Text style={[styles.leaveBalanceLabel, { color: theme.colors.onSurfaceVariant }]}>Earned</Text>
                      <Text style={[styles.leaveBalanceValue, { color: '#10B981' }]}>
                        {employee.leaveBalances[0].earnedLeave}
                      </Text>
                    </View>
                  )}
                  {employee.leaveBalances[0].compOff !== undefined && (
                    <View style={[styles.leaveBalanceItem, { backgroundColor: theme.colors.surfaceVariant }]}>
                      <Text style={[styles.leaveBalanceLabel, { color: theme.colors.onSurfaceVariant }]}>Comp Off</Text>
                      <Text style={[styles.leaveBalanceValue, { color: '#8B5CF6' }]}>
                        {employee.leaveBalances[0].compOff}
                      </Text>
                    </View>
                  )}
                  {employee.leaveBalances[0].paternityMaternity !== undefined && (
                    <View style={[styles.leaveBalanceItem, { backgroundColor: theme.colors.surfaceVariant }]}>
                      <Text style={[styles.leaveBalanceLabel, { color: theme.colors.onSurfaceVariant }]}>Paternity</Text>
                      <Text style={[styles.leaveBalanceValue, { color: '#F59E0B' }]}>
                        {employee.leaveBalances[0].paternityMaternity}
                      </Text>
                    </View>
                  )}
                  {employee.leaveBalances[0].birthdayLeave !== undefined && (
                    <View style={[styles.leaveBalanceItem, { backgroundColor: theme.colors.surfaceVariant }]}>
                      <Text style={[styles.leaveBalanceLabel, { color: theme.colors.onSurfaceVariant }]}>Birthday</Text>
                      <Text style={[styles.leaveBalanceValue, { color: '#EC4899' }]}>
                        {employee.leaveBalances[0].birthdayLeave}
                      </Text>
                    </View>
                  )}
                </View>
              </>
            )}

            {/* Custom Fields */}
            {employee.customFields && employee.customFields.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant, marginTop: 16 }]}>
                  Custom Fields
                </Text>
                <Divider style={{ marginBottom: 12 }} />
                {employee.customFields.map((field, index) => (
                  <View key={index} style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant, width: 100 }]}>
                      {field.fieldName}:
                    </Text>
                    <Text style={[styles.detailText, { color: theme.colors.onSurface }]}>
                      {field.fieldValue}
                    </Text>
                  </View>
                ))}
              </>
            )}

            {/* Document Links */}
            {employee.documents && employee.documents.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant, marginTop: 16 }]}>
                  Document Links
                </Text>
                <Divider style={{ marginBottom: 12 }} />
                {employee.documents.map((doc, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.documentLink}
                    onPress={() => Linking.openURL(doc.linkUrl)}
                  >
                    <IconButton icon="link" size={18} iconColor={theme.colors.primary} />
                    <Text style={{ color: theme.colors.primary }}>{doc.linkTitle}</Text>
                  </TouchableOpacity>
                ))}
              </>
            )}

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

// Add/Edit Employee Modal
const EmployeeFormModal = ({
  visible,
  employee,
  departments,
  managers,
  onDismiss,
  onSubmit,
  submitting,
  theme,
  isEditMode,
}: {
  visible: boolean;
  employee: User | null;
  departments: Department[];
  managers: User[];
  onDismiss: () => void;
  onSubmit: (data: CreateEmployeeData | UpdateEmployeeData) => void;
  submitting: boolean;
  theme: any;
  isEditMode: boolean;
}) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
    dateOfJoining: format(new Date(), 'yyyy-MM-dd'),
    role: 'employee',
    status: 'active',
    departmentId: undefined as number | undefined,
    managerId: undefined as number | undefined,
    address: '',
    panNumber: '',
    aadharNumber: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
  });

  const [showDatePicker, setShowDatePicker] = useState<'dob' | 'doj' | null>(null);
  const [showRolePicker, setShowRolePicker] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [showDepartmentPicker, setShowDepartmentPicker] = useState(false);
  const [showManagerPicker, setShowManagerPicker] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (visible) {
      if (isEditMode && employee) {
        setFormData({
          email: employee.email,
          password: '',
          firstName: employee.firstName,
          lastName: employee.lastName || '',
          phone: employee.phone || '',
          dateOfBirth: employee.dateOfBirth || '',
          dateOfJoining: employee.dateOfJoining || '',
          role: employee.role,
          status: employee.status,
          departmentId: employee.departmentId,
          managerId: employee.managerId,
          address: employee.address || '',
          panNumber: employee.panNumber || '',
          aadharNumber: employee.aadharNumber || '',
          emergencyContactName: employee.emergencyContactName || '',
          emergencyContactPhone: employee.emergencyContactPhone || '',
        });
      } else {
        setFormData({
          email: '',
          password: '',
          firstName: '',
          lastName: '',
          phone: '',
          dateOfBirth: '',
          dateOfJoining: format(new Date(), 'yyyy-MM-dd'),
          role: 'employee',
          status: 'active',
          departmentId: undefined,
          managerId: undefined,
          address: '',
          panNumber: '',
          aadharNumber: '',
          emergencyContactName: '',
          emergencyContactPhone: '',
        });
      }
    }
  }, [visible, isEditMode, employee]);

  const handleSubmit = () => {
    // Validation
    if (!formData.email || !formData.firstName) {
      Alert.alert('Error', 'Email and First Name are required');
      return;
    }

    if (!isEditMode && !formData.password) {
      Alert.alert('Error', 'Password is required for new employees');
      return;
    }

    if (!isEditMode && formData.password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }

    const submitData: any = { ...formData };

    // Remove password if empty (for edit mode)
    if (!submitData.password) {
      delete submitData.password;
    }

    // Remove empty date fields
    if (!submitData.dateOfBirth) {
      delete submitData.dateOfBirth;
    }

    onSubmit(submitData);
  };

  const roles = [
    { value: 'employee', label: 'Employee' },
    { value: 'manager', label: 'Manager' },
    { value: 'admin', label: 'Admin' },
  ];

  const statuses = [
    { value: 'active', label: 'Active' },
    { value: 'on_leave', label: 'On Leave' },
    { value: 'terminated', label: 'Terminated' },
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
                  {isEditMode ? 'Edit Employee' : 'Add New Employee'}
                </Text>
                <IconButton icon="close" onPress={onDismiss} disabled={submitting} />
              </View>

              <Divider style={{ marginBottom: 16 }} />

              {/* Personal Information */}
              <Text style={[styles.formSectionTitle, { color: theme.colors.onSurfaceVariant }]}>
                Personal Information
              </Text>

              <TextInput
                mode="outlined"
                label="First Name *"
                value={formData.firstName}
                onChangeText={(text) => setFormData({ ...formData, firstName: text })}
                disabled={submitting}
                style={styles.formInput}
              />

              <TextInput
                mode="outlined"
                label="Last Name"
                value={formData.lastName}
                onChangeText={(text) => setFormData({ ...formData, lastName: text })}
                disabled={submitting}
                style={styles.formInput}
              />

              <TextInput
                mode="outlined"
                label="Email *"
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
                disabled={submitting}
                style={styles.formInput}
              />

              <TextInput
                mode="outlined"
                label={isEditMode ? "New Password (leave blank to keep current)" : "Password *"}
                value={formData.password}
                onChangeText={(text) => setFormData({ ...formData, password: text })}
                secureTextEntry
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

              {/* Date of Birth */}
              <TouchableOpacity
                onPress={() => setShowDatePicker('dob')}
                disabled={submitting}
              >
                <TextInput
                  mode="outlined"
                  label="Date of Birth"
                  value={formData.dateOfBirth ? safeFormatDate(formData.dateOfBirth, 'MMMM dd, yyyy') : ''}
                  editable={false}
                  right={<TextInput.Icon icon="calendar" />}
                  style={styles.formInput}
                />
              </TouchableOpacity>

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

              {/* Emergency Contact */}
              <Text style={[styles.formSectionTitle, { color: theme.colors.onSurfaceVariant, marginTop: 16 }]}>
                Emergency Contact
              </Text>

              <TextInput
                mode="outlined"
                label="Emergency Contact Name"
                value={formData.emergencyContactName}
                onChangeText={(text) => setFormData({ ...formData, emergencyContactName: text })}
                disabled={submitting}
                style={styles.formInput}
              />

              <TextInput
                mode="outlined"
                label="Emergency Contact Phone"
                value={formData.emergencyContactPhone}
                onChangeText={(text) => setFormData({ ...formData, emergencyContactPhone: text })}
                keyboardType="phone-pad"
                disabled={submitting}
                style={styles.formInput}
              />

              {/* Employment Details */}
              <Text style={[styles.formSectionTitle, { color: theme.colors.onSurfaceVariant, marginTop: 16 }]}>
                Employment Details
              </Text>

              {/* Date of Joining */}
              <TouchableOpacity
                onPress={() => setShowDatePicker('doj')}
                disabled={submitting}
              >
                <TextInput
                  mode="outlined"
                  label="Date of Joining *"
                  value={formData.dateOfJoining ? safeFormatDate(formData.dateOfJoining, 'MMMM dd, yyyy') : ''}
                  editable={false}
                  right={<TextInput.Icon icon="calendar" />}
                  style={styles.formInput}
                />
              </TouchableOpacity>

              {/* Role Picker */}
              <TouchableOpacity
                onPress={() => setShowRolePicker(true)}
                disabled={submitting}
              >
                <TextInput
                  mode="outlined"
                  label="Role *"
                  value={roles.find(r => r.value === formData.role)?.label || ''}
                  editable={false}
                  right={<TextInput.Icon icon="chevron-down" />}
                  style={styles.formInput}
                />
              </TouchableOpacity>

              {/* Status Picker (only for edit mode) */}
              {isEditMode && (
                <TouchableOpacity
                  onPress={() => setShowStatusPicker(true)}
                  disabled={submitting}
                >
                  <TextInput
                    mode="outlined"
                    label="Status *"
                    value={statuses.find(s => s.value === formData.status)?.label || ''}
                    editable={false}
                    right={<TextInput.Icon icon="chevron-down" />}
                    style={styles.formInput}
                  />
                </TouchableOpacity>
              )}

              {/* Department Picker */}
              <TouchableOpacity
                onPress={() => setShowDepartmentPicker(true)}
                disabled={submitting}
              >
                <TextInput
                  mode="outlined"
                  label="Department"
                  value={departments.find(d => d.id === formData.departmentId)?.name || 'None'}
                  editable={false}
                  right={<TextInput.Icon icon="chevron-down" />}
                  style={styles.formInput}
                />
              </TouchableOpacity>

              {/* Manager Picker */}
              <TouchableOpacity
                onPress={() => setShowManagerPicker(true)}
                disabled={submitting}
              >
                <TextInput
                  mode="outlined"
                  label="Manager"
                  value={
                    managers.find(m => m.id === formData.managerId)
                      ? `${managers.find(m => m.id === formData.managerId)?.firstName} ${managers.find(m => m.id === formData.managerId)?.lastName}`
                      : 'None'
                  }
                  editable={false}
                  right={<TextInput.Icon icon="chevron-down" />}
                  style={styles.formInput}
                />
              </TouchableOpacity>

              {/* Identity Documents */}
              <Text style={[styles.formSectionTitle, { color: theme.colors.onSurfaceVariant, marginTop: 16 }]}>
                Identity Documents
              </Text>

              <TextInput
                mode="outlined"
                label="PAN Number"
                value={formData.panNumber}
                onChangeText={(text) => setFormData({ ...formData, panNumber: text.toUpperCase() })}
                maxLength={10}
                autoCapitalize="characters"
                disabled={submitting}
                style={styles.formInput}
              />

              <TextInput
                mode="outlined"
                label="Aadhar Number"
                value={formData.aadharNumber}
                onChangeText={(text) => setFormData({ ...formData, aadharNumber: text.replace(/\D/g, '') })}
                keyboardType="numeric"
                maxLength={12}
                disabled={submitting}
                style={styles.formInput}
              />

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

            {/* Date Pickers */}
            {showDatePicker && (
              <DateTimePicker
                value={
                  showDatePicker === 'dob' && formData.dateOfBirth
                    ? new Date(formData.dateOfBirth)
                    : showDatePicker === 'doj' && formData.dateOfJoining
                    ? new Date(formData.dateOfJoining)
                    : new Date()
                }
                mode="date"
                maximumDate={showDatePicker === 'dob' ? new Date() : undefined}
                onChange={(event, date) => {
                  setShowDatePicker(null);
                  if (date) {
                    const formatted = format(date, 'yyyy-MM-dd');
                    if (showDatePicker === 'dob') {
                      setFormData({ ...formData, dateOfBirth: formatted });
                    } else {
                      setFormData({ ...formData, dateOfJoining: formatted });
                    }
                  }
                }}
              />
            )}

            {/* Role Picker Modal */}
            <RNModal
              visible={showRolePicker}
              animationType="fade"
              transparent={true}
              onRequestClose={() => setShowRolePicker(false)}
            >
              <TouchableOpacity
                style={styles.pickerOverlay}
                activeOpacity={1}
                onPress={() => setShowRolePicker(false)}
              >
                <View style={[styles.pickerModal, { backgroundColor: theme.colors.surface }]}>
                  <Text variant="titleMedium" style={{ marginBottom: 16, fontWeight: '600', color: theme.colors.onSurface }}>
                    Select Role
                  </Text>
                  {roles.map((role) => (
                    <TouchableOpacity
                      key={role.value}
                      style={[
                        styles.pickerItem,
                        formData.role === role.value && { backgroundColor: theme.colors.primaryContainer },
                      ]}
                      onPress={() => {
                        setFormData({ ...formData, role: role.value });
                        setShowRolePicker(false);
                      }}
                    >
                      <Text style={{ color: theme.colors.onSurface }}>{role.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </TouchableOpacity>
            </RNModal>

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
                        setFormData({ ...formData, status: status.value });
                        setShowStatusPicker(false);
                      }}
                    >
                      <Text style={{ color: theme.colors.onSurface }}>{status.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </TouchableOpacity>
            </RNModal>

            {/* Department Picker Modal */}
            <RNModal
              visible={showDepartmentPicker}
              animationType="fade"
              transparent={true}
              onRequestClose={() => setShowDepartmentPicker(false)}
            >
              <TouchableOpacity
                style={styles.pickerOverlay}
                activeOpacity={1}
                onPress={() => setShowDepartmentPicker(false)}
              >
                <View style={[styles.pickerModal, { backgroundColor: theme.colors.surface }]}>
                  <Text variant="titleMedium" style={{ marginBottom: 16, fontWeight: '600', color: theme.colors.onSurface }}>
                    Select Department
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.pickerItem,
                      !formData.departmentId && { backgroundColor: theme.colors.primaryContainer },
                    ]}
                    onPress={() => {
                      setFormData({ ...formData, departmentId: undefined });
                      setShowDepartmentPicker(false);
                    }}
                  >
                    <Text style={{ color: theme.colors.onSurface }}>None</Text>
                  </TouchableOpacity>
                  {departments.map((dept) => (
                    <TouchableOpacity
                      key={dept.id}
                      style={[
                        styles.pickerItem,
                        formData.departmentId === dept.id && { backgroundColor: theme.colors.primaryContainer },
                      ]}
                      onPress={() => {
                        setFormData({ ...formData, departmentId: dept.id });
                        setShowDepartmentPicker(false);
                      }}
                    >
                      <Text style={{ color: theme.colors.onSurface }}>{dept.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </TouchableOpacity>
            </RNModal>

            {/* Manager Picker Modal */}
            <RNModal
              visible={showManagerPicker}
              animationType="fade"
              transparent={true}
              onRequestClose={() => setShowManagerPicker(false)}
            >
              <TouchableOpacity
                style={styles.pickerOverlay}
                activeOpacity={1}
                onPress={() => setShowManagerPicker(false)}
              >
                <View style={[styles.pickerModal, { backgroundColor: theme.colors.surface }]}>
                  <Text variant="titleMedium" style={{ marginBottom: 16, fontWeight: '600', color: theme.colors.onSurface }}>
                    Select Manager
                  </Text>
                  <ScrollView style={{ maxHeight: 300 }}>
                    <TouchableOpacity
                      style={[
                        styles.pickerItem,
                        !formData.managerId && { backgroundColor: theme.colors.primaryContainer },
                      ]}
                      onPress={() => {
                        setFormData({ ...formData, managerId: undefined });
                        setShowManagerPicker(false);
                      }}
                    >
                      <Text style={{ color: theme.colors.onSurface }}>None</Text>
                    </TouchableOpacity>
                    {managers
                      .filter(m => !employee || m.id !== employee.id)
                      .map((manager) => (
                        <TouchableOpacity
                          key={manager.id}
                          style={[
                            styles.pickerItem,
                            formData.managerId === manager.id && { backgroundColor: theme.colors.primaryContainer },
                          ]}
                          onPress={() => {
                            setFormData({ ...formData, managerId: manager.id });
                            setShowManagerPicker(false);
                          }}
                        >
                          <View style={styles.managerPickerItem}>
                            <Avatar.Text
                              size={32}
                              label={`${manager.firstName[0]}${manager.lastName?.[0] || ''}`}
                              style={{ backgroundColor: getRoleColor(manager.role) }}
                            />
                            <View style={{ marginLeft: 12 }}>
                              <Text style={{ color: theme.colors.onSurface, fontWeight: '500' }}>
                                {manager.firstName} {manager.lastName}
                              </Text>
                              <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 12 }}>
                                {manager.email}
                              </Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                      ))}
                  </ScrollView>
                </View>
              </TouchableOpacity>
            </RNModal>
          </View>
        </KeyboardAvoidingView>
      </View>
    </RNModal>
  );
};

// Main Employees Screen
export default function EmployeesScreen() {
  const theme = useTheme();
  const { user } = useAuth();

  // State
  const [employees, setEmployees] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [managers, setManagers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });
  const [stats, setStats] = useState<EmployeeStats>({
    total: 0,
    active: 0,
    managers: 0,
    admins: 0,
  });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDepartment, setFilterDepartment] = useState<number | undefined>(undefined);
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [showDepartmentFilter, setShowDepartmentFilter] = useState(false);

  // Modals
  const [showViewModal, setShowViewModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeWithDetails | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Check permissions
  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager' || user?.role === 'admin';
  const canCreate = isAdmin;
  const canEdit = isManager;
  const canDelete = isAdmin;

  // Load employees
  const loadEmployees = useCallback(async (page: number = 1, append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const response = await employeeService.getEmployees({
        page,
        limit: 20,
        search: searchQuery || undefined,
        status: filterStatus || undefined,
        departmentId: filterDepartment,
      });

      if (append) {
        setEmployees(prev => [...prev, ...response.items]);
      } else {
        setEmployees(response.items);
      }
      setPagination(response.pagination);
      setStats(response.stats);
    } catch (error) {
      console.error('Failed to load employees:', error);
      Alert.alert('Error', 'Failed to load employees');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [searchQuery, filterStatus, filterDepartment]);

  // Load departments
  const loadDepartments = async () => {
    try {
      const depts = await employeeService.getDepartments();
      setDepartments(depts);
    } catch (error) {
      console.error('Failed to load departments:', error);
    }
  };

  // Load managers
  const loadManagers = async () => {
    try {
      const mgrs = await employeeService.getManagers();
      setManagers(mgrs);
    } catch (error) {
      console.error('Failed to load managers:', error);
    }
  };

  // Initial load
  useEffect(() => {
    loadEmployees(1);
    loadDepartments();
    loadManagers();
  }, []);

  // Reload when filters change
  useEffect(() => {
    loadEmployees(1);
  }, [searchQuery, filterStatus, filterDepartment]);

  // Refresh handler
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadEmployees(1);
    setRefreshing(false);
  };

  // Load more handler
  const handleLoadMore = () => {
    if (!loadingMore && pagination.page < pagination.totalPages) {
      loadEmployees(pagination.page + 1, true);
    }
  };

  // View employee
  const handleViewEmployee = async (employee: User) => {
    try {
      const fullEmployee = await employeeService.getEmployeeById(employee.id);
      setSelectedEmployee(fullEmployee);
      setShowViewModal(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to load employee details');
    }
  };

  // Edit employee
  const handleEditEmployee = (employee: User) => {
    setSelectedEmployee(employee as EmployeeWithDetails);
    setIsEditMode(true);
    setShowViewModal(false);
    setShowFormModal(true);
  };

  // Add employee
  const handleAddEmployee = () => {
    setSelectedEmployee(null);
    setIsEditMode(false);
    setShowFormModal(true);
  };

  // Delete employee
  const handleDeleteEmployee = (employee: User) => {
    Alert.alert(
      'Deactivate Employee',
      `Are you sure you want to deactivate ${employee.firstName} ${employee.lastName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            try {
              await employeeService.deleteEmployee(employee.id);
              Alert.alert('Success', 'Employee deactivated successfully');
              loadEmployees(1);
            } catch (error) {
              Alert.alert('Error', 'Failed to deactivate employee');
            }
          },
        },
      ]
    );
  };

  // Submit form
  const handleFormSubmit = async (data: CreateEmployeeData | UpdateEmployeeData) => {
    try {
      setSubmitting(true);

      if (isEditMode && selectedEmployee) {
        await employeeService.updateEmployee(selectedEmployee.id, data as UpdateEmployeeData);
        Alert.alert('Success', 'Employee updated successfully');
      } else {
        await employeeService.createEmployee(data as CreateEmployeeData);
        Alert.alert('Success', 'Employee created successfully');
      }

      setShowFormModal(false);
      setSelectedEmployee(null);
      loadEmployees(1);
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to save employee';
      Alert.alert('Error', message);
    } finally {
      setSubmitting(false);
    }
  };

  // Status filter options
  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'on_leave', label: 'On Leave' },
    { value: 'terminated', label: 'Terminated' },
  ];

  // Render employee item
  const renderEmployee = ({ item }: { item: User }) => (
    <EmployeeCard
      employee={item}
      onView={() => handleViewEmployee(item)}
      onEdit={() => handleEditEmployee(item)}
      onDelete={() => handleDeleteEmployee(item)}
      canEdit={canEdit}
      canDelete={canDelete && item.id !== user?.id}
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
          Employee Management
        </Text>
      </View>

      {/* Search and Filters */}
      <View style={[styles.filterSection, { backgroundColor: theme.colors.surface }]}>
        <Searchbar
          placeholder="Search by name or email..."
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

          {/* Department Filter */}
          <Menu
            visible={showDepartmentFilter}
            onDismiss={() => setShowDepartmentFilter(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setShowDepartmentFilter(true)}
                icon="domain"
                compact
                style={styles.filterButton}
              >
                {filterDepartment ? departments.find(d => d.id === filterDepartment)?.name : 'Department'}
              </Button>
            }
          >
            <Menu.Item
              onPress={() => {
                setFilterDepartment(undefined);
                setShowDepartmentFilter(false);
              }}
              title="All Departments"
            />
            {departments.map(dept => (
              <Menu.Item
                key={dept.id}
                onPress={() => {
                  setFilterDepartment(dept.id);
                  setShowDepartmentFilter(false);
                }}
                title={dept.name}
              />
            ))}
          </Menu>

          {/* Clear Filters */}
          {(filterStatus || filterDepartment) && (
            <IconButton
              icon="close-circle"
              size={20}
              onPress={() => {
                setFilterStatus('');
                setFilterDepartment(undefined);
              }}
            />
          )}
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <StatCard title="Total" value={stats.total} color={theme.colors.primary} theme={theme} />
        <StatCard title="Active" value={stats.active} color="#10B981" theme={theme} />
        <StatCard title="Managers" value={stats.managers} color="#3B82F6" theme={theme} />
        <StatCard title="Admins" value={stats.admins} color="#8B5CF6" theme={theme} />
      </View>

      {/* Employee List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={employees}
          renderItem={renderEmployee}
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
              <Text style={{ color: theme.colors.onSurfaceVariant }}>
                No employees found
              </Text>
            </View>
          }
        />
      )}

      {/* FAB for Add Employee (Admin only) */}
      {canCreate && (
        <FAB
          icon="plus"
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          onPress={handleAddEmployee}
          color="#fff"
        />
      )}

      {/* View Employee Modal */}
      <ViewEmployeeModal
        visible={showViewModal}
        employee={selectedEmployee}
        onDismiss={() => {
          setShowViewModal(false);
          setSelectedEmployee(null);
        }}
        onEdit={() => {
          if (selectedEmployee) {
            handleEditEmployee(selectedEmployee);
          }
        }}
        canEdit={canEdit}
        theme={theme}
      />

      {/* Add/Edit Employee Modal */}
      <EmployeeFormModal
        visible={showFormModal}
        employee={selectedEmployee}
        departments={departments}
        managers={managers}
        onDismiss={() => {
          setShowFormModal(false);
          setSelectedEmployee(null);
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
    fontSize: 18,
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
  employeeCard: {
    marginBottom: 12,
    borderRadius: 12,
    paddingVertical: 8,
  },
  employeeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  employeeInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  employeeDetails: {
    marginLeft: 14,
    flex: 1,
    justifyContent: 'center',
  },
  employeeName: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  employeeEmail: {
    fontSize: 14,
    marginBottom: 10,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  roleChip: {
    height: 32,
    justifyContent: 'center',
  },
  statusChip: {
    height: 32,
    justifyContent: 'center',
  },
  employeeActions: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  employeeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  footerItem: {
    flex: 1,
  },
  footerLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  footerValue: {
    fontSize: 14,
    fontWeight: '500',
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
  profileRoleChip: {
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
  managerSection: {
    marginTop: 8,
  },
  documentLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
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
  managerPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leaveBalanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  leaveBalanceItem: {
    width: '31%',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  leaveBalanceLabel: {
    fontSize: 11,
    marginBottom: 4,
  },
  leaveBalanceValue: {
    fontSize: 16,
    fontWeight: '600',
  },
});
