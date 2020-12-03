class AppError extends Error {
  constructor(object = { message: null, statusCode: null }) {
    super(object.message || 'Unhandled server error');

    this.statusCode = object.statusCode || 500;
    this.status = `${this.statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
