import { sequelize } from '../config/database.js';
import { User } from './User.js';
import { Chat } from './Chat.js';
import { Post } from './Post.js';
import { Message } from './Message.js';
import { Block } from './Block.js';

// Define associations
Post.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(Post, { foreignKey: 'user_id', as: 'posts' });

Message.belongsTo(User, { foreignKey: 'sender_id', as: 'sender' });
Message.belongsTo(Chat, { foreignKey: 'chat_id', as: 'chat' });
Chat.hasMany(Message, { foreignKey: 'chat_id', as: 'messages' });

Block.belongsTo(User, { foreignKey: 'blocker_id', as: 'blocker' });
Block.belongsTo(User, { foreignKey: 'blocked_id', as: 'blocked' });

export { User, Chat, Post, Message, Block, sequelize };
