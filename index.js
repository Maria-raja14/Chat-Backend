import 'dotenv/config';
import http from 'http';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { Server } from 'socket.io';
import mysql from 'mysql2/promise';
import models from './models/index.js';
import routes from './routes/index.js';
import { authMiddleware } from './middlewares/authMiddleware.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { verifySocketToken } from './controllers/authController.js';
import { encryptId, decryptId } from './utils/secureId.js';

const { sequelize, Message, Chat } = models;

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
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

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

app.use('/api', routes);
app.use(errorHandler);

io.use(async (socket, next) => {
  try {
    const authHeader = socket.handshake.headers?.authorization;
    const token = socket.handshake.auth?.token || (authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null);
    if (!token) {
      return next(new Error('Authentication token missing from Socket.IO handshake.'));
    }
    const user = await verifySocketToken(token);
    socket.data.user = user;
    return next();
  } catch (error) {
    return next(new Error('Socket authentication failed.'));
  }
});

io.on('connection', (socket) => {
  const user = socket.data.user;
  socket.join(`user:${user.id}`);

  socket.on('join_chat', async ({ chatId }) => {
    try {
      const rawChatId = decryptId(chatId);
      socket.join(`chat:${rawChatId}`);
    } catch (error) {
      socket.emit('error', { message: 'Unable to join chat.' });
    }
  });

  socket.on('private_message', async ({ chatId, text }) => {
    try {
      if (!chatId || !text) {
        return socket.emit('error', { message: 'chatId and text are required.' });
      }

      const rawChatId = decryptId(chatId);
      const chat = await Chat.findByPk(rawChatId);
      if (!chat || ![chat.userAId, chat.userBId].includes(user.id)) {
        return socket.emit('error', { message: 'Chat not found or access denied.' });
      }

      const message = await Message.create({
        chatId: rawChatId,
        senderId: user.id,
        content: text,
      });

      const payload = {
        id: encryptId(message.id),
        chatId: encryptId(message.chatId),
        sender: {
          id: encryptId(user.id),
          username: user.username,
          displayName: user.displayName,
        },
        content: message.content,
        createdAt: message.createdAt,
      };

      io.to(`chat:${rawChatId}`).emit('message', payload);
      io.to(`user:${user.id}`).emit('message_ack', payload);
    } catch (err) {
      socket.emit('error', { message: 'Unable to send message.' });
    }
  });

  socket.on('disconnect', () => {
    socket.leave(`user:${user.id}`);
  });
});

const port = process.env.PORT || 4000;

(async () => {
  try {
    await ensureDatabaseExists();
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });

    server.listen(port, () => {
      console.log(`Secure chat backend is running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();
