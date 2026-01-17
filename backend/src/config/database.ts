import { Sequelize } from 'sequelize';
import config from './environment';
import logger from '../utils/logger';

const sequelize = new Sequelize(config.database.url, {
  dialect: 'postgres',
  logging: config.nodeEnv === 'development' ? (msg) => logger.debug(msg) : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  // SSL configuration for Railway PostgreSQL (required for external connections)
  dialectOptions: config.database.url.includes('railway') ? {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  } : {},
});

export const connectDatabase = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    logger.info('✓ Database connection established successfully');

    // Note: Database schema is managed via schema.sql
    // Sync is disabled to prevent enum type conflicts
    // if (config.nodeEnv === 'development') {
    //   await sequelize.sync({ alter: false });
    //   logger.info('✓ Database models synchronized');
    // }
  } catch (error) {
    logger.error('✗ Unable to connect to the database:', error);
    process.exit(1);
  }
};

export default sequelize;
