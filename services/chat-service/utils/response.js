const RESPONSE_CODES = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
};

class HttpError extends Error {
  constructor(status = RESPONSE_CODES.INTERNAL_SERVER_ERROR, message = 'Internal server error.', data = {}) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.data = data;
  }
}

function sendSuccess(res, data = {}, message = 'Success', status = RESPONSE_CODES.OK) {
  return res.status(status).json({
    response_code: status,
    message,
    data,
  });
}

function sendError(res, status = RESPONSE_CODES.INTERNAL_SERVER_ERROR, message = 'Internal server error.', data = {}) {
  return res.status(status).json({
    response_code: status,
    message,
    data,
  });
}

function throwHttpError(status, message, data = {}) {
  throw new HttpError(status, message, data);
}

export { RESPONSE_CODES, HttpError, sendSuccess, sendError, throwHttpError };
