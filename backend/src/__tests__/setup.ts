import dotenv from 'dotenv';
import path from 'path';

// Load test environment variables before anything else
dotenv.config({ path: path.join(__dirname, 'config/test.env') });

import sequelize from '../config/database';

// Global setup before all tests
beforeAll(async () => {
  try {
    // Connect to test database
    await sequelize.authenticate();

    // Sync all models - force: true drops and recreates all tables
    await sequelize.sync({ force: true });

    console.log('Test database connected and synced');
  } catch (error) {
    console.error('Test database setup failed:', error);
    throw error;
  }
});

// Global teardown after all tests
afterAll(async () => {
  try {
    await sequelize.close();
    console.log('Test database connection closed');
  } catch (error) {
    console.error('Error closing test database:', error);
  }
});

// Jest timeout for async operations
jest.setTimeout(30000);
