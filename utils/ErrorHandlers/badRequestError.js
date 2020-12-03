const appError = require('./appError');

class BadRequestError extends appError {
  constructor(message = 'Bad Request') {
    super({
      statusCode: 400,
      message,
    });
  }
}

module.exports = BadRequestError;
