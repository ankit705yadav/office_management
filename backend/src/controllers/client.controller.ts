import { Request, Response } from 'express';
import { Op } from 'sequelize';
import Client, { ClientStatus } from '../models/Client';
import { User } from '../models';
import logger from '../utils/logger';

/**
 * Get all clients
 * GET /api/clients
 */
export const getAllClients = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { contactPerson: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: clients } = await Client.findAndCountAll({
      where,
      include: [
        { model: User, as: 'creator', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
      order: [['name', 'ASC']],
      limit: Number(limit),
      offset,
    });

    res.status(200).json({
      status: 'success',
      data: {
        clients,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / Number(limit)),
        },
      },
    });
  } catch (error) {
    logger.error('Get all clients error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching clients',
    });
  }
};

/**
 * Get client by ID
 * GET /api/clients/:id
 */
export const getClientById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const client = await Client.findByPk(id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
    });

    if (!client) {
      res.status(404).json({
        status: 'error',
        message: 'Client not found',
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      data: { client },
    });
  } catch (error) {
    logger.error('Get client by ID error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching client',
    });
  }
};

/**
 * Create client
 * POST /api/clients
 */
export const createClient = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, phone, address, website, contactPerson, notes, status } = req.body;
    const userId = req.user?.id;

    if (!name) {
      res.status(400).json({
        status: 'error',
        message: 'Client name is required',
      });
      return;
    }

    const client = await Client.create({
      name,
      email,
      phone,
      address,
      website,
      contactPerson,
      notes,
      status: status || ClientStatus.ACTIVE,
      createdBy: userId,
    });

    logger.info(`Client created: ${client.name} by ${req.user?.email}`);

    res.status(201).json({
      status: 'success',
      message: 'Client created successfully',
      data: { client },
    });
  } catch (error) {
    logger.error('Create client error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while creating client',
    });
  }
};

/**
 * Update client
 * PUT /api/clients/:id
 */
export const updateClient = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, email, phone, address, website, contactPerson, notes, status } = req.body;

    const client = await Client.findByPk(id);

    if (!client) {
      res.status(404).json({
        status: 'error',
        message: 'Client not found',
      });
      return;
    }

    await client.update({
      name: name !== undefined ? name : client.name,
      email: email !== undefined ? email : client.email,
      phone: phone !== undefined ? phone : client.phone,
      address: address !== undefined ? address : client.address,
      website: website !== undefined ? website : client.website,
      contactPerson: contactPerson !== undefined ? contactPerson : client.contactPerson,
      notes: notes !== undefined ? notes : client.notes,
      status: status !== undefined ? status : client.status,
    });

    logger.info(`Client updated: ${client.name} by ${req.user?.email}`);

    res.status(200).json({
      status: 'success',
      message: 'Client updated successfully',
      data: { client },
    });
  } catch (error) {
    logger.error('Update client error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while updating client',
    });
  }
};

/**
 * Delete client
 * DELETE /api/clients/:id
 */
export const deleteClient = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const client = await Client.findByPk(id);

    if (!client) {
      res.status(404).json({
        status: 'error',
        message: 'Client not found',
      });
      return;
    }

    await client.destroy();

    logger.info(`Client deleted: ${client.name} by ${req.user?.email}`);

    res.status(200).json({
      status: 'success',
      message: 'Client deleted successfully',
    });
  } catch (error) {
    logger.error('Delete client error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while deleting client',
    });
  }
};
