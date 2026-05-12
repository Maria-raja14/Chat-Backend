import jwt from 'jsonwebtoken';
import models from '../models/index.js';
import { sendError, RESPONSE_CODES } from '../utils/response.js';

const { User } = models;
const jwtSecret = process.env.JWT_SECRET;

async function authMiddleware(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return sendError(res, RESPONSE_CODES.UNAUTHORIZED, 'Authorization header required.', {});
    }

    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, jwtSecret);
    if (!decoded || !decoded.id) {
      return sendError(res, RESPONSE_CODES.UNAUTHORIZED, 'Invalid token.', {});
    }

    const user = await User.findByPk(decoded.id);
    if (!user) {
      return sendError(res, RESPONSE_CODES.UNAUTHORIZED, 'User not found.', {});
    }

    req.user = user;
    next();
  } catch (error) {
    return sendError(res, RESPONSE_CODES.UNAUTHORIZED, 'Authentication failed.', {});
  }
}

export { authMiddleware };
