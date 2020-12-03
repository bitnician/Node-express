const Review = require('../models/reviewModel');
const catchAsync = require('../utils/catchAsync');
const NotFoundError = require('../utils/ErrorHandlers/notFoundError');
const factory = require('./handlerFactory');

exports.getAllReviews = catchAsync(async (req, res, next) => {
  let filter = {};
  if (req.params.tourId) filter = { tour: req.params.tourId };

  const reviews = await Review.find(filter);

  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: { reviews },
  });
});
exports.getReview = catchAsync(async (req, res, next) => {
  const review = await Review.findById(req.params.id);

  if (!review) throw new NotFoundError('The tour does not exist!');

  res.status(200).json({
    status: 'success',
    data: { review },
  });
});

exports.createReview = catchAsync(async (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user._id;

  const newReview = await Review.create(req.body);
  res.status(201).json({
    status: 'success',
    data: { review: newReview },
  });
});

exports.updateReview = catchAsync(async (req, res, next) => {});
exports.deleteReview = factory.deleteOne(Review);
