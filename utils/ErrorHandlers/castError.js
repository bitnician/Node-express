const appError = require('./appError');

class CastError extends appError {
  constructor(message = 'Invalid path') {
    super({
      statusCode: 400,
      message,
    });
  }
}

module.exports = CastError;
