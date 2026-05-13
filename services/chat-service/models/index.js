import { Sequelize, Op } from 'sequelize';
import databaseConfig from '../config/database.js';
import Chat from './chat.js';
import Message from './message.js';
import User from './user.js';

const environment = process.env.NODE_ENV || 'development';
const config = databaseConfig[environment];
const sequelize = new Sequelize(config);

const models = {
  User: User.initModel(sequelize),
  Chat: Chat.initModel(sequelize),
  Message: Message.initModel(sequelize),
};

models.User.hasMany(models.Chat, { foreignKey: 'userAId', as: 'chatsAsA' });
models.User.hasMany(models.Chat, { foreignKey: 'userBId', as: 'chatsAsB' });
models.User.hasMany(models.Message, { foreignKey: 'senderId', as: 'sentMessages' });

models.Chat.belongsTo(models.User, { foreignKey: 'userAId', as: 'userA' });
models.Chat.belongsTo(models.User, { foreignKey: 'userBId', as: 'userB' });
models.Chat.hasMany(models.Message, { foreignKey: 'chatId', as: 'messages' });

models.Message.belongsTo(models.Chat, { foreignKey: 'chatId', as: 'chat' });
models.Message.belongsTo(models.User, { foreignKey: 'senderId', as: 'sender' });

export default {
  sequelize,
  Op,
  ...models,
};
