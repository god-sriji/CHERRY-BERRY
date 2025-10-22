import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

export const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: process.env.DB_DIALECT,
    logging: false
  }
);

export const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log(' Database connected');
  } catch (error) {
    console.error(' Database connection failed:', error);
    throw error;
  }
};

export const syncDatabase = async () => {
  try {
    await sequelize.sync({ alter: false });
    console.log(' Database synced');
  } catch (error) {
    console.error(' Database sync failed:', error);
    throw error;
  }
};
