import { validationResult } from 'express-validator';
import { sendError, RESPONSE_CODES } from '../utils/response.js';

function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, RESPONSE_CODES.UNPROCESSABLE_ENTITY, 'Validation failed.', { errors: errors.array() });
  }
  next();
}

export { validateRequest };
