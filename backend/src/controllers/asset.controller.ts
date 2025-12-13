import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Asset, AssetAssignment, AssetRequest, User, Notification } from '../models';

// Helper function to generate asset tag
const generateAssetTag = async (category: string): Promise<string> => {
  const categorySlug = category.toUpperCase().replace(/[^A-Z0-9]/g, '-').replace(/-+/g, '-').substring(0, 15);

  const lastAsset = await Asset.findOne({
    where: { assetTag: { [Op.like]: `AST-${categorySlug}-%` } },
    order: [['assetTag', 'DESC']],
  });

  let nextNumber = 1;
  if (lastAsset) {
    const match = lastAsset.assetTag.match(/-(\d+)$/);
    if (match) nextNumber = parseInt(match[1], 10) + 1;
  }

  return `AST-${categorySlug}-${String(nextNumber).padStart(3, '0')}`;
};

// ============================================
// Asset CRUD Operations
// ============================================

// Create new asset
export const createAsset = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const { name, description, category, notes } = req.body;

    if (!name || !category) {
      res.status(400).json({ message: 'Name and category are required' });
      return;
    }

    // Generate unique asset tag
    const assetTag = await generateAssetTag(category);

    // Handle image uploads
    const images: string[] = [];
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files.slice(0, 5)) {
        images.push(`/uploads/assets/${file.filename}`);
      }
    }

    const asset = await Asset.create({
      assetTag,
      name,
      description,
      category,
      images,
      notes,
      status: 'available',
      createdBy: userId,
    });

    res.status(201).json({
      message: 'Asset created successfully',
      asset,
    });
  } catch (error) {
    console.error('Error creating asset:', error);
    res.status(500).json({ message: 'Failed to create asset' });
  }
};

// Get all assets with pagination and filters
export const getAllAssets = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      category,
      status,
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    const where: any = {};

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { assetTag: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (status) {
      where.status = status;
    }

    const { count, rows: assets } = await Asset.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
      order: [['created_at', 'DESC']],
      limit: Number(limit),
      offset,
    });

    res.json({
      items: assets,
      total: count,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(count / Number(limit)),
    });
  } catch (error) {
    console.error('Error fetching assets:', error);
    res.status(500).json({ message: 'Failed to fetch assets' });
  }
};

// Get asset by ID
export const getAssetById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const asset = await Asset.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
        {
          model: AssetAssignment,
          as: 'assignments',
          include: [
            {
              model: User,
              as: 'assignee',
              attributes: ['id', 'firstName', 'lastName', 'email'],
            },
            {
              model: User,
              as: 'assigner',
              attributes: ['id', 'firstName', 'lastName', 'email'],
            },
          ],
          order: [['assigned_date', 'DESC']],
        },
      ],
    });

    if (!asset) {
      res.status(404).json({ message: 'Asset not found' });
      return;
    }

    res.json(asset);
  } catch (error) {
    console.error('Error fetching asset:', error);
    res.status(500).json({ message: 'Failed to fetch asset' });
  }
};

// Update asset
export const updateAsset = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, category, notes, status, imagesToRemove } = req.body;

    const asset = await Asset.findByPk(id);

    if (!asset) {
      res.status(404).json({ message: 'Asset not found' });
      return;
    }

    // Handle images
    let images = [...(asset.images || [])];

    // Remove specified images
    if (imagesToRemove) {
      const toRemove = JSON.parse(imagesToRemove);
      images = images.filter(img => !toRemove.includes(img));
    }

    // Add new images
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        if (images.length < 5) {
          images.push(`/uploads/assets/${file.filename}`);
        }
      }
    }

    await asset.update({
      name: name || asset.name,
      description: description !== undefined ? description : asset.description,
      category: category || asset.category,
      notes: notes !== undefined ? notes : asset.notes,
      status: status || asset.status,
      images,
    });

    res.json({
      message: 'Asset updated successfully',
      asset,
    });
  } catch (error) {
    console.error('Error updating asset:', error);
    res.status(500).json({ message: 'Failed to update asset' });
  }
};

// Delete asset (soft delete - mark as retired)
export const deleteAsset = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const asset = await Asset.findByPk(id);

    if (!asset) {
      res.status(404).json({ message: 'Asset not found' });
      return;
    }

    // Check if asset is currently assigned
    const activeAssignment = await AssetAssignment.findOne({
      where: {
        assetId: id,
        status: { [Op.in]: ['assigned', 'overdue'] },
      },
    });

    if (activeAssignment) {
      res.status(400).json({ message: 'Cannot delete asset that is currently assigned' });
      return;
    }

    await asset.update({ status: 'retired' });

    res.json({ message: 'Asset retired successfully' });
  } catch (error) {
    console.error('Error deleting asset:', error);
    res.status(500).json({ message: 'Failed to delete asset' });
  }
};

// Get unique categories
export const getCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const assets = await Asset.findAll({
      attributes: ['category'],
      group: ['category'],
      order: [['category', 'ASC']],
    });

    const categories = assets.map(a => a.category);
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Failed to fetch categories' });
  }
};

// ============================================
// Assignment Operations
// ============================================

// Lend asset to user
export const lendAsset = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;
    const { assignedTo, purpose, dueDate } = req.body;

    if (!assignedTo) {
      res.status(400).json({ message: 'Employee ID is required' });
      return;
    }

    const asset = await Asset.findByPk(id);

    if (!asset) {
      res.status(404).json({ message: 'Asset not found' });
      return;
    }

    if (asset.status !== 'available') {
      res.status(400).json({ message: 'Asset is not available for lending' });
      return;
    }

    // Verify employee exists
    const employee = await User.findByPk(assignedTo);
    if (!employee) {
      res.status(404).json({ message: 'Employee not found' });
      return;
    }

    // Create assignment
    const assignment = await AssetAssignment.create({
      assetId: Number(id),
      assignedTo,
      assignedBy: userId,
      purpose,
      assignedDate: new Date(),
      dueDate: dueDate || null,
      status: 'assigned',
    });

    // Update asset status
    await asset.update({ status: 'assigned' });

    // Create notification for employee
    await Notification.create({
      userId: assignedTo,
      type: 'asset',
      title: 'Asset Assigned',
      message: `You have been assigned asset: ${asset.name} (${asset.assetTag})${dueDate ? `. Due date: ${new Date(dueDate).toLocaleDateString()}` : ''}`,
      relatedId: assignment.id,
      relatedType: 'asset_assignment',
      actionUrl: '/assets',
    });

    // Reload assignment with associations
    const fullAssignment = await AssetAssignment.findByPk(assignment.id, {
      include: [
        { model: Asset, as: 'asset' },
        { model: User, as: 'assignee', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: User, as: 'assigner', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
    });

    res.status(201).json({
      message: 'Asset assigned successfully',
      assignment: fullAssignment,
    });
  } catch (error) {
    console.error('Error lending asset:', error);
    res.status(500).json({ message: 'Failed to assign asset' });
  }
};

// Return asset
export const returnAsset = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;
    const { id } = req.params;
    const { returnCondition, conditionNotes } = req.body;

    if (!returnCondition) {
      res.status(400).json({ message: 'Return condition is required' });
      return;
    }

    const assignment = await AssetAssignment.findByPk(id, {
      include: [{ model: Asset, as: 'asset' }],
    });

    if (!assignment) {
      res.status(404).json({ message: 'Assignment not found' });
      return;
    }

    // Check if user is the assignee or admin/manager
    if (assignment.assignedTo !== userId && !['admin', 'manager'].includes(userRole)) {
      res.status(403).json({ message: 'Not authorized to return this asset' });
      return;
    }

    if (!['assigned', 'overdue'].includes(assignment.status)) {
      res.status(400).json({ message: 'Asset is not in an active assignment' });
      return;
    }

    // Determine final status based on condition
    let finalStatus: 'returned' | 'damaged' | 'lost' = 'returned';
    if (returnCondition === 'damaged') finalStatus = 'damaged';
    if (returnCondition === 'lost') finalStatus = 'lost';

    // Update assignment
    await assignment.update({
      returnedDate: new Date(),
      status: finalStatus,
      returnCondition,
      conditionNotes,
    });

    // Update asset status back to available (unless lost)
    if (assignment.asset && returnCondition !== 'lost') {
      await assignment.asset.update({ status: 'available' });
    } else if (assignment.asset && returnCondition === 'lost') {
      await assignment.asset.update({ status: 'retired' });
    }

    res.json({
      message: 'Asset returned successfully',
      assignment,
    });
  } catch (error) {
    console.error('Error returning asset:', error);
    res.status(500).json({ message: 'Failed to return asset' });
  }
};

// Get all assignments
export const getAllAssignments = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      employeeId,
      assetId,
      search,
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (employeeId) {
      where.assignedTo = employeeId;
    }

    if (assetId) {
      where.assetId = assetId;
    }

    const include: any[] = [
      {
        model: Asset,
        as: 'asset',
        ...(search ? {
          where: {
            [Op.or]: [
              { name: { [Op.iLike]: `%${search}%` } },
              { assetTag: { [Op.iLike]: `%${search}%` } },
            ],
          },
        } : {}),
      },
      {
        model: User,
        as: 'assignee',
        attributes: ['id', 'firstName', 'lastName', 'email', 'role'],
        ...(search && !assetId ? {
          where: {
            [Op.or]: [
              { firstName: { [Op.iLike]: `%${search}%` } },
              { lastName: { [Op.iLike]: `%${search}%` } },
            ],
          },
          required: false,
        } : {}),
      },
      {
        model: User,
        as: 'assigner',
        attributes: ['id', 'firstName', 'lastName', 'email'],
      },
    ];

    const { count, rows: assignments } = await AssetAssignment.findAndCountAll({
      where,
      include,
      order: [['assigned_date', 'DESC']],
      limit: Number(limit),
      offset,
    });

    res.json({
      items: assignments,
      total: count,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(count / Number(limit)),
    });
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ message: 'Failed to fetch assignments' });
  }
};

// Get current user's assigned assets
export const getMyAssets = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const { status } = req.query;

    const where: any = { assignedTo: userId };

    if (status) {
      where.status = status;
    } else {
      where.status = { [Op.in]: ['assigned', 'overdue'] };
    }

    const assignments = await AssetAssignment.findAll({
      where,
      include: [
        { model: Asset, as: 'asset' },
        { model: User, as: 'assigner', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
      order: [['due_date', 'ASC NULLS LAST'], ['assigned_date', 'DESC']],
    });

    res.json(assignments);
  } catch (error) {
    console.error('Error fetching my assets:', error);
    res.status(500).json({ message: 'Failed to fetch assigned assets' });
  }
};

// Get overdue assignments
export const getOverdueAssets = async (req: Request, res: Response): Promise<void> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const assignments = await AssetAssignment.findAll({
      where: {
        status: { [Op.in]: ['assigned', 'overdue'] },
        dueDate: { [Op.and]: [{ [Op.lt]: today }, { [Op.ne]: null as unknown as Date }] },
      },
      include: [
        { model: Asset, as: 'asset' },
        { model: User, as: 'assignee', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: User, as: 'assigner', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
      order: [['due_date', 'ASC']],
    });

    // Update status to overdue if not already
    for (const assignment of assignments) {
      if (assignment.status === 'assigned') {
        await assignment.update({ status: 'overdue' });
      }
    }

    res.json(assignments);
  } catch (error) {
    console.error('Error fetching overdue assets:', error);
    res.status(500).json({ message: 'Failed to fetch overdue assets' });
  }
};

// Mark asset as lost or damaged (admin function)
export const markAsLostOrDamaged = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, conditionNotes } = req.body;

    if (!['lost', 'damaged'].includes(status)) {
      res.status(400).json({ message: 'Status must be "lost" or "damaged"' });
      return;
    }

    const assignment = await AssetAssignment.findByPk(id, {
      include: [{ model: Asset, as: 'asset' }],
    });

    if (!assignment) {
      res.status(404).json({ message: 'Assignment not found' });
      return;
    }

    await assignment.update({
      status,
      returnCondition: status,
      conditionNotes,
      returnedDate: new Date(),
    });

    // Update asset status
    if (assignment.asset) {
      if (status === 'lost') {
        await assignment.asset.update({ status: 'retired' });
      } else {
        await assignment.asset.update({ status: 'under_maintenance' });
      }
    }

    // Notify the assignee
    await Notification.create({
      userId: assignment.assignedTo,
      type: 'asset',
      title: `Asset Marked as ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message: `Asset ${assignment.asset?.name} (${assignment.asset?.assetTag}) has been marked as ${status}.`,
      relatedId: assignment.id,
      relatedType: 'asset_assignment',
      actionUrl: '/assets',
    });

    res.json({
      message: `Asset marked as ${status}`,
      assignment,
    });
  } catch (error) {
    console.error('Error marking asset:', error);
    res.status(500).json({ message: 'Failed to update asset status' });
  }
};

// Get assignment statistics
export const getAssignmentStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const [assigned, overdue, returned, lost, damaged, totalAssets, availableAssets] = await Promise.all([
      AssetAssignment.count({ where: { status: 'assigned' } }),
      AssetAssignment.count({ where: { status: 'overdue' } }),
      AssetAssignment.count({ where: { status: 'returned' } }),
      AssetAssignment.count({ where: { status: 'lost' } }),
      AssetAssignment.count({ where: { status: 'damaged' } }),
      Asset.count({ where: { status: { [Op.ne]: 'retired' } } }),
      Asset.count({ where: { status: 'available' } }),
    ]);

    res.json({
      totalAssets,
      availableAssets,
      assignedAssets: assigned,
      overdueAssignments: overdue,
      lostAssets: lost,
      damagedAssets: damaged,
      returnedAssets: returned,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Failed to fetch statistics' });
  }
};

// Search employees for autocomplete
export const searchEmployees = async (req: Request, res: Response): Promise<void> => {
  try {
    const { q } = req.query;

    const where: any = {
      status: 'active',
    };

    if (q) {
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${q}%` } },
        { lastName: { [Op.iLike]: `%${q}%` } },
        { email: { [Op.iLike]: `%${q}%` } },
      ];
    }

    const users = await User.findAll({
      where,
      attributes: ['id', 'firstName', 'lastName', 'email', 'role'],
      limit: 10,
      order: [['firstName', 'ASC'], ['lastName', 'ASC']],
    });

    res.json(users);
  } catch (error) {
    console.error('Error searching employees:', error);
    res.status(500).json({ message: 'Failed to search employees' });
  }
};

// ============================================
// Asset Request Operations
// ============================================

// Create asset request (any employee can request)
export const createAssetRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { assetId, purpose, requestedDueDate } = req.body;
    const requestedBy = req.user?.id;

    if (!requestedBy) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    // Check if asset exists and is available
    const asset = await Asset.findByPk(assetId);
    if (!asset) {
      res.status(404).json({ message: 'Asset not found' });
      return;
    }

    if (asset.status !== 'available') {
      res.status(400).json({ message: 'Asset is not available for request' });
      return;
    }

    // Check if user already has a pending request for this asset
    const existingRequest = await AssetRequest.findOne({
      where: {
        assetId,
        requestedBy,
        status: 'pending',
      },
    });

    if (existingRequest) {
      res.status(400).json({ message: 'You already have a pending request for this asset' });
      return;
    }

    const request = await AssetRequest.create({
      assetId,
      requestedBy,
      purpose,
      requestedDueDate: requestedDueDate || null,
    });

    // Create notification for managers/admins
    const managers = await User.findAll({
      where: { role: { [Op.in]: ['admin', 'manager'] }, status: 'active' },
      attributes: ['id'],
    });

    const requester = await User.findByPk(requestedBy, {
      attributes: ['firstName', 'lastName'],
    });

    for (const manager of managers) {
      await Notification.create({
        userId: manager.id,
        type: 'asset',
        title: 'New Asset Request',
        message: `${requester?.firstName} ${requester?.lastName} has requested asset: ${asset.name} (${asset.assetTag})`,
        relatedId: request.id,
        relatedType: 'asset_request',
        actionUrl: '/assets',
      });
    }

    // Reload with associations
    const fullRequest = await AssetRequest.findByPk(request.id, {
      include: [
        { model: Asset, as: 'asset' },
        { model: User, as: 'requester', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
    });

    res.status(201).json({
      message: 'Asset request submitted successfully',
      request: fullRequest,
    });
  } catch (error) {
    console.error('Error creating asset request:', error);
    res.status(500).json({ message: 'Failed to create asset request' });
  }
};

// Get all asset requests (admin/manager)
export const getAllAssetRequests = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const { count, rows: requests } = await AssetRequest.findAndCountAll({
      where,
      include: [
        { model: Asset, as: 'asset' },
        { model: User, as: 'requester', attributes: ['id', 'firstName', 'lastName', 'email', 'role'] },
        { model: User, as: 'reviewer', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
      order: [['created_at', 'DESC']],
      limit: Number(limit),
      offset,
    });

    res.json({
      requests,
      total: count,
      page: Number(page),
      totalPages: Math.ceil(count / Number(limit)),
    });
  } catch (error) {
    console.error('Error fetching asset requests:', error);
    res.status(500).json({ message: 'Failed to fetch asset requests' });
  }
};

// Get my asset requests (current user)
export const getMyAssetRequests = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const requests = await AssetRequest.findAll({
      where: { requestedBy: userId },
      include: [
        { model: Asset, as: 'asset' },
        { model: User, as: 'reviewer', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
      order: [['created_at', 'DESC']],
    });

    res.json(requests);
  } catch (error) {
    console.error('Error fetching my asset requests:', error);
    res.status(500).json({ message: 'Failed to fetch asset requests' });
  }
};

// Approve asset request (admin/manager)
export const approveAssetRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reviewNotes, dueDate } = req.body;
    const reviewedBy = req.user?.id;

    if (!reviewedBy) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const request = await AssetRequest.findByPk(id, {
      include: [
        { model: Asset, as: 'asset' },
        { model: User, as: 'requester', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
    });

    if (!request) {
      res.status(404).json({ message: 'Request not found' });
      return;
    }

    if (request.status !== 'pending') {
      res.status(400).json({ message: 'Request is no longer pending' });
      return;
    }

    const asset = request.asset;
    if (!asset || asset.status !== 'available') {
      res.status(400).json({ message: 'Asset is no longer available' });
      return;
    }

    // Update request status
    await request.update({
      status: 'approved',
      reviewedBy,
      reviewedAt: new Date(),
      reviewNotes,
    });

    // Create assignment
    const assignment = await AssetAssignment.create({
      assetId: request.assetId,
      assignedTo: request.requestedBy,
      assignedBy: reviewedBy,
      purpose: request.purpose,
      assignedDate: new Date(),
      dueDate: dueDate || request.requestedDueDate || null,
      status: 'assigned',
    });

    // Update asset status
    await asset.update({ status: 'assigned' });

    // Notify requester
    await Notification.create({
      userId: request.requestedBy,
      type: 'asset',
      title: 'Asset Request Approved',
      message: `Your request for asset ${asset.name} (${asset.assetTag}) has been approved.`,
      relatedId: assignment.id,
      relatedType: 'asset_assignment',
      actionUrl: '/assets',
    });

    res.json({
      message: 'Asset request approved successfully',
      request,
      assignment,
    });
  } catch (error) {
    console.error('Error approving asset request:', error);
    res.status(500).json({ message: 'Failed to approve asset request' });
  }
};

// Reject asset request (admin/manager)
export const rejectAssetRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reviewNotes } = req.body;
    const reviewedBy = req.user?.id;

    if (!reviewedBy) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const request = await AssetRequest.findByPk(id, {
      include: [
        { model: Asset, as: 'asset' },
        { model: User, as: 'requester', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
    });

    if (!request) {
      res.status(404).json({ message: 'Request not found' });
      return;
    }

    if (request.status !== 'pending') {
      res.status(400).json({ message: 'Request is no longer pending' });
      return;
    }

    // Update request status
    await request.update({
      status: 'rejected',
      reviewedBy,
      reviewedAt: new Date(),
      reviewNotes,
    });

    // Notify requester
    await Notification.create({
      userId: request.requestedBy,
      type: 'asset',
      title: 'Asset Request Rejected',
      message: `Your request for asset ${request.asset?.name} (${request.asset?.assetTag}) has been rejected.${reviewNotes ? ` Reason: ${reviewNotes}` : ''}`,
      relatedId: request.id,
      relatedType: 'asset_request',
      actionUrl: '/assets',
    });

    res.json({
      message: 'Asset request rejected',
      request,
    });
  } catch (error) {
    console.error('Error rejecting asset request:', error);
    res.status(500).json({ message: 'Failed to reject asset request' });
  }
};

// Cancel asset request (by requester)
export const cancelAssetRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const request = await AssetRequest.findByPk(id);

    if (!request) {
      res.status(404).json({ message: 'Request not found' });
      return;
    }

    if (request.requestedBy !== userId) {
      res.status(403).json({ message: 'You can only cancel your own requests' });
      return;
    }

    if (request.status !== 'pending') {
      res.status(400).json({ message: 'Can only cancel pending requests' });
      return;
    }

    await request.update({ status: 'cancelled' });

    res.json({
      message: 'Asset request cancelled',
      request,
    });
  } catch (error) {
    console.error('Error cancelling asset request:', error);
    res.status(500).json({ message: 'Failed to cancel asset request' });
  }
};

// Get pending request count (for badge)
export const getPendingRequestCount = async (req: Request, res: Response): Promise<void> => {
  try {
    const count = await AssetRequest.count({ where: { status: 'pending' } });
    res.json({ count });
  } catch (error) {
    console.error('Error fetching pending count:', error);
    res.status(500).json({ message: 'Failed to fetch count' });
  }
};
