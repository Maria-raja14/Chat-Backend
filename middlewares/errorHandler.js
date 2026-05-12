import { sendError } from '../utils/response.js';

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  console.error(err);
  const status = err.status || 500;
  return sendError(res, status, err.message || 'Internal server error.', err.data || {});
}

export { errorHandler };
