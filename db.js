const mongoose = require('mongoose');

const db = mongoose.connect(
  process.env.DATABASE_LOCAL,
  {
    dbName: process.env.DATABASE_NAME,
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  },
  (err) => (err ? console.log(err) : console.log('Connected to database'))
);

module.exports = db;
