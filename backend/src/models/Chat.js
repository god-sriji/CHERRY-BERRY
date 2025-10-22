import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Chat = sequelize.define('Chat', {
  chat_id: { 
    type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true 
  },
  user1_id: { 
    type: DataTypes.INTEGER, 
    allowNull: false 
  },
  user2_id: { 
    type: DataTypes.INTEGER, 
    allowNull: false 
  },
  last_message_at: { 
    type: DataTypes.DATE, 
    defaultValue: DataTypes.NOW 
  }
}, { 
  tableName: 'CHAT', 
  timestamps: false
});
