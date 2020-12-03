const DuplicateError = require('../utils/ErrorHandlers/duplicateError');
const CastError = require('../utils/ErrorHandlers/castError');
const ValidationError = require('../utils/ErrorHandlers/validationError');
const UnAuthenticatedError = require('../utils/ErrorHandlers/unAuthenticatedError');

const sendErrorDev = (err, res) => {
  return res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    stack: err.stack,
    error: err,
  });
};

const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }

  console.error('ERROR 💥', err);

  return res.status(500).json({
    status: 'error',
    message: 'Something went wrong!',
  });
};

const handleDbError = (err) => {
  let error = { ...err };

  if (err.name === 'CastError') {
    error = new CastError(`invalid ${err.path}: ${err.value}`);
  }

  if (err.code === 11000) {
    const duplicateFieldValue = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
    error = new DuplicateError(
      `Duplicate field value: ${duplicateFieldValue}. please use another value`
    );
  }

  if (err.name === 'ValidationError') {
    const allValidationMessages = Object.values(err.errors).map(
      (el) => el.message
    );

    const message = `Invalid input data. ${allValidationMessages.join('. ')}`;
    error = new ValidationError(message);
  }
  return error;
};

const handleJwtError = (err) => {
  let error = { ...err };
  if (error.name === 'JsonWebTokenError') {
    error = new UnAuthenticatedError('Invalid Token! Please login again');
  }
  if (error.name === 'TokenExpiredError') {
    error = new UnAuthenticatedError('Expired Token! Please login again');
  }
  return error;
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    return sendErrorDev(err, res);
  }
  if (process.env.NODE_ENV === 'production') {
    err = handleDbError(err);
    err = handleJwtError(err);

    return sendErrorProd(err, res);
  }
};
