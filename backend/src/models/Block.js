import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Block = sequelize.define('Block', {
  block_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  blocker_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  blocked_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  blocked_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false
  }
}, {
  tableName: 'BLOCK',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['blocker_id', 'blocked_id'],
      name: 'unique_block'
    },
    {
      fields: ['blocker_id'],
      name: 'idx_blocker'
    },
    {
      fields: ['blocked_id'],
      name: 'idx_blocked'
    }
  ]
});
