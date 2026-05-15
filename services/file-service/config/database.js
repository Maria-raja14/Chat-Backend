import 'dotenv/config';

const dialect = process.env.DB_DIALECT || 'mysql';

const defaultConfig = {
  dialect,
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'chat_app',
  logging: false,
  define: {
    underscored: true,
    freezeTableName: false,
  },
};

export default {
  development: defaultConfig,
  test: defaultConfig,
  production: defaultConfig,
};
