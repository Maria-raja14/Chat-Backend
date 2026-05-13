import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import { Op } from 'sequelize';
import models from '../models/index.js';
import { encryptId } from '../utils/secureId.js';
import { sendSuccess, sendError, RESPONSE_CODES } from '../utils/response.js';

const { User } = models;

const jwtSecret = process.env.JWT_SECRET;
const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '1d';
const saltRounds = 12;

function createToken(payload) {
  return jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiresIn });
}

async function verifySocketToken(token) {
  const decoded = jwt.verify(token, jwtSecret);
  if (!decoded || !decoded.id) {
    throw new Error('Invalid token payload');
  }
  const user = await User.scope('withPassword').findByPk(decoded.id);
  if (!user) {
    throw new Error('User not found');
  }
  return user;
}

async function register(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, RESPONSE_CODES.UNPROCESSABLE_ENTITY, 'Validation failed.', { errors: errors.array() });
    }

    const { username, email, password, displayName } = req.body;
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { username },
          { email },
        ],
      },
    });
    if (existingUser) {
      return sendError(res, RESPONSE_CODES.CONFLICT, 'Username or email already exists.', {});
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const user = await User.create({ username, email, password: hashedPassword, displayName });

    const token = createToken({ id: user.id, username: user.username, displayName: user.displayName });
    return sendSuccess(res, {
      user: {
        id: encryptId(user.id),
        username: user.username,
        email: user.email,
        displayName: user.displayName,
      },
      token,
    }, 'User registered successfully.', RESPONSE_CODES.CREATED);
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, RESPONSE_CODES.UNPROCESSABLE_ENTITY, 'Validation failed.', { errors: errors.array() });
    }

    const { email, password } = req.body;
    const user = await User.scope('withPassword').findOne({ where: { email } });
    if (!user) {
      return sendError(res, RESPONSE_CODES.UNAUTHORIZED, 'Invalid credentials.', {});
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return sendError(res, RESPONSE_CODES.UNAUTHORIZED, 'Invalid credentials.', {});
    }

    const token = createToken({ id: user.id, username: user.username, displayName: user.displayName });
    return sendSuccess(res, {
      user: {
        id: encryptId(user.id),
        username: user.username,
        email: user.email,
        displayName: user.displayName,
      },
      token,
    }, 'Login successful.', RESPONSE_CODES.OK);
  } catch (error) {
    next(error);
  }
}

export {
  register,
  login,
  verifySocketToken,
};
