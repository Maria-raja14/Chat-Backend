import { body } from 'express-validator';

const registerRules = [
  body('username').trim().isLength({ min: 3, max: 32 }).withMessage('Username must be 3-32 characters long.'),
  body('email').trim().isEmail().withMessage('Valid email is required.'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.'),
  body('displayName').optional().trim().isLength({ max: 64 }).withMessage('Display name must be at most 64 characters.'),
];

const loginRules = [
  body('email').trim().isEmail().withMessage('Valid email is required.'),
  body('password').exists().withMessage('Password is required.'),
];

export { registerRules, loginRules };
