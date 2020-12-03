const dotenv = require('dotenv');

process.on('uncaughtException', (err) => {
  console.log('uncaughtException! 💥 Shutting down...');
  process.exit(1);
});

dotenv.config({ path: './config.env' });
const app = require('./app');

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`App running on port ${process.env.PORT}`);
});

process.on('unhandledRejection', (err) => {
  console.log('unhandledRejection! 💥 Shutting down...');
  server.close(() => {
    process.exit(1);
  });
});
