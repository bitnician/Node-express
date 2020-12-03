const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const sendEmail = require('../utils/email');
const ValidationError = require('../utils/ErrorHandlers/validationError');
const NotFoundError = require('../utils/ErrorHandlers/notFoundError');
const UnAuthorizedError = require('../utils/ErrorHandlers/unAuthorizedError');
const UnAuthenticatedError = require('../utils/ErrorHandlers/unAuthenticatedError');
const BadRequestError = require('../utils/ErrorHandlers/badRequestError');
const AppError = require('../utils/ErrorHandlers/appError');

const signToken = (id) => {
  const token = jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_TOKEN_EXPIRES,
  });
  return token;
};

const createAndSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    //* now + 90days
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
    ),
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
  };

  res.cookie('jwt', token, cookieOptions);

  user.password = undefined;

  return res.status(statusCode).json({
    status: 'success',
    token,
    data: { user },
  });
};

exports.signUp = catchAsync(async (req, res, next) => {
  const newUser = await User.create(req.body);

  return createAndSendToken(newUser, 201, res);
});

exports.signIn = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password)
    throw new ValidationError('please provide email and password!');

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password)))
    throw new NotFoundError('Incorrect credentials');

  return createAndSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  const { authorization } = req.headers;
  if (authorization && authorization.startsWith('Bearer')) {
    token = authorization.split(' ')[1];
  }
  if (!token) throw new UnAuthenticatedError();

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  const currentUser = await User.findById(decoded.id);
  if (!currentUser)
    throw new UnAuthenticatedError(
      'The user of this token does no longer exists'
    );

  if (currentUser.changedPasswordAfter(decoded.iat))
    throw new UnAuthenticatedError(
      'The user has changed the password recently'
    );

  req.user = currentUser;

  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) throw new UnAuthorizedError();

    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) throw new NotFoundError('User not found!');

  const resetToken = user.createPasswordResetToken();

  await user.save({ validateBeforeSave: false });

  const resetUrl = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/reset-password/${resetToken}`;

  const message = `Forget your password? Submit your patch request with your new password and password confirm to: ${resetUrl}. \n if you didn't forget your password, please ignore this email!`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token(for 10 minutes)',
      message,
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpired = undefined;
    await user.save({ validateBeforeSave: false });

    throw new AppError({
      message: 'There was an error sending the email, Try again later',
    });
  }

  return res.status(200).json({
    status: 'success',
    message: 'Token sent to email',
  });
});
exports.resetPassword = catchAsync(async (req, res, next) => {
  const { password, passwordConfirm } = req.body;

  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpired: { $gt: Date.now() },
  });

  if (!user) throw new BadRequestError('Token is invalid or has been expired');
  user.password = password;
  user.passwordConfirm = passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpired = undefined;
  await user.save();

  return createAndSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  const { oldPassword, password, passwordConfirm } = req.body;

  const user = await User.findOne(req.user).select('+password');

  const correctPassword = await user.correctPassword(
    oldPassword,
    user.password
  );

  if (!correctPassword) throw new UnAuthorizedError('Incorrect password');

  user.password = password;
  user.passwordConfirm = passwordConfirm;
  await user.save();

  return createAndSendToken(user, 200, res);
});
