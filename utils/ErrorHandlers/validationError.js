const appError = require('./appError');

class ValidationError extends appError {
  constructor(message = 'Validation Error') {
    super({
      statusCode: 422,
      message,
    });
  }
}

module.exports = ValidationError;
