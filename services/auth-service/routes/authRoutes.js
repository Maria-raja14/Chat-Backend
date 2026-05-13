import express from 'express';
import { register, login } from '../controllers/authController.js';
import { registerRules, loginRules } from '../validators/authValidator.js';
import { validateRequest } from '../validators/requestValidator.js';

const router = express.Router();

router.post('/register', registerRules, validateRequest, register);
router.post('/login', loginRules, validateRequest, login);

export default router;
