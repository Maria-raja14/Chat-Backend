import 'dotenv/config';
import http from 'http';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import mysql from 'mysql2/promise';
import models from './models/index.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { authMiddleware } from './middlewares/authMiddleware.js';

const { sequelize } = models;

async function ensureDatabaseExists() {
  if ((process.env.DB_DIALECT || 'mysql').toLowerCase() !== 'mysql') {
    return;
  }

  const dbName = process.env.DB_NAME || 'chat_app';
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  });

  await connection.query(
    `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await connection.end();
}

const app = express();
const server = http.createServer(app);

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  message: { error: 'Too many requests, please try again later.' },
});
app.use(limiter);

app.use('/api/auth', authRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/user', authMiddleware, userRoutes); // To handle any existing endpoints using /user
app.use(errorHandler);

const port = process.env.PORT || 4001;

(async () => {
  try {
    await ensureDatabaseExists();
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });

    server.listen(port, () => {
      console.log(`Auth service is running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();
