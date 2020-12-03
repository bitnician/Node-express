const appError = require('./appError');

class UnAuthorizedError extends appError {
  constructor(message = 'UnAuthorized User') {
    super({
      statusCode: 403,
      message,
    });
  }
}

module.exports = UnAuthorizedError;
