const appError = require('./appError');

class NotFoundError extends appError {
  constructor(message = 'Document not found') {
    super({
      statusCode: 404,
      message,
    });
  }
}

module.exports = NotFoundError;
