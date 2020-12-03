const appError = require('./appError');

class DuplicateError extends appError {
  constructor(message = 'Duplicat document!') {
    super({
      statusCode: 409,
      message,
    });
  }
}

module.exports = DuplicateError;
