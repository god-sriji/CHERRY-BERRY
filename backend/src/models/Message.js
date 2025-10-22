import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Message = sequelize.define('Message', {
  message_id: { 
    type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true 
  },
  chat_id: { 
    type: DataTypes.INTEGER, 
    allowNull: false 
  },
  sender_id: { 
    type: DataTypes.INTEGER, 
    allowNull: false 
  },
  message_text: { 
    type: DataTypes.TEXT,
    allowNull: true  // Changed to allow null for non-text messages
  },
  message_type: {
    type: DataTypes.ENUM('text', 'image', 'video', 'audio'),
    defaultValue: 'text',
    allowNull: false
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  sent_at: { 
    type: DataTypes.DATE, 
    defaultValue: DataTypes.NOW,
    allowNull: false
  }
}, { 
  tableName: 'MESSAGE', 
  timestamps: false
});
