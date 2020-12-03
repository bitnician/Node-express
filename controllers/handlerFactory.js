const catchAsync = require('../utils/catchAsync');
const NotFoundError = require('../utils/ErrorHandlers/notFoundError');

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const document = await Model.findByIdAndRemove(req.params.id);

    if (!document) throw new NotFoundError(`no document found!`);

    res.status(204).json({
      status: 'success',
      data: document,
    });
  });
