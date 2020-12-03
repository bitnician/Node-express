const appError = require('./appError');

class UnAuthenticatedError extends appError {
  constructor(message = 'UnAuthenticated User') {
    super({
      statusCode: 401,
      message,
    });
  }
}

module.exports = UnAuthenticatedError;
