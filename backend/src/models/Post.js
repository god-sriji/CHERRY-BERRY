import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Post = sequelize.define('Post', {
  post_id: { 
    type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true 
  },
  user_id: { 
    type: DataTypes.INTEGER, 
    allowNull: false 
  },
  media_url: { 
    type: DataTypes.STRING(255) 
  },
  media_type: {
    type: DataTypes.ENUM('image', 'video'),
    allowNull: true
  },
  caption: { 
    type: DataTypes.TEXT 
  },
  created_at: { 
    type: DataTypes.DATE, 
    defaultValue: DataTypes.NOW 
  }
}, { 
  tableName: 'POST', 
  timestamps: false
});
