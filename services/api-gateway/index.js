import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors({
  origin: '*', // For development, allow all
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  message: { error: 'Too many requests, please try again later.' },
});
app.use(limiter);

// Target URLs for microservices
const AUTH_SERVICE = process.env.AUTH_SERVICE_URL || 'http://localhost:4001';
const CHAT_SERVICE = process.env.CHAT_SERVICE_URL || 'http://localhost:4002';
const NOTIFICATION_SERVICE = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4003';

// Proxy rules
app.use('/api/auth', createProxyMiddleware({ target: AUTH_SERVICE, changeOrigin: true }));
app.use('/api/users', createProxyMiddleware({ target: AUTH_SERVICE, changeOrigin: true }));

app.use('/api/chat', createProxyMiddleware({ target: CHAT_SERVICE, changeOrigin: true }));
// Proxy for WebSocket connections to the Chat Service
app.use('/socket.io', createProxyMiddleware({ target: CHAT_SERVICE, ws: true, changeOrigin: true }));

app.use('/api/otp', createProxyMiddleware({ target: NOTIFICATION_SERVICE, changeOrigin: true }));

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'API Gateway is running' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API Gateway is running on http://localhost:${PORT}`);
});
