import { Sequelize, Op } from 'sequelize';
import databaseConfig from '../config/database.js';
import User from './user.js';

const environment = process.env.NODE_ENV || 'development';
const config = databaseConfig[environment];
const sequelize = new Sequelize(config);

const models = {
  User: User.initModel(sequelize),
};

export default {
  sequelize,
  Op,
  ...models,
};
