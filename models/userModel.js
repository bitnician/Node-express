const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'the name is required'],
    minlength: 3,
    maxlength: 100,
    trim: true,
    validate: {
      validator: (val) => {
        validator.isAlpha(val, 'en-US', {
          ignore: ' -',
        });
      },
      message: 'name must be string',
    },
  },
  email: {
    type: String,
    required: [true, 'the email is required'],
    trim: true,
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'The email is not valid'],
  },
  photo: {
    type: String,
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
  password: {
    type: String,
    required: [true, 'please provide a password'],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'please confirm a password'],
    validate: {
      //* this validatior only work on save() or create(). So for updating a password of user we should use save() not findOneAndUpdate()
      validator: function (val) {
        return this.password === val;
      },
      message: 'Passwords are not the same',
    },
  },
  passwordChangedAt: {
    type: Date,
  },
  passwordResetToken: {
    type: String,
  },
  passwordResetExpired: {
    type: Date,
  },
});

userSchema.pre('save', async function (next) {
  //* we encrypt the password only if the password being updated. if user only update the email, we should not update the password

  if (!this.isModified('password')) return next();

  //* If user is about to change or create a password, we will calculate the password hash with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  //* we add password confirm only for validations. now we delete it from DB by passing undefined to it.
  this.passwordConfirm = undefined;

  next();
});

userSchema.pre('save', function (next) {
  //* We check if the password is not modified Or if it is modified, the document is willing to create
  if (!this.isModified('password') || this.isNew) return next();

  //* It's because sometimes creation of JWT is faster than saving in the DB
  this.passwordChangedAt = Date.now() - 1000;

  next();
});

userSchema.pre(/^find/, function (next) {
  //* We will hide the deactivate user from find query

  this.find({ active: { $ne: false } });

  next();
});

//* Instance method: It will be available on all documents of a collection.
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  //* this.password will not be available here because we set select to false. so, we sure the token always created after the password has been changed

  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (jwtTimeStamp) {
  if (this.passwordChangedAt !== undefined) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    //*It returns false, If user get JWT after changing his password. lets say he got jwt at time 100 but change the password at 200. It means he change the password after token issued
    return jwtTimeStamp < changedTimeStamp;
  }

  //* False means password not changed so far
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpired = Date.now() + 10 * 60 * 1000; //*10 minutes in miliscond

  console.log({ resetToken }, this.passwordResetToken);

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
