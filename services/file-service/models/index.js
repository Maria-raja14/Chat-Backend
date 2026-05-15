import { Sequelize } from 'sequelize';
import databaseConfig from '../config/database.js';
import File from './file.js';

const environment = process.env.NODE_ENV || 'development';
const config = databaseConfig[environment];
const sequelize = new Sequelize(config);

const models = {
  File: File.initModel(sequelize),
};

export default {
  sequelize,
  ...models,
};
